# Contact Form Setup

This site's contact page is prepared to submit a `multipart/form-data` request to a hosting-side endpoint.

## Current frontend contract

- Page: `contact.html`
- Form method: `POST`
- Form action: `/api/contact`
- Encoding: `multipart/form-data`
- Expected response: JSON

## Current limits

- Accepted file types: `PDF`, `JPG`, `JPEG`, `PNG`, `WEBP`
- Max files: `5`
- Max file size: `5 MB` per file
- Max total upload size: `15 MB`
- Attachments are optional
- Large image uploads are downscaled client-side to a max dimension of roughly `2200px`
- Image uploads may be recompressed in-browser and converted to `JPG`
- PDF uploads are passed through unchanged

These limits are enforced in the frontend and should also be enforced server-side.

## Form fields

Text fields:

- `type`
- `name`
- `email`
- `phone`
- `message`
- `company_website`
- `recipient_email`
- `source_page`

File field:

- `attachments`

Notes:

- `company_website` is a honeypot spam field and should normally be empty.
- `recipient_email` is currently set to a temporary destination.
- `source_page` is included for traceability.
- The frontend may transform oversized image uploads before submission, so attachment filenames and MIME type may arrive as `JPG` even if the original file was `PNG` or `WEBP`.

## Required backend behavior

The host-side form handler should:

1. Accept `POST /api/contact`
2. Parse `multipart/form-data`
3. Validate required fields:
   - `type`
   - `name`
   - `email`
   - `message`
4. Reject submissions if:
   - `company_website` is not empty
   - file count exceeds `5`
   - any file exceeds `5 MB`
   - total upload size exceeds `15 MB`
   - file type is not allowed
5. Hold uploaded files only in temporary request memory/cache/temp storage while processing
6. Send an email to the destination inbox with the uploaded files attached if total size remains acceptable for your provider
7. Discard temporary uploaded files immediately after successful send or failure handling
8. Return JSON

## Recommended email payload

Subject:

- `Application - Full Name`
- `Inquiry - Full Name`

Body:

- Full Name
- Email
- Phone
- Message Type
- Message
- Source Page

Attachments:

- All valid uploaded files
- Expect image attachments to already be downscaled/compressed by the browser when needed

## Expected JSON responses

Success:

```json
{
  "ok": true,
  "message": "Message sent successfully."
}
```

Validation or processing error:

```json
{
  "ok": false,
  "message": "The selected files exceed the upload limit."
}
```

The frontend displays the `message` value to the user.

## Hosting requirements

Choose a host or backend that supports:

- server-side form endpoints or serverless functions
- `multipart/form-data` parsing
- outbound email sending
- optional file attachments in outgoing email
- temporary request-file handling without permanent storage
- HTTPS
- spam protection

Examples that can support this pattern:

- Netlify Functions
- Vercel Functions
- Cloudflare Workers with an upload-compatible backend
- a small Node/Express backend

## Operational recommendations

- Keep the current temporary inbox until the company inbox is ready.
- Add rate limiting and CAPTCHA if spam starts appearing.
- If email attachment delivery becomes unreliable, switch to temporary file storage plus emailed download links.
- Do not persist uploaded photos or resumes unless your workflow changes later.
- Do not trust frontend validation alone.
