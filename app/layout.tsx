import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Tracker from "@/components/Tracker";
import { site } from "@/lib/site";
import "./globals.css";


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
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
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
