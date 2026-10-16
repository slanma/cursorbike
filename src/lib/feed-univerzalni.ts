/**
 * Univerzální import feedů.
 *
 * Myšlenka: každý dodavatel posílá data jinak, ale vždy jde o seznam položek
 * a u každé položky o pár údajů (název, cena, fotky…). Program feed přečte,
 * rozloží každou položku na dvojice „název pole → hodnota" a obsluha jen
 * jednou určí, které pole je co. To se uloží jako profil dodavatele a příště
 * už se jen klikne na Aktualizovat.
 *
 * Výsledkem je stejný `FeedVysledek` jako u ručně psaných čteček (Author,
 * Crussis), takže zbytek importu — kategorie, náhled, zápis — je společný.
 *
 * Umí:
 *  - XML v libovolném tvaru (Heureka, Zboží, Google, vlastní formáty) — sám
 *    najde, který prvek je „jedna položka"
 *  - CSV s libovolným oddělovačem a kódováním (UTF-8 i Windows-1250)
 *  - parametry z HTML tabulky uvnitř feedu (Leader Fox) i z Heureka PARAM
 *  - seskupení velikostí do jednoho produktu (jedna barva = jeden produkt)
 */

import type { FeedProdukt, FeedVarianta, FeedVysledek, Upozorneni } from "@/lib/feed";
import { nactiFeed, rozdelCsv } from "@/lib/feed";
import { vyfiltruj } from "@/lib/vyber-zbozi";
import type { ParametrSkupina } from "@/lib/produkty";

export type Hodnota = string | string[];
export type Polozka = Record<string, Hodnota>;

export type PoleFeedu = {
  klic: string;
  /** Hodnota z první položky, kde pole není prázdné. */
  ukazka: string;
  /** Kolik položek má pole vyplněné (0 až 1). */
  vyplneno: number;
};

export type ZdrojFeedu = {
  druh: "xml" | "csv";
  polozky: Polozka[];
  pole: PoleFeedu[];
  /** Skupiny parametrů — pole ve tvaru „PROPERTIES › RÁM". */
  skupinyParametru: string[];
  /** U XML: název prvku, který představuje jednu položku. */
  prvek?: string;
  /** U XML: další kandidáti, kdyby program trefil špatný prvek. */
  kandidati?: string[];
};

export type CilovePole =
  | "kod"
  | "nazev"
  | "cena"
  | "ean"
  | "obrazky"
  | "popis"
  | "kratky"
  | "kategorie"
  | "znacka"
  | "skladem"
  | "velikost"
  | "barva"
  | "parametry"
  | "skupina";

export type ProfilDodavatele = {
  /** Uloží se k produktům jako `dodavatel` — podle toho se příště najdou. */
  id: string;
  nazev: string;
  url?: string;
  /** U XML: který prvek je jedna položka (když se nemá hádat). */
  prvek?: string;
  pole: Partial<Record<CilovePole, string>>;
  cenyBezDph: boolean;
  /** Úprava ceny v procentech, třeba 10 = o 10 % dráž. */
  upravaCeny: number;
  sklad: "kusy" | "dodaci-doba" | "text";
  upraveno: string;
  /**
   * Feed, pro který máme hotovou čtečku (Author, Crussis CSV, export starého
   * webu). Nic se u něj nepřiřazuje, čte se rovnou.
   */
  znamyFormat?: boolean;
  /**
   * Které skupiny zboží od dodavatele brát (klíče ze `shrnSkupiny`, třeba
   * „elektrokola"). Když chybí, bere se všechno.
   */
  brat?: string[];
};

/** Zkusí hotovou čtečku. Vrátí null, když feed nezná. */
export function zkusZnamyFormat(nazev: string, text: string): FeedVysledek | null {
  try {
    return nactiFeed(nazev, text);
  } catch {
    return null;
  }
}

/** Přečte feed dodavatele podle jeho uloženého profilu. */
export function zpracujProfil(text: string, profil: ProfilDodavatele): FeedVysledek {
  const vse = profil.znamyFormat ? nactiFeed(profil.nazev, text) : sestavProdukty(nactiZdroj(text, profil.prvek), profil);
  return vyfiltruj(vse, profil.brat);
}

/** Popisky pro obrazovku mapování — v pořadí, jak se zobrazují. */
export const CILOVA_POLE: { pole: CilovePole; popis: string; napoveda: string; povinne?: boolean }[] = [
  { pole: "nazev", popis: "Název", napoveda: "Jak se produkt jmenuje", povinne: true },
  { pole: "kod", popis: "Kód u dodavatele", napoveda: "Podle něj se produkt pozná při dalším importu", povinne: true },
  { pole: "cena", popis: "Cena", napoveda: "Prodejní cena pro zákazníka", povinne: true },
  { pole: "obrazky", popis: "Fotky", napoveda: "Odkazy na obrázky" },
  { pole: "kategorie", popis: "Kategorie", napoveda: "Kam produkt u dodavatele patří" },
  { pole: "velikost", popis: "Velikost", napoveda: "Velikosti se spojí do jednoho produktu" },
  { pole: "barva", popis: "Barva", napoveda: "Každá barva bude samostatný produkt" },
  { pole: "ean", popis: "EAN (čárový kód)", napoveda: "13místné číslo" },
  { pole: "skladem", popis: "Sklad", napoveda: "Počet kusů nebo dostupnost" },
  { pole: "popis", popis: "Popis", napoveda: "Delší text o produktu" },
  { pole: "kratky", popis: "Krátký popis", napoveda: "Jedna dvě věty do výpisu" },
  { pole: "parametry", popis: "Technické parametry", napoveda: "Tabulka parametrů (rám, motor, baterie…)" },
  { pole: "znacka", popis: "Značka", napoveda: "Výrobce" },
  { pole: "skupina", popis: "Skupina variant", napoveda: "Jen když dodavatel posílá kód modelu" },
];

const ODDELOVAC_PARAMETRU = " › ";

/** Zvláštní volba u velikosti: dodavatel ji nemá zvlášť, je jen v názvu („… 19\""). */
export const VELIKOST_Z_NAZVU = "__velikost-z-nazvu__";

const VELIKOST_V_NAZVU = /(?:^|\s)(\d{2}(?:[,.]\d)?)\s*["″](?=\s*$|\s*[–-]\s)/;

export function velikostZNazvu(nazev: string): string | null {
  const m = nazev.match(VELIKOST_V_NAZVU);
  return m ? `${m[1]!.replace(".", ",")}"` : null;
}

// =====================================================================
// Čtení souboru
// =====================================================================

/**
 * Převede bajty na text ve správném kódování. Čeští dodavatelé pořád často
 * posílají Windows-1250 — kdyby se to přečetlo jako UTF-8, rozsypala by se
 * diakritika.
 */
export function dekoduj(buffer: ArrayBuffer | Uint8Array): string {
  const bajty = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let start = 0;
  if (bajty[0] === 0xef && bajty[1] === 0xbb && bajty[2] === 0xbf) start = 3;
  const telo = bajty.subarray(start);

  const hlava = new TextDecoder("latin1").decode(telo.subarray(0, 300));
  const deklarovane = hlava.match(/encoding=["']?([\w-]+)/i)?.[1]?.toLowerCase();
  if (deklarovane && deklarovane !== "utf-8" && deklarovane !== "utf8") {
    try {
      return new TextDecoder(deklarovane).decode(telo);
    } catch {
      /* neznámé kódování — zkusíme odhad níž */
    }
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(telo);
  } catch {
    return new TextDecoder("windows-1250").decode(telo);
  }
}

function pridej(polozka: Polozka, klic: string, hodnota: string) {
  const h = hodnota.trim();
  if (!h) return;
  const stara = polozka[klic];
  if (stara === undefined) polozka[klic] = h;
  else if (Array.isArray(stara)) stara.push(h);
  else polozka[klic] = [stara, h];
}

const prvniHodnota = (h: Hodnota | undefined): string =>
  (Array.isArray(h) ? (h[0] ?? "") : (h ?? "")).trim();

const vsechnyHodnoty = (h: Hodnota | undefined): string[] =>
  (Array.isArray(h) ? h : h ? [h] : []).map((x) => x.trim()).filter(Boolean);

/** HTML tabulka ve feedu (Leader Fox posílá parametry jako `<table>`). */
function rozeberTabulku(html: string, predpona: string, polozka: Polozka) {
  if (!/<t[rd][\s>]/i.test(html)) return;
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("tr").forEach((tr) => {
    const bunky = Array.from(tr.querySelectorAll("td, th")).map((b) => (b.textContent ?? "").trim());
    if (bunky.length >= 2 && bunky[0] && bunky[1]) {
      pridej(polozka, `${predpona}${ODDELOVAC_PARAMETRU}${bunky[0]}`, bunky[1]);
    }
  });
}

const detiElementy = (el: Element): Element[] => Array.from(el.children);

/** Rozloží jednu položku XML na dvojice „cesta → hodnota". */
function zplosti(el: Element, cesta: string, polozka: Polozka) {
  for (const a of Array.from(el.attributes)) {
    pridej(polozka, cesta ? `${cesta}/@${a.name}` : `@${a.name}`, a.value);
  }
  const deti = detiElementy(el);
  if (!deti.length) {
    const text = el.textContent ?? "";
    if (cesta) {
      pridej(polozka, cesta, text);
      rozeberTabulku(text, cesta, polozka);
    }
    return;
  }
  for (const d of deti) {
    const jmeno = d.nodeName;
    const pod = detiElementy(d);
    // Heureka/Zboží: <PARAM><PARAM_NAME>Barva</PARAM_NAME><VAL>černá</VAL></PARAM>
    if (pod.length === 2 && /param|propert|attrib|vlastnost/i.test(jmeno)) {
      const jmenoParametru = pod.find((x) => /name|nazev|key/i.test(x.nodeName));
      const hodnota = pod.find((x) => /val|hodnota/i.test(x.nodeName));
      if (jmenoParametru && hodnota) {
        pridej(
          polozka,
          `${cesta ? cesta + "/" : ""}${jmeno}${ODDELOVAC_PARAMETRU}${(jmenoParametru.textContent ?? "").trim()}`,
          hodnota.textContent ?? "",
        );
        continue;
      }
    }
    zplosti(d, cesta ? `${cesta}/${jmeno}` : jmeno, polozka);
  }
}

/**
 * Najde prvek, který představuje jednu položku. Vyhrává ten, který se
 * opakuje a má nejvíc různých údajů — jinak by vyhrálo třeba <IMGURL>,
 * kterého je ve feedu nejvíc.
 */
function najdiPrvky(doc: Document): { vitez: string; kandidati: string[] } {
  const statistika = new Map<string, { pocet: number; poli: Set<string> }>();
  const vse = doc.getElementsByTagName("*");
  for (let i = 0; i < vse.length; i++) {
    const el = vse[i]!;
    if (el === doc.documentElement) continue;
    const deti = detiElementy(el);
    if (!deti.length) continue;
    const s = statistika.get(el.nodeName) ?? { pocet: 0, poli: new Set<string>() };
    s.pocet++;
    for (const d of deti) s.poli.add(d.nodeName);
    statistika.set(el.nodeName, s);
  }
  const serazeno = [...statistika.entries()]
    .filter(([, s]) => s.pocet >= 1 && s.poli.size >= 3)
    .sort((a, b) => b[1].pocet * b[1].poli.size - a[1].pocet * a[1].poli.size);
  if (!serazeno.length) throw new Error("Ve feedu jsme nenašli žádné položky.");
  return { vitez: serazeno[0]![0], kandidati: serazeno.slice(0, 6).map(([k]) => k) };
}

function nactiXml(text: string, prvek?: string): ZdrojFeedu {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  if (doc.getElementsByTagName("parsererror").length) {
    throw new Error("Soubor se nepodařilo přečíst — vypadá jako XML, ale je poškozený.");
  }
  const { vitez, kandidati } = najdiPrvky(doc);
  const nazev = prvek && doc.getElementsByTagName(prvek).length ? prvek : vitez;
  const prvky = doc.getElementsByTagName(nazev);
  const polozky: Polozka[] = [];
  for (let i = 0; i < prvky.length; i++) {
    const p: Polozka = {};
    zplosti(prvky[i]!, "", p);
    polozky.push(p);
  }
  return { druh: "xml", polozky, prvek: nazev, kandidati, ...shrnPole(polozky) };
}

function odhadniOddelovac(prvniRadek: string): string {
  const kandidati = [";", ",", "\t", "|"];
  let nej = ";";
  let max = 0;
  for (const k of kandidati) {
    const n = prvniRadek.split(k).length;
    if (n > max) {
      max = n;
      nej = k;
    }
  }
  return nej;
}

function nactiCsv(text: string): ZdrojFeedu {
  const radky = rozdelCsv(text, odhadniOddelovac(text.split(/\r?\n/)[0] ?? ""));
  if (radky.length < 2) throw new Error("Soubor neobsahuje žádné řádky s produkty.");
  const hlavicka = radky[0]!.map((h, i) => h.trim() || `Sloupec ${i + 1}`);
  const polozky = radky.slice(1).map((r) => {
    const p: Polozka = {};
    hlavicka.forEach((h, i) => pridej(p, h, r[i] ?? ""));
    return p;
  });
  return { druh: "csv", polozky, ...shrnPole(polozky) };
}

function shrnPole(polozky: Polozka[]): { pole: PoleFeedu[]; skupinyParametru: string[] } {
  const vzorek = polozky.slice(0, 500);
  const poradi: string[] = [];
  const pocty = new Map<string, number>();
  const ukazky = new Map<string, string>();
  for (const p of vzorek) {
    for (const [k, h] of Object.entries(p)) {
      if (!pocty.has(k)) poradi.push(k);
      pocty.set(k, (pocty.get(k) ?? 0) + 1);
      if (!ukazky.has(k)) ukazky.set(k, prvniHodnota(h));
    }
  }
  const pole = poradi.map((k) => ({
    klic: k,
    ukazka: ukazky.get(k) ?? "",
    vyplneno: vzorek.length ? (pocty.get(k) ?? 0) / vzorek.length : 0,
  }));
  const skupinyParametru = [
    ...new Set(poradi.filter((k) => k.includes(ODDELOVAC_PARAMETRU)).map((k) => k.split(ODDELOVAC_PARAMETRU)[0]!)),
  ];
  return { pole, skupinyParametru };
}

/** Přečte feed v libovolném formátu. */
export function nactiZdroj(text: string, prvek?: string): ZdrojFeedu {
  const zacatek = text.trimStart().slice(0, 200);
  if (/^<!doctype html|^<html|<head[\s>]/i.test(zacatek)) {
    throw new Error(
      "Tohle je webová stránka, ne feed — nejspíš přihlašovací. Zkontrolujte odkaz, má končit třeba na .xml nebo .csv.",
    );
  }
  if (zacatek.startsWith("<")) return nactiXml(text, prvek);
  if (zacatek.startsWith("{") || zacatek.startsWith("[")) {
    throw new Error("Feed ve formátu JSON (třeba ze Shopify) zatím neumíme. Pošlete ho Marťasovi.");
  }
  return nactiCsv(text);
}

// =====================================================================
// Návrh, které pole je co
// =====================================================================

const SYNONYMA: Record<CilovePole, [RegExp, RegExp | null]> = {
  kod: [/^(ITEM_?ID|PRODUCTNO|KOD|KÓD|KÓD Č\.|CODE|SKU|REFERENCE|PRODUCT ?ID)$/i, /kód|kod\b|sku|reference|item_?id|product_?no/i],
  nazev: [/^(PRODUCTNAME|PRODUCT|NAME|NAZEV|NÁZEV|TITLE|PRODUCT_?NAME)$/i, /název|nazev|name|title/i],
  cena: [/^(PRICE_VAT|PRICEVAT|PRICE|CENA|CENA S DPH|CENA_S_DPH|PRICE TAX INCLUDED)$/i, /price|cena/i],
  ean: [/^(EAN|EAN13|GTIN|BARCODE)$/i, /\bean|gtin|čárov/i],
  obrazky: [/^(IMGURLS\/IMGURL|IMGURL|IMAGES?|IMG_URL|IMAGE_LINK|URL OBRÁZKU|IMAGE URLS.*)$/i, /img|image|obr[aá]z|foto|photo|picture/i],
  popis: [/^(DESCRIPTION|POPIS|DESC)$/i, /descr|popis/i],
  kratky: [/^(SHORT_?DESCRIPTION|SHRNUTÍ|KRATKY_POPIS|SUMMARY)$/i, /short|krátk|kratk|shrnut|summary/i],
  kategorie: [/^(CATEGORYTEXT|CATEGORY|KATEGORIE|CATEGORIES)$/i, /categ|kategor/i],
  znacka: [/^(MANUFACTURER|BRAND|ZNACKA|ZNAČKA|VYROBCE|VÝROBCE)$/i, /manufact|brand|značk|znack|výrobc|vyrobc/i],
  skladem: [/^(STOCK|STOCK_QUANTITY|QUANTITY|SKLADEM|POCET|POČET|DELIVERY_DATE|AVAILABILITY)$/i, /stock|quantity|sklad|počet|delivery|dostupn/i],
  velikost: [/velikost rámu|frame size/i, /velikost|size\b/i],
  barva: [/(›|^)\s*(barva|color|colour)$/i, /barva|colou?r/i],
  parametry: [/^(PROPERTIES|PARAMETRY|PARAM|SPECIFICATIONS?)$/i, /param|propert|specif/i],
  skupina: [/^(ITEMGROUP_?ID|GROUP_?ID|SKUPINA|PARENT_?ID|MODEL_?ID)$/i, null],
};

/** U ceny nechceme nákupní ani doporučenou cenu, když je k dispozici prodejní. */
const NE_PRO_CENU = /nákup|nakup|purchase|wholesale|velkoob|doporu|max|stoneshop|původní|puvodni|old/i;

export function navrhniPole(zdroj: ZdrojFeedu): Partial<Record<CilovePole, string>> {
  const navrh: Partial<Record<CilovePole, string>> = {};
  const pouzite = new Set<string>();
  const vyplnena = zdroj.pole.filter((p) => p.vyplneno > 0);

  for (const { pole } of CILOVA_POLE) {
    if (pole === "parametry") {
      const skupina = zdroj.skupinyParametru.find((s) => SYNONYMA.parametry[1]!.test(s)) ?? zdroj.skupinyParametru[0];
      if (skupina) navrh.parametry = skupina;
      continue;
    }
    const [presne, volne] = SYNONYMA[pole];
    const vhodne = (p: PoleFeedu) => {
      if (pouzite.has(p.klic)) return false;
      if (pole === "obrazky" && !/^https?:\/\//i.test(p.ukazka)) return false;
      if (pole === "cena" && (!/\d/.test(p.ukazka) || (NE_PRO_CENU.test(p.klic) && !/price_vat/i.test(p.klic)))) return false;
      if (pole === "ean" && !/^\d{8,14}$/.test(p.ukazka)) return false;
      if (pole !== "velikost" && pole !== "barva" && p.klic.includes(ODDELOVAC_PARAMETRU)) return false;
      return true;
    };
    const jmeno = (p: PoleFeedu) => p.klic.split(ODDELOVAC_PARAMETRU).pop()!.split("/").pop()!;
    const kandidat =
      vyplnena.find((p) => vhodne(p) && (presne.test(p.klic) || presne.test(jmeno(p)))) ??
      (volne ? vyplnena.find((p) => vhodne(p) && volne.test(p.klic)) : undefined);
    if (kandidat) {
      navrh[pole] = kandidat.klic;
      pouzite.add(kandidat.klic);
    }
  }
  // Velikost není zvlášť, ale u většiny názvů je na konci („… 17\"").
  if (!navrh.velikost && navrh.nazev) {
    const nazvy = zdroj.polozky.slice(0, 300).map((p) => prvniHodnota(p[navrh.nazev!]));
    const sVelikosti = nazvy.filter((n) => velikostZNazvu(n)).length;
    if (nazvy.length && sVelikosti / nazvy.length >= 0.4) navrh.velikost = VELIKOST_Z_NAZVU;
  }
  return navrh;
}

/** Výchozí nastavení profilu podle toho, co ve feedu je. */
export function navrhniProfil(nazev: string, zdroj: ZdrojFeedu, url?: string): ProfilDodavatele {
  const pole = navrhniPole(zdroj);
  const skladPole = zdroj.pole.find((p) => p.klic === pole.skladem);
  const sklad: ProfilDodavatele["sklad"] = !skladPole
    ? "kusy"
    : /deliver|dodac/i.test(skladPole.klic)
      ? "dodaci-doba"
      : /^\d+$/.test(skladPole.ukazka)
        ? "kusy"
        : "text";
  return {
    id: idDodavatele(nazev),
    nazev: nazev.trim(),
    ...(url ? { url } : {}),
    ...(zdroj.prvek ? { prvek: zdroj.prvek } : {}),
    pole,
    cenyBezDph: !!pole.cena && /bez dph|tax excl|bez_dph|without/i.test(pole.cena),
    upravaCeny: 0,
    sklad,
    upraveno: new Date().toISOString(),
  };
}

const naSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Jména, která už používají ručně psané čtečky — nesmí se potkat. */
const OBSAZENA_ID = new Set(["author", "crussis", "cursorbike"]);

export function idDodavatele(nazev: string): string {
  const id = naSlug(nazev) || "dodavatel";
  return OBSAZENA_ID.has(id) ? `${id}-feed` : id;
}

// =====================================================================
// Sestavení produktů
// =====================================================================

const cislo = (s: string): number => {
  const ocisteno = s.replace(/\s|Kč|CZK|,-/gi, "").replace(",", ".");
  const n = Number(ocisteno);
  return Number.isFinite(n) ? n : 0;
};

const naRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Z „ARGUS 29", GREY 19,5"-1 (PANASONIC)" udělá „ARGUS 29", GREY (PANASONIC)". */
export function odeberVelikost(nazev: string, velikost: string): string {
  const v = naRegex(velikost.trim());
  return nazev
    .replace(new RegExp(`${v}\\s*-\\s*\\d+\\b`), " ")
    .replace(new RegExp(`(^|[\\s,(])${v}(?=$|[\\s,)])`), "$1")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ",")
    .replace(/,\s*\(/g, " (")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .replace(/\s{2,}/g, " ")
    .replace(/[\s,–-]+$/g, "")
    .trim();
}

const bezHtml = (s: string) =>
  s
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"');

/** Popis jako čistý text s odstavci — web ho tak i zobrazuje. */
export function upravPopis(s: string): string {
  return bezHtml(s)
    .split("\n")
    .map((r) => r.replace(/[ \t]+/g, " ").trim())
    .filter((r) => r !== ".")
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const prvniVety = (text: string, max = 190) => {
  const jednoRadek = text.replace(/\s+/g, " ").trim();
  if (jednoRadek.length <= max) return jednoRadek;
  const kus = jednoRadek.slice(0, max);
  const tecka = kus.lastIndexOf(". ");
  return tecka > 60 ? kus.slice(0, tecka + 1) : `${kus.slice(0, kus.lastIndexOf(" "))}…`;
};

const hezkyPopisek = (s: string) => {
  const t = s.trim();
  return t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t;
};

/** Obrázky mohou být v jednom poli oddělené čárkou, středníkem nebo vlnovkou. */
const rozdelObrazky = (hodnoty: string[]) =>
  hodnoty
    .flatMap((h) => h.split(/[\s~|;,]+(?=https?:\/\/)/i))
    .map((x) => x.trim())
    .filter((x) => /^https?:\/\//i.test(x));

const poradiVelikosti = (v: string | null) => {
  const n = Number((v ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
  if (Number.isFinite(n) && n > 0) return n;
  const pismena = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];
  const i = pismena.indexOf((v ?? "").toUpperCase());
  return i >= 0 ? 1000 + i : 9999;
};

export function sestavProdukty(zdroj: ZdrojFeedu, profil: ProfilDodavatele): FeedVysledek {
  const k = profil.pole;
  const upozorneni: Upozorneni[] = [];
  const hodnota = (p: Polozka, pole?: string): string => {
    if (!pole) return "";
    if (pole === VELIKOST_Z_NAZVU) return velikostZNazvu(prvniHodnota(p[k.nazev ?? ""])) ?? "";
    return prvniHodnota(p[pole]);
  };

  const cena = (p: Polozka) => {
    let c = cislo(hodnota(p, k.cena));
    if (profil.cenyBezDph) c *= 1.21;
    if (profil.upravaCeny) c *= 1 + profil.upravaCeny / 100;
    return Math.round(c);
  };

  const sklad = (p: Polozka) => {
    if (!k.skladem) return 0;
    const s = hodnota(p, k.skladem);
    if (profil.sklad === "kusy") return Math.max(0, Math.floor(cislo(s)));
    if (profil.sklad === "dodaci-doba") return s !== "" && cislo(s) === 0 ? 1 : 0;
    return /skladem|ano|yes|in.?stock|true|^1$|dostupn/i.test(s) && !/není|neni|out|ne$/i.test(s) ? 1 : 0;
  };

  type Skupina = { nazev: string; barva: string | null; polozky: Polozka[] };
  const skupiny = new Map<string, Skupina>();

  for (const p of zdroj.polozky) {
    const nazev = hodnota(p, k.nazev);
    const kod = hodnota(p, k.kod);
    if (!nazev && !kod) continue;
    const velikost = hodnota(p, k.velikost) || null;
    const barva = hodnota(p, k.barva) || null;
    const nazevModelu = velikost ? odeberVelikost(nazev, velikost) : nazev;
    const klic = k.skupina
      ? `${hodnota(p, k.skupina) || kod}|${barva ?? ""}`
      : velikost
        ? `${naSlug(nazevModelu)}|${naSlug(barva ?? "")}`
        : kod || naSlug(nazev);
    const s = skupiny.get(klic) ?? { nazev: nazevModelu || nazev || kod, barva, polozky: [] };
    s.polozky.push(p);
    skupiny.set(klic, s);
  }

  const produkty: FeedProdukt[] = [];
  for (const [klic, s] of skupiny) {
    const prvni = s.polozky[0]!;
    const varianty: FeedVarianta[] = s.polozky
      .map((p) => ({
        velikost: hodnota(p, k.velikost) || null,
        ean: hodnota(p, k.ean).replace(/\D/g, "") || null,
        cena: cena(p),
        skladem: sklad(p),
      }))
      .sort((a, b) => poradiVelikosti(a.velikost) - poradiVelikosti(b.velikost));

    const obrazky = [
      ...new Set(rozdelObrazky(s.polozky.flatMap((p) => (k.obrazky ? vsechnyHodnoty(p[k.obrazky]) : [])))),
    ].slice(0, 12);

    const popis = upravPopis(hodnota(prvni, k.popis));
    const kratky = upravPopis(hodnota(prvni, k.kratky)) || prvniVety(popis);

    let parametry: ParametrSkupina[] = [];
    if (k.parametry) {
      const predpona = `${k.parametry}${ODDELOVAC_PARAMETRU}`;
      const polozky = Object.entries(prvni)
        .filter(([pole]) => pole.startsWith(predpona) && pole !== k.velikost)
        .map(([pole, h]) => ({ label: hezkyPopisek(pole.slice(predpona.length)), hodnota: prvniHodnota(h) }))
        .filter((x) => x.label && x.hodnota);
      const velikosti = [...new Set(varianty.map((v) => v.velikost).filter(Boolean))];
      if (velikosti.length > 1) polozky.push({ label: "Velikosti rámu", hodnota: velikosti.join(", ") });
      if (polozky.length) parametry = [{ skupina: "Technické parametry", polozky }];
    }

    const kategorieFeed = hodnota(prvni, k.kategorie)
      .split(/\s*[|>]\s*/)
      .map((x) => x.trim())
      .filter(Boolean)
      .join("|");

    const kod = k.skupina || k.velikost ? `m:${naSlug(klic).slice(0, 120)}` : hodnota(prvni, k.kod) || naSlug(s.nazev);

    if (!obrazky.length) {
      upozorneni.push({ druh: "bez-fotky", produkt: s.nazev, detail: "Feed neuvádí žádnou fotku." });
    }
    if (!kategorieFeed) {
      upozorneni.push({ druh: "bez-kategorie", produkt: s.nazev, detail: "Feed neuvádí kategorii." });
    }

    produkty.push({
      dodavatel: profil.id,
      kod,
      nazev: s.nazev,
      barva: s.barva,
      znacka: hodnota(prvni, k.znacka) || null,
      kategorieFeed,
      kratky,
      popis,
      obrazky,
      obrazkySoubory: [],
      parametry,
      varianty,
    });
  }

  return { dodavatel: profil.id, produkty, upozorneni, polozekVeFeedu: zdroj.polozky.length };
}

/** Kontrola, než se profil uloží. */
export function chybiPovinne(profil: ProfilDodavatele): string[] {
  if (profil.znamyFormat) return [];
  return CILOVA_POLE.filter((c) => c.povinne && !profil.pole[c.pole]).map((c) => c.popis);
}
