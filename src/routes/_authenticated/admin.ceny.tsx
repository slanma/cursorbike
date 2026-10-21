import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Check, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { nactiProfily } from "@/lib/eshop";
import {
  cenaPodlePravidla,
  nactiPravidla,
  popisPravidla,
  pouzijPravidlo,
  ulozPravidla,
  vratZmeny,
  type CenovePravidlo,
  type ZmenaCeny,
  type Zaokrouhleni,
} from "@/lib/ceny";
import { formatCena } from "@/lib/produkty";
import { sklonuj } from "@/lib/cestina";
import { dekoduj } from "@/lib/feed-univerzalni";
import { porovnejCeny, prevezmiCeny, type RozdilCeny, type VysledekPorovnani } from "@/lib/porovnani-cen";
import { RefreshCw, Upload } from "lucide-react";
import { useNactiZOdkazu } from "@/components/admin/NovyDodavatel";
import { porovnejSeStarymWebem, prevezmiCenyStarehoWebu, type RozdilCenyStaryWeb } from "@/lib/stary-web";

export const Route = createFileRoute("/_authenticated/admin/ceny")({
  component: Ceny,
});

const UPRAVY = [
  { procento: -10, text: "o 10 % levněji" },
  { procento: -5, text: "o 5 % levněji" },
  { procento: 0, text: "přesně" },
  { procento: 5, text: "o 5 % dráž" },
  { procento: 10, text: "o 10 % dráž" },
];

const ZAOKROUHLENI: { hodnota: Zaokrouhleni; text: string }[] = [
  { hodnota: "990", text: "zaokrouhlím na …990" },
  { hodnota: "100", text: "zaokrouhlím na stovky" },
  { hodnota: "zadne", text: "nezaokrouhluji" },
];

const NAZVY_RUCNICH: Record<string, string> = { author: "Author", crussis: "Crussis" };

/** Kola ze starého webu nemají dodavatele — jejich ceny jsou vaše a pravidlo se na ně nevztahuje. */
const BEZ_PRAVIDLA = new Set(["cursorbike"]);

const volba = (zapnuto: boolean) =>
  `min-h-14 rounded-lg border-2 px-5 text-xl font-bold transition-colors ${
    zapnuto ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"
  }`;

/**
 * Ceny jednou větou.
 *
 * „Kola od Leader Fox prodávám o 5 % levněji a zaokrouhlím na …990."
 * Hned je vidět příklad a po uložení jde změna vrátit jedním kliknutím.
 */
function Ceny() {
  const qc = useQueryClient();
  const { data: profily = [] } = useQuery({ queryKey: ["feed-profily"], queryFn: nactiProfily });
  const { data: pravidla = [] } = useQuery({ queryKey: ["cenova-pravidla"], queryFn: nactiPravidla });
  const { data: dodavateleVProduktech = [] } = useQuery({
    queryKey: ["dodavatele-v-produktech"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produkty").select("dodavatel").not("dodavatel", "is", null);
      if (error) throw error;
      return [...new Set((data ?? []).map((d) => d.dodavatel as string))];
    },
  });

  const dodavatele = useMemo(() => {
    const seznam = new Map<string, string>();
    for (const p of profily) seznam.set(p.id, p.nazev);
    for (const d of dodavateleVProduktech) {
      if (!seznam.has(d) && !BEZ_PRAVIDLA.has(d)) seznam.set(d, NAZVY_RUCNICH[d] ?? d);
    }
    return [...seznam.entries()].map(([id, nazev]) => ({ id, nazev }));
  }, [profily, dodavateleVProduktech]);

  const [dodavatel, setDodavatel] = useState("");
  const [procento, setProcento] = useState(0);
  const [zaokrouhleni, setZaokrouhleni] = useState<Zaokrouhleni>("zadne");
  const [uklada, setUklada] = useState(false);
  const [posledniZmeny, setPosledniZmeny] = useState<ZmenaCeny[] | null>(null);

  useEffect(() => {
    if (!dodavatel && dodavatele[0]) setDodavatel(dodavatele[0].id);
  }, [dodavatel, dodavatele]);

  // Při výběru dodavatele se ukáže jeho uložené pravidlo.
  useEffect(() => {
    const p = pravidla.find((x) => x.dodavatel === dodavatel);
    setProcento(p?.procento ?? 0);
    setZaokrouhleni(p?.zaokrouhleni ?? "zadne");
    setPosledniZmeny(null);
  }, [dodavatel, pravidla]);

  const { data: vzor } = useQuery({
    queryKey: ["vzor-ceny", dodavatel],
    enabled: !!dodavatel,
    queryFn: async () => {
      const { data } = await supabase
        .from("produkty")
        .select("nazev, cena_feed")
        .eq("dodavatel", dodavatel)
        .not("cena_feed", "is", null)
        .order("cena_feed", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const cenaVzoru = vzor?.cena_feed ?? 0;
  const priklad = cenaPodlePravidla(cenaVzoru, { procento, zaokrouhleni });
  const nazevDodavatele = dodavatele.find((d) => d.id === dodavatel)?.nazev ?? "";

  const ulozit = async () => {
    if (!dodavatel) return;
    setUklada(true);
    try {
      const nove: CenovePravidlo = { dodavatel, procento, zaokrouhleni };
      await ulozPravidla([...pravidla.filter((p) => p.dodavatel !== dodavatel), nove]);
      const zmeny = await pouzijPravidlo(nove);
      setPosledniZmeny(zmeny);
      qc.invalidateQueries({ queryKey: ["cenova-pravidla"] });
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nepodařilo se uložit");
    } finally {
      setUklada(false);
    }
  };

  const vratit = async () => {
    if (!posledniZmeny) return;
    try {
      await vratZmeny(posledniZmeny);
      toast.success("Ceny jsou zpátky, jak byly.");
      setPosledniZmeny(null);
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nepodařilo se vrátit");
    }
  };

  return (
    <div className="mx-auto grid max-w-4xl gap-8 text-lg">
      <div>
        <h2 className="section-title text-4xl md:text-5xl">Za kolik chcete zboží prodávat?</h2>
        <p className="mt-2 text-xl text-muted-foreground">
          Nastavíte to jednou větou. Platí to pro všechno zboží od dodavatele, i pro to, které přibude.
        </p>
      </div>

      {dodavatele.length === 0 ? (
        <p className="rounded-xl border bg-card p-6">
          Zatím nemáte žádné zboží od dodavatelů. Nejdřív je stáhněte v Zboží → Stáhnout od dodavatele.
        </p>
      ) : (
        <section className="grid gap-6 rounded-xl border-2 border-primary bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-2xl">
            <span>Zboží od</span>
            <label className="sr-only" htmlFor="dodavatel">
              Dodavatel
            </label>
            <select
              id="dodavatel"
              value={dodavatel}
              onChange={(e) => setDodavatel(e.target.value)}
              className="min-h-14 rounded-lg border-2 bg-background px-4 text-xl font-bold"
            >
              {dodavatele.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nazev}
                </option>
              ))}
            </select>
            <span>prodávám za cenu dodavatele</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {UPRAVY.map((u) => (
              <button key={u.procento} type="button" className={volba(procento === u.procento)} onClick={() => setProcento(u.procento)}>
                {u.text}
              </button>
            ))}
            <label className="inline-flex min-h-14 items-center gap-2 rounded-lg border-2 bg-card px-4 text-xl">
              <span className="font-semibold">jinak:</span>
              <input
                type="number"
                value={procento}
                onChange={(e) => setProcento(Number(e.target.value) || 0)}
                className="w-20 bg-transparent text-xl font-bold outline-none"
                aria-label="Vlastní úprava ceny v procentech"
              />
              %
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-2xl">a cenu</span>
            {ZAOKROUHLENI.map((z) => (
              <button key={z.hodnota} type="button" className={volba(zaokrouhleni === z.hodnota)} onClick={() => setZaokrouhleni(z.hodnota)}>
                {z.text}
              </button>
            ))}
          </div>

          {cenaVzoru > 0 && (
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-accent p-5 text-accent-foreground">
              <span className="text-xl">Příklad:</span>
              <span className="text-2xl">
                dodavatel <b>{formatCena(cenaVzoru)}</b>
              </span>
              <ArrowRight className="h-6 w-6" />
              <span className="text-3xl font-bold">u vás {formatCena(priklad)}</span>
            </div>
          )}

          <div>
            <button
              type="button"
              disabled={uklada}
              onClick={() => void ulozit()}
              className="min-h-14 rounded-lg bg-primary px-8 text-xl font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {uklada ? "Ukládám…" : "Uložit pravidlo"}
            </button>
          </div>

          {posledniZmeny && (
            <div role="status" className="flex flex-wrap items-center gap-4 rounded-lg bg-foreground p-4 text-xl text-background">
              <Check className="h-6 w-6 shrink-0" />
              <span className="flex-[1_1_260px]">
                Uloženo: {nazevDodavatele} {popisPravidla({ procento, zaokrouhleni })}.{" "}
                {posledniZmeny.length
                  ? `Cena se změnila u ${sklonuj(posledniZmeny.length, "produktu", "produktů", "produktů")}.`
                  : "Žádná cena se nemusela měnit."}
              </span>
              {posledniZmeny.length > 0 && (
                <button
                  type="button"
                  onClick={() => void vratit()}
                  className="inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-background px-4 font-bold"
                >
                  <RotateCcw className="h-5 w-5" /> Vrátit zpět
                </button>
              )}
            </div>
          )}

          <p className="text-base text-muted-foreground">
            Zboží, u kterého jste cenu napsali ručně, pravidlo nezmění.
          </p>
        </section>
      )}

      <KontrolaStarehoWebu />

      <JednoKolo />
    </div>
  );
}

/** Rychlá změna ceny jednoho kola — bez otevírání celého formuláře. */
function JednoKolo() {
  const qc = useQueryClient();
  const [hledani, setHledani] = useState("");
  const { data: kola = [] } = useQuery({
    queryKey: ["admin-produkty", "ceny"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produkty")
        .select("id, nazev, cena, puvodni_cena, cena_feed, cena_rucne, dodavatel")
        .order("nazev");
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: pravidla = [] } = useQuery({ queryKey: ["cenova-pravidla"], queryFn: nactiPravidla });

  const nalezena = hledani.trim().length >= 2
    ? kola.filter((k) => k.nazev.toLowerCase().includes(hledani.trim().toLowerCase())).slice(0, 8)
    : [];

  return (
    <section className="grid gap-5 rounded-xl border bg-card p-6 md:p-8">
      <div>
        <h3 className="section-title text-3xl">Cena jednoho produktu</h3>
        <p className="mt-1 text-muted-foreground">
          Když cenu napíšete ručně, má vždycky přednost. Pravidlo ani měsíční přehled ji nepřepíšou.
        </p>
      </div>
      <div className="grid gap-2">
        <label htmlFor="hledat-kolo" className="text-xl font-bold">
          Který produkt?
        </label>
        <input
          id="hledat-kolo"
          value={hledani}
          onChange={(e) => setHledani(e.target.value)}
          placeholder="Napište kus názvu, třeba Argus"
          className="min-h-14 rounded-lg border-2 bg-background px-4 text-xl"
        />
      </div>
      {nalezena.map((k) => (
        <KoloCena
          key={k.id}
          kolo={k}
          podlePravidla={k.cena_feed ? cenaPodlePravidla(k.cena_feed, pravidla.find((p) => p.dodavatel === k.dodavatel)) : 0}
          onUlozeno={() => qc.invalidateQueries({ queryKey: ["admin-produkty"] })}
        />
      ))}
      {hledani.trim().length >= 2 && nalezena.length === 0 && (
        <p className="text-muted-foreground">Nic s takovým názvem jsme nenašli.</p>
      )}
    </section>
  );
}

function KoloCena({
  kolo,
  podlePravidla,
  onUlozeno,
}: {
  kolo: { id: string; nazev: string; cena: number; puvodni_cena: number | null; cena_feed: number | null; cena_rucne: boolean };
  podlePravidla: number;
  onUlozeno: () => void;
}) {
  const [cena, setCena] = useState(String(kolo.puvodni_cena ?? kolo.cena));
  const [akce, setAkce] = useState(kolo.puvodni_cena ? String(kolo.cena) : "");
  const [uklada, setUklada] = useState(false);

  const ulozit = async () => {
    setUklada(true);
    try {
      const zaklad = Number(cena.replace(/\s/g, "")) || 0;
      const akcni = Number(akce.replace(/\s/g, "")) || 0;
      // Akční cena: na webu se prodává za ni a původní je přeškrtnutá.
      const zaznam =
        akcni > 0 && akcni < zaklad
          ? { cena: akcni, puvodni_cena: zaklad, cena_rucne: true }
          : { cena: zaklad, puvodni_cena: null, cena_rucne: true };
      const { error } = await supabase.from("produkty").update(zaznam).eq("id", kolo.id);
      if (error) throw error;
      toast.success("Cena uložena.");
      onUlozeno();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nepodařilo se uložit");
    } finally {
      setUklada(false);
    }
  };

  const zpetNaPravidlo = async () => {
    const { error } = await supabase
      .from("produkty")
      .update({ cena: podlePravidla, puvodni_cena: null, cena_rucne: false })
      .eq("id", kolo.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCena(String(podlePravidla));
    setAkce("");
    toast.success("Produkt se zase řídí pravidlem.");
    onUlozeno();
  };

  return (
    <div className="grid gap-4 rounded-lg bg-surface p-5">
      <div>
        <p className="text-2xl font-bold">{kolo.nazev}</p>
        <p className="text-muted-foreground">
          {kolo.cena_feed ? `Dodavatel: ${formatCena(kolo.cena_feed)}` : "Bez ceny od dodavatele"}
          {podlePravidla > 0 && ` · podle pravidla: ${formatCena(podlePravidla)}`}
          {kolo.cena_rucne && " · cena je napsaná ručně"}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-xl font-bold">Cena na webu</span>
          <span className="flex items-center gap-2">
            <input
              inputMode="numeric"
              value={cena}
              onChange={(e) => setCena(e.target.value)}
              className="min-h-14 min-w-0 flex-1 rounded-lg border-2 bg-background px-4 text-2xl font-bold"
            />
            <span className="text-xl font-bold">Kč</span>
          </span>
        </label>
        <label className="grid gap-2">
          <span className="text-xl font-bold">
            Akční cena <span className="font-normal text-muted-foreground">(nepovinné)</span>
          </span>
          <span className="flex items-center gap-2">
            <input
              inputMode="numeric"
              value={akce}
              onChange={(e) => setAkce(e.target.value)}
              placeholder="nechte prázdné"
              className="min-h-14 min-w-0 flex-1 rounded-lg border-2 bg-background px-4 text-2xl font-bold"
            />
            <span className="text-xl font-bold">Kč</span>
          </span>
          <span className="text-base text-muted-foreground">Na webu bude běžná cena přeškrtnutá.</span>
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={uklada}
          onClick={() => void ulozit()}
          className="min-h-14 rounded-lg bg-primary px-8 text-xl font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          Uložit cenu
        </button>
        {kolo.cena_rucne && podlePravidla > 0 && (
          <button
            type="button"
            onClick={() => void zpetNaPravidlo()}
            className="min-h-14 rounded-lg border-2 px-6 text-xl font-semibold hover:border-primary"
          >
            Řídit se zase pravidlem
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Sedí ceny se starým webem? Obchodník nahraje export ze staré administrace
 * a web ukáže jen kola, kde se cena liší. Převzít jde po jednom nebo všechno.
 */
function KontrolaStarehoWebu() {
  const qc = useQueryClient();
  const stahni = useNactiZOdkazu();
  const [prubeh, setPrubeh] = useState<string | null>(null);
  const [vysledek, setVysledek] = useState<{ rozdily: RozdilCenyStaryWeb[]; sedi: number; nenalezena: number } | null>(
    null,
  );
  const [hotove, setHotove] = useState<Set<string>>(new Set());

  const zkontrolovat = async () => {
    setPrubeh("Čtu starý web…");
    try {
      setVysledek(await porovnejSeStarymWebem(stahni, setPrubeh));
      setHotove(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Starý web se nepodařilo přečíst");
    } finally {
      setPrubeh(null);
    }
  };

  const prevzit = async (r: RozdilCenyStaryWeb[]) => {
    try {
      await prevezmiCenyStarehoWebu(r);
      setHotove((h) => new Set([...h, ...r.map((x) => x.id)]));
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      toast.success(r.length === 1 ? "Cena převzata." : `Převzato ${r.length} cen.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nepodařilo se uložit");
    }
  };

  const zbyva = (vysledek?.rozdily ?? []).filter((r) => !hotove.has(r.id));
  const cena = (c: number, p: number | null) => (p ? `${formatCena(c)} (akce, běžně ${formatCena(p)})` : formatCena(c));

  return (
    <section className="grid gap-5 rounded-xl border-2 border-primary bg-card p-6 md:p-8">
      <div>
        <h3 className="section-title text-3xl">Sedí ceny se starým webem?</h3>
        <p className="mt-1 text-lg text-muted-foreground">
          Klikněte a web si sám projde starý web cursorbike.cz — i s akčními cenami — a ukáže jen kola, kde se cena
          liší. Nic se nezmění samo.
        </p>
      </div>
      <button
        type="button"
        disabled={!!prubeh}
        onClick={() => void zkontrolovat()}
        className="inline-flex min-h-14 w-fit items-center gap-3 rounded-lg bg-primary px-7 text-xl font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        <RefreshCw className={`h-6 w-6 ${prubeh ? "animate-spin" : ""}`} />
        {prubeh ?? "Zkontrolovat ceny"}
      </button>

      {vysledek && (
        <div className="grid gap-3">
          <p className="rounded-lg bg-accent p-4 text-xl text-accent-foreground">
            {vysledek.sedi > 0 && <>U {sklonuj(vysledek.sedi, "kola", "kol", "kol")} cena sedí ✓ </>}
            {zbyva.length > 0 ? <>· U {sklonuj(zbyva.length, "kola", "kol", "kol")} se liší.</> : <>· Všechno sedí.</>}
          </p>
          {zbyva.length > 1 && (
            <button
              type="button"
              onClick={() => void prevzit(zbyva)}
              className="min-h-14 w-fit rounded-lg border-2 border-primary px-6 text-xl font-bold text-primary hover:bg-primary/5"
            >
              Převzít všechny ceny ze starého webu ({zbyva.length})
            </button>
          )}
          {zbyva.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-xl border-2 p-4">
              <p className="min-w-0 flex-[1_1_260px] text-xl font-bold">{r.nazev}</p>
              <div className="grid text-lg">
                <span>
                  Starý web: <b>{cena(r.staryCena, r.staryPuvodni)}</b>
                </span>
                <span className="text-muted-foreground">Nový web: {cena(r.novyCena, r.novyPuvodni)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void prevzit([r])}
                  className="min-h-12 rounded-lg bg-primary px-5 text-lg font-bold text-primary-foreground"
                >
                  Převzít ze starého webu
                </button>
                <button
                  type="button"
                  onClick={() => setHotove((h) => new Set([...h, r.id]))}
                  className="min-h-12 rounded-lg border-2 px-5 text-lg font-semibold"
                >
                  Nechat novou
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <details className="text-base">
        <summary className="cursor-pointer text-muted-foreground">Starý web se nedaří přečíst? Nahrát export ručně</summary>
        <div className="mt-4">
          <PorovnaniZExportu />
        </div>
      </details>
    </section>
  );
}

function PorovnaniZExportu() {
  const qc = useQueryClient();
  const [vysledek, setVysledek] = useState<VysledekPorovnani | null>(null);
  const [pracuje, setPracuje] = useState(false);
  const [prevzato, setPrevzato] = useState<Set<string>>(new Set());

  const nahrat = async (soubory: File[]) => {
    if (!soubory.length) return;
    setPracuje(true);
    try {
      const texty = await Promise.all(soubory.map(async (f) => dekoduj(await f.arrayBuffer())));
      setVysledek(await porovnejCeny(texty));
      setPrevzato(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Soubor se nepodařilo přečíst");
    } finally {
      setPracuje(false);
    }
  };

  const prevzit = async (rozdily: RozdilCeny[]) => {
    try {
      await prevezmiCeny(rozdily);
      setPrevzato((p) => new Set([...p, ...rozdily.map((r) => r.id)]));
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      toast.success(rozdily.length === 1 ? "Cena převzata." : `Převzato ${rozdily.length} cen.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nepodařilo se uložit");
    }
  };

  const zbyva = (vysledek?.rozdily ?? []).filter((r) => !prevzato.has(r.id));

  return (
    <section className="grid gap-5">

      <ol className="grid gap-2 text-lg">
        {[
          "Přihlaste se do administrace starého webu.",
          "Klikněte na Katalog a potom na Produkty.",
          "Nahoře u Filtrovat podle kategorií vyberte Jízdní kola (pak zvlášť Elektrokola).",
          "Nad seznamem produktů klikněte na Export. Uloží se soubor .csv.",
          "Soubor (nebo víc souborů najednou) nahrajte tlačítkem níž.",
        ].map((k, i) => (
          <li key={k} className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
              {i + 1}
            </span>
            <span className="pt-0.5">{k}</span>
          </li>
        ))}
      </ol>

      <label className="inline-flex min-h-14 w-fit cursor-pointer items-center gap-3 rounded-lg bg-primary px-7 text-xl font-bold text-primary-foreground hover:bg-primary/90">
        <Upload className="h-6 w-6" />
        {pracuje ? "Porovnávám…" : "Nahrát export ze starého webu"}
        <input
          type="file"
          accept=".csv"
          multiple
          className="hidden"
          onChange={(e) => {
            void nahrat(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </label>

      {vysledek && (
        <div className="grid gap-3">
          <p className="rounded-lg bg-accent p-4 text-xl text-accent-foreground">
            {vysledek.sedi > 0 && <>U {sklonuj(vysledek.sedi, "kola", "kol", "kol")} cena sedí ✓ </>}
            {zbyva.length > 0
              ? <>· U {sklonuj(zbyva.length, "kola", "kol", "kol")} se liší.</>
              : vysledek.rozdily.length > 0
                ? <>· Všechny rozdíly jsou vyřešené.</>
                : <>· Všechno sedí.</>}
          </p>

          {zbyva.length > 1 && (
            <button
              type="button"
              onClick={() => void prevzit(zbyva)}
              className="min-h-14 w-fit rounded-lg border-2 border-primary px-6 text-xl font-bold text-primary hover:bg-primary/5"
            >
              Převzít všechny ceny ze starého webu ({zbyva.length})
            </button>
          )}

          {zbyva.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-xl border-2 p-4">
              <p className="min-w-0 flex-[1_1_260px] text-xl font-bold">{r.nazev}</p>
              <div className="grid text-lg">
                <span>
                  Starý web: <b>{formatCena(r.naStaremWebu)}</b>
                </span>
                <span className="text-muted-foreground">Nový web: {formatCena(r.naNovemWebu)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void prevzit([r])}
                  className="min-h-12 rounded-lg bg-primary px-5 text-lg font-bold text-primary-foreground"
                >
                  Převzít ze starého webu
                </button>
                <button
                  type="button"
                  onClick={() => setPrevzato((p) => new Set([...p, r.id]))}
                  className="min-h-12 rounded-lg border-2 px-5 text-lg font-semibold"
                >
                  Nechat novou
                </button>
              </div>
            </div>
          ))}

          {vysledek.nenalezena.length > 0 && (
            <details className="rounded-lg bg-surface p-4">
              <summary className="cursor-pointer text-lg">
                {sklonuj(vysledek.nenalezena.length, "kolo ze starého webu", "kola ze starého webu", "kol ze starého webu")} na novém
                webu nemáme — ukázat
              </summary>
              <ul className="mt-2 grid gap-1">
                {vysledek.nenalezena.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
