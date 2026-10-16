import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Pencil, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { nactiKategorie, nactiMapovani, nactiProfily, ulozMapovani, ulozProfily } from "@/lib/eshop";
import { NeznamyFormat, nactiFeed, shrnUpozorneni, type FeedVysledek } from "@/lib/feed";
import { dekoduj, zpracujProfil, type ProfilDodavatele } from "@/lib/feed-univerzalni";
import { NovyDodavatel, useNactiZOdkazu } from "@/components/admin/NovyDodavatel";
import { zaradAutomaticky } from "@/lib/vyber-zbozi";
import { sklonuj } from "@/lib/cestina";
import { nactiPravidla, ulozPravidla, type Zaokrouhleni } from "@/lib/ceny";
import {
  navrhniMapovani,
  nactiProPorovnani,
  nazevProWeb,
  provedImport,
  sestavPlan,
  type ExistujiciProdukt,
  type Mapovani,
  type Plan,
} from "@/lib/feed-import";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/feedy")({
  component: ImportFeedu,
});

type NaseKategorie = { id: string; nazev: string; sekce: string; znacka: string | null };

/**
 * Feed od Authora je v kódování Windows-1250, ne v UTF-8. Kdybychom ho
 * přečetli jako UTF-8, rozsypala by se všechna diakritika.
 */
async function precti(soubor: File): Promise<string> {
  return dekoduj(await soubor.arrayBuffer());
}

const popisSekce = (s: string) =>
  s === "elektrokola" ? "Elektrokola" : s === "bazar" ? "Bazar" : s === "doplnky" ? "Doplňky" : "Kola";

const naSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Z cesty, jak ji píše dodavatel („Elektrokola|Crussis|Horská elektrokola"),
 * odhadne sekci, značku a název. Slouží jen k předvyplnění formuláře —
 * poslední slovo má obsluha.
 */
const OBECNE_CASTI = /^(e-?shop|v[yý]prodej|akce|novinky?|sale|home|dom[uů])$/i;

function rozeberCestu(cesta: string, znackaZFeedu?: string | null): { sekce: string; znacka: string; nazev: string } {
  const casti = cesta.split("|").map((x) => x.trim()).filter(Boolean);
  const vse = casti.join(" ").toLowerCase();
  const sekce = vse.includes("elektro") || /\be-?bike/.test(vse) ? "elektrokola" : vse.includes("bazar") ? "bazar" : "kola";
  const vecne = casti.filter((c) => !OBECNE_CASTI.test(c));
  const zbytek = vecne.length > 1 ? vecne.slice(1) : vecne;
  return {
    sekce,
    znacka: znackaZFeedu?.trim() || (zbytek.length > 1 ? zbytek[0]! : ""),
    nazev: zbytek[zbytek.length - 1] ?? cesta,
  };
}

/**
 * Import od dodavatelů.
 *
 * Záměrně jedna obrazovka a co nejmíň rozhodování: vyberete soubor a hned
 * vidíte, co se stane a kolik kol přibude. Zařazení do kategorií si program
 * spočítá sám a ukazuje ho jen tehdy, když si s něčím neporadil — jinak by
 * obsluha proklikávala dvacet roletek pokaždé znovu.
 */
function ImportFeedu() {
  const qc = useQueryClient();
  const [feed, setFeed] = useState<FeedVysledek | null>(null);
  const [nase, setNase] = useState<NaseKategorie[]>([]);
  const [mapovani, setMapovani] = useState<Mapovani>({});
  const [existujici, setExistujici] = useState<ExistujiciProdukt[]>([]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [prubeh, setPrubeh] = useState<string | null>(null);
  const [hotovo, setHotovo] = useState<{
    novych: number;
    aktualizovano: number;
    dodavatel?: string | undefined;
    od?: string | undefined;
  } | null>(null);
  const [zverejnuje, setZverejnuje] = useState(false);
  const [rozbaleno, setRozbaleno] = useState(false);
  const [zaklada, setZaklada] = useState<string | null>(null);
  const [novaSekce, setNovaSekce] = useState("kola");
  const [novaZnacka, setNovaZnacka] = useState("");
  const [novyNazev, setNovyNazev] = useState("");
  const [uklada, setUklada] = useState(false);
  const [editor, setEditor] = useState<{ puvodni?: ProfilDodavatele; text?: string; nazev?: string } | null>(null);
  const [aktualizuje, setAktualizuje] = useState<string | null>(null);
  const nactiZOdkazu = useNactiZOdkazu();
  const { data: profily = [] } = useQuery({ queryKey: ["feed-profily"], queryFn: nactiProfily });

  const kategorieFeedu = feed
    ? [...new Set(feed.produkty.map((p) => p.kategorieFeed))]
        .map((k) => ({ nazev: k, pocet: feed.produkty.filter((p) => p.kategorieFeed === k).length }))
        .sort((a, b) => Number(!!mapovani[a.nazev]) - Number(!!mapovani[b.nazev]) || b.pocet - a.pocet)
    : [];
  const nezarazene = kategorieFeedu.filter((k) => !mapovani[k.nazev]);

  const prepocitej = (m: Mapovani, f = feed, e = existujici) => {
    if (f) setPlan(sestavPlan(f, e, m));
  };

  const nactiSoubory = async (soubory: File[]) => {
    setFeed(null);
    setPlan(null);
    setHotovo(null);
    setRozbaleno(false);
    setPrubeh(soubory.length > 1 ? `Čtu ${soubory.length} souborů…` : "Čtu soubor…");
    try {
      const texty = await Promise.all(soubory.map(async (f) => ({ nazev: f.name, text: await precti(f) })));
      let casti: FeedVysledek[];
      try {
        casti = texty.map((t) => nactiFeed(t.nazev, t.text));
      } catch (e) {
        // Neznámý soubor: místo chyby nabídneme přidat dodavatele.
        if (e instanceof NeznamyFormat && texty.length === 1) {
          setEditor({ text: texty[0]!.text, nazev: texty[0]!.nazev.replace(/\.[^.]+$/, "") });
          toast.info("Tenhle feed zatím neznáme — řekněte nám jednou, co je co, a příště to půjde samo.");
          return;
        }
        throw e;
      }
      const videno = new Set<string>();
      const vysledek: FeedVysledek = {
        dodavatel: casti[0]!.dodavatel,
        produkty: casti
          .flatMap((c) => c.produkty)
          .filter((p) => {
            const klic = `${p.dodavatel}|${p.kod}`;
            if (videno.has(klic)) return false;
            videno.add(klic);
            return true;
          }),
        upozorneni: casti.flatMap((c) => c.upozorneni),
        polozekVeFeedu: casti.reduce((s, c) => s + c.polozekVeFeedu, 0),
      };
      await zpracuj(vysledek);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Soubor se nepodařilo přečíst");
    } finally {
      setPrubeh(null);
    }
  };

  /** Společný krok pro všechny zdroje: kategorie, porovnání, náhled. */
  const zpracuj = async (vysledek: FeedVysledek, rovnou = false) => {
    {
      const [ulozene, produkty, kategorie] = await Promise.all([
        nactiMapovani(),
        nactiProPorovnani(),
        nactiKategorie(),
      ]);
      const seznamKategorii: NaseKategorie[] = kategorie.map((k) => ({
        id: k.id,
        nazev: k.nazev,
        sekce: k.sekce,
        znacka: k.znacka,
      }));

      // Zařazení se spočítá samo; ručně uložené má přednost.
      const navrh = navrhniMapovani(
        [...new Set(vysledek.produkty.map((p) => p.kategorieFeed))],
        seznamKategorii,
      );
      let vysledneMapovani: Mapovani = { ...navrh, ...(ulozene ?? {}) };

      // Co zůstalo nezařazené, zařadíme sami — u kol a elektrokol stačí
      // založit kategorii podle dodavatele, obchodník ji pak může přejmenovat.
      const profil = profily.find((p) => p.id === vysledek.dodavatel);
      const { mapovani: doplnene, nove } = await zaradAutomaticky(
        vysledek.produkty,
        vysledneMapovani,
        seznamKategorii,
        profil?.nazev ?? "",
      );
      if (nove.length) {
        vysledneMapovani = doplnene;
        seznamKategorii.push(...nove);
        await ulozMapovani(vysledneMapovani);
        qc.invalidateQueries({ queryKey: ["admin-kategorie"] });
        toast.success(
          `Založili jsme ${nove.length} ${nove.length === 1 ? "novou kategorii" : nove.length < 5 ? "nové kategorie" : "nových kategorií"}. Názvy můžete kdykoli upravit v Kategoriích.`,
        );
      } else {
        vysledneMapovani = doplnene;
      }

      setFeed(vysledek);
      setNase(seznamKategorii);
      setExistujici(produkty);
      setMapovani(vysledneMapovani);
      // Náhled rovnou, ať se na něj nemusí klikat zvlášť.
      const novyPlan = sestavPlan(vysledek, produkty, vysledneMapovani);
      setPlan(novyPlan);

      // Trychtýř: obchodník už řekl, co chce a za kolik — stáhneme to rovnou.
      if (rovnou) {
        const od = new Date(Date.now() - 5000).toISOString();
        await ulozMapovani(vysledneMapovani);
        const v = await provedImport(novyPlan, produkty, setPrubeh);
        setHotovo({ ...v, dodavatel: vysledek.dodavatel, od });
        setFeed(null);
        setPlan(null);
        qc.invalidateQueries({ queryKey: ["admin-produkty"] });
        qc.invalidateQueries({ queryKey: ["admin-dnes"] });
      }
    }
  };

  const zacniZnovu = () => {
    setFeed(null);
    setPlan(null);
    setHotovo(null);
    setRozbaleno(false);
  };

  /** Profil uložený, feed přečtený — rovnou na náhled importu. */
  const pouzijProfil = async (profil: ProfilDodavatele, vysledek: FeedVysledek, rovnou = false) => {
    zacniZnovu();
    setPrubeh(rovnou ? `Stahuji zboží od ${profil.nazev}…` : `Připravuji produkty od ${profil.nazev}…`);
    try {
      await zpracuj(vysledek, rovnou);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Feed se nepodařilo zpracovat");
    } finally {
      setPrubeh(null);
    }
  };

  const ulozProfil = async (
    profil: ProfilDodavatele,
    vysledek: FeedVysledek,
    pravidlo: { procento: number; zaokrouhleni: Zaokrouhleni } | null,
  ) => {
    try {
      if (pravidlo) {
        const pravidla = await nactiPravidla();
        await ulozPravidla([...pravidla.filter((p) => p.dodavatel !== profil.id), { dodavatel: profil.id, ...pravidlo }]);
        qc.invalidateQueries({ queryKey: ["cenova-pravidla"] });
      }
      const ostatni = profily.filter((p) => p.id !== profil.id);
      await ulozProfily([...ostatni, profil]);
      await qc.invalidateQueries({ queryKey: ["feed-profily"] });
      setEditor(null);
      toast.success(`Dodavatel ${profil.nazev} je uložený.`);
      await pouzijProfil(profil, vysledek, true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Dodavatele se nepodařilo uložit");
    }
  };

  const aktualizujZOdkazu = async (profil: ProfilDodavatele) => {
    if (!profil.url) return;
    setAktualizuje(profil.id);
    try {
      const text = await nactiZOdkazu(profil.url);
      await pouzijProfil(profil, zpracujProfil(text, profil));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Feed se nepodařilo stáhnout");
    } finally {
      setAktualizuje(null);
    }
  };

  const aktualizujZeSouboru = async (profil: ProfilDodavatele, soubor: File) => {
    try {
      await pouzijProfil(profil, zpracujProfil(await precti(soubor), profil));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Soubor se nepodařilo přečíst");
    }
  };

  const smazProfil = async (profil: ProfilDodavatele) => {
    if (!confirm(`Smazat dodavatele ${profil.nazev}? Produkty na webu zůstanou, jen se přestanou aktualizovat.`)) return;
    await ulozProfily(profily.filter((p) => p.id !== profil.id));
    await qc.invalidateQueries({ queryKey: ["feed-profily"] });
  };

  /**
   * Založí kategorii, kterou dodavatel používá, ale my ji ještě nemáme.
   * Když chybí i značka, vytvoří se zároveň — obsluha tak nemusí odbíhat
   * do jiné části administrace a vracet se zpátky k importu.
   */
  const zalozKategorii = async (cestaFeedu: string) => {
    if (!novyNazev.trim()) {
      toast.error("Vyplňte název kategorie");
      return;
    }
    if (!novaZnacka.trim()) {
      toast.error("Vyplňte značku");
      return;
    }
    setUklada(true);
    try {
      const slugZnacky = naSlug(novaZnacka);
      // Značku hledáme podle sekce a adresy; když není, založíme ji.
      const { data: existujiciZnacka, error: chybaHledani } = await supabase
        .from("znacky")
        .select("id")
        .eq("sekce", novaSekce)
        .eq("slug", slugZnacky)
        .maybeSingle();
      if (chybaHledani) throw chybaHledani;

      let znackaId = existujiciZnacka?.id;
      if (!znackaId) {
        const { data, error } = await supabase
          .from("znacky")
          .insert({ sekce: novaSekce, slug: slugZnacky, nazev: novaZnacka.trim(), poradi: 99 })
          .select("id")
          .single();
        if (error) throw error;
        znackaId = data.id;
      }

      const { data: novaKat, error: chybaKat } = await supabase
        .from("kategorie")
        .insert({
          slug: `${novaSekce}-${slugZnacky}-${naSlug(novyNazev)}`,
          nazev: novyNazev.trim(),
          sekce: novaSekce,
          znacka: slugZnacky,
          znacka_id: znackaId,
          poradi: 99,
        })
        .select("id, nazev, sekce, znacka")
        .single();
      if (chybaKat) throw chybaKat;

      const doplneno = [...nase, { id: novaKat.id, nazev: novaKat.nazev, sekce: novaKat.sekce, znacka: novaKat.znacka }];
      const m = { ...mapovani, [cestaFeedu]: novaKat.id };
      setNase(doplneno);
      setMapovani(m);
      prepocitej(m);
      setZaklada(null);
      qc.invalidateQueries({ queryKey: ["admin-kategorie"] });
      qc.invalidateQueries({ queryKey: ["katalog"] });
      toast.success(`Kategorie „${novaKat.nazev}" založena`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kategorii se nepodařilo založit");
    } finally {
      setUklada(false);
    }
  };

  const spustit = async () => {
    if (!plan) return;
    setPrubeh("Spouštím import…");
    try {
      await ulozMapovani(mapovani);
      const v = await provedImport(plan, existujici, setPrubeh);
      setHotovo(v);
      setFeed(null);
      setPlan(null);
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
      qc.invalidateQueries({ queryKey: ["pocty-produktu"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import se nepodařil");
    } finally {
      setPrubeh(null);
    }
  };

  const souhrn = feed ? shrnUpozorneni(feed.upozorneni) : [];

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h2 className="section-title text-3xl md:text-4xl">Zboží od dodavatelů</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Zboží nemusíte zadávat ručně. Web si ho stáhne od dodavatele i s fotkami, popisy a velikostmi.
        </p>
      </div>

      {/* JAK TO FUNGUJE */}
      {!editor && !hotovo && (
        <div className="grid gap-4 rounded-xl border-2 border-primary bg-card p-6">
          <p className="text-xl font-bold">Jak to funguje</p>
          <ol className="grid gap-3 sm:grid-cols-3">
            {[
              ["Vložíte odkaz", "Odkaz na nabídku (feed) vám dá dodavatel. Kde ho najdete, vám poradíme."],
              ["Zaškrtnete, co chcete", "Třeba jen kola a elektrokola, nebo i díly a doplňky."],
              ["Zvolíte cenu", "Třeba o 5 % levněji. Zboží se stáhne rovnou s vaší cenou."],
            ].map(([nadpis, text], i) => (
              <li key={nadpis} className="flex gap-3 rounded-lg bg-surface p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <span>
                  <span className="block text-lg font-bold">{nadpis}</span>
                  <span className="text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div>
            <Button size="lg" className="min-h-16 px-8 text-xl" onClick={() => setEditor({})}>
              <Plus className="mr-2 h-6 w-6" /> Přidat dodavatele
            </Button>
          </div>
          <p className="text-muted-foreground">
            Máte od dodavatele soubor místo odkazu? Klikněte na Přidat dodavatele a dole zvolte Vybrat soubor.
          </p>
        </div>
      )}

      {/* PŘIDÁNÍ / ÚPRAVA DODAVATELE */}
      {editor && (
        <NovyDodavatel
          key={editor.puvodni?.id ?? editor.nazev ?? "novy"}
          puvodni={editor.puvodni}
          pocatecniText={editor.text}
          pocatecniNazev={editor.nazev}
          onUlozit={ulozProfil}
          onZrusit={() => setEditor(null)}
        />
      )}

      {/* ULOŽENÍ DODAVATELÉ */}
      {!editor && !hotovo && (
        <div className="grid gap-3 rounded-lg border bg-card p-6 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xl font-bold">Vaši dodavatelé</p>
          </div>
          {profily.length === 0 ? (
            <p className="text-lg text-muted-foreground">
              Zatím žádný. Prvního přidáte velkým zeleným tlačítkem nahoře.
            </p>
          ) : (
            <ul className="divide-y">
              {profily.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{p.nazev}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.url ?? "nahrává se soubor"} · upraveno {new Date(p.upraveno).toLocaleDateString("cs-CZ")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.url ? (
                      <Button size="sm" disabled={aktualizuje === p.id} onClick={() => void aktualizujZOdkazu(p)}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${aktualizuje === p.id ? "animate-spin" : ""}`} />
                        {aktualizuje === p.id ? "Stahuji…" : "Aktualizovat"}
                      </Button>
                    ) : (
                      <label className="inline-flex h-9 cursor-pointer items-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground">
                        <Upload className="mr-2 h-4 w-4" /> Nahrát soubor
                        <input
                          type="file"
                          accept=".xml,.csv,.txt"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void aktualizujZeSouboru(p, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setEditor({ puvodni: p })}>
                      <Pencil className="mr-2 h-4 w-4" /> Upravit
                    </Button>
                    <Button size="sm" variant="ghost" aria-label={`Smazat ${p.nazev}`} onClick={() => void smazProfil(p)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* VÝBĚR SOUBORU — Author, Crussis a export starého webu (starý způsob, schovaný) */}
      {!editor && !hotovo && (
        <details className="rounded-lg border bg-card p-4">
          <summary className="cursor-pointer text-muted-foreground">
            Starý způsob: nahrát soubor bez uložení dodavatele (export starého webu)
          </summary>
        <div className="mt-4 rounded-lg border-2 border-dashed p-6 text-center">
          <p className="text-lg font-bold">Vyberte soubor</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Můžete jich vybrat i víc najednou — podržte Cmd a klikejte.
          </p>
          <Input
            id="soubor"
            type="file"
            accept=".xml,.csv,.txt"
            multiple
            className="mx-auto mt-4 max-w-sm"
            onChange={(e) => {
              const soubory = Array.from(e.target.files ?? []);
              if (soubory.length) void nactiSoubory(soubory);
              e.target.value = "";
            }}
          />
          {prubeh && <p className="mt-3 text-sm text-muted-foreground">{prubeh}</p>}
        </div>
        </details>
      )}

      {prubeh && !editor && (
        <p className="rounded-lg bg-accent p-4 text-lg font-semibold text-accent-foreground">{prubeh}</p>
      )}

      {/* CO SE STANE */}
      {plan && feed && (
        <div className="grid gap-5 rounded-lg border-2 border-primary bg-card p-6 shadow-card">
          <div>
            <p className="text-2xl font-bold">
              Přibude {plan.novych} {plan.novych === 1 ? "kolo" : plan.novych < 5 ? "kola" : "kol"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.aktualizaci > 0 && <>U {plan.aktualizaci} kol se doplní sklad a čárové kódy. </>}
              {plan.preskocenych > 0 && <>{plan.preskocenych} se přeskočí. </>}
              Nová kola budou zatím skrytá, zveřejníte je až po kontrole.
            </p>
          </div>

          {plan.zmenyCen > 0 && (
            <p className="rounded-md border bg-surface p-4 text-sm">
              U {plan.zmenyCen} kol posílá dodavatel jinou cenu, než máte na webu.{" "}
              <span className="font-semibold">Vaše ceny zůstanou.</span>
            </p>
          )}

          {/* Zařazení — ukazuje se jen když je co řešit */}
          {nezarazene.length === 0 ? (
            <p className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Všechna kola jsme zařadili do kategorií sami.
              <button
                type="button"
                className="underline hover:text-primary"
                onClick={() => setRozbaleno(!rozbaleno)}
              >
                {rozbaleno ? "Skrýt" : "Zkontrolovat"}
              </button>
            </p>
          ) : (
            <div className="rounded-md border-2 border-dashed p-4">
              <p className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-primary" />
                {nezarazene.length === 1
                  ? "U jedné skupiny nevíme, kam patří"
                  : `U ${nezarazene.length} skupin nevíme, kam patří`}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vyberte kategorii, nebo nechte být — co zůstane prázdné, se nenaimportuje.
              </p>
              <div className="mt-3 grid gap-2">
                {nezarazene.map((k) => (
                  <div key={k.nazev} className="grid gap-2">
                    <div className="grid items-center gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <span className="text-sm">
                        <span className="font-semibold">{k.nazev || "(bez kategorie)"}</span>{" "}
                        <span className="text-muted-foreground">— {k.pocet} kol</span>
                      </span>
                      <select
                        className="h-10 rounded-md border bg-background px-3 text-sm"
                        value={mapovani[k.nazev] ?? ""}
                        onChange={(e) => {
                          const m = { ...mapovani, [k.nazev]: e.target.value };
                          setMapovani(m);
                          prepocitej(m);
                        }}
                      >
                        <option value="">— neimportovat —</option>
                        {nase.map((x) => (
                          <option key={x.id} value={x.id}>
                            {popisSekce(x.sekce)} · {x.znacka ?? "—"} · {x.nazev}
                          </option>
                        ))}
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const navrh = rozeberCestu(k.nazev, feed?.produkty.find((p) => p.kategorieFeed === k.nazev)?.znacka);
                          setZaklada(zaklada === k.nazev ? null : k.nazev);
                          setNovaSekce(navrh.sekce);
                          setNovaZnacka(navrh.znacka);
                          setNovyNazev(navrh.nazev);
                        }}
                      >
                        Založit novou
                      </Button>
                    </div>

                    {zaklada === k.nazev && (
                      <div className="grid gap-3 rounded-md border bg-surface p-4 sm:grid-cols-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor={`sekce-${k.nazev}`}>Kam patří</Label>
                          <select
                            id={`sekce-${k.nazev}`}
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                            value={novaSekce}
                            onChange={(e) => setNovaSekce(e.target.value)}
                          >
                            <option value="kola">Kola</option>
                            <option value="elektrokola">Elektrokola</option>
                            <option value="bazar">Bazar</option>
                            <option value="doplnky">Doplňky</option>
                          </select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`znacka-${k.nazev}`}>Značka</Label>
                          <Input
                            id={`znacka-${k.nazev}`}
                            value={novaZnacka}
                            placeholder="Crussis"
                            onChange={(e) => setNovaZnacka(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor={`nazev-${k.nazev}`}>Název kategorie</Label>
                          <Input
                            id={`nazev-${k.nazev}`}
                            value={novyNazev}
                            onChange={(e) => setNovyNazev(e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Button size="sm" disabled={uklada} onClick={() => void zalozKategorii(k.nazev)}>
                            {uklada ? "Zakládám…" : "Založit a zařadit sem"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setZaklada(null)}>
                            Zrušit
                          </Button>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Značka se založí taky, pokud ještě není. Předvyplnili jsme to podle toho,
                            jak kategorii pojmenoval dodavatel.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rozbaleno && (
            <div className="grid gap-2 rounded-md border p-4">
              <p className="text-xs text-muted-foreground">
                Když něco sedí špatně, přepište to tady — vaše volba má přednost a zapamatujeme si ji.
              </p>
              <div className="max-h-72 overflow-auto">
                {kategorieFeedu.map((k) => (
                  <div key={k.nazev} className="grid items-center gap-2 py-1 sm:grid-cols-[1fr_1fr]">
                    <span className="text-sm">
                      {k.nazev || "(bez kategorie)"}{" "}
                      <span className="text-muted-foreground">— {k.pocet} kol</span>
                    </span>
                    <select
                      className="h-9 rounded-md border bg-background px-2 text-sm"
                      value={mapovani[k.nazev] ?? ""}
                      onChange={(e) => {
                        const m = { ...mapovani, [k.nazev]: e.target.value };
                        setMapovani(m);
                        prepocitej(m);
                      }}
                    >
                      <option value="">— neimportovat —</option>
                      {nase.map((x) => (
                        <option key={x.id} value={x.id}>
                          {popisSekce(x.sekce)} · {x.znacka ?? "—"} · {x.nazev}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => void spustit()} disabled={!!prubeh || plan.novych + plan.aktualizaci === 0}>
              <Upload className="mr-2 h-5 w-5" />
              {prubeh ?? `Naimportovat ${plan.novych + plan.aktualizaci} kol`}
            </Button>
            <Button
              variant="ghost"
              disabled={!!prubeh}
              onClick={() => {
                setFeed(null);
                setPlan(null);
              }}
            >
              Zrušit
            </Button>
          </div>

          {souhrn.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Co bude potřeba dodělat ručně
              </summary>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {souhrn.map((s) => (
                  <li key={s.druh}>
                    <span className="font-semibold">{s.pocet}×</span> {s.popis}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Není to chyba importu — takhle to poslal dodavatel.
              </p>
            </details>
          )}

          {plan.radky.some((r) => r.akce === "novy") && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Ukázat, která kola přibudou
              </summary>
              <ul className="mt-2 max-h-60 space-y-1 overflow-auto text-muted-foreground">
                {plan.radky
                  .filter((r) => r.akce === "novy")
                  .map((r) => (
                    <li key={r.produkt.kod}>{nazevProWeb(r.produkt)}</li>
                  ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* HOTOVO */}
      {hotovo && (
        <div className="rounded-lg border-2 border-primary bg-card p-6 shadow-card">
          <h3 className="flex items-center gap-2 text-xl font-bold">
            <CheckCircle2 className="h-6 w-6 text-primary" /> Hotovo
          </h3>
          <p className="mt-2">
            Přibylo {sklonuj(hotovo.novych, "nový produkt", "nové produkty", "nových produktů")}
            {hotovo.aktualizovano > 0 && <>, u {hotovo.aktualizovano} se doplnil sklad</>}.
          </p>
          {hotovo.novych > 0 && (
            <>
              <p className="mt-3 text-lg">
                Nové zboží je zatím <span className="font-semibold">skryté</span>, zákazníci ho ještě nevidí.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {hotovo.dodavatel && hotovo.od && (
                  <Button
                    size="lg"
                    className="min-h-14 px-7 text-lg"
                    disabled={zverejnuje}
                    onClick={async () => {
                      setZverejnuje(true);
                      const { error } = await supabase
                        .from("produkty")
                        .update({ aktivni: true })
                        .eq("dodavatel", hotovo.dodavatel!)
                        .eq("aktivni", false)
                        .gte("created_at", hotovo.od!);
                      setZverejnuje(false);
                      if (error) {
                        toast.error(error.message);
                        return;
                      }
                      toast.success("Nové zboží je na webu.");
                      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
                      qc.invalidateQueries({ queryKey: ["admin-dnes"] });
                      setHotovo({ ...hotovo, dodavatel: undefined });
                    }}
                  >
                    {zverejnuje ? "Zveřejňuji…" : "Zveřejnit hned"}
                  </Button>
                )}
                <Link
                  to="/admin/produkty"
                  className="inline-flex min-h-14 items-center rounded-lg border-2 px-6 text-lg font-semibold hover:border-primary"
                >
                  Nejdřív je projdu
                </Link>
              </div>
            </>
          )}
          <Button className="mt-4" variant="ghost" onClick={() => setHotovo(null)}>
            Zpět na dodavatele
          </Button>
        </div>
      )}
    </div>
  );
}
