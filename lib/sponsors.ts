const DEFAULT_TRIP_COM_URL = "https://www.trip.com/?Allianceid=10098824&SID=328636813&trip_sub1={slug}&trip_sub3=D19266536";

export function getTripComSponsorUrl(countryName: string, countrySlug: string) {
  const configured = process.env.TRIP_COM_AFFILIATE_URL?.trim() || DEFAULT_TRIP_COM_URL;
  const expanded = configured
    .replaceAll("{country}", encodeURIComponent(countryName))
    .replaceAll("{slug}", encodeURIComponent(countrySlug));

  try {
    const url = new URL(expanded);
    if (url.searchParams.has("Allianceid")) url.searchParams.set("trip_sub1", countrySlug);
    url.searchParams.set("utm_source", "coloratlasworld");
    url.searchParams.set("utm_medium", "sponsored_travel");
    url.searchParams.set("utm_campaign", "country_profiles");
    url.searchParams.set("utm_content", countrySlug);
    return url.toString();
  } catch {
    return DEFAULT_TRIP_COM_URL;
  }
}
