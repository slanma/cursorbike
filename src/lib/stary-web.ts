/**
 * Starý web (PrestaShop na cursorbike.cz) přečtený automaticky.
 *
 * Obchodník nemusí nic exportovat: web si projde kategorie starého webu,
 * vezme z nich názvy, ceny (i akční) a odkazy na kola a porovná je s novým
 * webem. U kol bez popisu otevře jejich stránku na starém webu a popis
 * doplní. Čte se přes server (prohlížeč by cizí stránku stáhnout nesměl).
 *
 * Funguje, dokud starý web běží — tedy do přepnutí domény.
 */

import { supabase } from "@/integrations/supabase/client";
import { slovaNazvu } from "@/lib/propojeni";

export const STARY_WEB = "https://www.cursorbike.cz";

/** Hlavní kategorie starého webu se zbožím. */
const KATEGORIE = ["/cs/16-jizdni-kola", "/cs/49-elektrokola", "/cs/101-elektrokolobezky", "/cs/141-bazar"];

export type KoloStaryWeb = {
  url: string;
  /** Název poskládaný z adresy — na seznamu bývá název useknutý („…"). */
  nazevZAdresy: string;
  cena: number;
  /** Běžná cena, když je kolo v akci. */
  puvodniCena: number | null;
};

type Stahni = (url: string) => Promise<string>;

const cislo = (s: string) => Number(s.replace(/[^\d,]/g, "").replace(",", ".")) || 0;

const nazevZAdresy = (url: string) =>
  decodeURIComponent(url.split("/").pop() ?? "")
    .replace(/\.html$/, "")
    .replace(/^\d+-/, "")
    .replace(/-/g, " ");

/** Z jedné stránky výpisu vytáhne kola s cenou. */
function rozeberVypis(html: string): KoloStaryWeb[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const kola = new Map<string, KoloStaryWeb>();
  const odkazy = Array.from(doc.querySelectorAll("h1 a, h2 a, h3 a, .product-title a")) as HTMLAnchorElement[];
  for (const a of odkazy) {
    const href = a.getAttribute("href") ?? "";
    if (!/\/\d+-[^/]+\.html(\?|$)/.test(href)) continue;
    const url = href.split("?")[0]!;
    if (kola.has(url)) continue;
    // Kontejner kola: nejbližší předek, ve kterém je cena a žádné jiné kolo.
    const odkazuNaKola = (el: Element) =>
      new Set(
        Array.from(el.querySelectorAll("a[href]"))
          .map((x) => (x.getAttribute("href") ?? "").split("?")[0])
          .filter((h) => /\/\d+-[^/]+\.html$/.test(h ?? "")),
      ).size;
    let box: Element | null = a;
    for (let i = 0; i < 8 && box && !/Kč/.test(box.textContent ?? ""); i++) box = box.parentElement;
    if (!box || odkazuNaKola(box) > 1) continue;
    const cenaEl = box.querySelector(".price, [itemprop='price'], .product-price");
    const bezna = box.querySelector(".regular-price");
    let cena = cenaEl ? cislo(cenaEl.textContent ?? "") : 0;
    if (!cena) {
      const vse = [...(box.textContent ?? "").matchAll(/(\d[\d\s\u00a0]*,\d\d)\s*Kč/g)].map((m) => cislo(m[1]!));
      cena = vse.length ? vse[vse.length - 1]! : 0;
    }
    if (!cena) continue;
    let puvodni = bezna ? cislo(bezna.textContent ?? "") : 0;
    if (!puvodni && /Běžná cena/i.test(box.textContent ?? "")) {
      const ceny = [...(box.textContent ?? "").matchAll(/(\d[\d\s\u00a0]*,\d\d)\s*Kč/g)].map((m) => cislo(m[1]!));
      if (ceny.length >= 2) puvodni = Math.max(...ceny);
    }
    kola.set(url, {
      url,
      nazevZAdresy: nazevZAdresy(url),
      cena,
      puvodniCena: puvodni > cena ? puvodni : null,
    });
  }
  return [...kola.values()];
}

/** Projde všechny kategorie starého webu i se stránkováním. */
export async function nactiKolaStarehoWebu(stahni: Stahni, hlaska: (t: string) => void): Promise<KoloStaryWeb[]> {
  const vse = new Map<string, KoloStaryWeb>();
  for (const kat of KATEGORIE) {
    for (let strana = 1; strana <= 30; strana++) {
      hlaska(`Čtu starý web… ${vse.size} kol`);
      let html: string;
      try {
        html = await stahni(`${STARY_WEB}${kat}?page=${strana}`);
      } catch {
        break;
      }
      const nalezena = rozeberVypis(html).filter((k) => !vse.has(k.url));
      if (!nalezena.length) break;
      for (const k of nalezena) vse.set(k.url, k);
    }
  }
  return [...vse.values()];
}

type KoloNovyWeb = { id: string; nazev: string; cena: number; puvodni_cena: number | null; popis: string; kratky: string };

const podobnost = (staryNazev: string, novyNazev: string) => {
  const s = slovaNazvu(staryNazev);
  const n = slovaNazvu(novyNazev);
  if (s.size < 2 || !n.size) return 0;
  const spolecne = [...s].filter((x) => n.has(x)).length;
  const zeStareho = spolecne / s.size;
  if (zeStareho < 0.85) return 0;
  return (zeStareho + spolecne / n.size) / 2;
};

/** Ke každému kolu na novém webu najde jeho stránku na starém webu. */
export function sparujSNovym(stara: KoloStaryWeb[], nova: KoloNovyWeb[]): Map<string, KoloStaryWeb[]> {
  const pary = new Map<string, KoloStaryWeb[]>();
  for (const s of stara) {
    let nej: KoloNovyWeb | undefined;
    let skore = 0;
    for (const n of nova) {
      const sk = podobnost(s.nazevZAdresy, n.nazev);
      if (sk > skore) {
        skore = sk;
        nej = n;
      }
    }
    if (nej) pary.set(nej.id, [...(pary.get(nej.id) ?? []), s]);
  }
  return pary;
}

export async function nactiNovyWeb(): Promise<KoloNovyWeb[]> {
  const { data, error } = await supabase.from("produkty").select("id, nazev, cena, puvodni_cena, popis, kratky");
  if (error) throw error;
  return (data ?? []) as KoloNovyWeb[];
}

export type RozdilCenyStaryWeb = {
  id: string;
  nazev: string;
  staryCena: number;
  staryPuvodni: number | null;
  novyCena: number;
  novyPuvodni: number | null;
};

/** Porovná ceny. Akce se počítá: když je kolo na starém webu v akci, ukáže se i běžná cena. */
export async function porovnejSeStarymWebem(
  stahni: Stahni,
  hlaska: (t: string) => void,
): Promise<{ rozdily: RozdilCenyStaryWeb[]; sedi: number; nenalezena: number }> {
  const [stara, nova] = await Promise.all([nactiKolaStarehoWebu(stahni, hlaska), nactiNovyWeb()]);
  const pary = sparujSNovym(stara, nova);
  const rozdily: RozdilCenyStaryWeb[] = [];
  let sedi = 0;
  for (const n of nova) {
    const s = pary.get(n.id);
    if (!s?.length) continue;
    // Víc velikostí jednoho kola bývá na starém webu zvlášť — bereme nejnižší cenu.
    const nejlevnejsi = s.reduce((a, b) => (b.cena < a.cena ? b : a));
    if (nejlevnejsi.cena === n.cena && (nejlevnejsi.puvodniCena ?? null) === (n.puvodni_cena ?? null)) {
      sedi++;
      continue;
    }
    rozdily.push({
      id: n.id,
      nazev: n.nazev,
      staryCena: nejlevnejsi.cena,
      staryPuvodni: nejlevnejsi.puvodniCena,
      novyCena: n.cena,
      novyPuvodni: n.puvodni_cena,
    });
  }
  const sparovanaStara = new Set([...pary.values()].flat().map((s) => s.url));
  return { rozdily, sedi, nenalezena: stara.filter((s) => !sparovanaStara.has(s.url)).length };
}

export async function prevezmiCenyStarehoWebu(rozdily: RozdilCenyStaryWeb[]): Promise<void> {
  for (const r of rozdily) {
    const { error } = await supabase
      .from("produkty")
      .update({ cena: r.staryCena, puvodni_cena: r.staryPuvodni, cena_rucne: true })
      .eq("id", r.id);
    if (error) throw error;
  }
}

/** Popis ze stránky kola na starém webu. */
function rozeberStrankuKola(html: string): { popis: string; kratky: string } {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = (el: Element | null) =>
    (el?.textContent ?? "")
      .split("\n")
      .map((r) => r.replace(/\s+/g, " ").trim())
      .filter(Boolean)
      .join("\n")
      .trim();
  const popis = text(doc.querySelector("#description .product-description, #description, .product-description"));
  const kratky =
    text(doc.querySelector("#product-description-short, .product-description-short, [id^='product-description-short']")) ||
    (doc.querySelector("meta[property='og:description'], meta[name='description']")?.getAttribute("content") ?? "").trim();
  return { popis, kratky };
}

/**
 * Doplní popisy kolům, která žádný nemají. Bere je ze starého webu.
 * Co u kola už je, nepřepíše.
 */
export async function doplnPopisyZeStarehoWebu(
  stahni: Stahni,
  hlaska: (t: string) => void,
): Promise<{ doplneno: number; bezPopisu: number }> {
  const [stara, nova] = await Promise.all([nactiKolaStarehoWebu(stahni, hlaska), nactiNovyWeb()]);
  const pary = sparujSNovym(stara, nova);
  const kDoplneni = nova.filter((n) => !n.popis?.trim() && pary.get(n.id)?.length);
  let doplneno = 0;
  for (const [i, n] of kDoplneni.entries()) {
    hlaska(`Doplňuji popisy… ${i + 1} z ${kDoplneni.length}`);
    try {
      const { popis, kratky } = rozeberStrankuKola(await stahni(pary.get(n.id)![0]!.url));
      const text = popis || kratky;
      if (!text) continue;
      const zmena: { popis: string; kratky?: string } = { popis: text };
      if (!n.kratky?.trim() && kratky) zmena.kratky = kratky.slice(0, 200);
      const { error } = await supabase.from("produkty").update(zmena).eq("id", n.id);
      if (error) throw error;
      doplneno++;
    } catch {
      /* jedno kolo se nepovedlo — pokračujeme dalším */
    }
  }
  return { doplneno, bezPopisu: nova.filter((n) => !n.popis?.trim()).length - doplneno };
}
