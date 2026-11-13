# Responsive audit — 2026-11-13

## Verified locally

- Astro check: no errors, warnings, or hints.
- Production build: successful.
- Backend tests: 5 passed, with mocked SMTP.
- Current Chromium and WebKit browser suites: 60 passed.
- Four additional interaction checks passed: value-card hover/reduced-motion behavior and visible keyboard focus across all pages, in both engines. macOS WebKit uses its documented Option-Tab link-navigation shortcut: https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac
- All four published pages preserve approved copy, image order, and SVG paths.
- Screen matrix: 320×568, 390×844, 844×390, 768×1024, 1024×768, 1366×768, and 1920×1080; the existing layout checks also cover widths through 2560px.
- Touch emulation is enabled for phone and tablet checks.
- Each content section is scrolled into view and checked for its completed reveal, viewport bounds, and horizontal overflow.
- Reduced-motion preference changes restore immediate section visibility.
- Existing checks cover service dropdown isolation, hero slideshow playback and pause controls, hero/header transitions, back-to-top behavior, JavaScript-disabled content, and form feedback.
- Upload tests now verify real multipart bytes at an isolated loopback receiver. No email is sent.

## Firefox exception accepted by the user

Firefox's downloaded Playwright browser exits before loading a page with `Could not find profile folder`. It fails with automatic temporary profiles, a canonical temporary directory, an explicitly created workspace profile, initialized profile preference files, and its content sandbox disabled. Reinstalling the browser bundle did not resolve the error. This is a browser-launch failure, not a test result for the website.

The user explicitly asked to leave Firefox verification on 2026-11-13 because it repeatedly fails to launch. No further Firefox investigation is required for this audit. The visible-window attempt also exited before testing the website, reporting macOS sandbox-extension and application-service errors.

For optional future Firefox verification on another environment:

```sh
npm ci
npm ci --prefix server
npm run build
npx playwright install firefox
npm run test:e2e -- --project=firefox
```

Phone and tablet results are browser emulation, not physical-device certification. WebKit coverage is not a claim that every Safari/iOS version has been tested.

The audit is complete for the user-accepted Chromium and WebKit scope: 64 browser checks passed across the recorded screen sizes and interaction modes. Firefox compatibility remains unverified under the accepted exception. No production website, DNS, or company infrastructure was investigated. No commits, pushes, or deployments were made.
