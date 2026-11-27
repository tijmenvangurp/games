import { defineTexts } from "@shared/i18n";

export const mathPageTexts = defineTexts(
  {
    title: "Tafel Topper",
    chooseSubtitle: "Kies wat je wilt oefenen",
    backToGame: "Terug naar je sommen",
    allStars: "Je bleef scherp!",
    manyStars: "Je bleef rekenen!",
    someStars: "Goed geoefend!",
    stars: (stars: number) => `Je haalde ${stars} van de 10 sterren.`,
  },
  {
    title: "Times Table Topper",
    chooseSubtitle: "Choose what you want to practise",
    backToGame: "Back to your sums",
    allStars: "You stayed sharp!",
    manyStars: "You kept on calculating!",
    someStars: "Good practice!",
    stars: (stars: number) => `You got ${stars} out of 10 stars.`,
  },
);
