import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../server/package.json', import.meta.url));
const nodemailer = require('nodemailer');
const createTransport = nodemailer.createTransport;
const sent = [];
let failDelivery = false;

// The router tests never read .env, open a socket, or send real email.
Object.assign(process.env, {
  SMTP_HOST: 'test.invalid', SMTP_USER: 'test@example.invalid', SMTP_PASS: 'test',
  SMTP_FROM: 'test@example.invalid', CONTACT_RECIPIENT_EMAIL: 'recipient@example.invalid',
  CONTACT_MAX_FILES: '5', CONTACT_MAX_FILE_SIZE_MB: '5', CONTACT_MAX_TOTAL_SIZE_MB: '15',
});
nodemailer.createTransport = () => ({
  sendMail: async (mail) => {
    if (failDelivery) throw new Error('Simulated SMTP failure');
    sent.push(mail);
    return { messageId: 'test-only' };
  },
});
after(() => { nodemailer.createTransport = createTransport; });
const { contactRouter } = await import('../server/contact.js');

function fields(overrides = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    type: 'Inquiry', name: 'Local Test', email: 'sender@example.invalid',
    message: 'In-memory test. No real email.', ...overrides,
  })) form.set(key, value);
  return form;
}

async function submit(form) {
  const wire = new Response(form);
  const body = Buffer.from(await wire.arrayBuffer());
  const req = Readable.from(body);
  Object.assign(req, {
    method: 'POST', url: '/',
    headers: { 'content-type': wire.headers.get('content-type'), 'content-length': String(body.length) },
  });
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) { this.statusCode = code; return this; },
      json(payload) { resolve({ status: this.statusCode, ...payload }); return this; },
    };
    contactRouter.handle(req, res, (error) => error ? reject(error) : reject(new Error('Unhandled request')));
  });
}

test('valid inquiry uses configured recipient and sender reply address', async () => {
  const response = await submit(fields({ recipient: 'untrusted@example.invalid' }));
  assert.equal(response.status, 200);
  assert.equal(sent.at(-1).to, 'recipient@example.invalid');
  assert.equal(sent.at(-1).replyTo, 'sender@example.invalid');
});

test('application preserves PDF filename and bytes', async () => {
  const form = fields({ type: 'Application' });
  const bytes = '%PDF-1.4\nlocal test\n%%EOF';
  form.append('attachments', new Blob([bytes], { type: 'application/pdf' }), 'resume.pdf');
  assert.equal((await submit(form)).status, 200);
  const attachment = sent.at(-1).attachments[0];
  assert.equal(attachment.filename, 'resume.pdf');
  assert.equal(attachment.content.toString(), bytes);
});

test('invalid fields and honeypot do not send email', async () => {
  const count = sent.length;
  for (const invalid of [{ email: 'invalid' }, { type: 'Other' }, { name: '' }, { message: '' }]) {
    assert.equal((await submit(fields(invalid))).status, 400);
  }
  assert.equal((await submit(fields({ company_website: 'bot' }))).status, 200);
  assert.equal(sent.length, count);
});

test('unsupported attachments are rejected', async () => {
  const form = fields();
  form.append('attachments', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
  assert.equal((await submit(form)).status, 400);
});

test('SMTP failure returns an error rather than success', async () => {
  failDelivery = true;
  const originalError = console.error;
  console.error = () => {};
  try {
    const response = await submit(fields());
    assert.equal(response.status, 500);
    assert.equal(response.message, 'Your message could not be sent. Please try again later.');
  } finally {
    failDelivery = false;
    console.error = originalError;
  }
});
