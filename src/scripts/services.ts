const servicesGrid = document.querySelector<HTMLElement>('.services-grid');

if (servicesGrid) {
  const desktop = window.matchMedia('(min-width: 769px)');
  let pending = false;
  let previousWidth = -1;
  const alignCopy = () => {
    pending = false;
    // Measure natural copy height so it can shrink as well as grow on resize.
    servicesGrid.style.removeProperty('--service-title-height');
    servicesGrid.style.removeProperty('--service-summary-height');
    if (!desktop.matches) return;
    const tallest = (selector: string) => Math.ceil(Math.max(0,
      ...Array.from(servicesGrid.querySelectorAll<HTMLElement>(selector), (element) => element.getBoundingClientRect().height),
    ));
    const titleHeight = tallest('.service-card-body h3');
    const summaryHeight = tallest('.service-card-summary');
    servicesGrid.style.setProperty('--service-title-height', `${titleHeight}px`);
    servicesGrid.style.setProperty('--service-summary-height', `${summaryHeight}px`);
  };
  const schedule = () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(alignCopy);
  };
  new ResizeObserver(([entry]) => {
    // Expanding a detail panel changes height, but must not resize sibling cards.
    if (entry.contentRect.width === previousWidth) return;
    previousWidth = entry.contentRect.width;
    schedule();
  }).observe(servicesGrid);
  desktop.addEventListener('change', schedule);
  document.fonts.ready.then(schedule);
  schedule();
}

document.querySelectorAll<HTMLButtonElement>('.more-info').forEach((button) => {
  const panel = document.getElementById(button.getAttribute('aria-controls') || '');
  if (!panel) return;
  panel.hidden = true;
  button.hidden = false;
  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    panel.hidden = isOpen;
    button.setAttribute('aria-expanded', String(!isOpen));
    button.textContent = isOpen ? 'Show more info' : 'Hide info';
  });
});
