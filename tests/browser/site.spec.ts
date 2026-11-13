import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const pages = ['index', 'about', 'careers', 'contact'];

test.beforeEach(async ({ page }) => {
  // All checks are local. Never visit a live domain or submit to a remote API.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4173(?:\/|$))/, (route) => route.abort());
});

for (const name of pages) {
  test(`${name}: original wording, image order, and SVGs are preserved`, async ({ page }) => {
    const original = await readFile(new URL(`../../legacy/${name}.html`, import.meta.url), 'utf8');
    await page.goto(`/${name}.html`);
    const result = await page.evaluate((html) => {
      const old = new DOMParser().parseFromString(html, 'text/html');
      // The approved hero variation removes the old headline and promotes its slogan.
      old.querySelector('.hero h1')?.remove();
      const text = (document: Document, selector: string) => {
        // Compare content independently of the build's inter-element whitespace
        // minification, and exclude executable code and the restored pause control.
        const collect = (node: Node): string => {
          if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
          if (node instanceof Element && (node.matches('script, style, .hero-brand, .hero-nav, .hero-bottom'))) return '';
          return [...node.childNodes].map(collect).join(' ');
        };
        return collect(document.querySelector(selector)!).replace(/\s+/g, ' ').trim();
      };
      const normalize = (src: string) => src.replace(/^\.?\//, '');
      return {
        oldText: ['header', 'main', 'footer'].map((selector) => text(old, selector)),
        newText: ['header', 'main', 'footer'].map((selector) => text(document, selector)),
        oldImages: [...old.querySelectorAll('img')].map((image) => normalize(image.getAttribute('src')!)),
        newImages: [...document.querySelectorAll('img:not(.hero-brand img)')].map((image) => image.dataset.source),
        oldIcons: [...old.querySelectorAll('svg path')].map((path) => path.getAttribute('d')),
        newIcons: [...document.querySelectorAll('svg path')].map((path) => path.getAttribute('d')),
      };
    }, original);
    expect(result.newText).toEqual(result.oldText);
    expect(result.newImages).toEqual(result.oldImages);
    expect(result.newIcons).toEqual(result.oldIcons);
    if (name === 'index') {
      const gap = await page.evaluate(() => document.querySelector('.mission-vision')!.getBoundingClientRect().top - document.querySelector('.hero')!.getBoundingClientRect().bottom);
      expect(gap).toBeGreaterThan(40);
    }
    await expect(page.locator('header nav [aria-current="page"]')).toHaveCount(1);
    expect((await page.locator('nav').allTextContents()).join(' ')).not.toContain('Projects');
  });

  test(`${name}: responsive layout and images`, async ({ page }) => {
    for (const width of [320, 390, 768, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`/${name}.html`);
      await page.locator('footer').scrollIntoViewIfNeeded();
      await expect.poll(() => page.locator('img').evaluateAll((images) => images.every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      const horizontalEscape = await page.locator('main, header, footer, nav, .service-card, .company-logo-slot, .contact-form').evaluateAll((elements) => elements.some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      }));
      expect(horizontalEscape).toBe(false);
    }
  });
}

test('services remain readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/index.html');
  for (const paragraph of await page.locator('.mission-vision > p, .value-body, .service-details').all()) {
    await expect(paragraph).toBeVisible();
  }
  await page.goto('http://127.0.0.1:4173/contact.html');
  await expect(page.locator('form')).toBeVisible();
  await expect(page.locator('#contact-submit')).toBeEnabled();
  expect(await page.locator('form').evaluate((form: HTMLFormElement) => form.noValidate)).toBe(false);
  await context.close();
});

test('service buttons disclose their corresponding content', async ({ page }) => {
  await page.goto('/index.html');
  const cards = page.locator('.service-card');
  await expect.poll(async () => {
    const tops = await page.locator('.service-card-summary').evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
    return Math.max(...tops) - Math.min(...tops);
  }).toBeLessThanOrEqual(1);
  const collapsedHeights = await cards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
  const buttons = await page.locator('.more-info').all();
  for (const [index, button] of buttons.entries()) {
    const panel = page.locator(`#${await button.getAttribute('aria-controls')}`);
    await expect(panel).toBeHidden();
    await button.click();
    await expect(panel).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const expandedHeights = await cards.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
    expect(expandedHeights[index]).toBeGreaterThan(collapsedHeights[index]);
    expandedHeights.forEach((height, sibling) => {
      if (sibling !== index) expect(height).toBeCloseTo(collapsedHeights[sibling], 1);
    });
    await button.click();
    await expect(panel).toBeHidden();
    expect(await cards.nth(index).evaluate((element) => element.getBoundingClientRect().height)).toBeCloseTo(collapsedHeights[index], 1);
  }
});

test('hero preserves its eight images and respects reduced motion', async ({ page }) => {
  const images: string[] = [];
  page.on('request', (request) => { if (request.resourceType() === 'image') images.push(request.url()); });
  await page.goto('/index.html');
  const slides = await page.locator('.hero').getAttribute('data-slides');
  expect(JSON.parse(slides!)).toHaveLength(8);
  await expect(page.locator('.hero-rotation-toggle')).toHaveText('Play slideshow');
  // The remaining seven slides are not eagerly preloaded.
  expect(images.filter((url) => /photo-(10|15|29|60|137|141|144)[._]/.test(url))).toHaveLength(0);
  await page.locator('.hero-rotation-toggle').click();
  await expect(page.locator('.hero-rotation-toggle')).toHaveText('Pause slideshow');
  await page.locator('.hero-rotation-toggle').click();
  await expect(page.locator('.hero-rotation-toggle')).toHaveText('Play slideshow');
});

test('404 and unpublished content stay outside published pages', async ({ page, request }) => {
  expect((await request.get('/missing-page')).status()).toBe(404);
  for (const path of ['/legacy/index.html', '/past-projects.archive.html', '/about-2.archive.html', '/server/contact.js', '/.env', '/package.json']) {
    expect((await request.get(path)).status()).toBe(404);
  }
  await page.goto('/past-projects.html');
  await expect(page).toHaveURL(/\/index\.html$/);
  await page.goto('/about-2.html');
  await expect(page).toHaveURL(/\/about\.html$/);
});

test('hero loads and displays the next image when playback is enabled', async ({ page }) => {
  await page.goto('/index.html');
  await page.locator('.hero-rotation-toggle').click();
  // A fullscreen background must keep rotating while the pointer is over it.
  await page.mouse.move(300, 300);
  await expect(page.locator('.hero-img')).toHaveAttribute('data-source', 'images/home-page/photo-10.JPEG', { timeout: 7000 });
  expect(await page.locator('.hero-img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
});

test('fullscreen hero reveals the header and back-to-top together after scrolling', async ({ page }) => {
  for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [844, 390]]) {
    await page.setViewportSize({ width, height });
    await page.goto('/index.html');
    const header = page.locator('body > header');
    const top = page.getByRole('button', { name: 'Back to top', includeHidden: true });
    await expect(header).toBeHidden();
    await expect(header).toHaveAttribute('inert', '');
    await expect(top).toBeHidden();
    await expect(page.locator('.hero-brand img')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Hero navigation' })).toBeVisible();
    const bounds = await page.locator('.hero').boundingBox();
    expect(bounds!.x).toBe(0);
    expect(bounds!.y).toBe(0);
    expect(bounds!.width).toBe(width);
    expect(bounds!.height).toBeGreaterThanOrEqual(height);
    await page.evaluate((height) => window.scrollTo(0, height - 100), bounds!.height);
    await expect(header).toBeHidden();
    await page.locator('.hero-scroll').click();
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute('aria-hidden', 'false');
    await expect(top).toBeVisible();
    const contentIsClear = await page.evaluate(() => document.querySelector('#learn-more')!.getBoundingClientRect().top >= document.querySelector('header')!.getBoundingClientRect().bottom);
    expect(contentIsClear).toBe(true);
    await top.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(header).toBeHidden();
    await expect(top).toBeHidden();
  }
});

test('hero navigation opens the existing pages with their normal header', async ({ page }) => {
  await page.goto('/index.html');
  await page.getByRole('navigation', { name: 'Hero navigation' }).getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(/\/about\.html$/);
  await expect(page.locator('body > header')).toBeVisible();
  expect(await page.locator('body > header').evaluate((header: HTMLElement) => header.inert)).toBe(false);
});

test('arrow-only back-to-top works on every published page', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  for (const name of pages) {
    await page.goto(`/${name}.html`);
    const button = page.getByRole('button', { name: 'Back to top', includeHidden: true });
    await expect(button).toBeHidden();
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect(button).toBeVisible();
    await expect(button).toHaveText('↑');
    const bounds = await button.boundingBox();
    expect(bounds!.width).toBe(44);
    expect(bounds!.height).toBe(44);
    await button.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(button).toBeHidden();
  }
});
