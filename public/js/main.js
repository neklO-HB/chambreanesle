const cards = document.querySelectorAll('.room-card, .panel-card, .reservation-card');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

cards.forEach((card, index) => {
  card.style.transitionDelay = `${index * 60}ms`;
  observer.observe(card);
});

const flash = document.querySelector('.flash');
if (flash) {
  setTimeout(() => {
    flash.style.opacity = '0';
    flash.style.transform = 'translateY(-8px)';
  }, 3200);
}
