export {};

const hero = document.querySelector<HTMLElement>('.hero');
const header = document.querySelector<HTMLElement>('body > header');
const backToTop = document.querySelector<HTMLButtonElement>('.back-to-top');

if (header && backToTop) {
  let scheduled = false;
  const update = () => {
    const pastTop = hero ? hero.getBoundingClientRect().bottom <= 1 : header.getBoundingClientRect().bottom <= 0;
    if (hero) {
      document.body.classList.toggle('hero-past', pastTop);
      header.inert = !pastTop;
      header.setAttribute('aria-hidden', String(!pastTop));
    }
    backToTop.hidden = !pastTop;
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; update(); });
  };
  const resize = new ResizeObserver(() => {
    document.body.style.setProperty('--header-height', `${header.getBoundingClientRect().height}px`);
    schedule();
  });
  resize.observe(header);
  if (hero) resize.observe(hero);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('pageshow', update);
  backToTop.addEventListener('click', () => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    const heading = document.querySelector<HTMLElement>('main h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  });
  update();
}
