# Contact Form Server

This folder contains the backend used by `contact.html`.

## Local setup

1. Copy `.env.example` to `.env` in the repo root.
2. Fill in the SMTP values and `CONTACT_RECIPIENT_EMAIL`.
3. Install dependencies:

```bash
cd server
npm install
```

4. Start the site and contact API:

```bash
npm start
```

The site will be available at `http://localhost:3000`, and the form will post to `/api/contact`.

## Docker

From the repo root:

```bash
docker compose up --build
```

The server reads environment variables from `.env` through `docker-compose.yml`.

## Required environment variables

- `CONTACT_RECIPIENT_EMAIL`: inbox that receives contact submissions.
- `SMTP_HOST`: SMTP server hostname.
- `SMTP_PORT`: SMTP server port, usually `587` or `465`.
- `SMTP_SECURE`: use `true` for port `465`; otherwise usually `false`.
- `SMTP_USER`: SMTP username.
- `SMTP_PASS`: SMTP password or app password.
- `SMTP_FROM`: sender address used for outgoing messages.

The frontend never chooses the recipient. The backend reads it from `CONTACT_RECIPIENT_EMAIL`.
