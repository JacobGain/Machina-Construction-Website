import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';

const maxFiles = Number(process.env.CONTACT_MAX_FILES || 5);
const maxFileSizeBytes = Number(process.env.CONTACT_MAX_FILE_SIZE_MB || 5) * 1024 * 1024;
const maxTotalSizeBytes = Number(process.env.CONTACT_MAX_TOTAL_SIZE_MB || 15) * 1024 * 1024;

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: maxFiles,
    fileSize: maxFileSizeBytes,
  },
  fileFilter: (req, file, cb) => {
    const lowerName = file.originalname.toLowerCase();
    const hasAllowedExtension = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (allowedMimeTypes.has(file.mimetype) || hasAllowedExtension) {
      cb(null, true);
      return;
    }

    cb(new Error('Only PDF, JPG, JPEG, PNG, and WEBP attachments are accepted.'));
  },
});

export const contactRouter = express.Router();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

function trimField(value) {
  return String(value || '').trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createTransporter() {
  const host = requiredEnv('SMTP_HOST');
  const port = Number(process.env.SMTP_PORT || 587);
  const user = requiredEnv('SMTP_USER');
  const pass = requiredEnv('SMTP_PASS');
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

function validateSubmission(fields, files) {
  const type = trimField(fields.type);
  const name = trimField(fields.name);
  const email = trimField(fields.email);
  const phone = trimField(fields.phone);
  const message = trimField(fields.message);

  if (!['Application', 'Inquiry'].includes(type)) {
    return { error: 'Please select a valid message type.' };
  }

  if (!name || !email || !message) {
    return { error: 'Please complete all required fields before sending your message.' };
  }

  if (!isValidEmail(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > maxTotalSizeBytes) {
    return { error: `Attachments exceed the ${process.env.CONTACT_MAX_TOTAL_SIZE_MB || 15} MB total upload limit.` };
  }

  return {
    values: {
      type,
      name,
      email,
      phone,
      message,
    },
  };
}

async function sendContactEmail(values, files) {
  const recipient = requiredEnv('CONTACT_RECIPIENT_EMAIL');
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subjectPrefix = process.env.EMAIL_SUBJECT_PREFIX || 'Machina Website';
  const subject = `${subjectPrefix}: ${values.type} from ${values.name}`;

  const text = [
    `Message Type: ${values.type}`,
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Phone: ${values.phone || 'Not provided'}`,
    '',
    'Message:',
    values.message,
  ].join('\n');

  const html = `
    <h2>${escapeHtml(subject)}</h2>
    <p><strong>Message Type:</strong> ${escapeHtml(values.type)}</p>
    <p><strong>Name:</strong> ${escapeHtml(values.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(values.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(values.phone || 'Not provided')}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(values.message).replaceAll('\n', '<br>')}</p>
  `;

  const transporter = createTransporter();

  await transporter.sendMail({
    to: recipient,
    from,
    replyTo: values.email,
    subject,
    text,
    html,
    attachments: files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
      contentType: file.mimetype,
    })),
  });
}

contactRouter.post('/', (req, res) => {
  upload.array('attachments', maxFiles)(req, res, async (uploadError) => {
    try {
      if (uploadError) {
        return res.status(400).json({ message: uploadError.message || 'One or more attachments could not be uploaded.' });
      }

      if (trimField(req.body.company_website)) {
        return res.status(200).json({ message: 'Message received.' });
      }

      const files = req.files || [];
      const validation = validateSubmission(req.body, files);
      if (validation.error) {
        return res.status(400).json({ message: validation.error });
      }

      await sendContactEmail(validation.values, files);
      return res.status(200).json({ message: 'Message sent successfully.' });
    } catch (error) {
      console.error('Contact form error:', error);
      return res.status(500).json({ message: 'Your message could not be sent. Please try again later.' });
    }
  });
});
