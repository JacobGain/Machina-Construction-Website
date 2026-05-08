import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contactRouter } from './contact.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const siteRoot = path.resolve(__dirname, '..');

const app = express();
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');

app.use('/api/contact', contactRouter);

app.use((req, res, next) => {
  const blockedPaths = [
    /^\/server(?:\/|$)/,
    /^\/\.env(?:\.|$)/,
    /^\/Dockerfile$/,
    /^\/docker-compose\.ya?ml$/,
    /^\/package(?:-lock)?\.json$/,
  ];

  if (blockedPaths.some((pattern) => pattern.test(req.path))) {
    res.status(404).sendFile(path.join(siteRoot, '404.html'));
    return;
  }

  next();
});

app.use(express.static(siteRoot, {
  dotfiles: 'ignore',
  extensions: ['html'],
  index: 'index.html',
}));

app.use((req, res) => {
  res.status(404).sendFile(path.join(siteRoot, '404.html'));
});

app.listen(port, () => {
  console.log(`Machina website running at http://localhost:${port}`);
});
