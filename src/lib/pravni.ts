import { kontakt } from "@/lib/kontakt";

export const prodavajici = {
  jmeno: "Miroslav Dékany",
  oznaceni: "Miroslav Dékany – Cursorbike",
  sidlo: kontakt.adresaJednoradek,
  ico: "40338797",
  dic: "CZ6411211070",
  zapis: "v živnostenském rejstříku vedeném Městským úřadem Kravaře",
  email: kontakt.email,
  emailHref: kontakt.emailHref,
  telefon: kontakt.telefon,
  telefonHref: kontakt.telefonHref,
  adresaProVraceni: kontakt.adresaJednoradek,
  ucinnostOd: "9. 8. 2026",
} as const;
