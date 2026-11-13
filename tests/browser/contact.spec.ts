import { test, expect, type Page } from '@playwright/test';

const pdf = (name: string, size = 40) => ({ name, mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(size)]) });

async function fill(page: Page) {
  await page.locator('#type').selectOption('Application');
  await page.locator('#name').fill('Local Test');
  await page.locator('#email').fill('sender@example.invalid');
  await page.locator('#message').fill('Local test. No real email should be sent.');
}

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4173(?:\/|$))/, (route) => route.abort());
  // A safe default for every form test; individual tests override this mock.
  await page.route('**/api/contact', (route) => route.fulfill({ status: 500, json: { message: 'Your message could not be sent. Please try again later.' } }));
  await page.goto('/contact.html');
});

test('prepared attachments survive chooser reset, removal, and submission', async ({ page }) => {
  await page.unroute('**/api/contact');
  await fill(page);
  await page.locator('#file').setInputFiles([pdf('resume.pdf'), pdf('extra.pdf')]);
  await expect(page.locator('.file-item')).toHaveCount(2);
  await page.locator('#file').setInputFiles(pdf('reference.pdf'));
  await expect(page.locator('.file-item')).toHaveCount(3);
  await page.getByRole('button', { name: 'Remove extra.pdf', exact: true }).click();
  await page.locator('#contact-submit').click();
  await expect(page.locator('.form-feedback')).toHaveClass(/is-success/);
  const received = await (await page.request.get('/__test/submission')).json();
  expect(received.files.map((file: { name: string }) => file.name)).toEqual(['resume.pdf', 'reference.pdf']);
  expect(Buffer.from(received.files[0].bytes, 'base64').toString()).toContain('%PDF-1.4');
  expect(received.fields.type).toBe('Application');
  await expect(page.locator('.file-item')).toHaveCount(0);
  await expect(page.locator('#name')).toHaveValue('');
});

test('a delivery failure retains text and attachments for retry', async ({ page }) => {
  await fill(page);
  await page.locator('#file').setInputFiles(pdf('resume.pdf'));
  await expect(page.locator('.file-item')).toHaveCount(1);
  await page.locator('#contact-submit').click();
  await expect(page.locator('.form-feedback')).toHaveClass(/is-error/);
  await expect(page.locator('#name')).toHaveValue('Local Test');
  await expect(page.locator('.file-item')).toHaveCount(1);
  await expect(page.locator('#contact-submit')).toBeEnabled();
});

test('HTML fallback responses are not reported as successful delivery', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ contentType: 'text/html', body: '<html>fallback</html>' }));
  await fill(page);
  await page.locator('#contact-submit').click();
  await expect(page.locator('.form-feedback')).toHaveClass(/is-error/);
  await expect(page.locator('#name')).toHaveValue('Local Test');
});

test('upload count, size, and filename rendering are enforced safely', async ({ page }) => {
  await page.locator('#file').setInputFiles({ name: '<img src=x onerror=alert(1)>.txt', mimeType: 'text/plain', buffer: Buffer.from('test') });
  await expect(page.locator('.form-feedback')).toContainText('<img src=x onerror=alert(1)>.txt');
  await expect(page.locator('.form-feedback img')).toHaveCount(0);
  await page.locator('#file').setInputFiles(pdf('oversized.pdf', 6 * 1024 * 1024));
  await expect(page.locator('.form-feedback')).toContainText('per-file limit');
  await page.locator('#file').setInputFiles(Array.from({ length: 6 }, (_, i) => pdf(`resume-${i}.pdf`)));
  await expect(page.locator('.file-item')).toHaveCount(5);
  await expect(page.locator('.form-feedback')).toContainText('up to 5 files');
});

test('total attachment limit preserves already accepted files', async ({ page }) => {
  await page.locator('#file').setInputFiles(Array.from({ length: 4 }, (_, i) => pdf(`resume-${i}.pdf`, 4 * 1024 * 1024)));
  await expect(page.locator('.file-item')).toHaveCount(3);
  await expect(page.locator('.form-feedback')).toContainText('total upload limit');
});

test('Careers preselects Application and required fields prevent submission', async ({ page }) => {
  await page.goto('/careers.html');
  await page.getByRole('link', { name: 'Apply Now' }).click();
  await expect(page.locator('#type')).toHaveValue('Application');
  let requests = 0;
  page.on('request', (request) => { if (request.url().endsWith('/api/contact')) requests++; });
  await page.locator('#contact-submit').click();
  await expect(page.locator('.form-feedback')).toContainText('required fields');
  expect(requests).toBe(0);
});

test('large image attachments are downscaled, compressed, and submitted', async ({ page }) => {
  await page.unroute('**/api/contact');
  await fill(page);
  const originalSize = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = 1800;
    const context = canvas.getContext('2d')!;
    const pixels = context.createImageData(canvas.width, canvas.height);
    for (let offset = 0; offset < pixels.data.length; offset += 65536) {
      crypto.getRandomValues(pixels.data.subarray(offset, Math.min(offset + 65536, pixels.data.length)));
    }
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = 255;
    context.putImageData(pixels, 0, 0);
    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'));
    const transfer = new DataTransfer();
    transfer.items.add(new File([blob], 'site-photo.png', { type: 'image/png' }));
    const input = document.querySelector<HTMLInputElement>('#file')!;
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return blob.size;
  });
  expect(originalSize).toBeGreaterThan(5 * 1024 * 1024);
  await expect(page.locator('.file-item')).toContainText('site-photo.jpg');
  await expect(page.locator('#contact-submit')).toBeEnabled();
  await page.locator('#contact-submit').click();
  await expect(page.locator('.form-feedback')).toHaveClass(/is-success/);
  const received = await (await page.request.get('/__test/submission')).json();
  const uploaded = received.files[0];
  expect(uploaded.type).toBe('image/jpeg');
  expect(uploaded.name).toBe('site-photo.jpg');
  expect(uploaded.size).toBeLessThanOrEqual(5 * 1024 * 1024);
  const bytes = Buffer.from(uploaded.bytes, 'base64');
  expect([...bytes.subarray(0, 2)]).toEqual([255, 216]);
});
