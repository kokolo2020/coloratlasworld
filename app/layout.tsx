import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import "./globals.css";

const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const display = Lora({ variable: "--font-display", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://coloratlasworld.com"),
  title: { default: "Color Atlas World — Every Country, Clearly Explained", template: "%s | Color Atlas World" },
  description: "Explore country flags, geography, people, economies, culture, and defining facts in a beautiful visual atlas.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Color Atlas World — Every Country, Clearly Explained",
    description: "Explore country flags, geography, people, economies, culture, and defining facts in a beautiful visual atlas.",
    type: "website",
    url: "https://coloratlasworld.com",
    siteName: "Color Atlas World",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Color Atlas World globe and atlas cover" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Color Atlas World — Every Country, Clearly Explained",
    description: "Explore country flags, geography, people, economies, culture, and defining facts in a beautiful visual atlas.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>{children}</body>
    </html>
  );
}
