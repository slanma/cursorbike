import { supabase } from "@/integrations/supabase/client";
import type { FeedProdukt, FeedVysledek } from "@/lib/feed";
import { cenaPodlePravidla, nactiPravidla, pravidloPro } from "@/lib/ceny";

export type Mapovani = Record<string, string>;

// =====================================================================
// Automatické přiřazení kategorií
//
// Dodavatel píše kategorii jako cestu („Elektrokola|Crussis|Horská
// elektrokola"), my ji máme rozdělenou na sekci, značku a název. Po
// očištění o diakritiku a oddělovače se to ale skoro vždy shoduje, takže
// nemá smysl nechávat obsluhu proklikat dvacet řádků ručně.
//
// Když na jednu kategorii z feedu sedí dvě naše (třeba „Horská
// elektrokola" má Crussis i Lectron), schválně nepřiřadíme nic —
// v takovém případě to musí rozhodnout člověk.
// =====================================================================

const ocistiProShodu = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const POPIS_SEKCE: Record<string, string> = {
  kola: "kola",
  elektrokola: "elektrokola",
  bazar: "bazar",
};

type NaseKategorie = { id: string; nazev: string; sekce: string; znacka: string | null };

/** Slova, která rozlišují jinak stejné kategorie — dámské vs. pánské vs. dětské. */
const ROZLISUJICI = ["damske", "damska", "panske", "panska", "detske", "detska"];

const naTokeny = (text: string) => new Set(ocistiProShodu(text).split(" ").filter(Boolean));

/** Kolik bodů dostane naše kategorie za shodu s kategorií z feedu. */
function skore(feed: string, k: NaseKategorie): number {
  const f = ocistiProShodu(feed);
  const nazev = ocistiProShodu(k.nazev);
  if (!nazev) return 0;

  const casti = feed.split("|").map((x) => ocistiProShodu(x)).filter(Boolean);
  const posledni = casti[casti.length - 1] ?? "";

  let bodu = 0;
  if (posledni === nazev || casti.slice(1).join(" ") === nazev) {
    bodu += 3;
  } else {
    // Dodavatel často přidá slovo navíc („29 palců E-cross"), takže se
    // neporovnává celý řetězec, ale kolik slov z našeho názvu ve feedu je.
    const naseSlova = naTokeny(k.nazev);
    const feedSlova = naTokeny(feed);
    const shoda = [...naseSlova].filter((t) => feedSlova.has(t)).length / naseSlova.size;
    bodu += shoda === 1 ? 3 : shoda >= 0.8 ? 2 : shoda >= 0.6 ? 1 : 0;
  }
  if (bodu === 0) return 0;

  // Když jedna strana mluví o dámském a druhá ne, nejde o tutéž kategorii.
  const feedSlova = naTokeny(feed);
  const naseSlova = naTokeny(k.nazev);
  for (const r of ROZLISUJICI) {
    if (feedSlova.has(r) !== naseSlova.has(r)) {
      bodu -= 2;
      break;
    }
  }

  // Značka rozhodne, když stejný název nabízí víc značek.
  if (k.znacka && f.includes(ocistiProShodu(k.znacka))) bodu += 3;
  const sekce = POPIS_SEKCE[k.sekce];
  if (sekce && f.startsWith(sekce)) bodu += 1;

  // Při shodě vyhrává konkrétnější kategorie: na „Horská elektrokola (E-MTB)
  // | 29 palců" sedí i pouhé „Horská elektrokola", ale ta první je přesnější.
  bodu += Math.min(naseSlova.size, 8) * 0.1;
  return bodu;
}

/**
 * Navrhne přiřazení pro každou kategorii z feedu.
 * Vrací jen jednoznačné shody — u sporných nechá rozhodnutí na obsluze.
 */
export function navrhniMapovani(kategorieFeedu: string[], nase: NaseKategorie[]): Mapovani {
  const navrh: Mapovani = {};
  for (const feed of kategorieFeedu) {
    if (!feed.trim()) continue;
    let nej = 0;
    let vitez: string | null = null;
    let remiza = false;
    for (const k of nase) {
      const b = skore(feed, k);
      if (b > nej) {
        nej = b;
        vitez = k.id;
        remiza = false;
      } else if (b === nej && b > 0 && k.id !== vitez) {
        remiza = true;
      }
    }
    if (vitez && nej >= 3 && !remiza) navrh[feed] = vitez;
  }
  return navrh;
}

export type PlanRadek = {
  produkt: FeedProdukt;
  akce: "novy" | "aktualizace" | "preskoceno";
  duvod?: string;
  /** id existujícího produktu, když jde o aktualizaci */
  id?: string;
  cena: number;
  cenaNaWebu?: number;
  skladem: number;
  kategorieId?: string;
};

export type Plan = {
  radky: PlanRadek[];
  novych: number;
  aktualizaci: number;
  preskocenych: number;
  zmenyCen: number;
};

const naSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 110);

/** Název, pod kterým produkt pojede na webu. Barva je součástí názvu. */
export const nazevProWeb = (p: FeedProdukt) =>
  p.barva && !p.nazev.toLowerCase().includes(p.barva.toLowerCase()) ? `${p.nazev} — ${p.barva}` : p.nazev;

/** Nejnižší cena mezi velikostmi. U kol bývají všechny stejné. */
export const cenaProduktu = (p: FeedProdukt) => {
  const ceny = p.varianty.map((v) => v.cena).filter((c) => c > 0);
  return ceny.length ? Math.min(...ceny) : 0;
};

export const sklademCelkem = (p: FeedProdukt) =>
  p.varianty.reduce((s, v) => s + v.skladem, 0);

export type ExistujiciProdukt = {
  id: string;
  slug: string;
  nazev: string;
  cena: number;
  dodavatel: string | null;
  dodavatel_kod: string | null;
};

/** Načte jen to, co je k porovnání potřeba — ne celé produkty. */
export async function nactiProPorovnani(): Promise<ExistujiciProdukt[]> {
  const { data, error } = await supabase
    .from("produkty")
    .select("id, slug, nazev, cena, dodavatel, dodavatel_kod");
  if (error) throw error;
  return (data ?? []) as ExistujiciProdukt[];
}

/**
 * Připraví plán importu — co přibude, co se aktualizuje a co se přeskočí.
 * Nic nezapisuje, slouží k náhledu před potvrzením.
 */
export function sestavPlan(
  feed: FeedVysledek,
  existujici: ExistujiciProdukt[],
  mapovani: Mapovani,
): Plan {
  const podleKodu = new Map(
    existujici
      .filter((p) => p.dodavatel && p.dodavatel_kod)
      .map((p) => [`${p.dodavatel}|${p.dodavatel_kod}`, p]),
  );

  const radky: PlanRadek[] = feed.produkty.map((p) => {
    const cena = cenaProduktu(p);
    const skladem = sklademCelkem(p);
    const kategorieId = mapovani[p.kategorieFeed];
    const stary = podleKodu.get(`${p.dodavatel}|${p.kod}`);

    if (stary) {
      return {
        produkt: p,
        akce: "aktualizace",
        id: stary.id,
        cena,
        cenaNaWebu: stary.cena,
        skladem,
        ...(kategorieId ? { kategorieId } : {}),
      };
    }
    if (!kategorieId) {
      return {
        produkt: p,
        akce: "preskoceno",
        duvod: p.kategorieFeed
          ? `Kategorie „${p.kategorieFeed}" není přiřazená`
          : "Feed neuvádí kategorii",
        cena,
        skladem,
      };
    }
    if (cena <= 0) {
      return { produkt: p, akce: "preskoceno", duvod: "Dodavatel neposlal cenu", cena, skladem, kategorieId };
    }
    return { produkt: p, akce: "novy", cena, skladem, kategorieId };
  });

  return {
    radky,
    novych: radky.filter((r) => r.akce === "novy").length,
    aktualizaci: radky.filter((r) => r.akce === "aktualizace").length,
    preskocenych: radky.filter((r) => r.akce === "preskoceno").length,
    zmenyCen: radky.filter(
      (r) => r.akce === "aktualizace" && r.cena > 0 && r.cena !== r.cenaNaWebu,
    ).length,
  };
}

/**
 * Zapíše plán do databáze.
 *
 * Nové produkty přicházejí SKRYTÉ (`aktivni = false`). Obchodník je projde,
 * doplní, co chybí, a teprve pak je zveřejní — feed nikdy nic nepustí na web
 * bez jeho vědomí.
 */
export async function provedImport(
  plan: Plan,
  existujici: ExistujiciProdukt[],
  hlaska: (text: string) => void,
): Promise<{ novych: number; aktualizovano: number }> {
  const pouziteSlugy = new Set(existujici.map((p) => p.slug));
  const unikatniSlug = (zaklad: string) => {
    let s = naSlug(zaklad) || "produkt";
    let i = 2;
    while (pouziteSlugy.has(s)) s = `${naSlug(zaklad)}-${i++}`;
    pouziteSlugy.add(s);
    return s;
  };

  // Nová kola dostanou cenu podle pravidla dodavatele (o kolik % a zaokrouhlení).
  const pravidla = await nactiPravidla().catch(() => []);
  const nove = plan.radky.filter((r) => r.akce === "novy");
  const upravy = plan.radky.filter((r) => r.akce === "aktualizace");

  let novych = 0;
  for (let i = 0; i < nove.length; i += 50) {
    const davka = nove.slice(i, i + 50).map((r) => {
      const p = r.produkt;
      const velikosti = [...new Set(p.varianty.map((v) => v.velikost).filter((v): v is string => !!v))];
      return {
        slug: unikatniSlug(nazevProWeb(p)),
        nazev: nazevProWeb(p),
        kategorie_id: r.kategorieId ?? null,
        cena: cenaPodlePravidla(r.cena, pravidloPro(pravidla, p.dodavatel)) || r.cena,
        cena_feed: r.cena,
        kratky: p.kratky.slice(0, 200),
        popis: p.popis,
        obrazek_url: p.obrazky[0] ?? null,
        obrazky: p.obrazky.slice(1),
        velikosti,
        skladem: r.skladem,
        na_objednavku: true,
        ean: p.varianty.find((v) => v.ean)?.ean ?? null,
        barva: p.barva,
        dodavatel: p.dodavatel,
        dodavatel_kod: p.kod,
        varianty: p.varianty,
        ...(p.parametry?.length ? { parametry: p.parametry } : {}),
        importovano_at: new Date().toISOString(),
        // Záměrně skryté — obchodník je zveřejní, až je zkontroluje.
        aktivni: false,
      };
    });
    const { error } = await supabase.from("produkty").insert(davka);
    if (error) throw error;
    novych += davka.length;
    hlaska(`Zakládám nové produkty… ${novych} z ${nove.length}`);
  }

  let aktualizovano = 0;
  for (const r of upravy) {
    const p = r.produkt;
    const velikosti = [...new Set(p.varianty.map((v) => v.velikost).filter((v): v is string => !!v))];
    // Cenu, název, popis ani fotky NEPŘEPISUJEME — ty si obchodník doladil sám.
    const { error } = await supabase
      .from("produkty")
      .update({
        cena_feed: r.cena,
        skladem: r.skladem,
        velikosti,
        varianty: p.varianty,
        ean: p.varianty.find((v) => v.ean)?.ean ?? null,
        importovano_at: new Date().toISOString(),
      })
      .eq("id", r.id!);
    if (error) throw error;
    aktualizovano++;
    if (aktualizovano % 25 === 0) hlaska(`Aktualizuji… ${aktualizovano} z ${upravy.length}`);
  }

  return { novych, aktualizovano };
}

/** Převezme cenu od dodavatele jako cenu na webu. */
export async function prevezmiCenu(id: string, cena: number): Promise<void> {
  const { error } = await supabase.from("produkty").update({ cena }).eq("id", id);
  if (error) throw error;
}
