export {};

const sections = document.querySelectorAll<HTMLElement>('body:not(.minimal) main > section:not(.hero)');

if (sections.length && 'IntersectionObserver' in window) {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      // Keep interactive content visible while someone is using it.
      const focused = entry.target.contains(document.activeElement);
      entry.target.classList.toggle('is-visible', entry.isIntersecting || focused);
    });
  }, { threshold: 0.1 });

  const configure = () => {
    observer.disconnect();
    sections.forEach((section) => {
      if (motion.matches) {
        section.classList.remove('reveal-enabled');
        section.classList.add('is-visible');
        return;
      }
      const bounds = section.getBoundingClientRect();
      const inView = bounds.top < window.innerHeight && bounds.bottom > 0;
      section.classList.toggle('is-visible', inView || section.contains(document.activeElement));
      section.classList.add('reveal-enabled');
      observer.observe(section);
    });
  };

  sections.forEach((section) => {
    section.addEventListener('focusin', () => section.classList.add('is-visible'));
  });
  motion.addEventListener('change', configure);
  window.addEventListener('pageshow', configure);
  configure();
}
