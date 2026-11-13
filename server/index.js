import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const siteRoot = path.join(projectRoot, 'dist');

// Resolve the root .env consistently, including when started from server/.
// Existing environment values (such as Docker's env_file) keep precedence.
dotenv.config({ path: path.join(projectRoot, '.env') });
const { contactRouter } = await import('./contact.js');

const app = express();
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');

app.use('/api/contact', contactRouter);

// Serve only compiled public files. Source, archives, and secrets stay private.
app.use('/_astro', express.static(path.join(siteRoot, '_astro'), {
  dotfiles: 'ignore',
  maxAge: '1y',
  immutable: true,
}));
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
