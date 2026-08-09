import type { Metadata } from "next";
import Link from "next/link";
import AnalyticsDashboard from "../../components/AnalyticsDashboard";

export const metadata: Metadata = {
  title: "Visitor Analytics",
  description: "Anonymous aggregate visitor analytics for Color Atlas World.",
  robots: { index: false, follow: false },
};

export default function AnalyticsPage() {
  return (
    <main className="analytics-page">
      <nav className="analytics-nav">
        <Link className="analytics-brand" href="/"><span>✦</span> Color Atlas World</Link>
        <Link className="analytics-back" href="/">← Back to atlas</Link>
      </nav>
      <AnalyticsDashboard />
    </main>
  );
}
