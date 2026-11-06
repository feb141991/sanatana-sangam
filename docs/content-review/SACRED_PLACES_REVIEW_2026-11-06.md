# Homepage Sacred Places: Wording for Review

**Status:** Awaiting founder or council review. Nothing here has been approved. The wording is already live on shoonaya.com.
**Where it appears:** `public/landing.html`, community section.
**Chosen by:** Claude, as a small selection with two places per tradition. The card says "A small selection across four traditions, not a ranking."

## How to review

For each row, mark **Approve**, **Change** (with new text) or **Remove**. Reply with the outcome and it can be applied in one change.

| # | Tradition | Place and location | Text on the card | Support found | Limit of that support | Decision |
|---|---|---|---|---|---|---|
| 1 | Hindu | Shri Mahakaleshwar, Ujjain, Madhya Pradesh | One of the twelve Jyotirlingas of Shiva, on the Shipra river. | App data, `lib/yatra-data.ts` in `shoonaya-mobile` | Internal data only; no outside source checked | |
| 2 | Hindu | Kashi Vishwanath, Varanasi, Uttar Pradesh | One of the twelve Jyotirlingas of Shiva, on the Ganga. | App data, `lib/yatra-data.ts` | Internal data only; no outside source checked | |
| 3 | Sikh | Sri Harmandir Sahib, Amritsar, Punjab | Also known as the Golden Temple, and managed by the SGPC. | [SGPC](https://sgpc.net/about-sgpc/) | Read through a search summary | |
| 4 | Sikh | Takht Sachkhand Sri Hazur Sahib, Nanded, Maharashtra | One of the five Takhts, marking where Guru Gobind Singh's earthly life ended in 1708. | [Wikipedia](https://en.wikipedia.org/wiki/Hazur_Sahib), [Sikh Missionary Society](https://www.sikhmissionarysociety.org/sms/smssikhism/takhts/) | Secondary sources; please check the phrasing | |
| 5 | Buddhist | Mahabodhi Temple, Bodh Gaya, Bihar | By Buddhist tradition, where the Buddha attained enlightenment. | [Encyclopedia of Buddhism](https://encyclopediaofbuddhism.org/wiki/Bodh_Gaya) | UNESCO's page could not be read | |
| 6 | Buddhist | Lumbini, Rupandehi, Nepal | By Buddhist tradition, the birthplace of the Buddha. | [Outlook Traveller](https://www.outlooktraveller.com/explore/culture/retrace-the-steps-of-shakyamuni-buddha) | Travel source; UNESCO's page could not be read | |
| 7 | Jain | Shatrunjaya Hill, Palitana, Gujarat | A hill of temples sacred to Shvetambara Jains. | [Wikipedia](https://en.wikipedia.org/wiki/Palitana_temples) | No trust or government source found | |
| 8 | Jain | Shravanabelagola, Hassan district, Karnataka | A Jain pilgrimage centre, home to the Gommateshwara (Bahubali) statue on Vindhyagiri hill. | [carams.in](https://carams.in/places/shravanabelagola/) | Weak source. "Digambara" left out because it could not be confirmed | |

## Questions for the reviewer

1. Are these the right eight, and is two per tradition the right balance?
2. Should rows 1 and 2 say more than the shared Jyotirlinga line, using sources you accept?
3. Row 4: is "earthly life ended" the wording you want?
4. Row 8: can a Jain authority confirm the sampradaya, so it can be named?
5. The map shows land only, with no borders. Is that acceptable, particularly with Lumbini shown in Nepal?

## Also shown on three places

Rows 1, 3 and 4 add: "Listed in Live Darshan in the app. Request early access". These match entries in `src/lib/live-streams.ts`. A stream can be off air or deactivated at any moment, so the line says "listed", not "live now".

Dots mark places, not members. Their positions come from approximate coordinates at town level.
