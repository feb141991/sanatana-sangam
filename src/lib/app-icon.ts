export function updateAppIcon(isPro: boolean) {
  if (typeof window === 'undefined') return;
  
  const favicon = document.getElementById('favicon') as HTMLLinkElement;
  if (favicon) {
    favicon.href = isPro ? '/assets/images/logos/logo-pro.png' : '/assets/images/logos/logo-normal.png';
  } else {
    const newFavicon = document.createElement('link');
    newFavicon.id = 'favicon';
    newFavicon.rel = 'icon';
    newFavicon.href = isPro ? '/assets/images/logos/logo-pro.png' : '/assets/images/logos/logo-normal.png';
    document.head.appendChild(newFavicon);
  }
}
