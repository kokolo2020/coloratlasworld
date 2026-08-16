"use client";

import { getAnalyticsSession } from "@/lib/client-analytics";

type TravelSponsorCardProps = {
  countryName: string;
  countrySlug: string;
  capital: string;
  flagSrc: string;
  href: string;
  placement: "overview" | "practical";
  variant?: "wide" | "compact";
};

export default function TravelSponsorCard({
  countryName,
  countrySlug,
  capital,
  flagSrc,
  href,
  placement,
  variant = "wide",
}: TravelSponsorCardProps) {
  function recordClick() {
    const session = getAnalyticsSession();
    if (!session) return;
    const payload = JSON.stringify({
      ...session,
      partner: "Trip.com",
      placement,
      countrySlug,
      countryName,
      path: window.location.pathname,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/sponsor-click", new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch("/api/analytics/sponsor-click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  }

  return (
    <aside className={`travel-sponsor ${variant}`} aria-label={`Sponsored travel options for ${countryName}`}>
      <div className="travel-sponsor-visual">
        <img src={flagSrc} alt="" loading="lazy" />
        <span>Sponsored travel</span>
      </div>
      <div className="travel-sponsor-copy">
        <small>Featured travel booking</small>
        <h2>{variant === "wide" ? `Turn ${countryName} into your next journey.` : `Plan a visit to ${countryName}.`}</h2>
        <p>Compare stays, flights and experiences{capital ? ` around ${capital}` : ""} with Trip.com.</p>
      </div>
      <a href={href} target="_blank" rel="sponsored nofollow noopener noreferrer" onClick={recordClick}>
        <span className="trip-wordmark">Trip.com</span>
        <strong>Explore travel deals <span aria-hidden="true">↗</span></strong>
        <small>External booking site</small>
      </a>
    </aside>
  );
}
