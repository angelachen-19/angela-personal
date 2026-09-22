const footer = document.getElementById('connect');
if (footer) {
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      footer.classList.add('is-visible');
      observer.disconnect();
    }
  }, { threshold: 0.05 });
  observer.observe(footer);
}
