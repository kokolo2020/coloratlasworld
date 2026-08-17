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
        <span>Travel partner</span>
      </div>
      <div className="travel-sponsor-copy">
        <small>Advertisement · Affiliate link</small>
        <h2>{variant === "wide" ? `Turn ${countryName} into your next journey.` : `Plan a visit to ${countryName}.`}</h2>
        <p>Search stays, flights and experiences{capital ? ` around ${capital}` : ""} on Trip.com.</p>
      </div>
      <a
        className="travel-sponsor-cta"
        href={href}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        aria-label={`Search Trip.com for travel to ${countryName} (affiliate link)`}
        onClick={recordClick}
      >
        <img className="trip-logo" src="/partners/trip-com-logo.png" alt="Trip.com" />
        <strong>Search flights &amp; hotels <span aria-hidden="true">↗</span></strong>
        <small>Affiliate booking link</small>
      </a>
    </aside>
  );
}
