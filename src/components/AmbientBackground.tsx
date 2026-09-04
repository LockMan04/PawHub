import React, { useState } from "react";

interface StarDefinition {
  x: string;
  y: string;
  size: string;
  opacity: string;
  dimOpacity: string;
  midOpacity: string;
  driftX: string;
  driftY: string;
  duration: string;
  twinkleDuration: string;
  delay: string;
}

interface CloudDefinition {
  top: string;
  left: string;
  width: string;
  opacity: string;
  scale: string;
  duration: string;
  delay: string;
}

const CLOUDS: CloudDefinition[] = [
  { top: "4%", left: "-7%", width: "32rem", opacity: "0.68", scale: "1.08", duration: "38s", delay: "-11s" },
  { top: "17%", left: "66%", width: "26rem", opacity: "0.58", scale: "0.92", duration: "46s", delay: "-29s" },
  { top: "38%", left: "8%", width: "23rem", opacity: "0.48", scale: "0.82", duration: "42s", delay: "-18s" },
  { top: "51%", left: "73%", width: "35rem", opacity: "0.62", scale: "1.14", duration: "54s", delay: "-36s" },
  { top: "70%", left: "-4%", width: "29rem", opacity: "0.5", scale: "0.96", duration: "49s", delay: "-24s" },
  { top: "84%", left: "48%", width: "24rem", opacity: "0.44", scale: "0.84", duration: "44s", delay: "-7s" },
];

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createStars(count: number): StarDefinition[] {
  return Array.from({ length: count }, () => {
    const duration = randomBetween(18, 52);
    const opacity = randomBetween(0.28, 0.96);

    return {
      x: `${randomBetween(0, 100).toFixed(2)}%`,
      y: `${randomBetween(0, 100).toFixed(2)}%`,
      size: `${randomBetween(0.7, 2.6).toFixed(2)}px`,
      opacity: opacity.toFixed(2),
      dimOpacity: (opacity * 0.34).toFixed(2),
      midOpacity: (opacity * 0.7).toFixed(2),
      driftX: `${randomBetween(-5, 5).toFixed(2)}vw`,
      driftY: `${randomBetween(-4, 4).toFixed(2)}vh`,
      duration: `${duration.toFixed(2)}s`,
      twinkleDuration: `${randomBetween(2.4, 7.5).toFixed(2)}s`,
      delay: `${(-randomBetween(0, duration)).toFixed(2)}s`,
    };
  });
}

export const AmbientBackground: React.FC = () => {
  const [stars] = useState(() => createStars(104));

  return (
    <div className="ambient-background" aria-hidden="true">
      <div className="ambient-cloud-field">
        {CLOUDS.map((cloud, index) => (
          <span
            key={index}
            className="ambient-cloud"
            style={
              {
                "--cloud-top": cloud.top,
                "--cloud-left": cloud.left,
                "--cloud-width": cloud.width,
                "--cloud-opacity": cloud.opacity,
                "--cloud-scale": cloud.scale,
                "--cloud-duration": cloud.duration,
                "--cloud-delay": cloud.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      <div className="ambient-star-field">
        {stars.map((star, index) => (
          <span
            key={index}
            className="ambient-star"
            style={
              {
                "--star-x": star.x,
                "--star-y": star.y,
                "--star-size": star.size,
                "--star-opacity": star.opacity,
                "--star-dim-opacity": star.dimOpacity,
                "--star-mid-opacity": star.midOpacity,
                "--star-drift-x": star.driftX,
                "--star-drift-y": star.driftY,
                "--star-duration": star.duration,
                "--star-twinkle-duration": star.twinkleDuration,
                "--star-delay": star.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
};
