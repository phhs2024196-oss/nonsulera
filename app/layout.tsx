import type { Metadata } from "next";
import { East_Sea_Dokdo, Gowun_Dodum, Nanum_Myeongjo } from "next/font/google";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Tracker from "@/components/Tracker";
import { site } from "@/lib/site";
import "./globals.css";

const serif = Nanum_Myeongjo({ weight: ["400", "700", "800"], subsets: ["latin"], variable: "--f-serif", display: "swap" });
const brush = East_Sea_Dokdo({ weight: "400", subsets: ["latin"], variable: "--f-brush", display: "swap" });
const sans = Gowun_Dodum({ weight: "400", subsets: ["latin"], variable: "--f-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "논술의 시대 · 수리논술", template: "%s · 논술의 시대" },
  description: site.description,
  openGraph: { siteName: site.name, locale: "ko_KR", type: "website", images: ["/brand/logo_main.png"] },
  icons: { icon: "/brand/logo_main.png" },
};

const orgLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: site.name,
  url: site.url,
  logo: `${site.url}/brand/logo_main.png`,
  description: site.description,
  sameAs: [site.instagram, site.youtube],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${serif.variable} ${brush.variable} ${sans.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
        <Header />
        <main>{children}</main>
        <Footer />
        <Suspense fallback={null}><Tracker /></Suspense>
      </body>
    </html>
  );
}
