/**
 * WhatsApp Integration Utilities
 */

const APP_URL = typeof window !== 'undefined'
  ? window.location.origin
  : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.shoonaya.com');

export function getWhatsAppShareLink(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function shareScoreToWhatsApp(name: string, score: number, rank: number) {
  const text = `🔱 Jai Sanatan! I just reached Rank #${rank} on the Global Mandali with ${score} Seva points! \n\nJoin me on Shoonaya to track your Sadhana and grow together: ${APP_URL}`;
  return getWhatsAppShareLink(text);
}

export function inviteFriendsToWhatsApp(name: string) {
  const text = `🙏 Namaste! ${name} is inviting you to join Shoonaya: Find your infinite. A daily spiritual sanctuary for sacred time, practice, and connection.\n\nExplore daily practice, family spaces, and community at your own pace.\n\nJoin here: ${APP_URL}`;
  return getWhatsAppShareLink(text);
}
