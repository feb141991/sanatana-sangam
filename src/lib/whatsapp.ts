/**
 * WhatsApp Integration Utilities
 */

const APP_URL = 'https://shoonaya.app'; // Replace with actual production URL

export function getWhatsAppShareLink(text: string) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function shareScoreToWhatsApp(name: string, score: number, rank: number) {
  const text = `🔱 Jai Sanatan! I just reached Rank #${rank} on the Global Mandali with ${score} Seva points! \n\nJoin me on Shoonaya to track your Sadhana and grow together: ${APP_URL}`;
  return getWhatsAppShareLink(text);
}

export function inviteFriendsToWhatsApp(name: string) {
  const text = `🙏 Namaste! ${name} is inviting you to join Shoonaya, the digital home for your spiritual journey. \n\nTrack your Sadhana, join a Kul, and connect with the Mandali. \n\nDownload here: ${APP_URL}`;
  return getWhatsAppShareLink(text);
}
