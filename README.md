# Machina Construction Ltd.

A static Astro website with a separate Express/SMTP contact endpoint. The published pages remain Home, About, Careers, and Contact, using the existing `.html` URLs. Original wording, image assignments, and section order are preserved.

## Local development

Use Node.js 22.23.4 or newer (Node 24 LTS is also supported).

```sh
npm ci
npm ci --prefix server
npm run build
npm start
```

Open `http://localhost:3000` to review the static build. The server serves only `dist/`; archived content and application source are not published.

For live frontend updates, run `npm run dev` in another terminal and open `http://127.0.0.1:4321`. Astro proxies `/api/contact` to the server on port 3000. The existing `.html` links work in development as well as in the build.

## Contact form

The form continues to POST multipart data to `/api/contact`. Application/Inquiry, optional phone, PDF/image attachments, image compression, and the existing 5-file / 5-MiB-each / 15-MiB-total limits are retained. Careers preselects Application.

The backend resolves `.env` from the repository root, regardless of the working directory. Existing process environment variables take precedence. Use `.env.example` for the required SMTP and recipient settings; never commit credentials. The recipient remains exclusively controlled by `CONTACT_RECIPIENT_EMAIL`.

Local development does not require working SMTP credentials to render the pages. Manually submitting the form through the running server attempts real SMTP delivery when configured. Automated tests mock delivery and must not be used as proof of inbox delivery.

Without JavaScript, all page content remains readable and the form uses normal browser validation and multipart submission. The existing backend responds with JSON. File preparation, compression, and inline feedback enhance the JavaScript experience.

## Validation

```sh
npm run check
npm run build
npm test
npx playwright install chromium firefox webkit
npm run test:e2e
```

Browser tests cover Chromium, Firefox, and WebKit. A temporary local test server receives actual multipart upload bytes, while failure scenarios use intercepted responses. This server never connects to SMTP. Tests check original copy and image order against `legacy/`, phone and tablet orientations, desktop layouts, scroll animations, reduced motion, JavaScript-disabled pages, service disclosures, unpublished content, and attachment submission/retry behavior. They do not contact the live website, DNS, or company infrastructure.

To use an existing Chromium-compatible installation instead of downloading one, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to its executable path.

## Source and output

- `src/pages/`: page content; existing text and order retained.
- `src/components/`: shared navigation, footer, responsive images, and hero slideshow.
- `src/styles/global.css`: brand colors, typography, responsive layout, and reduced-motion styling.
- `src/scripts/`: contact preparation, slideshow, and service disclosures; no UI framework runtime.
- `images/`: unchanged original assets. Astro generates responsive derivatives during the build.
- `legacy/`: untouched original HTML/CSS/JS, including unpublished project/history archives; reference only.
- `dist/`: generated static HTML, CSS, JavaScript, and images; ignored by Git.
- `server/`: the existing SMTP backend and static file server.

`about-2.html` and `past-projects.html` remain compatibility redirects. They do not expose archived page content or appear in navigation.

## Docker

The existing Compose service can build the new static output using the updated multi-stage Dockerfile. The runtime includes only the compiled website, server code, and production server dependencies. `.env` and source archives are excluded from the image. No deployment is performed by the build.

```sh
docker compose up --build
```

Live email delivery and deployment need separate verification in the intended environment; neither is performed by the migration's automated checks.
