import { test, expect } from '@playwright/test';

const screens = [
  { name: 'small phone', width: 320, height: 568, touch: true },
  { name: 'phone', width: 390, height: 844, touch: true },
  { name: 'phone landscape', width: 844, height: 390, touch: true },
  { name: 'tablet', width: 768, height: 1024, touch: true },
  { name: 'tablet landscape', width: 1024, height: 768, touch: true },
  { name: 'laptop', width: 1366, height: 768, touch: false },
  { name: 'desktop', width: 1920, height: 1080, touch: false },
];

for (const screen of screens) {
  test(`${screen.name}: content and scroll reveals across all pages`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: screen, hasTouch: screen.touch, reducedMotion: 'no-preference' });
    await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const name of ['index', 'about', 'careers', 'contact']) {
      await page.goto(`http://127.0.0.1:4173/${name}.html`);
      const sections = page.locator('main > section:not(.hero)');
      for (const section of await sections.all()) {
        await section.scrollIntoViewIfNeeded();
        await expect(section).toHaveClass(/is-visible/);
        await expect(section).toHaveCSS('opacity', '1');
        expect(await section.evaluate(element => {
          const bounds = element.getBoundingClientRect();
          return bounds.left >= -1 && bounds.right <= innerWidth + 1;
        })).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await expect(page.locator('section.reveal-enabled')).toHaveCount(0);
      for (const section of await sections.all()) await expect(section).toHaveCSS('opacity', '1');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('value-card hover feedback respects reduced motion', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4173/index.html');
  const card = page.locator('.value-card').first();
  await card.hover();
  await expect(card).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -5)');
  await expect(card.locator('.value-icon')).toHaveCSS('border-radius', '14px');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(card).toHaveCSS('transform', 'none');
  await expect(card.locator('.value-icon')).toHaveCSS('transform', 'none');
  await context.close();
});

test('keyboard navigation has visible focus on every page', async ({ page, browserName }) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:4173(?:\/|$))/, route => route.abort());
  for (const name of ['index', 'about', 'careers', 'contact']) {
    await page.goto(`/${name}.html`);
    // macOS WebKit uses Option-Tab for links under its default keyboard setting.
    // https://support.apple.com/guide/safari/keyboard-shortcuts-and-gestures-cpsh003/mac
    await page.keyboard.press(browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab');
    const focused = page.locator(':focus');
    await expect(focused).toHaveCount(1);
    await expect(focused).toBeVisible();
    await expect(focused).toHaveCSS('outline-style', 'solid');
    await expect(focused).toHaveCSS('outline-width', '3px');
  }
});
