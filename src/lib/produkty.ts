import eletroCity from "@/assets/kolo-elektro-city.jpg";
import mtb from "@/assets/kolo-mtb.jpg";
import trekking from "@/assets/kolo-trekking.jpg";

export type Kategorie = "kola" | "elektrokola";

export type Produkt = {
  slug: string;
  nazev: string;
  kategorie: Kategorie;
  typ: string;
  cena: number;
  puvodniCena?: number;
  obrazek: string;
  kratky: string;
  popis: string;
  parametry: { label: string; hodnota: string }[];
};

export const produkty: Produkt[] = [
  {
    slug: "elektrokolo-city-nizky-nastup",
    nazev: "Elektrokolo City s nízkým nástupem",
    kategorie: "elektrokola",
    typ: "Městské",
    cena: 44900,
    puvodniCena: 49900,
    obrazek: eletroCity,
    kratky: "Pohodlný nástup, středový motor a baterie na 90 km.",
    popis:
      "Elektrokolo pro každodenní jízdu po městě i na výlety. Nízký rám usnadní nasedání, integrovaná baterie vydrží až 90 km a hydraulické brzdy zvládnou i plné brašny.",
    parametry: [
      { label: "Motor", hodnota: "Středový, 250 W / 65 Nm" },
      { label: "Baterie", hodnota: "630 Wh, integrovaná" },
      { label: "Dojezd", hodnota: "60–90 km" },
      { label: "Velikosti", hodnota: "S / M / L" },
    ],
  },
  {
    slug: "mtb-enduro-zelene",
    nazev: "MTB Enduro Trail",
    kategorie: "kola",
    typ: "Horské",
    cena: 36900,
    obrazek: mtb,
    kratky: "Hliníkový rám, 140mm vidlice, brzdy pro prudké sjezdy.",
    popis:
      "Horské kolo pro trailové ježdění. Lehký hliníkový rám, vzduchová vidlice s 140 mm zdvihu a široké pláště pro jistotu v technickém terénu.",
    parametry: [
      { label: "Rám", hodnota: "Hliník 6061, trail geometrie" },
      { label: "Vidlice", hodnota: "Vzduchová, 140 mm" },
      { label: "Převody", hodnota: "1x12" },
      { label: "Kola", hodnota: "29\"" },
    ],
  },
  {
    slug: "trekkingove-kolo-tour",
    nazev: "Trekkingové kolo Tour",
    kategorie: "kola",
    typ: "Trekking",
    cena: 25900,
    obrazek: trekking,
    kratky: "Nosič, blatníky a světla – připravené na cesty.",
    popis:
      "Univerzální trekkingové kolo pro dojíždění i vícedenní výlety. Kompletní výbava včetně nosiče, blatníků a dynama je součástí ceny.",
    parametry: [
      { label: "Rám", hodnota: "Hliník, trekking" },
      { label: "Výbava", hodnota: "Nosič, blatníky, světla" },
      { label: "Převody", hodnota: "2x10" },
      { label: "Brzdy", hodnota: "Hydraulické kotoučové" },
    ],
  },
  {
    slug: "elektrokolo-trek-power",
    nazev: "Elektrokolo Trek Power",
    kategorie: "elektrokola",
    typ: "Trekkingové",
    cena: 58900,
    obrazek: trekking,
    kratky: "Silný motor a velká baterie pro dlouhé trasy.",
    popis:
      "Trekkingové elektrokolo pro delší výlety s bagáží. Vysoká kapacita baterie, robustní nosič a spolehlivé komponenty s plným servisem u nás v prodejně.",
    parametry: [
      { label: "Motor", hodnota: "Středový, 250 W / 85 Nm" },
      { label: "Baterie", hodnota: "750 Wh" },
      { label: "Dojezd", hodnota: "80–130 km" },
      { label: "Nosnost", hodnota: "150 kg" },
    ],
  },
  {
    slug: "mtb-hardtail-start",
    nazev: "MTB Hardtail Start",
    kategorie: "kola",
    typ: "Horské",
    cena: 18900,
    obrazek: mtb,
    kratky: "Dostupný začátek do terénu, seřízené u nás v dílně.",
    popis:
      "Spolehlivý hardtail pro první kilometry v terénu. Každé kolo u nás před předáním kompletně seřídíme a projedeme s vámi nastavení posedu.",
    parametry: [
      { label: "Rám", hodnota: "Hliník 6061" },
      { label: "Vidlice", hodnota: "Pružinová, 100 mm" },
      { label: "Převody", hodnota: "1x10" },
      { label: "Kola", hodnota: "29\"" },
    ],
  },
  {
    slug: "elektrokolo-compact",
    nazev: "Elektrokolo Compact",
    kategorie: "elektrokola",
    typ: "Kompaktní",
    cena: 39900,
    obrazek: eletroCity,
    kratky: "Menší kola, snadné parkování, ideální do města.",
    popis:
      "Kompaktní elektrokolo do bytu i do kufru auta. Menší kola zlepšují obratnost, výbava zvládne každodenní dojíždění za každého počasí.",
    parametry: [
      { label: "Motor", hodnota: "Zadní náboj, 250 W" },
      { label: "Baterie", hodnota: "500 Wh" },
      { label: "Dojezd", hodnota: "50–75 km" },
      { label: "Kola", hodnota: "24\"" },
    ],
  },
];

export const formatCena = (cena: number) =>
  new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(cena);

export const najdiProdukt = (slug: string) => produkty.find((p) => p.slug === slug);
