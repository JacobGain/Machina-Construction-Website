import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(new URL('../../server/package.json', import.meta.url));
const express = require('express');
const app = express();
const root = path.resolve('dist');
let submission = null;

// Receive actual browser multipart bytes locally. Never connect to SMTP.
app.post('/api/contact', async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const data = await new Response(Buffer.concat(chunks), {
      headers: { 'content-type': req.headers['content-type'] },
    }).formData();
    submission = { fields: {}, files: [] };
    for (const [name, value] of data) {
      if (typeof value === 'string') submission.fields[name] = value;
      else submission.files.push({ name: value.name, type: value.type, size: value.size, bytes: Buffer.from(await value.arrayBuffer()).toString('base64') });
    }
    res.json({ message: 'Message sent successfully.' });
  } catch {
    res.status(400).json({ message: 'Invalid test submission.' });
  }
});
app.get('/__test/submission', (_req, res) => res.json(submission));
app.use(express.static(root, { dotfiles: 'ignore', extensions: ['html'] }));
app.use((_req, res) => res.status(404).sendFile(path.join(root, '404.html')));
app.listen(4173, '127.0.0.1');
