import { redirect } from "next/navigation";
import { COUNTRIES } from "@/lib/countries";

const VALID_SLUGS = new Set(COUNTRIES.map((country) => country.slug));

export default async function CleanComparePage({ params }: { params: Promise<{ pair: string }> }) {
  const pair = (await params).pair;
  const slugs = pair.split("-vs-").map((slug) => slug.trim().toLowerCase()).filter((slug) => VALID_SLUGS.has(slug)).slice(0, 4);
  redirect(slugs.length >= 2 ? `/compare?countries=${encodeURIComponent(slugs.join(","))}` : "/compare");
}
