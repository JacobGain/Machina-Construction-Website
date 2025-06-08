// Main JavaScript for interactive behaviors

document.addEventListener('DOMContentLoaded', function() {
  // Scroll-based fade-in effect for elements with class 'fade-in'
  const options = {
    threshold: 0.1
  };
  const observer = new IntersectionObserver(function(entries, obs) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, options);
  // Observe all elements with the 'fade-in' class
  document.querySelectorAll('.fade-in').forEach(function(el) {
    observer.observe(el);
  });

  // Toggle project details popup/expand on Past Projects page
  document.querySelectorAll('.more-info').forEach(function(button) {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      const detailsId = button.getAttribute('aria-controls');
      const details = document.getElementById(detailsId);
      const expanded = button.getAttribute('aria-expanded') === 'true';
      if (details) {
        // Toggle the visibility of the project details
        details.hidden = expanded;
        // Update aria-expanded attribute on the button
        button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      }
    });
  });
});
