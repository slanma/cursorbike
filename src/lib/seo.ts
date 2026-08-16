import { kontakt } from "@/lib/kontakt";

export const zaklad = "https://www.cursorbike.cz";

export function kanonicka(cesta: string) {
  return { rel: "canonical", href: `${zaklad}${cesta}` };
}

export function jsonLdScript(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

export function drobkyLd(polozky: { nazev: string; cesta: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: polozky.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.nazev,
      item: `${zaklad}${p.cesta}`,
    })),
  };
}

export function servisLd() {
  return {
    "@context": "https://schema.org",
    "@type": "BikeStore",
    name: kontakt.nazev,
    telephone: kontakt.telefon,
    email: kontakt.email,
    url: `${zaklad}/servis`,
    address: {
      "@type": "PostalAddress",
      streetAddress: kontakt.ulice,
      addressLocality: kontakt.mesto,
      postalCode: kontakt.psc,
      addressCountry: "CZ",
    },
    openingHours: ["Mo-Fr 09:00-12:00", "Mo-Fr 13:00-17:00"],
  };
}
