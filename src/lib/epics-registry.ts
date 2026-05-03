import { LibraryTradition, LibraryCategory } from './library-content';

export interface EpicVerse {
  verseNumber: string;
  original: string;
  transliteration: string;
  meaning: string;
}

export interface EpicChapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  verses?: EpicVerse[]; // Optional: only loaded when needed
}

export interface EpicKanda {
  id: string;
  title: string;
  kandaNumber: number;
  description: string;
  chapters: EpicChapter[];
}

export interface EpicStructure {
  id: string;
  title: string;
  tradition: LibraryTradition;
  category: LibraryCategory;
  description: string;
  kandas: EpicKanda[];
}

export const RAMAYANA_STRUCTURE: EpicStructure = {
  id: 'ramayana-valmiki',
  title: 'Valmiki Ramayana',
  tradition: 'hindu',
  category: 'ramayana',
  description: 'The primordial epic (Adi Kavya) composed by Sage Valmiki, detailing the life and journey of Shri Rama.',
  kandas: [
    {
      id: 'bal-kanda',
      title: 'Bal Kanda',
      kandaNumber: 1,
      description: 'The Book of Childhood: Details the birth of Rama, his early life, and his marriage to Sita.',
      chapters: [
        { id: 'ram-bal-1', chapterNumber: 1, title: 'The Legend Begins', summary: 'Valmiki asks Narada about the perfect man.' },
        { id: 'ram-bal-2', chapterNumber: 2, title: 'The First Shloka', summary: 'Valmiki witnesses the hunter and composes the first verse.' },
        { id: 'ram-bal-3', chapterNumber: 3, title: 'Brahma\'s Command', summary: 'Brahma commands Valmiki to write the full story of Rama.' },
        { id: 'ram-bal-4', chapterNumber: 4, title: 'Kusha and Lava', summary: 'The sons of Rama recite the epic in the assembly.' },
        { id: 'ram-bal-5', chapterNumber: 5, title: 'The City of Ayodhya', summary: 'Description of the magnificent capital and its prosperity.' },
        { id: 'ram-bal-6', chapterNumber: 6, title: 'The Administration', summary: 'How King Dasaratha ruled with justice and wisdom.' },
        { id: 'ram-bal-7', chapterNumber: 7, title: 'The Ministers', summary: 'Description of the eight virtuous ministers of Dasaratha.' },
        { id: 'ram-bal-8', chapterNumber: 8, title: 'The Desire for a Son', summary: 'Dasaratha decides to perform the Ashvamedha Yajna.' },
        { id: 'ram-bal-9', chapterNumber: 9, title: 'Rishyasringa', summary: 'Sumantra tells the legend of the sage Rishyasringa.' },
        { id: 'ram-bal-10', chapterNumber: 10, title: 'The Invitation', summary: 'Dasaratha invites Rishyasringa to Ayodhya.' },
      ]
    },
    {
      id: 'ayodhya-kanda',
      title: 'Ayodhya Kanda',
      kandaNumber: 2,
      description: 'The Book of Ayodhya: Preparations for Rama\'s coronation and his subsequent exile.',
      chapters: [
        { id: 'ram-ayodhya-1', chapterNumber: 1, title: 'Dasaratha\'s Intention', summary: 'The King decides to crown Rama as the Yuvaraja.' },
      ]
    },
    { id: 'aranya-kanda', title: 'Aranya Kanda', kandaNumber: 3, description: 'The Book of the Forest: The life in exile and the abduction of Sita.', chapters: [] },
    { id: 'kishkindha-kanda', title: 'Kishkindha Kanda', kandaNumber: 4, description: 'The Book of Kishkindha: The alliance with the monkeys and the search for Sita.', chapters: [] },
    { id: 'sundara-kanda', title: 'Sundara Kanda', kandaNumber: 5, description: 'The Beautiful Book: Hanuman\'s journey to Lanka and his meeting with Sita.', chapters: [] },
    { id: 'yuddha-kanda', title: 'Yuddha Kanda', kandaNumber: 6, description: 'The Book of War: The great battle between Rama and Ravana.', chapters: [] },
    { id: 'uttara-kanda', title: 'Uttara Kanda', kandaNumber: 7, description: 'The Final Book: The reign of Rama and the later history.', chapters: [] },
  ]
};

export const BHAGAVATAM_STRUCTURE: EpicStructure = {
  id: 'bhagavatam',
  title: 'Srimad Bhagavatam',
  tradition: 'hindu',
  category: 'bhagavatam',
  description: 'The spotless Purana detailing the incarnations of Vishnu, focusing on the life of Lord Krishna.',
  kandas: [
    { id: 'canto-1', title: 'Canto 1: Creation', kandaNumber: 1, description: 'The setting of the story and the questions of the sages.', chapters: [
      { id: 'bhag-1-1', chapterNumber: 1, title: 'Questions by the Sages', summary: 'Sages at Naimisharanya ask Suta Goswami about the ultimate good.' },
      { id: 'bhag-1-2', chapterNumber: 2, title: 'Divinity and Divine Service', summary: 'Suta explains the nature of transcendental service to Krishna.' },
      { id: 'bhag-1-3', chapterNumber: 3, title: 'Krishna is the Source of All Incarnations', summary: 'List of the various avatars of the Lord.' },
    ] },
    { id: 'canto-2', title: 'Canto 2: The Cosmic Manifestation', kandaNumber: 2, description: 'The universal form and the process of creation.', chapters: [] },
    { id: 'canto-3', title: 'Canto 3: The Status Quo', kandaNumber: 3, description: 'The appearance of Varaha and the teachings of Kapila.', chapters: [] },
    { id: 'canto-4', title: 'Canto 4: The Creation of the Fourth Order', kandaNumber: 4, description: 'The story of Dhruva Maharaja and King Prithu.', chapters: [] },
    { id: 'canto-5', title: 'Canto 5: The Creative Impetus', kandaNumber: 5, description: 'The journey of Rishabhadeva and the cosmic geography.', chapters: [] },
    { id: 'canto-6', title: 'Canto 6: Prescribed Duties for Mankind', kandaNumber: 6, description: 'The story of Ajamila and the power of the holy name.', chapters: [] },
    { id: 'canto-7', title: 'Canto 7: The Science of God', kandaNumber: 7, description: 'The story of Prahlada Maharaja and Narasimha Deva.', chapters: [] },
    { id: 'canto-8', title: 'Canto 8: Withdrawal of the Cosmic Creations', kandaNumber: 8, description: 'Churning of the ocean and the Vamana avatar.', chapters: [] },
    { id: 'canto-9', title: 'Canto 9: Liberation', kandaNumber: 9, description: 'The dynasties of the sun and the moon.', chapters: [] },
    { id: 'canto-10', title: 'Canto 10: The Summum Bonum', kandaNumber: 10, description: 'The appearance and pastimes of Lord Krishna.', chapters: [] },
    { id: 'canto-11', title: 'Canto 11: General History', kandaNumber: 11, description: 'The Uddhava Gita and the disappearance of the Yadu dynasty.', chapters: [] },
    { id: 'canto-12', title: 'Canto 12: The Age of Deterioration', kandaNumber: 12, description: 'The symptoms of Kali Yuga and the final instructions.', chapters: [] },
  ]
};
