/**
 * Co od dodavatele brát — bez mravenčí práce.
 *
 * Dodavatel posílá všechno: kola, elektrokola, díly, pláště, merch. Obchodník
 * chce většinou jen kola. Místo přiřazování desítek kategorií se ho web zeptá
 * jednou otázkou „Co chcete brát? ☑ Elektrokola ☑ Kola ☐ Díly" a kategorie
 * pro vybrané zboží založí sám.
 */

import { supabase } from "@/integrations/supabase/client";
import type { FeedProdukt, FeedVysledek } from "@/lib/feed";

export type DruhZbozi = "elektrokola" | "kola" | "ostatni";

export type SkupinaZbozi = { klic: string; nazev: string; druh: DruhZbozi; pocet: number };

/** Slova, která v cestě kategorie nic neříkají. */
const OBECNE = /^(e-?shop|eshop|v[yý]prodej|akce|novinky?|sale|home|dom[uů]|katalog|produkty|zbo[zž]í|ostatn[ií])$/i;

const casti = (cesta: string) =>
  cesta
    .split("|")
    .map((x) => x.trim())
    .filter((x) => x && !OBECNE.test(x));

const OSTATNI = /r[aá]m(y|ov|\b)|koncovk|d[ií]l|merch|pl[aá][sš]|du[sš]|p[rř][ií]slu[sš]|oble[cč]|dopl[nň]|n[aá][rř]ad|n[aá]hradn|baterie|nab[ií]je|helm|p[rř]ilb|z[aá]mk|svitil|sv[eě]tl|bra[sš]n|tabl|cyklopo[cč]|oble|tri[cč]|kalhot|rukavic|kosmetik|mazac|ol[eě]j/i;
const ELEKTRO = /elektro|e-?bike|e-kol|ebike|pedelec|(^|\s)e-(?!shop)[a-z]/i;
const KOLA = /\bkol[oa]?\b|kola|bike|mtb|horsk|siln|gravel|trek|cross|krosov|m[eě]stsk|d[eě]tsk|junior|dámsk|pánsk|bmx|fatbike|trail|enduro|downhill|odstr[eč]ed/i;

export function druhCesty(cesta: string): DruhZbozi {
  if (!cesta.trim()) return "ostatni";
  // Bez obecných slov — „E-SHOP" by se jinak spletlo s e-bikem.
  const text = (cesta.includes("|") ? casti(cesta).join(" ") : cesta).toLowerCase();
  if (OSTATNI.test(text)) return "ostatni";
  if (ELEKTRO.test(text)) return "elektrokola";
  if (KOLA.test(text)) return "kola";
  return "ostatni";
}

const hezky = (s: string) => {
  const t = s.trim();
  if (t !== t.toUpperCase()) return t;
  return t
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
};

/** Do jaké skupiny (Elektrokola, Kola, Náhradní díly…) produkt patří. */
export function skupinaProduktu(p: FeedProdukt): { klic: string; nazev: string; druh: DruhZbozi } {
  const c = casti(p.kategorieFeed);
  const prvni = c[0] ?? "Bez kategorie";
  return { klic: prvni.toLowerCase(), nazev: hezky(prvni), druh: druhCesty(p.kategorieFeed) };
}

export function shrnSkupiny(produkty: FeedProdukt[]): SkupinaZbozi[] {
  const mapa = new Map<string, SkupinaZbozi>();
  for (const p of produkty) {
    const s = skupinaProduktu(p);
    const stara = mapa.get(s.klic);
    if (stara) {
      stara.pocet++;
      // Když jsou ve skupině kola, je to skupina kol, i kdyby první produkt byl díl.
      if (stara.druh === "ostatni" && s.druh !== "ostatni") stara.druh = s.druh;
    } else mapa.set(s.klic, { ...s, pocet: 1 });
  }
  const poradi: Record<DruhZbozi, number> = { elektrokola: 0, kola: 1, ostatni: 2 };
  return [...mapa.values()].sort((a, b) => poradi[a.druh] - poradi[b.druh] || b.pocet - a.pocet);
}

/** Výchozí výběr: kola a elektrokola ano, ostatní ne. */
export const vychoziVyber = (skupiny: SkupinaZbozi[]) => skupiny.filter((s) => s.druh !== "ostatni").map((s) => s.klic);

/** Nechá jen zboží, které obchodník chce brát. */
export function vyfiltruj(vysledek: FeedVysledek, brat?: string[]): FeedVysledek {
  if (!brat) return vysledek;
  const chci = new Set(brat);
  return { ...vysledek, produkty: vysledek.produkty.filter((p) => chci.has(skupinaProduktu(p).klic)) };
}

const naSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Jednotné typy kol pro filtr na stránce značky. Každý dodavatel kategorie
 * pojmenovává jinak („mtb 29", „Horská | Celoodpružené 29"", „e-cross 29"),
 * zákazník ale chce u každé značky stejná tlačítka.
 */
export function typKola(text: string): string {
  const t = text.toLowerCase();
  if (/d[eě]tsk|junior|kid|odr[aá][zž]ed|\b(12|14|16|20|24)["”]?\b.*kol/.test(t) || /junior/.test(t)) return "Dětská";
  if (/celoodpru|full|fully|trail|enduro|downhill/.test(t)) return "Celoodpružená";
  if (/siln|road|gravel/.test(t)) return "Silniční a gravel";
  if (/cross|trek|krosov/.test(t)) return "Crossová a trekking";
  if (/m[eě]stsk|city|urban/.test(t)) return "Městská";
  if (/skl[aá]dac|fold/.test(t)) return "Skládací";
  if (/mtb|horsk|mountain|hardtail/.test(t)) return "Horská";
  return "Ostatní";
}

type NaseKategorie = { id: string; nazev: string; sekce: string; znacka: string | null };

/**
 * Kategorie z feedu, které ještě nikam nepatří, zařadí sama: když u nás
 * stejná kategorie je, použije ji, jinak ji (i se značkou) založí.
 * Vrací doplněné přiřazení a kolik kategorií vzniklo.
 */
export async function zaradAutomaticky(
  produkty: FeedProdukt[],
  mapovani: Record<string, string>,
  nase: NaseKategorie[],
  zalozniZnacka: string,
): Promise<{ mapovani: Record<string, string>; nove: NaseKategorie[] }> {
  const vysledek = { ...mapovani };
  const nove: NaseKategorie[] = [];
  const vsechny = [...nase];

  const chybi = new Map<string, FeedProdukt>();
  for (const p of produkty) if (p.kategorieFeed && !vysledek[p.kategorieFeed]) chybi.set(p.kategorieFeed, p);

  for (const [cesta, p] of chybi) {
    const druh = druhCesty(cesta);
    const sekce = druh === "elektrokola" ? "elektrokola" : "kola";
    const znacka = hezky(p.znacka || zalozniZnacka || "Ostatní");
    const slugZnacky = naSlug(znacka);
    // Kola → značka → typ kola. Velikosti jsou uvnitř produktu jako varianty.
    const nazev = typKola(`${casti(cesta).join(" ")} ${p.nazev}`);

    const shoda = vsechny.find(
      (k) => k.sekce === sekce && (k.znacka ?? "") === slugZnacky && naSlug(k.nazev) === naSlug(nazev),
    );
    if (shoda) {
      vysledek[cesta] = shoda.id;
      continue;
    }

    const { data: znackaRadek, error: e1 } = await supabase
      .from("znacky")
      .select("id")
      .eq("sekce", sekce)
      .eq("slug", slugZnacky)
      .maybeSingle();
    if (e1) throw e1;
    let znackaId = znackaRadek?.id;
    if (!znackaId) {
      const { data, error } = await supabase
        .from("znacky")
        .insert({ sekce, slug: slugZnacky, nazev: znacka, poradi: 99 })
        .select("id")
        .single();
      if (error) throw error;
      znackaId = data.id;
    }

    const { data: kat, error: e2 } = await supabase
      .from("kategorie")
      .insert({
        slug: `${sekce}-${slugZnacky}-${naSlug(nazev)}`.slice(0, 120),
        nazev,
        sekce,
        znacka: slugZnacky,
        znacka_id: znackaId,
        poradi: 99,
      })
      .select("id, nazev, sekce, znacka")
      .single();
    if (e2) {
      // Stejná adresa už existuje (třeba ze souběžného importu) — použijeme ji.
      const { data: existujici } = await supabase
        .from("kategorie")
        .select("id, nazev, sekce, znacka")
        .eq("slug", `${sekce}-${slugZnacky}-${naSlug(nazev)}`.slice(0, 120))
        .maybeSingle();
      if (!existujici) throw e2;
      vysledek[cesta] = existujici.id;
      continue;
    }
    vysledek[cesta] = kat.id;
    nove.push(kat);
    vsechny.push(kat);
  }
  return { mapovani: vysledek, nove };
}
