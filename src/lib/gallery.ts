import { Cat, CatLayoutMeta, GalleryItem, TextGalleryItem } from "../types/cat";
import { HERO_START, HERO_END, INTERMEDIATE_MESSAGES } from "../data/messages";

const ASPECT_RATIOS = [
  { ratio: "1 / 1", value: 1.0 },
  { ratio: "4 / 5", value: 0.8 },
  { ratio: "3 / 4", value: 0.75 },
  { ratio: "4 / 3", value: 1.33 },
  { ratio: "16 / 10", value: 1.6 },
];

function getRandomNumber(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function getRandomSpeed(): number {
  const speeds = [0.65, 0.8, 0.95, 1.1, 1.25, 1.35];
  return speeds[Math.floor(Math.random() * speeds.length)];
}

function getRandomRotation(): number {
  const tilt = getRandomNumber(-3.5, 3.5);
  return Math.round(tilt * 10) / 10;
}

export function buildGallerySequence(cats: Cat[]): GalleryItem[] {
  const items: GalleryItem[] = [];

  items.push({
    type: "text",
    id: "hero-start",
    text: HERO_START.text,
    size: HERO_START.size,
    variant: HERO_START.variant,
    subtitle: HERO_START.subtitle,
    meta: {
      speed: 1.0,
      yOffset: 0,
    },
  });

  const catCount = cats.length;
  const majorBreaks = INTERMEDIATE_MESSAGES.filter((m) => m.size === "medium");
  const inlineMessages = INTERMEDIATE_MESSAGES.filter((m) => m.size === "small");

  const catsPerWave = 10;
  const waveCount = Math.max(1, Math.ceil(catCount / catsPerWave));

  let currentCatIdx = 0;
  let inlineMsgIdx = 0;

  for (let wave = 0; wave < waveCount; wave++) {
    const waveCatsEnd = Math.min(currentCatIdx + catsPerWave, catCount);
    const waveCats = cats.slice(currentCatIdx, waveCatsEnd);
    currentCatIdx = waveCatsEnd;

    waveCats.forEach((cat, idx) => {
      const aspect = ASPECT_RATIOS[Math.floor(Math.random() * ASPECT_RATIOS.length)];
      const meta: CatLayoutMeta = {
        column: idx % 5,
        widthRange: {
          min: 240,
          max: 460,
        },
        aspectRatio: aspect.ratio,
        aspectRatioValue: aspect.value,
        xOffset: Math.round(getRandomNumber(-20, 20)),
        yOffset: Math.round(getRandomNumber(-30, 30)),
        speed: getRandomSpeed(),
        rotation: getRandomRotation(),
      };

      items.push({
        type: "image",
        id: `cat-${cat.id}-${wave}-${idx}`,
        cat,
        meta,
      });

      if (idx === 2 || idx === 6) {
        const msg = inlineMessages[inlineMsgIdx % inlineMessages.length];
        const inlineItem: TextGalleryItem = {
          type: "text",
          id: `inline-msg-${wave}-${idx}-${inlineMsgIdx}-${msg.text.replace(/\s+/g, "-")}`,
          text: msg.text,
          size: msg.size,
          variant: msg.variant,
          meta: {
            speed: getRandomNumber(0.85, 1.15),
            yOffset: Math.round(getRandomNumber(-15, 15)),
          },
        };
        items.push(inlineItem);
        inlineMsgIdx++;
      }
    });

    if (wave < waveCount - 1) {
      const major = majorBreaks[wave % majorBreaks.length];
      items.push({
        type: "text",
        id: `major-break-${wave}-${major.text.replace(/\s+/g, "-")}`,
        text: major.text,
        size: major.size,
        variant: major.variant,
        meta: {
          speed: 1.0,
          yOffset: 0,
        },
      });
    }
  }

  items.push({
    type: "text",
    id: "hero-end",
    text: HERO_END.text,
    size: HERO_END.size,
    variant: HERO_END.variant,
    meta: {
      speed: 1.0,
      yOffset: 0,
    },
  });

  return items;
}
