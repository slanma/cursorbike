import { kontakt } from "@/lib/kontakt";

/**
 * Identifikace prodávajícího pro všechny právní stránky:
 * obchodní podmínky, zásady zpracování osobních údajů, odstoupení od smlouvy a patičku.
 *
 * Toto je JEDINÉ místo, kde se identita prodávajícího nastavuje.
 *
 Identifikační údaje odpovídají výpisu z obchodního rejstříku
 * (Cursorbike s.r.o., IČO 21464065, C 95768 u Krajského soudu v Ostravě, vznik 12. 4. 2024).
 *
 * Společnost je plátcem DPH, DIČ CZ21464065.
 */
export const prodavajici = {
  jmeno: "Cursorbike s.r.o.",
  oznaceni: "Cursorbike s.r.o.",

  /**
  * Sídlo dle výpisu z OR. POZOR: není totožné s adresou prodejny —
  * sídlo je v Ostravě-Porubě, ale zboží se vrací do provozovny v Kravařích.
  * Pro doručovací účely se proto všude používá `adresaProVraceni`, ne `sidlo`.
  */
  sidlo: "Karola Šmidkeho 1818/14, Poruba, 708 00 Ostrava",

  ico: "21464065",

  /**
  * DIČ právnické osoby v ČR = „CZ" + IČO.
  * U neplátce nastavit na `null` — řádek DIČ se pak všude skryje.
  */
  dic: "CZ21464065" as string | null,

  /**
   * Řídí formulaci o cenách v čl. 3.1 a 5.1 obchodních podmínek.
   * Neplátce DPH nesmí uvádět „ceny včetně DPH" — proto je to přepínač,
   * ne natvrdo zapsaná věta.
   */
  platceDph: true,

  zapis: "v obchodním rejstříku vedeném Krajským soudem v Ostravě, spisová značka C 95768",

  /**
  * Jednatel oprávněný jednat za společnost. Ve výpisu byl statutární orgán oříznutý,
  * takže zatím `null` — řádek se v obchodních podmínkách nezobrazí.
  * Není povinný údaj, ale doplnit se hodí.
  */
  jednatel: null as string | null,

  /**
  * s.r.o. má datovou schránku ze zákona. Dokud je `null`, řádek v čl. 1.2
  * i čl. 10.3 o doručování do datové schránky se nezobrazí.
  */
  datovaSchranka: null as string | null,

  email: kontakt.email,
  emailHref: kontakt.emailHref,
  telefon: kontakt.telefon,
  telefonHref: kontakt.telefonHref,
  adresaProVraceni: kontakt.adresaJednoradek,

  /**
  * Datum účinnosti obchodních podmínek = den spuštění e-shopu.
  * Zatím nastaveno na dnešek, upravit podle skutečného data spuštění.
  */
  ucinnostOd: "14. 8. 2026",

  /**
   * Znění, které se tímto nahrazuje (čl. 14.4).
   * `null` = jde o první znění obchodních podmínek tohoto e-shopu, věta o nahrazení
   * se nezobrazí. Původní text tvrdil, že nahrazuje znění „od 1. 1. 2014", což
   * u nově spouštěného e-shopu neplatilo.
   */
  predchoziUcinnostOd: null as string | null,

  /**
   * Přechodné ustanovení pro případ, že e-shop dříve provozoval jiný subjekt.
   * `null` = e-shop cursorbike.cz je spouštěn nově pod s.r.o., přes web nebyla
   * uzavřena žádná dřívější smlouva, a přechodné ustanovení tedy nedává smysl.
   *
   * Vyplnit POUZE tehdy, pokud by e-shop reálně běžel pod předchozím subjektem
   * a bylo by nutné zákazníkům sdělit, komu uplatnit starší reklamace.
   */
  predchudce: null as null | {
    jmeno: string;
    ico: string;
    doDne: string;
    zavazkyPrevzaty: boolean;
  },
};
