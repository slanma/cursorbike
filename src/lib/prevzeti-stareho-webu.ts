/**
 * Převzetí starého webu (PrestaShop na cursorbike.cz) — jednou, před
 * přepnutím domény.
 *
 * Starý web je zdroj pravdy: co je na něm, má být i na novém. Web si ho
 * projde sám (výpisy i stránky kol) a převezme:
 *   - ceny i akce (přeškrtnutá běžná cena),
 *   - popisy a krátké popisy,
 *   - všechny fotky — a hned je uloží k nám, protože starý web skončí,
 *   - kola, která na starém webu přibyla.
 * Potom se kola při stahování od dodavatelů sama propojí (propojeni.ts)
 * a od té doby je hlídá měsíční přehled.
 */

import { supabase } from "@/integrations/supabase/client";
import { rozlozNazev } from "@/lib/feed";
import { nactiKategorie, nactiMapovani, ulozMapovani } from "@/lib/eshop";
import { slovaNazvu } from "@/lib/propojeni";
import { nactiKolaStarehoWebu } from "@/lib/stary-web";
import { zaradAutomaticky } from "@/lib/vyber-zbozi";
import type { FeedProdukt } from "@/lib/feed";

type Stahni = (url: string) => Promise<string>;

export type KoloZeStarehoWebu = {
  kod: string;
  nazev: string;
  barva: string | null;
  kategorie: string;
  znacka: string;
  cena: number;
  puvodniCena: number | null;
  popis: string;
  kratky: string;
  fotky: string[];
  varianty: { velikost: string | null; ean: null; cena: number; skladem: number }[];
};

export type PlanPrevzeti = {
  kola: KoloZeStarehoWebu[];
  /** id na novém webu ke kódu kola ze starého webu */
  sparovana: Map<string, string>;
  nova: KoloZeStarehoWebu[];
  /** kola ze starého webu na novém webu, která na starém už nejsou */
  navic: { id: string; nazev: string }[];
};

const cislo = (s: string) => Number(s.replace(/[^\d,.]/g, "").replace(",", ".")) || 0;
const text = (el: Element | null | undefined) => (el?.textContent ?? "").replace(/\s+/g, " ").trim();
const odstavce = (el: Element | null | undefined) =>
  (el?.textContent ?? "")
    .split("\n")
    .map((r) => r.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");

export function rozeberStranku(html: string, url: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const meta = (p: string) => doc.querySelector(`meta[property='${p}'], meta[name='${p}']`)?.getAttribute("content") ?? "";

  const nazev = text(doc.querySelector("h1")) || meta("og:title");
  const cena = Math.round(cislo(meta("product:price:amount")));
  const bezna = Math.round(cislo(text(doc.querySelector(".product-prices .regular-price, .regular-price"))));

  // Drobečková navigace: Domů › Elektrokola › Liberty › Elektrokola|Liberty|e-City 28" › kolo
  const drobky = Array.from(doc.querySelectorAll(".breadcrumb a, nav[class*='breadcrumb'] a, ol a"))
    .map((a) => text(a))
    .filter((t) => t && !/^dom[uů]$/i.test(t) && t !== nazev);
  const kategorie = drobky.find((d) => d.includes("|")) ?? drobky.join("|");

  const znacka = text(doc.querySelector("a[href*='/brand/']")) || drobky[1] || "";

  // Všechny fotky kola, ve velkém rozlišení.
  const fotky = new Map<string, string>();
  doc.querySelectorAll("img").forEach((img) => {
    for (const atr of ["data-image-large-src", "data-src", "src"]) {
      const src = img.getAttribute(atr) ?? "";
      const m = src.match(/^(https?:\/\/[^/]+)\/(\d+)-[a-z_]+_default\/([^?]+)$/i);
      if (m && !fotky.has(m[2]!)) fotky.set(m[2]!, `${m[1]}/${m[2]}-large_default/${m[3]}`);
    }
  });

  return {
    url,
    nazev,
    cena,
    puvodniCena: bezna > cena ? bezna : null,
    popis: odstavce(doc.querySelector("#description .product-description, #description")),
    kratky: odstavce(doc.querySelector("[id^='product-description-short'], .product-description-short")) || meta("og:description"),
    kategorie,
    znacka,
    fotky: [...fotky.values()],
  };
}

/** Projde starý web a sestaví plán převzetí. Nic zatím neukládá. */
export async function pripravPrevzeti(stahni: Stahni, hlaska: (t: string) => void): Promise<PlanPrevzeti> {
  const vypis = await nactiKolaStarehoWebu(stahni, hlaska);
  const stranky: ReturnType<typeof rozeberStranku>[] = [];
  for (const [i, k] of vypis.entries()) {
    hlaska(`Čtu kola na starém webu… ${i + 1} z ${vypis.length}`);
    try {
      const s = rozeberStranku(await stahni(k.url), k.url);
      // Akce z výpisu, kdyby ji stránka neukazovala stejně.
      if (!s.puvodniCena && k.puvodniCena) s.puvodniCena = k.puvodniCena;
      if (!s.cena) s.cena = k.cena;
      if (s.nazev && s.cena) stranky.push(s);
    } catch {
      /* jedno kolo se nepovedlo — pokračujeme */
    }
  }

  // Velikosti jednoho kola jsou na starém webu zvlášť — spojíme je, stejně jako při prvním převodu.
  const mapa = new Map<string, KoloZeStarehoWebu>();
  for (const s of stranky) {
    const { model, barva, velikost } = rozlozNazev(s.nazev, s.kategorie);
    const kod = `${s.kategorie}|${model}|${barva ?? ""}`.toLowerCase();
    const k = mapa.get(kod);
    if (!k) {
      mapa.set(kod, {
        kod,
        nazev: model || s.nazev,
        barva,
        kategorie: s.kategorie,
        znacka: s.znacka,
        cena: s.cena,
        puvodniCena: s.puvodniCena,
        popis: s.popis,
        kratky: s.kratky,
        fotky: s.fotky,
        varianty: [{ velikost, ean: null, cena: s.cena, skladem: 0 }],
      });
    } else {
      k.varianty.push({ velikost, ean: null, cena: s.cena, skladem: 0 });
      if (s.cena < k.cena) {
        k.cena = s.cena;
        k.puvodniCena = s.puvodniCena;
      }
      for (const f of s.fotky) if (!k.fotky.includes(f)) k.fotky.push(f);
      if (!k.popis && s.popis) k.popis = s.popis;
    }
  }
  const kola = [...mapa.values()];

  const { data, error } = await supabase.from("produkty").select("id, nazev, dodavatel, dodavatel_kod, aktivni");
  if (error) throw error;
  const nove = data ?? [];
  const pouzita = new Set<string>();
  const sparovana = new Map<string, string>();
  for (const k of kola) {
    let shoda = nove.find((n) => !pouzita.has(n.id) && n.dodavatel_kod === k.kod);
    if (!shoda) {
      const s = slovaNazvu(`${k.nazev} ${k.barva ?? ""}`);
      let nej = 0;
      for (const n of nove) {
        if (pouzita.has(n.id) || s.size < 2) continue;
        const t = slovaNazvu(n.nazev);
        const spolecne = [...s].filter((x) => t.has(x)).length;
        const sk = spolecne / s.size >= 0.85 ? (spolecne / s.size + spolecne / Math.max(1, t.size)) / 2 : 0;
        if (sk > nej) {
          nej = sk;
          shoda = n;
        }
      }
    }
    if (shoda) {
      pouzita.add(shoda.id);
      sparovana.set(k.kod, shoda.id);
    }
  }
  return {
    kola,
    sparovana,
    nova: kola.filter((k) => !sparovana.has(k.kod)),
    navic: nove
      .filter((n) => n.dodavatel === "cursorbike" && n.aktivni && !pouzita.has(n.id))
      .map((n) => ({ id: n.id, nazev: n.nazev })),
  };
}

export type CoPrevzit = { ceny: boolean; popisy: boolean; fotky: boolean; nova: boolean };

export async function provedPrevzeti(
  plan: PlanPrevzeti,
  co: CoPrevzit,
  hlaska: (t: string) => void,
): Promise<{ ceny: number; popisy: number; fotky: number; nova: number; idsFotek: string[] }> {
  const vysledek = { ceny: 0, popisy: 0, fotky: 0, nova: 0, idsFotek: [] as string[] };
  const ids = [...plan.sparovana.values()];
  const stavajici = new Map<string, { popis: string; kratky: string; obrazek_url: string | null; obrazky: string[] | null; cena: number; puvodni_cena: number | null }>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase
      .from("produkty")
      .select("id, popis, kratky, obrazek_url, obrazky, cena, puvodni_cena")
      .in("id", ids.slice(i, i + 200));
    for (const d of data ?? []) stavajici.set(d.id, d as never);
  }

  let i = 0;
  for (const k of plan.kola) {
    const id = plan.sparovana.get(k.kod);
    if (!id) continue;
    hlaska(`Přebírám… ${++i} z ${plan.sparovana.size}`);
    const ted = stavajici.get(id);
    const zmena: Record<string, unknown> = {};
    if (co.ceny && ted && (ted.cena !== k.cena || (ted.puvodni_cena ?? null) !== k.puvodniCena)) {
      zmena["cena"] = k.cena;
      zmena["puvodni_cena"] = k.puvodniCena;
      zmena["cena_rucne"] = true;
      vysledek.ceny++;
    }
    if (co.popisy && ted) {
      if (!ted.popis?.trim() && (k.popis || k.kratky)) {
        zmena["popis"] = k.popis || k.kratky;
        vysledek.popisy++;
      }
      if (!ted.kratky?.trim() && k.kratky) zmena["kratky"] = k.kratky.slice(0, 200);
    }
    if (co.fotky && ted && k.fotky.length) {
      const maFotek = (ted.obrazek_url ? 1 : 0) + (ted.obrazky?.length ?? 0);
      if (k.fotky.length > maFotek) {
        zmena["obrazek_url"] = k.fotky[0];
        zmena["obrazky"] = k.fotky.slice(1);
        vysledek.fotky++;
      }
      vysledek.idsFotek.push(id);
    }
    if (Object.keys(zmena).length) {
      const { error } = await supabase.from("produkty").update(zmena as never).eq("id", id);
      if (error) throw error;
    }
  }

  if (co.nova && plan.nova.length) {
    hlaska("Zakládám kola, která na novém webu chyběla…");
    const feed: FeedProdukt[] = plan.nova.map((k) => ({
      dodavatel: "cursorbike",
      kod: k.kod,
      nazev: k.nazev,
      barva: k.barva,
      znacka: k.znacka,
      kategorieFeed: k.kategorie,
      kratky: k.kratky,
      popis: k.popis,
      obrazky: k.fotky,
      obrazkySoubory: [],
      varianty: k.varianty,
    }));
    const kategorie = await nactiKategorie();
    const { mapovani } = await zaradAutomaticky(
      feed,
      await nactiMapovani(),
      kategorie.map((x) => ({ id: x.id, nazev: x.nazev, sekce: x.sekce, znacka: x.znacka })),
      "",
    );
    await ulozMapovani(mapovani);
    const nazevProWeb = (k: KoloZeStarehoWebu) =>
      k.barva && !k.nazev.toLowerCase().includes(k.barva.toLowerCase()) ? `${k.nazev} — ${k.barva}` : k.nazev;
    const zaznamy = plan.nova.map((k) => {
      const nazev = nazevProWeb(k);
      const slug = `${nazev}-${k.kod.length}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 90);
      return {
        slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
        nazev,
        kategorie_id: mapovani[k.kategorie] ?? null,
        cena: k.cena,
        puvodni_cena: k.puvodniCena,
        cena_rucne: true,
        kratky: k.kratky.slice(0, 200),
        popis: k.popis,
        obrazek_url: k.fotky[0] ?? null,
        obrazky: k.fotky.slice(1),
        velikosti: [...new Set(k.varianty.map((v) => v.velikost).filter((v): v is string => !!v))],
        varianty: k.varianty,
        barva: k.barva,
        dodavatel: "cursorbike",
        dodavatel_kod: k.kod,
        na_objednavku: true,
        skladem: 0,
        // Na starém webu se prodávají, takže na nový web patří hned.
        aktivni: true,
        importovano_at: new Date().toISOString(),
      };
    });
    for (let j = 0; j < zaznamy.length; j += 50) {
      const { data, error } = await supabase.from("produkty").insert(zaznamy.slice(j, j + 50)).select("id");
      if (error) throw error;
      vysledek.nova += data?.length ?? 0;
      if (co.fotky) vysledek.idsFotek.push(...(data ?? []).map((d) => d.id));
    }
  }

  await supabase
    .from("nastaveni")
    .upsert({ klic: "stary-web-prevzat", hodnota: { kdy: new Date().toISOString() } as never }, { onConflict: "klic" });
  return vysledek;
}

export async function skryjNavic(ids: string[]): Promise<void> {
  for (let i = 0; i < ids.length; i += 100) {
    const { error } = await supabase.from("produkty").update({ aktivni: false }).in("id", ids.slice(i, i + 100));
    if (error) throw error;
  }
}
