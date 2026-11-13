export {};

interface Slide { src: string; srcset: string; source: string; }

const hero = document.querySelector<HTMLElement>('.hero');
const image = hero?.querySelector<HTMLImageElement>('.hero-img');
const toggle = hero?.querySelector<HTMLButtonElement>('.hero-rotation-toggle');

if (hero && image && toggle) {
  const slides: Slide[] = JSON.parse(hero.dataset.slides || '[]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motion.matches;
  let inView = true;
  let index = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let loading = false;

  const canPlay = () => !paused && !document.hidden && inView;
  function update() {
    if (timer) clearTimeout(timer);
    timer = undefined;
    toggle!.textContent = paused ? 'Play slideshow' : 'Pause slideshow';
    toggle!.setAttribute('aria-pressed', String(paused));
    if (canPlay() && !loading && slides.length > 1) timer = setTimeout(next, 3500);
  }
  async function next() {
    if (!canPlay()) return;
    loading = true;
    const nextIndex = (index + 1) % slides.length;
    const slide = slides[nextIndex];
    // Load only the next responsive image, when it is needed.
    const incoming = new Image();
    incoming.sizes = image!.sizes;
    incoming.srcset = slide.srcset;
    incoming.src = slide.src;
    try {
      await incoming.decode();
      if (canPlay()) {
        image!.srcset = slide.srcset;
        image!.src = slide.src;
        image!.dataset.source = slide.source;
        index = nextIndex;
      }
    } catch {
      // A failed slide must never replace the photograph currently on screen.
    } finally {
      loading = false;
      update();
    }
  }
  toggle.hidden = false;
  toggle.addEventListener('click', () => { paused = !paused; update(); });
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting && entry.intersectionRect.height > 0;
    update();
  }).observe(hero);
  motion.addEventListener('change', () => { paused = motion.matches; update(); });
  document.addEventListener('visibilitychange', update);
  update();
}
