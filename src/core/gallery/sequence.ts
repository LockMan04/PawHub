import { AnimalImage, AnimalLayoutMeta, GalleryItem, TextGalleryItem } from "../../types/gallery";
import { MessageDefinition } from "../../types/site-config";

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

export interface GallerySequenceOptions {
  heroStart?: MessageDefinition;
  heroEnd?: MessageDefinition;
  messages?: MessageDefinition[];
  animal?: string;
}

const DEFAULT_HERO_START: MessageDefinition = {
  text: "HELLO",
  subtitle: "i wish i was an animal, no school, no work",
  size: "hero",
  variant: "hero",
};

const DEFAULT_HERO_END: MessageDefinition = {
  text: "BYEBYE",
  size: "hero",
  variant: "hero",
};

const DEFAULT_INTERMEDIATE_MESSAGES: MessageDefinition[] = [
  { text: "keep scrolling", size: "medium", variant: "outlined" },
  { text: "good vibes only", size: "medium", variant: "editorial-serif" },
  { text: "one more", size: "small", variant: "pill" },
  { text: "certified cuteness", size: "small", variant: "brutalist-mono" },
  { text: "infinite joy", size: "medium", variant: "gradient" },
  { text: "almost there", size: "small", variant: "pill" },
];

export function buildGallerySequence(
  images: AnimalImage[],
  options?: GallerySequenceOptions
): GalleryItem[] {
  const heroStart = options?.heroStart ?? DEFAULT_HERO_START;
  const heroEnd = options?.heroEnd ?? DEFAULT_HERO_END;
  const intermediateMessages = options?.messages ?? DEFAULT_INTERMEDIATE_MESSAGES;
  const animal = options?.animal ?? "item";

  const items: GalleryItem[] = [];

  items.push({
    type: "text",
    id: "hero-start",
    text: heroStart.text,
    size: heroStart.size,
    variant: heroStart.variant,
    subtitle: heroStart.subtitle,
    meta: {
      speed: 1.0,
      yOffset: 0,
    },
  });

  const imageCount = images.length;
  const majorBreaks = intermediateMessages.filter((m) => m.size === "medium");
  const inlineMessages = intermediateMessages.filter((m) => m.size === "small");

  const imagesPerWave = 10;
  const waveCount = Math.max(1, Math.ceil(imageCount / imagesPerWave));

  let currentImageIdx = 0;
  let inlineMsgIdx = 0;

  for (let wave = 0; wave < waveCount; wave++) {
    const waveImagesEnd = Math.min(currentImageIdx + imagesPerWave, imageCount);
    const waveImages = images.slice(currentImageIdx, waveImagesEnd);
    currentImageIdx = waveImagesEnd;

    waveImages.forEach((image, idx) => {
      const aspect = ASPECT_RATIOS[Math.floor(Math.random() * ASPECT_RATIOS.length)];
      const meta: AnimalLayoutMeta = {
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
        id: `${animal}-${image.id}-${wave}-${idx}`,
        image,
        meta,
      });

      if ((idx === 2 || idx === 6) && inlineMessages.length > 0) {
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

    if (wave < waveCount - 1 && majorBreaks.length > 0) {
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
    text: heroEnd.text,
    size: heroEnd.size,
    variant: heroEnd.variant,
    meta: {
      speed: 1.0,
      yOffset: 0,
    },
  });

  return items;
}
