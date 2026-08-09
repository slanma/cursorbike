import eletroCity from "@/assets/kolo-elektro-city.jpg";
import mtb from "@/assets/kolo-mtb.jpg";
import trekking from "@/assets/kolo-trekking.jpg";

export type Kategorie = "kola" | "elektrokola";

export type ParametrSkupina = {
  skupina: string;
  polozky: { label: string; hodnota: string }[];
};

export type SekceSlug = "panska" | "damska" | "detska";

export type Produkt = {
  slug: string;
  nazev: string;
  kategorie: Kategorie;
  typ: string;
  sekce?: SekceSlug;
  velikost?: string;
  cena: number;
  puvodniCena?: number;
  obrazek: string;
  kratky: string;
  popis: string;
  proKoho: string[];
  neniProKoho?: string;
  parametry: ParametrSkupina[];
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
      "Elektrokolo pro každodenní jízdu po městě i na výlety. Nízký rám usnadní nasedání, integrovaná baterie vydrží až 90 km a hydraulické brzdy zvládnou i plné brašny. Kolo předáváme kompletně seřízené, s nastavením posedu přímo na vaši postavu.",
    proKoho: [
      "Pro dojíždění do práce a nákupy po městě",
      "Pro seniory a všechny, komu dělá potíže přehodit nohu přes rám",
      "Pro jízdu za každého počasí – blatníky, světla i nosič jsou součástí",
      "Pro rekreační výlety do 90 km bez nabíjení",
    ],
    neniProKoho: "Není určeno do náročného terénu ani na skoky.",
    parametry: [
      {
        skupina: "Pohon a baterie",
        polozky: [
          { label: "Motor", hodnota: "Středový, 250 W / 65 Nm" },
          { label: "Baterie", hodnota: "630 Wh, integrovaná v rámu" },
          { label: "Dojezd", hodnota: "60–90 km podle režimu a terénu" },
          { label: "Nabíjení", hodnota: "cca 4,5 h (0–100 %)" },
          { label: "Displej", hodnota: "Barevný, 5 režimů podpory" },
        ],
      },
      {
        skupina: "Rám a geometrie",
        polozky: [
          { label: "Rám", hodnota: "Hliník, nízký průstupový nástup" },
          { label: "Velikosti", hodnota: "S / M / L (155–190 cm)" },
          { label: "Hmotnost", hodnota: "24,5 kg včetně baterie" },
          { label: "Nosnost", hodnota: "140 kg (jezdec + bagáž)" },
        ],
      },
      {
        skupina: "Komponenty",
        polozky: [
          { label: "Převody", hodnota: "Shimano Deore 1x10" },
          { label: "Brzdy", hodnota: "Hydraulické kotoučové, 180 mm" },
          { label: "Kola / pláště", hodnota: '28" / 47 mm s reflexním pruhem' },
          { label: "Odpružení", hodnota: "Vidlice 63 mm + odpružená sedlovka" },
        ],
      },
      {
        skupina: "Výbava a záruka",
        polozky: [
          { label: "Výbava v ceně", hodnota: "Nosič, blatníky, světla, stojánek, zvonek" },
          { label: "Záruka", hodnota: "3 roky rám, 2 roky baterie a motor" },
          { label: "Servis", hodnota: "První seřízení po 300 km zdarma" },
        ],
      },
    ],
  },
  {
    slug: "mtb-enduro-zelene",
    nazev: "MTB Enduro Trail",
    kategorie: "kola",
    typ: "Horské",
    sekce: "panska",
    velikost: '29"',
    cena: 36900,
    obrazek: mtb,
    kratky: "Hliníkový rám, 140mm vidlice, brzdy pro prudké sjezdy.",
    popis:
      "Horské kolo pro trailové ježdění. Lehký hliníkový rám, vzduchová vidlice s 140 mm zdvihu a široké pláště pro jistotu v technickém terénu. Před předáním kolo projedeme a nastavíme tlak ve vidlici podle vaší váhy.",
    proKoho: [
      "Pro jezdce, kteří jezdí singletraily a bikeparkové modré/červené tratě",
      "Pro pokročilé začátečníky, co chtějí kolo, ze kterého rychle nevyrostou",
      "Pro celodenní výjezdy v kopcích – 1x12 zvládne i strmé stoupání",
    ],
    neniProKoho: "Na běžné dojíždění po městě je zbytečně těžké a bez výbavy.",
    parametry: [
      {
        skupina: "Rám a odpružení",
        polozky: [
          { label: "Rám", hodnota: "Hliník 6061, trail geometrie" },
          { label: "Vidlice", hodnota: "Vzduchová, 140 mm, s lockoutem" },
          { label: "Velikosti", hodnota: "S / M / L / XL (160–195 cm)" },
          { label: "Hmotnost", hodnota: "13,8 kg" },
        ],
      },
      {
        skupina: "Komponenty",
        polozky: [
          { label: "Převody", hodnota: "1x12, rozsah 10–51 z." },
          { label: "Brzdy", hodnota: "Hydraulické kotoučové, 203/180 mm" },
          { label: "Kola", hodnota: '29", ráfky 30 mm vnitřní šířky' },
          { label: "Pláště", hodnota: "2,4\" tubeless ready" },
          { label: "Sedlovka", hodnota: "Teleskopická, 150 mm zdvih" },
        ],
      },
      {
        skupina: "Výbava a záruka",
        polozky: [
          { label: "Výbava v ceně", hodnota: "Pedály nasazujeme dle domluvy" },
          { label: "Záruka", hodnota: "3 roky rám, 2 roky komponenty" },
          { label: "Servis", hodnota: "První seřízení po 300 km zdarma" },
        ],
      },
    ],
  },
  {
    slug: "trekkingove-kolo-tour",
    nazev: "Trekkingové kolo Tour",
    kategorie: "kola",
    typ: "Trekking",
    sekce: "damska",
    velikost: '27,5"',
    cena: 25900,
    obrazek: trekking,
    kratky: "Nosič, blatníky a světla – připravené na cesty.",
    popis:
      "Univerzální trekkingové kolo pro dojíždění i vícedenní výlety. Kompletní výbava včetně nosiče, blatníků a dynama je součástí ceny, takže kolo stačí vyzvednout a vyrazit.",
    proKoho: [
      "Pro dojíždění do práce po asfaltu i po polních cestách",
      "Pro vícedenní výlety s brašnami a stanem",
      "Pro toho, kdo chce jedno kolo na všechno a nechce nic dokupovat",
    ],
    parametry: [
      {
        skupina: "Rám a geometrie",
        polozky: [
          { label: "Rám", hodnota: "Hliník, trekking geometrie" },
          { label: "Velikosti", hodnota: "17\" / 19\" / 21\" (160–192 cm)" },
          { label: "Hmotnost", hodnota: "14,9 kg s výbavou" },
          { label: "Nosnost", hodnota: "130 kg" },
        ],
      },
      {
        skupina: "Komponenty",
        polozky: [
          { label: "Převody", hodnota: "Shimano 2x10" },
          { label: "Brzdy", hodnota: "Hydraulické kotoučové, 160 mm" },
          { label: "Kola / pláště", hodnota: '28" / 40 mm s protipíchnutím' },
          { label: "Vidlice", hodnota: "Odpružená, 63 mm s lockoutem" },
        ],
      },
      {
        skupina: "Výbava a záruka",
        polozky: [
          { label: "Výbava v ceně", hodnota: "Nosič (25 kg), blatníky, dynamo, světla, stojánek" },
          { label: "Záruka", hodnota: "3 roky rám, 2 roky komponenty" },
          { label: "Servis", hodnota: "První seřízení po 300 km zdarma" },
        ],
      },
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
    proKoho: [
      "Pro dlouhé celodenní trasy 80–130 km",
      "Pro cestování s brašnami – nosnost 150 kg včetně bagáže",
      "Pro kopcovité oblasti, kde oceníte 85 Nm kroutícího momentu",
      "Pro páry, které chtějí jet spolu i s rozdílnou kondicí",
    ],
    parametry: [
      {
        skupina: "Pohon a baterie",
        polozky: [
          { label: "Motor", hodnota: "Středový, 250 W / 85 Nm" },
          { label: "Baterie", hodnota: "750 Wh, vyjímatelná" },
          { label: "Dojezd", hodnota: "80–130 km" },
          { label: "Nabíjení", hodnota: "cca 5,5 h (0–100 %)" },
          { label: "Displej", hodnota: "Barevný, s navigací přes aplikaci" },
        ],
      },
      {
        skupina: "Rám a geometrie",
        polozky: [
          { label: "Rám", hodnota: "Hliník, trekking – vysoký i nízký nástup" },
          { label: "Velikosti", hodnota: "M / L / XL (168–195 cm)" },
          { label: "Hmotnost", hodnota: "26,8 kg" },
          { label: "Nosnost", hodnota: "150 kg" },
        ],
      },
      {
        skupina: "Komponenty",
        polozky: [
          { label: "Převody", hodnota: "Shimano Deore 1x11" },
          { label: "Brzdy", hodnota: "Hydraulické kotoučové, 4pístkové, 180 mm" },
          { label: "Kola / pláště", hodnota: '28" / 50 mm e-bike rated' },
          { label: "Vidlice", hodnota: "Vzduchová, 100 mm" },
        ],
      },
      {
        skupina: "Výbava a záruka",
        polozky: [
          { label: "Výbava v ceně", hodnota: "Nosič, blatníky, světla, stojánek" },
          { label: "Záruka", hodnota: "3 roky rám, 2 roky baterie a motor" },
          { label: "Servis", hodnota: "Diagnostika a aktualizace software u nás" },
        ],
      },
    ],
  },
  {
    slug: "mtb-hardtail-start",
    nazev: "MTB Hardtail Start",
    kategorie: "kola",
    typ: "Horské",
    sekce: "detska",
    velikost: '26"',
    cena: 18900,
    obrazek: mtb,
    kratky: "Dostupný začátek do terénu, seřízené u nás v dílně.",
    popis:
      "Spolehlivý hardtail pro první kilometry v terénu. Každé kolo u nás před předáním kompletně seřídíme a projedeme s vámi nastavení posedu.",
    proKoho: [
      "Pro začátečníky a první kolo do lehčího terénu",
      "Pro studenty a dojíždění po městě i po cyklostezkách",
      "Pro rodiče, kteří hledají odolné kolo s rozumnou cenou",
    ],
    neniProKoho: "Na bikepark a skoky doporučíme raději model s odpruženou zádí.",
    parametry: [
      {
        skupina: "Rám a odpružení",
        polozky: [
          { label: "Rám", hodnota: "Hliník 6061" },
          { label: "Vidlice", hodnota: "Pružinová, 100 mm" },
          { label: "Velikosti", hodnota: "S / M / L (160–188 cm)" },
          { label: "Hmotnost", hodnota: "14,2 kg" },
        ],
      },
      {
        skupina: "Komponenty",
        polozky: [
          { label: "Převody", hodnota: "1x10" },
          { label: "Brzdy", hodnota: "Hydraulické kotoučové, 180/160 mm" },
          { label: "Kola", hodnota: '29"' },
          { label: "Pláště", hodnota: "2,25\" univerzální vzorek" },
        ],
      },
      {
        skupina: "Výbava a záruka",
        polozky: [
          { label: "Záruka", hodnota: "3 roky rám, 2 roky komponenty" },
          { label: "Servis", hodnota: "První seřízení po 300 km zdarma" },
        ],
      },
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
    proKoho: [
      "Pro město, kde se kolo musí vejít do výtahu nebo do kufru",
      "Pro kombinaci kolo + auto/vlak při cestě do práce",
      "Pro menší postavy – nízký nástup a nastavitelné sedlo i představec",
    ],
    parametry: [
      {
        skupina: "Pohon a baterie",
        polozky: [
          { label: "Motor", hodnota: "Zadní náboj, 250 W / 45 Nm" },
          { label: "Baterie", hodnota: "500 Wh, vyjímatelná" },
          { label: "Dojezd", hodnota: "50–75 km" },
          { label: "Nabíjení", hodnota: "cca 4 h (0–100 %)" },
        ],
      },
      {
        skupina: "Rám a rozměry",
        polozky: [
          { label: "Rám", hodnota: "Hliník, kompaktní nízký nástup" },
          { label: "Velikosti", hodnota: "Univerzální (150–185 cm)" },
          { label: "Hmotnost", hodnota: "22,4 kg" },
          { label: "Nosnost", hodnota: "120 kg" },
        ],
      },
      {
        skupina: "Komponenty",
        polozky: [
          { label: "Převody", hodnota: "Shimano 1x8" },
          { label: "Brzdy", hodnota: "Hydraulické kotoučové, 160 mm" },
          { label: "Kola / pláště", hodnota: '24" / 2,15" balonové' },
        ],
      },
      {
        skupina: "Výbava a záruka",
        polozky: [
          { label: "Výbava v ceně", hodnota: "Blatníky, světla, nosič, stojánek" },
          { label: "Záruka", hodnota: "3 roky rám, 2 roky baterie a motor" },
          { label: "Servis", hodnota: "První seřízení po 300 km zdarma" },
        ],
      },
    ],
  },
];

export const sekceKol: { slug: SekceSlug; nazev: string; popis: string; velikosti: string[] }[] = [
  {
    slug: "panska",
    nazev: "Pánská",
    popis: "Jízdní kola pánská — horská 29\".",
    velikosti: ['29"'],
  },
  {
    slug: "damska",
    nazev: "Dámská",
    popis: "Jízdní kola dámská — horská 27,5\" a 29\".",
    velikosti: ['27,5"', '29"'],
  },
  {
    slug: "detska",
    nazev: "Dětská",
    popis: "Jízdní kola dětská — 26\", 27,5\" a 29\".",
    velikosti: ['26"', '27,5"', '29"'],
  },
];

export const kolaSekce = (sekce: SekceSlug) =>
  produkty.filter((p) => p.kategorie === "kola" && p.sekce === sekce);

export const najdiSekci = (slug: string) => sekceKol.find((s) => s.slug === slug);

export const formatCena = (cena: number) =>
  new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(cena);

export const najdiProdukt = (slug: string) => produkty.find((p) => p.slug === slug);
