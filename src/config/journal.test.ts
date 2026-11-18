import { describe, expect, it } from "vitest";
import {
  findJournalEssay,
  getAllJournalEssays,
  getFeaturedJournalEssay,
  getRelatedEssays,
} from "./journal";

describe("journal publication gate", () => {
  it("exposes verified, published essays through public readers", () => {
    const essays = getAllJournalEssays();
    expect(essays.length).toBe(32);

    const mandirEssay = findJournalEssay("architecture-of-silence-ancient-mandirs");
    expect(mandirEssay).toBeDefined();
    expect(mandirEssay?.publicationStatus).toBe("published");
    expect(mandirEssay?.editorialReview?.sourcesVerified).toBe(true);

    const tithiEssay = findJournalEssay("the-global-tithi-discrepancy-astronomy-and-timezones");
    expect(tithiEssay).toBeDefined();
    expect(tithiEssay?.publicationStatus).toBe("published");
    expect(tithiEssay?.editorialReview?.sourcesVerified).toBe(true);

    const brahmaEssay = findJournalEssay("the-sacred-science-of-brahma-muhurta-astronomy-and-awakening");
    expect(brahmaEssay).toBeDefined();
    expect(brahmaEssay?.publicationStatus).toBe("published");
    expect(brahmaEssay?.editorialReview?.sourcesVerified).toBe(true);

    const ekadashiEssay = findJournalEssay("the-complete-ekadashi-parana-guide-shastric-rules-and-timing");
    expect(ekadashiEssay).toBeDefined();
    expect(ekadashiEssay?.publicationStatus).toBe("published");
    expect(ekadashiEssay?.editorialReview?.sourcesVerified).toBe(true);

    const karwaEssay = findJournalEssay("karwa-chauth-moonrise-astronomy-and-global-cities");
    expect(karwaEssay).toBeDefined();
    expect(karwaEssay?.publicationStatus).toBe("published");
    expect(karwaEssay?.editorialReview?.sourcesVerified).toBe(true);

    const makarEssay = findJournalEssay("makar-sankranti-astronomy-punya-kaal-and-uttarayana");
    expect(makarEssay).toBeDefined();
    expect(makarEssay?.publicationStatus).toBe("published");
    expect(makarEssay?.editorialReview?.sourcesVerified).toBe(true);

    const shivratriEssay = findJournalEssay("maha-shivratri-nishita-kaal-and-four-pahar-puja");
    expect(shivratriEssay).toBeDefined();
    expect(shivratriEssay?.publicationStatus).toBe("published");
    expect(shivratriEssay?.editorialReview?.sourcesVerified).toBe(true);

    const pradoshEssay = findJournalEssay("pradosh-vrat-twilight-window-and-shani-pradosham");
    expect(pradoshEssay).toBeDefined();
    expect(pradoshEssay?.publicationStatus).toBe("published");
    expect(pradoshEssay?.editorialReview?.sourcesVerified).toBe(true);

    const rahuEssay = findJournalEssay("rahu-kaal-and-choghadiya-astronomy-and-muhurta-science");
    expect(rahuEssay).toBeDefined();
    expect(rahuEssay?.publicationStatus).toBe("published");
    expect(rahuEssay?.editorialReview?.sourcesVerified).toBe(true);

    const navratriE = findJournalEssay("navratri-ghatasthapana-muhurta-and-nine-devi-forms");
    expect(navratriE).toBeDefined();
    expect(navratriE?.publicationStatus).toBe("published");
    expect(navratriE?.editorialReview?.sourcesVerified).toBe(true);

    const diwaliE = findJournalEssay("diwali-lakshmi-puja-sthira-lagna-and-dhanteras-astronomy");
    expect(diwaliE).toBeDefined();
    expect(diwaliE?.publicationStatus).toBe("published");
    expect(diwaliE?.editorialReview?.sourcesVerified).toBe(true);

    const janmashtamiE = findJournalEssay("sri-krishna-janmashtami-ashtami-vs-rohini-nakshatra");
    expect(janmashtamiE).toBeDefined();
    expect(janmashtamiE?.publicationStatus).toBe("published");
    expect(janmashtamiE?.editorialReview?.sourcesVerified).toBe(true);

    const ganeshE = findJournalEssay("ganesh-chaturthi-madhyahna-sthapana-and-chandra-darshan-dosha");
    expect(ganeshE).toBeDefined();
    expect(ganeshE?.publicationStatus).toBe("published");
    expect(ganeshE?.editorialReview?.sourcesVerified).toBe(true);

    const pitruE = findJournalEssay("pitru-paksha-and-mahalaya-ancestral-tarpan-science");
    expect(pitruE).toBeDefined();
    expect(pitruE?.publicationStatus).toBe("published");
    expect(pitruE?.editorialReview?.sourcesVerified).toBe(true);

    const suryaE = findJournalEssay("surya-arghya-the-sacred-science-of-offering-water-to-the-sun");
    expect(suryaE).toBeDefined();
    expect(suryaE?.publicationStatus).toBe("published");
    expect(suryaE?.editorialReview?.sourcesVerified).toBe(true);

    const tulsiE = findJournalEssay("tulsi-seva-shastric-rules-for-watering-and-plucking");
    expect(tulsiE).toBeDefined();
    expect(tulsiE?.publicationStatus).toBe("published");
    expect(tulsiE?.editorialReview?.sourcesVerified).toBe(true);

    const vastuE = findJournalEssay("home-mandir-vastu-direction-geometry-and-altar-setup");
    expect(vastuE).toBeDefined();
    expect(vastuE?.publicationStatus).toBe("published");
    expect(vastuE?.editorialReview?.sourcesVerified).toBe(true);

    const chalisaE = findJournalEssay("hanuman-chalisa-meaning-meter-and-astrological-protection");
    expect(chalisaE).toBeDefined();
    expect(chalisaE?.publicationStatus).toBe("published");
    expect(chalisaE?.editorialReview?.sourcesVerified).toBe(true);

    const sandhyaE = findJournalEssay("sandhyavandanam-cosmic-science-of-trisandhya-and-solar-meditation");
    expect(sandhyaE).toBeDefined();
    expect(sandhyaE?.publicationStatus).toBe("published");
    expect(sandhyaE?.editorialReview?.sourcesVerified).toBe(true);

    const japaE = findJournalEssay("mantra-japa-tulsi-vs-rudraksha-mala-and-meru-bead-rule");
    expect(japaE).toBeDefined();
    expect(japaE?.publicationStatus).toBe("published");
    expect(japaE?.editorialReview?.sourcesVerified).toBe(true);

    const karmaE = findJournalEssay("understanding-karma-sanchita-prarabdha-and-kriyamana");
    expect(karmaE).toBeDefined();
    expect(karmaE?.publicationStatus).toBe("published");
    expect(karmaE?.editorialReview?.sourcesVerified).toBe(true);

    const chhathE = findJournalEssay("chhath-puja-austere-tapasya-and-solar-biophysics");
    expect(chhathE).toBeDefined();
    expect(chhathE?.publicationStatus).toBe("published");
    expect(chhathE?.editorialReview?.sourcesVerified).toBe(true);

    const amavasyaE = findJournalEssay("amavasya-vs-purnima-navigating-lunar-polarities-and-consciousness");
    expect(amavasyaE).toBeDefined();
    expect(amavasyaE?.publicationStatus).toBe("published");
    expect(amavasyaE?.editorialReview?.sourcesVerified).toBe(true);

    const fastingE = findJournalEssay("dietary-purity-and-the-science-of-fasting-ayurvedic-autophagy");
    expect(fastingE).toBeDefined();
    expect(fastingE?.publicationStatus).toBe("published");
    expect(fastingE?.editorialReview?.sourcesVerified).toBe(true);

    const featured = getFeaturedJournalEssay();
    expect(featured).toBeDefined();
    expect(featured?.slug).toBe(essays[0].slug);

    const related = getRelatedEssays("architecture-of-silence-ancient-mandirs");
    expect(related.length).toBeGreaterThan(0);
  });
});
