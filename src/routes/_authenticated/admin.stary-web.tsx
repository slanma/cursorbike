import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Download } from "lucide-react";
import { useNactiZOdkazu } from "@/components/admin/NovyDodavatel";
import { stahniFotky } from "@/lib/fotky.functions";
import { sklonuj } from "@/lib/cestina";
import {
  pripravPrevzeti,
  provedPrevzeti,
  skryjNavic,
  type CoPrevzit,
  type PlanPrevzeti,
} from "@/lib/prevzeti-stareho-webu";

export const Route = createFileRoute("/_authenticated/admin/stary-web")({
  component: PrevzetiStarehoWebu,
});

const zaskrt = "h-7 w-7 shrink-0 accent-[var(--primary)]";

/**
 * Převzít starý web — průvodce na jednu stránku.
 * 1) web si starý web přečte, 2) obchodník odškrtne, co převzít, 3) hotovo.
 * Potom stačí stáhnout feedy od dodavatelů a kola se sama propojí.
 */
function PrevzetiStarehoWebu() {
  const qc = useQueryClient();
  const stahni = useNactiZOdkazu();
  const ulozFotky = useServerFn(stahniFotky);
  const [plan, setPlan] = useState<PlanPrevzeti | null>(null);
  const [prubeh, setPrubeh] = useState<string | null>(null);
  const [co, setCo] = useState<CoPrevzit>({ ceny: true, popisy: true, fotky: true, nova: true });
  const [skryt, setSkryt] = useState(true);
  const [hotovo, setHotovo] = useState<{ ceny: number; popisy: number; fotky: number; nova: number; skryto: number } | null>(
    null,
  );

  const nacist = async () => {
    setPrubeh("Čtu starý web…");
    try {
      setPlan(await pripravPrevzeti(stahni, setPrubeh));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Starý web se nepodařilo přečíst");
    } finally {
      setPrubeh(null);
    }
  };

  const prevzit = async () => {
    if (!plan) return;
    setPrubeh("Přebírám…");
    try {
      const v = await provedPrevzeti(plan, co, setPrubeh);
      // Fotky hned k nám — starý web po přepnutí domény zmizí i s nimi.
      if (co.fotky && v.idsFotek.length) {
        for (let i = 0; i < v.idsFotek.length; i += 20) {
          setPrubeh(`Ukládám fotky k nám… ${Math.min(i + 20, v.idsFotek.length)} z ${v.idsFotek.length}`);
          try {
            await ulozFotky({ data: { ids: v.idsFotek.slice(i, i + 20) } });
          } catch {
            /* fotky jde uložit i později tlačítkem v Zboží */
          }
        }
      }
      let skryto = 0;
      if (skryt && plan.navic.length) {
        await skryjNavic(plan.navic.map((n) => n.id));
        skryto = plan.navic.length;
      }
      setHotovo({ ceny: v.ceny, popisy: v.popisy, fotky: v.fotky, nova: v.nova, skryto });
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      qc.invalidateQueries({ queryKey: ["admin-dnes"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Převzetí se nepodařilo");
    } finally {
      setPrubeh(null);
    }
  };

  if (hotovo) {
    return (
      <div className="mx-auto grid max-w-3xl gap-6 text-lg">
        <section className="grid justify-items-center gap-4 rounded-xl border-2 border-primary bg-card p-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Check className="h-11 w-11" />
          </div>
          <h2 className="section-title text-4xl">Starý web je převzatý</h2>
          <ul className="grid gap-1 text-xl">
            <li>Nová cena nebo akce u {sklonuj(hotovo.ceny, "kola", "kol", "kol")}</li>
            <li>Doplněný popis u {sklonuj(hotovo.popisy, "kola", "kol", "kol")}</li>
            <li>Víc fotek u {sklonuj(hotovo.fotky, "kola", "kol", "kol")}</li>
            <li>Přibylo {sklonuj(hotovo.nova, "kolo", "kola", "kol")}, které na novém webu chybělo</li>
            {hotovo.skryto > 0 && <li>Skryto {sklonuj(hotovo.skryto, "kolo", "kola", "kol")}, které už na starém webu není</li>}
          </ul>
        </section>
        <section className="grid gap-3 rounded-xl border bg-card p-6">
          <p className="text-2xl font-bold">Další krok: propojit s dodavateli</p>
          <p>
            Stáhněte nabídku od dodavatelů. Kola, která už máte, se s nimi samy propojí — zůstanou vaše ceny, fotky i
            popisy a od té doby se u nich bude hlídat sklad a nabídka.
          </p>
          <Link
            to="/admin/feedy"
            className="inline-flex min-h-14 w-fit items-center gap-3 rounded-lg bg-primary px-7 text-xl font-bold text-primary-foreground"
          >
            <Download className="h-6 w-6" /> Stáhnout od dodavatele
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6 text-lg">
      <div>
        <h2 className="section-title text-4xl md:text-5xl">Převzít starý web</h2>
        <p className="mt-2 text-xl text-muted-foreground">
          Než přepneme doménu, vezmeme ze starého webu všechno: ceny i akce, popisy, všechny fotky a kola, která
          přibyla. Pak stáhnete feedy od dodavatelů a kola se s nimi propojí.
        </p>
      </div>

      {!plan && (
        <section className="grid gap-4 rounded-xl border-2 border-primary bg-card p-6">
          <p className="text-xl font-bold">Krok 1 ze 2: Přečíst starý web</p>
          <p className="text-muted-foreground">
            Trvá to pár minut — web otevře každé kolo na starém webu. Nechte stránku otevřenou. Zatím se nic nemění.
          </p>
          <button
            type="button"
            disabled={!!prubeh}
            onClick={() => void nacist()}
            className="min-h-14 w-fit rounded-lg bg-primary px-8 text-xl font-bold text-primary-foreground disabled:opacity-60"
          >
            {prubeh ?? "Přečíst starý web"}
          </button>
        </section>
      )}

      {plan && (
        <section className="grid gap-4 rounded-xl border-2 border-primary bg-card p-6">
          <p className="text-xl font-bold">Krok 2 ze 2: Co převzít?</p>
          <p className="rounded-lg bg-accent p-4 text-accent-foreground">
            Na starém webu jsme našli <b>{sklonuj(plan.kola.length, "kolo", "kola", "kol")}</b>.{" "}
            {plan.sparovana.size} už na novém webu máte
            {plan.nova.length > 0 && <>, {sklonuj(plan.nova.length, "je nové", "jsou nová", "je nových")}</>}.
          </p>
          {(
            [
              ["ceny", "Ceny a akce", "Ceny budou přesně jako na starém webu, i s přeškrtnutou běžnou cenou."],
              ["popisy", "Popisy", "Doplní se tam, kde chybí. Co už máte, se nepřepíše."],
              ["fotky", "Všechny fotky", "A hned je uložíme k nám — starý web po přepnutí zmizí i s fotkami."],
              ["nova", `Nová kola (${plan.nova.length})`, "Kola, která na starém webu přibyla. Budou rovnou na webu."],
            ] as const
          ).map(([klic, nazev, popis]) => (
            <label
              key={klic}
              className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 ${co[klic] ? "border-primary bg-accent" : ""}`}
            >
              <input type="checkbox" className={zaskrt} checked={co[klic]} onChange={() => setCo({ ...co, [klic]: !co[klic] })} />
              <span>
                <span className="block text-xl font-bold">{nazev}</span>
                <span className="text-muted-foreground">{popis}</span>
              </span>
            </label>
          ))}
          {plan.navic.length > 0 && (
            <label className={`flex cursor-pointer items-start gap-4 rounded-lg border-2 p-4 ${skryt ? "border-primary bg-accent" : ""}`}>
              <input type="checkbox" className={zaskrt} checked={skryt} onChange={() => setSkryt(!skryt)} />
              <span>
                <span className="block text-xl font-bold">
                  Skrýt {sklonuj(plan.navic.length, "kolo", "kola", "kol")}, které na starém webu už není
                </span>
                <span className="text-muted-foreground">Nejspíš se prodala. Nesmažou se, jen se schovají.</span>
                <details className="mt-1">
                  <summary className="cursor-pointer text-base">Ukázat která</summary>
                  <ul className="mt-1 text-base">
                    {plan.navic.map((n) => (
                      <li key={n.id}>{n.nazev}</li>
                    ))}
                  </ul>
                </details>
              </span>
            </label>
          )}
          <button
            type="button"
            disabled={!!prubeh}
            onClick={() => void prevzit()}
            className="min-h-16 rounded-lg bg-primary px-8 text-2xl font-bold text-primary-foreground disabled:opacity-60"
          >
            {prubeh ?? "Převzít"}
          </button>
        </section>
      )}
    </div>
  );
}
