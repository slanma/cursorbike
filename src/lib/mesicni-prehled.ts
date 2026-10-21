/**
 * Měsíční přehled od dodavatelů.
 *
 * Jednou za měsíc stačí: web stáhne feedy všech dodavatelů, kteří mají
 * odkaz, a připraví tři otázky:
 *   1. nová kola — chcete je na web?
 *   2. kola, která dodavatel už nemá — skrýt je?
 *   3. změny cen — převzít nové ceny?
 * Sklad a čárové kódy se aktualizují bez ptaní, na těch není co rozhodovat.
 */

import { supabase } from "@/integrations/supabase/client";
import { nactiKategorie, nactiMapovani, nactiProfily } from "@/lib/eshop";
import type { FeedProdukt } from "@/lib/feed";
import {
  navrhniMapovani,
  provedImport,
  sestavPlan,
  type ExistujiciProdukt,
  type Plan,
  type PlanRadek,
} from "@/lib/feed-import";
import { zpracujProfil } from "@/lib/feed-univerzalni";
import { cenaPodlePravidla, nactiPravidla, pravidloPro } from "@/lib/ceny";
import { zaradAutomaticky } from "@/lib/vyber-zbozi";
import { najdiStareKolo } from "@/lib/propojeni";
import { ulozMapovani } from "@/lib/eshop";

export type NoveKolo = {
  klic: string;
  dodavatel: string;
  radek: PlanRadek;
  cenaNaWebu: number;
  /** Stejné kolo převzaté ze starého webu — místo přidání se propojí. */
  uzNaWebu?: string;
  uzNaWebuId?: string;
};
export type ZmizeleKolo = { id: string; nazev: string; dodavatel: string };
export type NovaCena = { id: string; nazev: string; dodavatel: string; cenaTed: number; cenaNova: number };

export type MesicniPrehled = {
  nova: NoveKolo[];
  /** Nová kola z kategorií, které ještě nejsou přiřazené — řeší se v Importu. */
  novaBezKategorie: number;
  zmizela: ZmizeleKolo[];
  ceny: NovaCena[];
  /** Aktualizace skladu a EAN u kol, která už na webu jsou. */
  aktualizace: PlanRadek[];
  existujici: ExistujiciProdukt[];
  dodavatele: string[];
  chyby: { dodavatel: string; zprava: string }[];
  /** Dodavatelé bez odkazu — jejich soubor se nahrává ručně v Importu. */
  bezOdkazu: string[];
};

type Existujici = ExistujiciProdukt & {
  cena_rucne: boolean;
  aktivni: boolean;
  cena_feed: number | null;
  ean: string | null;
};

export async function pripravPrehled(
  stahni: (url: string) => Promise<string>,
  hlaska: (text: string) => void,
): Promise<MesicniPrehled> {
  const [profily, ulozene, kategorie, pravidla, db] = await Promise.all([
    nactiProfily(),
    nactiMapovani(),
    nactiKategorie(),
    nactiPravidla(),
    supabase.from("produkty").select("id, slug, nazev, cena, cena_feed, cena_rucne, aktivni, dodavatel, dodavatel_kod, ean"),
  ]);
  if (db.error) throw db.error;
  const existujici = (db.data ?? []) as Existujici[];
  const nase = kategorie.map((k) => ({ id: k.id, nazev: k.nazev, sekce: k.sekce, znacka: k.znacka }));

  const vysledek: MesicniPrehled = {
    nova: [],
    novaBezKategorie: 0,
    zmizela: [],
    ceny: [],
    aktualizace: [],
    existujici,
    dodavatele: [],
    chyby: [],
    bezOdkazu: profily.filter((p) => !p.url).map((p) => p.nazev),
  };

  const pouzitaStara = new Set<string>();
  for (const profil of profily.filter((p) => p.url)) {
    hlaska(`Stahuji nabídku od ${profil.nazev}…`);
    let produkty: FeedProdukt[];
    try {
      const text = await stahni(profil.url!);
      produkty = zpracujProfil(text, profil).produkty;
    } catch (e) {
      vysledek.chyby.push({ dodavatel: profil.nazev, zprava: e instanceof Error ? e.message : "Feed se nepodařilo stáhnout" });
      continue;
    }
    vysledek.dodavatele.push(profil.nazev);

    const zakladni = { ...navrhniMapovani([...new Set(produkty.map((p) => p.kategorieFeed))], nase), ...ulozene };
    // Nové kategorie u dodavatele se zařadí samy, ať se na ně obchodník nemusí ptát.
    const { mapovani, nove } = await zaradAutomaticky(produkty, zakladni, nase, profil.nazev);
    if (nove.length) {
      nase.push(...nove);
      Object.assign(ulozene, mapovani);
      await ulozMapovani(ulozene);
    }
    const plan = sestavPlan({ dodavatel: profil.id, produkty, upozorneni: [], polozekVeFeedu: produkty.length }, existujici, mapovani);
    const pravidlo = pravidloPro(pravidla, profil.id);

    for (const r of plan.radky) {
      if (r.akce === "novy") {
        const podobne = najdiStareKolo(r.produkt, existujici, pouzitaStara);
        if (podobne) pouzitaStara.add(podobne.id);
        vysledek.nova.push({
          klic: `${profil.id}|${r.produkt.kod}`,
          dodavatel: profil.nazev,
          radek: r,
          cenaNaWebu: cenaPodlePravidla(r.cena, pravidlo) || r.cena,
          ...(podobne ? { uzNaWebu: podobne.nazev, uzNaWebuId: podobne.id } : {}),
        });
      } else if (r.akce === "preskoceno" && r.duvod?.includes("Kategorie")) {
        vysledek.novaBezKategorie++;
      } else if (r.akce === "aktualizace") {
        vysledek.aktualizace.push(r);
        const e = existujici.find((x) => x.id === r.id);
        if (e && !e.cena_rucne && r.cena > 0) {
          const nova = cenaPodlePravidla(r.cena, pravidlo);
          if (nova > 0 && nova !== e.cena) {
            vysledek.ceny.push({ id: e.id, nazev: e.nazev, dodavatel: profil.nazev, cenaTed: e.cena, cenaNova: nova });
          }
        }
      }
    }

    const kodyVeFeedu = new Set(produkty.map((p) => p.kod));
    for (const e of existujici) {
      if (e.dodavatel === profil.id && e.aktivni && e.dodavatel_kod && !kodyVeFeedu.has(e.dodavatel_kod)) {
        vysledek.zmizela.push({ id: e.id, nazev: e.nazev, dodavatel: profil.nazev });
      }
    }
  }
  return vysledek;
}

export type Odpovedi = {
  /** Klíče nových kol, která se mají přidat. */
  pridat: Set<string>;
  /** Klíče nových kol, která se mají propojit se stejným kolem ze starého webu. */
  propojit: Set<string>;
  /** Id kol, která se mají skrýt. */
  skryt: Set<string>;
  /** Id kol, u kterých se má převzít nová cena. */
  prevzitCenu: Set<string>;
};

export async function ulozPrehled(
  prehled: MesicniPrehled,
  odpovedi: Odpovedi,
  hlaska: (text: string) => void,
): Promise<{ pridano: number; skryto: number; cen: number }> {
  const propojovana = prehled.nova.filter((n) => n.uzNaWebuId && odpovedi.propojit.has(n.klic));
  for (const n of propojovana) {
    const { error } = await supabase
      .from("produkty")
      .update({ dodavatel: n.radek.produkt.dodavatel, dodavatel_kod: n.radek.produkt.kod })
      .eq("id", n.uzNaWebuId!);
    if (error) throw error;
  }
  const radky = [
    ...prehled.nova.filter((n) => odpovedi.pridat.has(n.klic)).map((n) => n.radek),
    ...propojovana.map((n) => ({ ...n.radek, akce: "aktualizace" as const, id: n.uzNaWebuId! })),
    ...prehled.aktualizace,
  ];
  const plan: Plan = {
    radky,
    novych: radky.filter((r) => r.akce === "novy").length,
    aktualizaci: prehled.aktualizace.length + propojovana.length,
    preskocenych: 0,
    zmenyCen: 0,
  };
  const { novych } = await provedImport(plan, prehled.existujici, hlaska);

  let skryto = 0;
  for (const id of odpovedi.skryt) {
    const { error } = await supabase.from("produkty").update({ aktivni: false }).eq("id", id);
    if (error) throw error;
    skryto++;
  }

  let cen = 0;
  for (const c of prehled.ceny.filter((x) => odpovedi.prevzitCenu.has(x.id))) {
    const { error } = await supabase.from("produkty").update({ cena: c.cenaNova }).eq("id", c.id);
    if (error) throw error;
    cen++;
  }

  await ulozPosledniPrehled(new Date().toISOString());
  return { pridano: novych, skryto, cen };
}

export async function nactiPosledniPrehled(): Promise<string | null> {
  const { data, error } = await supabase
    .from("nastaveni")
    .select("hodnota")
    .eq("klic", "mesicni-prehled")
    .maybeSingle();
  if (error) throw error;
  const h = data?.hodnota as { posledni?: string } | null;
  return h?.posledni ?? null;
}

async function ulozPosledniPrehled(kdy: string): Promise<void> {
  const { error } = await supabase
    .from("nastaveni")
    .upsert({ klic: "mesicni-prehled", hodnota: { posledni: kdy } as never }, { onConflict: "klic" });
  if (error) throw error;
}

/** Je čas na přehled? Když ještě nebyl, nebo od posledního uběhlo 30 dní. */
export const jeCasNaPrehled = (posledni: string | null) =>
  !posledni || Date.now() - new Date(posledni).getTime() > 30 * 24 * 60 * 60 * 1000;
