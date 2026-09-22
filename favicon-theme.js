// Match the website's theme toggle; use the browser theme when none is set.
const icon = document.querySelector('link[rel="icon"][type="image/svg+xml"]');
const browserTheme = matchMedia('(prefers-color-scheme: dark)');
function syncFavicon() {
  const theme = document.documentElement.getAttribute('data-theme');
  const dark = theme ? theme === 'dark' : browserTheme.matches;
  const href = dark ? 'favicon-dark.svg' : 'favicon-light.svg';
  if (icon && icon.getAttribute('href') !== href) icon.setAttribute('href', href);
}
new MutationObserver(syncFavicon).observe(document.documentElement, {
  attributes: true, attributeFilter: ['data-theme']
});
browserTheme.addEventListener('change', syncFavicon);
syncFavicon();
