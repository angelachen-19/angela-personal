const gallery = document.querySelector('.building-gallery');
const videos = [...gallery.querySelectorAll('video')];
const motion = gallery.querySelector('.gallery-motion');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const dialog = document.querySelector('.gallery-lightbox');
const detailVideo = dialog.querySelector('video');
const detailImage = dialog.querySelector('img');
let paused = reducedMotion.matches;
const visible = new Set();

function updatePlayback() {
  motion.textContent = paused ? 'Play previews' : 'Pause previews';
  motion.setAttribute('aria-label', paused ? 'Play automatic video previews' : 'Pause automatic video previews');
  motion.setAttribute('aria-pressed', String(paused));
  videos.forEach(video => {
    if (!paused && !document.hidden && !dialog.open && visible.has(video)) {
      video.play().catch(() => {});
    } else video.pause();
  });
}
const observer = new IntersectionObserver(entries => {
  entries.forEach(({target, isIntersecting}) => {
    if (isIntersecting) visible.add(target); else visible.delete(target);
  });
  updatePlayback();
}, {threshold:.15});
videos.forEach(video => observer.observe(video));
motion.addEventListener('click', () => { paused = !paused; updatePlayback(); });
reducedMotion.addEventListener('change', event => { paused = event.matches; updatePlayback(); });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) detailVideo.pause();
  updatePlayback();
});

gallery.querySelectorAll('.gallery-media').forEach(button => {
  button.addEventListener('click', () => {
    const media = button.querySelector('video,img');
    dialog.querySelector('h3').textContent = button.dataset.title;
    const isVideo = media.tagName === 'VIDEO';
    detailVideo.hidden = !isVideo;
    detailImage.hidden = isVideo;
    if (isVideo) {
      detailVideo.src = media.getAttribute('src');
      detailVideo.poster = media.poster;
      detailVideo.setAttribute('aria-label', button.dataset.title);
    } else {
      detailImage.src = media.src;
      detailImage.alt = media.alt;
    }
    dialog.showModal();
    updatePlayback();
    if (isVideo && !reducedMotion.matches) detailVideo.play().catch(() => {});
  });
});
dialog.querySelector('.gallery-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  detailVideo.pause();
  detailVideo.removeAttribute('src');
  detailVideo.load();
  updatePlayback();
});
updatePlayback();
