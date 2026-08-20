import { supabase } from "@/integrations/supabase/client";
import type { FeedProdukt, FeedVysledek } from "@/lib/feed";

export type Mapovani = Record<string, string>;

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
  p.barva ? `${p.nazev} — ${p.barva}` : p.nazev;

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
        cena: r.cena,
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
