import Link from "next/link";
import CountrySearch from "../components/CountrySearch";
import CountrySnapshot, { CountrySnapshotData } from "../components/CountrySnapshot";
import { COUNTRIES, displayRegion, flagUrl, formatMoney, formatNumber, getCountryByCca3, getCountryBySlug, getEnrichment, getMetrics } from "../lib/countries";

const highlights = [
  { value: "199", label: "complete country profiles" },
  { value: "1", label: "searchable world atlas" },
  { value: "0", label: "clutter or geography jargon" },
];

const SNAPSHOT_COUNTRIES = ["united-states", "canada", "mexico", "france", "japan", "china", "india", "singapore", "italy", "south-africa", "brazil"];

const PROFILE_OVERRIDES: Record<string, Partial<CountrySnapshotData>> = {
  "united-states": {
    fullFlagUrl: "/flags/us.svg",
    lede: "A federal republic in North America known for its diverse people, dynamic economy, and global influence in innovation, culture, and leadership.",
    summary: "The United States spans North America between Canada and Mexico, with coastlines on the Atlantic Ocean, Pacific Ocean, Arctic Ocean, and Gulf of Mexico. It is a federal republic of 50 states and one federal district.",
    flagFacts: [
      { value: "50", label: "States" },
      { value: "1", label: "Federal district" },
      { value: "5", label: "Major territories" },
      { value: "3", label: "Ocean coastlines" },
    ],
    flagNote: "Federal republic in North America with major Atlantic, Pacific, Gulf, and Arctic access.",
    gender: { female: "50.5%", male: "49.5%" },
    medianAge: "38.9 years",
    ageDistribution: [{ label: "0-14", value: 18 }, { label: "15-29", value: 20 }, { label: "30-44", value: 19 }, { label: "45-59", value: 20 }, { label: "60-74", value: 15 }, { label: "75+", value: 8 }],
    education: { tertiary: "62%", secondary: "28%", primary: "10%" },
    religion: { primary: "Christianity", primaryPercent: "63%", secondary: "Unaffiliated", secondaryPercent: "29%", other: "Other 8%" },
    aboutImageUrl: "https://tile.loc.gov/storage-services/service/pnp/cph/3b30000/3b34000/3b34100/3b34163r.jpg",
    aboutImageAlt: "Statue of Liberty, circa 1901",
    neighbors: [
      { name: "Canada", slug: "canada", flagUrl: "https://flagcdn.com/ca.svg", note: "North" },
      { name: "Mexico", slug: "mexico", flagUrl: "https://flagcdn.com/mx.svg", note: "South" },
      { name: "Atlantic Ocean", note: "East" },
      { name: "Pacific Ocean", note: "West" },
    ],
    transportFacts: [
      { title: "3 Major International Airports", detail: "Atlanta (ATL), Chicago (ORD), Los Angeles (LAX)" },
      { title: "10 Major Seaports", detail: "Los Angeles, Long Beach, New York/New Jersey, Houston, Savannah, Seattle, Miami, etc." },
    ],
  },
  canada: {
    lede: "A vast North American federation known for bilingual institutions, natural resources, high living standards, and Arctic, Atlantic, and Pacific reach.",
    summary: "Canada stretches from the Atlantic to the Pacific and north into the Arctic, sharing the world’s longest international land border with the United States. It is a parliamentary democracy and constitutional monarchy with 10 provinces and 3 territories.",
    flagFacts: [{ value: "10", label: "Provinces" }, { value: "3", label: "Territories" }, { value: "2", label: "Official languages" }, { value: "3", label: "Ocean coasts" }],
    flagNote: "Large high-income North American country with Atlantic, Pacific, and Arctic coastlines.",
    gender: { female: "50.3%", male: "49.7%" },
    medianAge: "41.8 years",
    ageDistribution: [{ label: "0-14", value: 15 }, { label: "15-29", value: 19 }, { label: "30-44", value: 20 }, { label: "45-59", value: 21 }, { label: "60-74", value: 17 }, { label: "75+", value: 8 }],
    education: { tertiary: "67%", secondary: "25%", primary: "8%" },
    religion: { primary: "Christianity", primaryPercent: "53%", secondary: "Unaffiliated", secondaryPercent: "35%", other: "Other 12%" },
    transportFacts: [{ title: "Major International Airports", detail: "Toronto (YYZ), Vancouver (YVR), Montreal (YUL)" }, { title: "Major Seaports", detail: "Vancouver, Montreal, Halifax, Prince Rupert" }],
  },
  mexico: {
    lede: "A North American republic known for Spanish-speaking culture, manufacturing, tourism, ancient civilizations, and strong Pacific and Gulf connections.",
    summary: "Mexico sits between the United States and Central America, with coastlines on the Pacific Ocean, Gulf of Mexico, and Caribbean Sea. Its federal system includes 31 states and Mexico City.",
    flagFacts: [{ value: "32", label: "Federal entities" }, { value: "Spanish", label: "Main language" }, { value: "MXN", label: "Currency" }, { value: "2", label: "Major coasts" }],
    flagNote: "Federal republic linking North America, Central America, the Pacific, and the Gulf of Mexico.",
    gender: { female: "51.2%", male: "48.8%" },
    medianAge: "30.6 years",
    ageDistribution: [{ label: "0-14", value: 25 }, { label: "15-29", value: 25 }, { label: "30-44", value: 22 }, { label: "45-59", value: 17 }, { label: "60-74", value: 8 }, { label: "75+", value: 3 }],
    education: { tertiary: "24%", secondary: "55%", primary: "21%" },
    religion: { primary: "Christianity", primaryPercent: "88%", secondary: "Unaffiliated", secondaryPercent: "8%", other: "Other 4%" },
    transportFacts: [{ title: "Major International Airports", detail: "Mexico City (MEX), Cancun (CUN), Guadalajara (GDL)" }, { title: "Major Seaports", detail: "Veracruz, Manzanillo, Lazaro Cardenas" }],
  },
  france: {
    lede: "A European republic known for culture, diplomacy, design, agriculture, aerospace, and one of the world’s largest advanced economies.",
    summary: "France is centered in Western Europe with Atlantic, Mediterranean, and English Channel coastlines, plus overseas territories around the world. Paris is its capital and a major global center for culture, finance, and diplomacy.",
    flagFacts: [{ value: "18", label: "Regions" }, { value: "Paris", label: "Capital" }, { value: "EUR", label: "Currency" }, { value: "EU", label: "Member" }],
    flagNote: "Western European republic with Mediterranean, Atlantic, and Channel access.",
    gender: { female: "51.6%", male: "48.4%" },
    medianAge: "42.3 years",
    ageDistribution: [{ label: "0-14", value: 17 }, { label: "15-29", value: 17 }, { label: "30-44", value: 19 }, { label: "45-59", value: 20 }, { label: "60-74", value: 18 }, { label: "75+", value: 9 }],
    education: { tertiary: "41%", secondary: "43%", primary: "16%" },
    religion: { primary: "Christianity", primaryPercent: "47%", secondary: "Unaffiliated", secondaryPercent: "40%", other: "Other 13%" },
    transportFacts: [{ title: "Major International Airports", detail: "Paris CDG, Paris Orly, Nice Cote d'Azur" }, { title: "Major Seaports", detail: "Marseille Fos, Le Havre, Dunkirk" }],
  },
  japan: {
    displayTheme: "night",
    lede: "An island nation in East Asia known for advanced technology, long life expectancy, dense cities, and deep cultural continuity.",
    summary: "Japan is an archipelago in the northwest Pacific, with Tokyo as its capital and largest metropolitan center. Its economy is highly developed, and its society combines modern industry with long-standing traditions.",
    flagFacts: [{ value: "47", label: "Prefectures" }, { value: "4", label: "Main islands" }, { value: "JPY", label: "Currency" }, { value: "Pacific", label: "Ocean" }],
    flagNote: "High-income East Asian island country in the Pacific Ring of Fire.",
    gender: { female: "51.4%", male: "48.6%" },
    medianAge: "49.9 years",
    ageDistribution: [{ label: "0-14", value: 12 }, { label: "15-29", value: 13 }, { label: "30-44", value: 18 }, { label: "45-59", value: 20 }, { label: "60-74", value: 21 }, { label: "75+", value: 16 }],
    education: { tertiary: "64%", secondary: "30%", primary: "6%" },
    religion: { primary: "Shinto/Buddhist", primaryPercent: "70%", secondary: "Unaffiliated", secondaryPercent: "24%", other: "Other 6%" },
    neighbors: [{ name: "Pacific Ocean", note: "East" }, { name: "Sea of Japan", note: "West" }, { name: "Korea Strait", note: "Southwest" }, { name: "East China Sea", note: "Southwest" }],
    transportFacts: [{ title: "Major International Airports", detail: "Tokyo Haneda (HND), Narita (NRT), Kansai (KIX)" }, { title: "Major Seaports", detail: "Yokohama, Kobe, Nagoya, Tokyo" }],
  },
  china: {
    lede: "A major East Asian country known for its population scale, manufacturing power, long imperial history, and fast modern infrastructure.",
    summary: "China occupies a vast part of East Asia, from the Pacific coast to high inland plateaus and deserts. Beijing is the capital, while Shanghai, Shenzhen, Guangzhou, and other cities anchor one of the world’s largest economies.",
    flagFacts: [{ value: "23", label: "Provinces" }, { value: "5", label: "Autonomous regions" }, { value: "CNY", label: "Currency" }, { value: "1.4B", label: "People" }],
    flagNote: "Large East Asian state with a long land frontier and major Pacific ports.",
    gender: { female: "48.9%", male: "51.1%" },
    medianAge: "39.8 years",
    ageDistribution: [{ label: "0-14", value: 17 }, { label: "15-29", value: 17 }, { label: "30-44", value: 23 }, { label: "45-59", value: 24 }, { label: "60-74", value: 15 }, { label: "75+", value: 4 }],
    education: { tertiary: "22%", secondary: "60%", primary: "18%" },
    religion: { primary: "Folk/Other", primaryPercent: "52%", secondary: "Unaffiliated", secondaryPercent: "28%", other: "Buddhist/Other 20%" },
    transportFacts: [{ title: "Major International Airports", detail: "Shanghai Pudong (PVG), Beijing Capital (PEK), Guangzhou (CAN)" }, { title: "Major Seaports", detail: "Shanghai, Ningbo-Zhoushan, Shenzhen, Guangzhou" }],
  },
  india: {
    lede: "A South Asian republic known for its enormous population, democratic institutions, languages, technology services, and historic trade routes.",
    summary: "India covers much of South Asia, with the Himalayas to the north and the Indian Ocean to the south. New Delhi is the capital, and the country is one of the world’s largest democracies and fastest-growing major economies.",
    flagFacts: [{ value: "28", label: "States" }, { value: "8", label: "Union territories" }, { value: "INR", label: "Currency" }, { value: "1.46B", label: "People" }],
    flagNote: "Large South Asian republic with Himalayan borders and Indian Ocean coastlines.",
    gender: { female: "48.4%", male: "51.6%" },
    medianAge: "28.8 years",
    ageDistribution: [{ label: "0-14", value: 25 }, { label: "15-29", value: 27 }, { label: "30-44", value: 24 }, { label: "45-59", value: 15 }, { label: "60-74", value: 7 }, { label: "75+", value: 2 }],
    education: { tertiary: "15%", secondary: "53%", primary: "32%" },
    religion: { primary: "Hinduism", primaryPercent: "80%", secondary: "Islam", secondaryPercent: "14%", other: "Other 6%" },
    transportFacts: [{ title: "Major International Airports", detail: "Delhi (DEL), Mumbai (BOM), Bengaluru (BLR)" }, { title: "Major Seaports", detail: "JNPA/Mumbai, Mundra, Chennai, Visakhapatnam" }],
  },
  singapore: {
    displayTheme: "night",
    lede: "A compact Southeast Asian city-state known for global finance, port logistics, aviation, clean urban systems, and multicultural daily life.",
    summary: "Singapore is an island city-state at the southern end of the Malay Peninsula, positioned on one of the world’s busiest shipping routes. Its economy is high income, highly urban, and closely tied to trade, finance, aviation, and technology.",
    flagFacts: [{ value: "City", label: "State" }, { value: "4", label: "Official languages" }, { value: "SGD", label: "Currency" }, { value: "100%", label: "Urban" }],
    flagNote: "High-income Southeast Asian city-state with one of the world’s busiest ports.",
    gender: { female: "52.4%", male: "47.6%" },
    medianAge: "42.8 years",
    ageDistribution: [{ label: "0-14", value: 12 }, { label: "15-29", value: 17 }, { label: "30-44", value: 23 }, { label: "45-59", value: 24 }, { label: "60-74", value: 17 }, { label: "75+", value: 7 }],
    education: { tertiary: "60%", secondary: "30%", primary: "10%" },
    religion: { primary: "Buddhist", primaryPercent: "31%", secondary: "Unaffiliated", secondaryPercent: "20%", other: "Islam/Christian/Hindu 49%" },
    neighbors: [{ name: "Malaysia", slug: "malaysia", flagUrl: "https://flagcdn.com/my.svg", note: "North" }, { name: "Indonesia", slug: "indonesia", flagUrl: "https://flagcdn.com/id.svg", note: "South" }, { name: "Singapore Strait", note: "South" }, { name: "South China Sea", note: "East" }],
    transportFacts: [{ title: "Major International Airport", detail: "Singapore Changi Airport (SIN)" }, { title: "Major Seaport", detail: "Port of Singapore container and transshipment hub" }],
  },
  italy: {
    lede: "A Southern European republic known for Roman history, Renaissance culture, fashion, engineering, cuisine, and Mediterranean trade.",
    summary: "Italy extends into the Mediterranean Sea and includes the large islands of Sicily and Sardinia. Rome is the capital, and the country is a founding EU member with a strong cultural and industrial identity.",
    flagFacts: [{ value: "20", label: "Regions" }, { value: "Rome", label: "Capital" }, { value: "EUR", label: "Currency" }, { value: "Med", label: "Sea" }],
    flagNote: "Mediterranean European republic with Alpine borders and extensive coastlines.",
    gender: { female: "51.2%", male: "48.8%" },
    medianAge: "48.4 years",
    ageDistribution: [{ label: "0-14", value: 13 }, { label: "15-29", value: 15 }, { label: "30-44", value: 18 }, { label: "45-59", value: 21 }, { label: "60-74", value: 21 }, { label: "75+", value: 12 }],
    education: { tertiary: "31%", secondary: "50%", primary: "19%" },
    religion: { primary: "Christianity", primaryPercent: "74%", secondary: "Unaffiliated", secondaryPercent: "18%", other: "Other 8%" },
    transportFacts: [{ title: "Major International Airports", detail: "Rome Fiumicino (FCO), Milan Malpensa (MXP), Venice (VCE)" }, { title: "Major Seaports", detail: "Genoa, Trieste, Gioia Tauro, Naples" }],
  },
  "south-africa": {
    lede: "A diverse southern African republic known for mineral wealth, coastlines, major cities, wildlife, and 11 official languages.",
    summary: "South Africa occupies the southern tip of the African continent, where the Atlantic and Indian Oceans meet. It has three capital cities in practice, with Pretoria serving as the executive capital.",
    flagFacts: [{ value: "9", label: "Provinces" }, { value: "3", label: "Capitals" }, { value: "11", label: "Official languages" }, { value: "2", label: "Ocean coasts" }],
    flagNote: "Southern African republic with Atlantic and Indian Ocean coastlines.",
    gender: { female: "51.1%", male: "48.9%" },
    medianAge: "28.3 years",
    ageDistribution: [{ label: "0-14", value: 28 }, { label: "15-29", value: 25 }, { label: "30-44", value: 23 }, { label: "45-59", value: 15 }, { label: "60-74", value: 7 }, { label: "75+", value: 2 }],
    education: { tertiary: "16%", secondary: "58%", primary: "26%" },
    religion: { primary: "Christianity", primaryPercent: "78%", secondary: "Traditional/Other", secondaryPercent: "15%", other: "Unaffiliated 7%" },
    transportFacts: [{ title: "Major International Airports", detail: "Johannesburg (JNB), Cape Town (CPT), Durban (DUR)" }, { title: "Major Seaports", detail: "Durban, Cape Town, Ngqura, Richards Bay" }],
  },
  brazil: {
    lede: "A South American federation known for the Amazon, Portuguese language, agriculture, energy, biodiversity, music, football, and large cities.",
    summary: "Brazil is the largest country in South America, stretching from the Amazon Basin to the Atlantic coast. Brasília is the capital, while São Paulo and Rio de Janeiro are among its best-known urban centers.",
    flagFacts: [{ value: "26", label: "States" }, { value: "1", label: "Federal district" }, { value: "BRL", label: "Currency" }, { value: "Amazon", label: "Region" }],
    flagNote: "Large South American federation with an Atlantic coastline and Amazon interior.",
    gender: { female: "50.9%", male: "49.1%" },
    medianAge: "34.2 years",
    ageDistribution: [{ label: "0-14", value: 20 }, { label: "15-29", value: 22 }, { label: "30-44", value: 23 }, { label: "45-59", value: 20 }, { label: "60-74", value: 11 }, { label: "75+", value: 4 }],
    education: { tertiary: "22%", secondary: "55%", primary: "23%" },
    religion: { primary: "Christianity", primaryPercent: "81%", secondary: "Unaffiliated", secondaryPercent: "9%", other: "Other 10%" },
    transportFacts: [{ title: "Major International Airports", detail: "São Paulo GRU, Rio GIG, Brasília BSB" }, { title: "Major Seaports", detail: "Santos, Rio de Janeiro, Paranagua, Itajai" }],
  },
};

function compactArea(value?: number | null) {
  if (value == null) return "Not published";
  return `${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(value)} km²`;
}

function compactSquareMiles(value?: number | null) {
  if (value == null) return "";
  return `${new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(value * 0.386102)} mi²`;
}

function percent(value?: number | null) {
  if (value == null) return "Not published";
  return `${value.toFixed(value === 100 ? 0 : 1)}%`;
}

function economyLabel(value?: number | null) {
  if (value == null) return "National economy";
  if (value >= 30000) return "High-income country";
  if (value >= 12000) return "Upper-middle income";
  if (value >= 4000) return "Emerging economy";
  return "Developing economy";
}

function buildSnapshot(slug: string): CountrySnapshotData {
  const country = getCountryBySlug(slug)!;
  const metrics = getMetrics(country.cca3);
  const enrichment = getEnrichment(country.cca3);
  const currencies = Object.entries(country.currencies);
  const [lat, lng] = country.latlng;
  const neighborCountries = (country.borders ?? [])
    .map((neighbor) => getCountryByCca3(neighbor))
    .filter((neighbor): neighbor is NonNullable<typeof neighbor> => Boolean(neighbor));
  const override = PROFILE_OVERRIDES[slug] || {};
  const urban = enrichment?.demographics?.urbanPercent?.value;
  const rural = enrichment?.demographics?.ruralPercent?.value ?? (urban == null ? null : 100 - urban);
  const snapshot: CountrySnapshotData = {
    slug: country.slug,
    name: country.name,
    officialName: country.officialName,
    code: country.cca2,
    region: displayRegion(country),
    flagUrl: flagUrl(country.cca2),
    fullFlagUrl: flagUrl(country.cca2),
    capital: country.capital || "Not published",
    population: metrics?.population ? formatNumber(metrics.population.value) : formatNumber(country.population),
    populationNote: metrics?.population?.year ? `${metrics.population.year} est.` : "2024 est.",
    currency: currencies.map(([code, currency]) => `${currency.name} (${code})`).join(", "),
    currencyCode: currencies.map(([code]) => code).join(", "),
    area: compactArea(country.area),
    areaImperial: compactSquareMiles(country.area),
    coastline: country.landlocked ? "Landlocked" : "Coastal",
    gdp: metrics?.gdp ? formatMoney(metrics.gdp.value) : "Not published",
    gdpPerCapita: metrics?.gdpPerCapita ? formatMoney(metrics.gdpPerCapita.value) : "Not published",
    gdpGrowth: metrics?.gdpGrowth ? `${metrics.gdpGrowth.value.toFixed(1)}%` : "Not published",
    lifeExpectancy: metrics?.lifeExpectancy ? `${metrics.lifeExpectancy.value.toFixed(0)} years` : "Not published",
    medianAge: enrichment?.demographics?.medianAge ? `${enrichment.demographics.medianAge} years` : "Not published",
    urbanPercent: percent(urban),
    ruralPercent: percent(rural),
    languages: (enrichment?.demographics?.officialLanguages ?? []).join(", ") || Object.values(country.languages).join(", "),
    government: enrichment?.government?.type || "Republic",
    timeZones: enrichment?.dailyLife?.timeZones || "Local time zones",
    drivingSide: enrichment?.dailyLife?.drivingSide || "Right",
    plugTypes: enrichment?.dailyLife?.plugTypes || "Common local standards",
    mapUrl: `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 30}%2C${lat - 16}%2C${lng + 30}%2C${lat + 16}&layer=mapnik&marker=${lat}%2C${lng}`,
    silhouetteUrl: country.cca2 === "US" ? "/maps/us-states.svg" : "",
    neighbors: neighborCountries.map((neighbor) => ({ name: neighbor.name, slug: neighbor.slug, flagUrl: flagUrl(neighbor.cca2), note: "Border" })),
    landmark: enrichment?.images?.[0],
    history: enrichment?.history?.summary || "",
    facts: enrichment?.facts ?? [],
  };
  return { ...snapshot, ...override };
}

export default async function Home({ searchParams }: { searchParams?: Promise<{ country?: string }> }) {
  const params = await searchParams;
  const snapshots = SNAPSHOT_COUNTRIES.map(buildSnapshot);
  const initialCountry = params?.country;

  return (
    <main>
      <CountrySnapshot data={snapshots} initialOpen={Boolean(initialCountry && SNAPSHOT_COUNTRIES.includes(initialCountry))} initialCountry={initialCountry} />
      <nav className="site-nav" aria-label="Primary navigation">
        <Link className="brand" href="/" aria-label="Color Atlas World home">
          <span className="brand-mark">✦</span>
          <span>Color Atlas World</span>
        </Link>
        <div className="nav-links">
          <a href="#explore">Explore</a>
          <a href="#about">About</a>
          <a className="nav-cta" href="#countries">Browse 199 countries</a>
        </div>
      </nav>

      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow"><span /> A living atlas for curious people</p>
          <h1>Every country,<br /><em>clearly explained.</em></h1>
          <p className="hero-lede">
            Search a country and discover its flag, people, economy, geography,
            culture, and defining facts in one beautiful profile.
          </p>
          <CountrySearch variant="hero" />
          <p className="search-note">Try “Canada”, “Cambodia”, “Japan”, “UK”, or “BR”</p>
        </div>

        <div className="hero-atlas" aria-label="United States profile preview">
          <div className="atlas-orbit orbit-one" />
          <div className="atlas-orbit orbit-two" />
          <div className="atlas-card atlas-card-main">
            <div className="atlas-card-topline"><span>Country 001</span><span>North America</span></div>
            <img src="/flags/us.svg" alt="Flag of the United States" />
            <div className="atlas-card-title">
              <div><small>Now exploring</small><strong>United States</strong></div>
              <span className="atlas-code">US</span>
            </div>
          </div>
          <div className="atlas-card atlas-stat-card">
            <small>Population · 2025</small>
            <strong>341.8M</strong>
            <span>50 states · 1 federal district</span>
          </div>
          <div className="atlas-pin"><span>●</span> Washington, D.C.</div>
        </div>
      </section>

      <section className="number-strip" aria-label="Color Atlas World at a glance">
        {highlights.map((item) => (
          <div key={item.label}><strong>{item.value}</strong><span>{item.label}</span></div>
        ))}
      </section>

      <section className="feature-section" id="explore">
        <div className="section-heading">
          <p className="eyebrow"><span /> Featured country</p>
          <h2>Begin anywhere.<br /><em>Explore deeply.</em></h2>
          <p>Every country now has the same polished profile: flag, map, people, geography, economy, identity, and sources.</p>
          <Link className="text-link" href="/countries/united-states">Explore the full USA profile <span>→</span></Link>
        </div>
        <Link className="country-feature-card" href="/countries/united-states">
          <div className="feature-flag"><img src="/flags/us.svg" alt="" /></div>
          <div className="feature-card-body">
            <div className="feature-title-row">
              <div><small>North America</small><h3>United States</h3></div>
              <span>US</span>
            </div>
            <div className="mini-stats">
              <div><small>Capital</small><strong>Washington, D.C.</strong></div>
              <div><small>Population</small><strong>341.8 million</strong></div>
              <div><small>Currency</small><strong>U.S. dollar</strong></div>
            </div>
          </div>
        </Link>
      </section>

      <section className="country-directory" id="countries">
        <div className="country-directory-head">
          <div>
            <p className="eyebrow"><span /> The complete atlas</p>
            <h2>Choose from<br /><em>199 countries.</em></h2>
          </div>
          <p>Search by country name, common alias, or two- and three-letter country code—or browse the full directory below.</p>
        </div>
        <CountrySearch variant="hero" />
        <div className="country-directory-grid">
          {COUNTRIES.map((country) => (
            <Link className="country-directory-card" href={`/countries/${country.slug}`} key={country.cca3}>
              <img src={flagUrl(country.cca2)} alt="" loading="lazy" />
              <span><strong>{country.name}</strong><small>{displayRegion(country)} · {country.cca2}</small></span>
              <b aria-hidden="true">→</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="principles" id="about">
        <div><span>01</span><h3>Trusted numbers</h3><p>Core statistics include their year and link back to authoritative sources.</p></div>
        <div><span>02</span><h3>Designed to teach</h3><p>Dense information becomes a clear visual story that works on every screen.</p></div>
        <div><span>03</span><h3>One global system</h3><p>All 199 country profiles share the same structure, navigation, sourcing, and visual language.</p></div>
      </section>

      <footer className="site-footer">
        <div className="brand"><span className="brand-mark">✦</span><span>Color Atlas World</span></div>
        <p>Explore the world, one country at a time.</p>
        <span>© 2026 Color Atlas World</span>
      </footer>
    </main>
  );
}
