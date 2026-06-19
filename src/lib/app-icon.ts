export function updateAppIcon(_isPro: boolean) {
  if (typeof window === 'undefined') return;

  const iconHref = '/icons/icon-192x192.png';
  const favicon = document.getElementById('favicon') as HTMLLinkElement;
  if (favicon) {
    favicon.href = iconHref;
  } else {
    const newFavicon = document.createElement('link');
    newFavicon.id = 'favicon';
    newFavicon.rel = 'icon';
    newFavicon.href = iconHref;
    document.head.appendChild(newFavicon);
  }
}
