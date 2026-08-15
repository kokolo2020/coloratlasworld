"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type AtlasHeroItem = {
  slug: string;
  profileNumber: number;
  name: string;
  code: string;
  region: string;
  regionCode: string;
  capital: string;
  population: string;
  populationYear: string;
  populationNote: string;
  flagUrl: string;
  needsContrast?: boolean;
};

type RotatingAtlasHeroProps = {
  items: AtlasHeroItem[];
};

const ROTATION_INTERVAL = 5500;

export default function RotatingAtlasHero({ items }: RotatingAtlasHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const active = items[activeIndex];

  useEffect(() => {
    if (paused || items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(interval);
  }, [items.length, paused]);

  if (!active) return null;

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + items.length) % items.length);
  };

  return (
    <div
      className="hero-atlas"
      aria-label={`Featured world profile: ${active.name}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="atlas-orbit orbit-one" aria-hidden="true" />
      <div className="atlas-orbit orbit-two" aria-hidden="true" />

      <Link
        className="atlas-card atlas-card-main atlas-rotating-piece"
        href={`/countries/${active.slug}`}
        key={`profile-${active.slug}`}
      >
        <div className="atlas-card-topline">
          <span>Country {String(active.profileNumber).padStart(3, "0")}</span>
          <span>{active.region}</span>
        </div>
        <div className={`atlas-flag-frame${active.needsContrast ? " needs-contrast" : ""}`}>
          <img src={active.flagUrl} alt={`Flag of ${active.name}`} />
        </div>
        <div className="atlas-card-title">
          <div><small>Now exploring</small><strong>{active.name}</strong></div>
          <span className="atlas-code">{active.code}</span>
        </div>
      </Link>

      <div className="atlas-card atlas-stat-card atlas-rotating-piece" key={`stat-${active.slug}`} aria-live="polite">
        <small>Population · {active.populationYear}</small>
        <strong>{active.population}</strong>
        <span>{active.populationNote}</span>
      </div>

      <div className="atlas-pin atlas-rotating-piece" key={`pin-${active.slug}`}>
        <span aria-hidden="true">●</span> {active.capital}
      </div>

      <div className="atlas-controls" aria-label="Featured continents">
        <button className="atlas-arrow" type="button" onClick={() => move(-1)} aria-label="Previous featured country">
          {"\u2190"}
        </button>
        <div className="atlas-continent-tabs">
          {items.map((item, index) => (
            <button
              className={index === activeIndex ? "active" : ""}
              type="button"
              key={item.slug}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${item.name}, ${item.region}`}
              aria-pressed={index === activeIndex}
              title={`${item.region}: ${item.name}`}
            >
              {item.regionCode}
            </button>
          ))}
        </div>
        <button className="atlas-arrow" type="button" onClick={() => move(1)} aria-label="Next featured country">
          {"\u2192"}
        </button>
      </div>
    </div>
  );
}
