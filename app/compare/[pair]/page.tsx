import type { Metadata } from "next";
import ComparePage from "../page";
import { notFound } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

const VALID_SLUGS = new Set(COUNTRIES.map((country) => country.slug));

function parsePair(pair: string) {
  return [...new Set(pair.split("-vs-").map((slug) => slug.trim().toLowerCase()).filter((slug) => VALID_SLUGS.has(slug)))].slice(0, 4);
}

export function generateStaticParams() {
  return [
    "united-states-vs-canada",
    "united-states-vs-china-vs-india",
    "japan-vs-singapore-vs-south-korea",
    "france-vs-italy-vs-united-kingdom",
    "brazil-vs-south-africa-vs-india",
    "australia-vs-canada",
  ].map((pair) => ({ pair }));
}

export async function generateMetadata({ params }: { params: Promise<{ pair: string }> }): Promise<Metadata> {
  const slugs = parsePair((await params).pair);
  if (slugs.length < 2) return {};
  const countries = slugs.map((slug) => COUNTRIES.find((country) => country.slug === slug)).filter((country): country is (typeof COUNTRIES)[number] => Boolean(country));
  const title = `Compare ${countries.map((country) => country.name).join(" vs ")}`;
  const description = `Compare ${countries.map((country) => country.name).join(", ")} by population, GDP, life expectancy, geography, languages, and country facts.`;
  const canonical = `/compare/${slugs.join("-vs-")}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function CleanComparePage({ params }: { params: Promise<{ pair: string }> }) {
  const slugs = parsePair((await params).pair);
  if (slugs.length < 2) notFound();
  return <ComparePage searchParams={Promise.resolve({ countries: slugs.join(",") })} />;
}
