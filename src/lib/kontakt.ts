export const kontakt = {
  nazev: "Cursorbike s.r.o.",
  ulice: "Novodvorská 310/13",
  mesto: "Kravaře",
  psc: "747 21",
  adresaJednoradek: "Novodvorská 310/13, 747 21 Kravaře",
  telefon: "+420 606 713 763",
  telefonHref: "tel:+420606713763",
  email: "cursorbike@seznam.cz",
  emailHref: "mailto:cursorbike@seznam.cz",
  otviraciDoba: [
    { den: "Pondělí – Pátek", cas: "9:00–12:00 a 13:00–17:00" },
    { den: "Sobota", cas: "Zavřeno" },
    { den: "Neděle", cas: "Zavřeno" },
  ],
  otviraciDobaKratce: "Po–Pá 9–12 a 13–17 · So a Ne zavřeno",
  mapaOdkaz:
    "https://mapy.cz/zakladni?x=18.0070979&y=49.9323530&z=17&source=addr&id=9535507&q=novodvorsk%C3%A1%2013",
  mapaEmbed:
    "https://www.openstreetmap.org/export/embed.html?bbox=17.9971%2C49.9284%2C18.0171%2C49.9364&layer=mapnik&marker=49.932353%2C18.0070979",
  odRoku: 1997,
} as const;
