"use client";

function utcDayNumber(date: Date) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
}

export default function DailyCountryFact({ countryName, facts, profileNumber }: { countryName: string; facts: string[]; profileNumber: number }) {
  const today = new Date();
  const dailyFacts = facts.filter(Boolean);
  if (!dailyFacts.length) return null;

  const fact = dailyFacts[(utcDayNumber(today) + profileNumber * 3) % dailyFacts.length];
  const isoDate = today.toISOString().slice(0, 10);
  const dateLabel = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: "UTC" }).format(today);

  return (
    <section className="daily-fact-strip" aria-label={`Daily fact about ${countryName}`}>
      <div className="daily-fact-title">
        <span>Daily discovery</span>
        <strong>Did you know?</strong>
      </div>
      <p>{fact}</p>
      <div className="daily-fact-meta">
        <strong>{countryName}</strong>
        <time dateTime={isoDate}>{dateLabel} · UTC</time>
      </div>
    </section>
  );
}
