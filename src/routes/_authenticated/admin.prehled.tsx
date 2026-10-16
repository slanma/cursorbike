import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Bike, Check, RefreshCw } from "lucide-react";
import { nactiProfily } from "@/lib/eshop";
import { formatCena } from "@/lib/produkty";
import { nazevProWeb } from "@/lib/feed-import";
import { useNactiZOdkazu } from "@/components/admin/NovyDodavatel";
import { nactiPosledniPrehled, pripravPrehled, ulozPrehled, type MesicniPrehled } from "@/lib/mesicni-prehled";
import { sklonuj } from "@/lib/cestina";

export const Route = createFileRoute("/_authenticated/admin/prehled")({
  component: MesicniPrehledStranka,
});

type Volba = "ano" | "ne";

const tlacitko = (zapnuto: boolean) =>
  `min-h-14 rounded-lg border-2 px-5 text-xl font-bold transition-colors ${
    zapnuto ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"
  }`;

/**
 * Měsíční přehled od dodavatelů — tři otázky, vždycky jen jedna na obrazovce.
 */
function MesicniPrehledStranka() {
  const qc = useQueryClient();
  const stahni = useNactiZOdkazu();
  const { data: profily = [] } = useQuery({ queryKey: ["feed-profily"], queryFn: nactiProfily });
  const { data: posledni } = useQuery({ queryKey: ["posledni-prehled"], queryFn: nactiPosledniPrehled });

  const [prehled, setPrehled] = useState<MesicniPrehled | null>(null);
  const [prubeh, setPrubeh] = useState<string | null>(null);
  const [krok, setKrok] = useState(1);
  const [volby, setVolby] = useState<Record<string, Volba>>({});
  const [vysledek, setVysledek] = useState<{ pridano: number; skryto: number; cen: number } | null>(null);

  const sOdkazem = profily.filter((p) => p.url);

  const zacit = async () => {
    setPrubeh("Připravujeme přehled…");
    try {
      const p = await pripravPrehled(stahni, setPrubeh);
      setPrehled(p);
      setVolby({});
      // Prázdné otázky přeskočíme, ať se neodklikávají zbytečně.
      setKrok(p.nova.length ? 1 : p.zmizela.length ? 2 : p.ceny.length ? 3 : 4);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Přehled se nepodařilo připravit");
    } finally {
      setPrubeh(null);
    }
  };

  const volba = (klic: string, vychozi: Volba = "ano") => volby[klic] ?? vychozi;
  const nastav = (klic: string, v: Volba) => setVolby((x) => ({ ...x, [klic]: v }));
  /** Kolo, které už na webu máte, se ve výchozím stavu nepřidává — ať nevznikne dvakrát. */
  const volbaNoveho = (n: { klic: string; uzNaWebu?: string }) => volba(n.klic, n.uzNaWebu ? "ne" : "ano");

  const dalsi = () => {
    if (!prehled) return;
    let k = krok + 1;
    if (k === 2 && !prehled.zmizela.length) k = 3;
    if (k === 3 && !prehled.ceny.length) k = 4;
    setKrok(k);
  };
  const zpet = () => {
    if (!prehled) return;
    let k = krok - 1;
    if (k === 3 && !prehled.ceny.length) k = 2;
    if (k === 2 && !prehled.zmizela.length) k = 1;
    if (k === 1 && !prehled.nova.length) k = krok;
    setKrok(Math.max(1, k));
  };

  const ulozit = async () => {
    if (!prehled) return;
    setPrubeh("Ukládáme…");
    try {
      const v = await ulozPrehled(
        prehled,
        {
          pridat: new Set(prehled.nova.filter((n) => volbaNoveho(n) === "ano").map((n) => n.klic)),
          skryt: new Set(prehled.zmizela.filter((z) => volba(`z:${z.id}`) === "ano").map((z) => z.id)),
          prevzitCenu: new Set(prehled.ceny.filter((c) => volba(`c:${c.id}`) === "ano").map((c) => c.id)),
        },
        setPrubeh,
      );
      setVysledek(v);
      setKrok(5);
      qc.invalidateQueries({ queryKey: ["admin-dnes"] });
      qc.invalidateQueries({ queryKey: ["posledni-prehled"] });
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Nepodařilo se uložit");
    } finally {
      setPrubeh(null);
    }
  };

  // ÚVOD
  if (!prehled) {
    return (
      <div className="mx-auto grid max-w-3xl gap-6 text-lg">
        <div>
          <h2 className="section-title text-4xl md:text-5xl">Měsíční přehled od dodavatelů</h2>
          <p className="mt-2 text-xl text-muted-foreground">
            Stáhneme nabídky dodavatelů a zeptáme se vás na tři věci: nové zboží, zboží, které už nemají, a změny cen.
            Zabere to pár minut.
          </p>
        </div>
        {sOdkazem.length === 0 ? (
          <div className="rounded-xl border bg-card p-6">
            <p className="text-xl">Zatím nemáte žádného dodavatele s odkazem na feed.</p>
            <Link to="/admin/feedy" className="mt-4 inline-flex min-h-14 items-center rounded-lg bg-primary px-7 text-xl font-bold text-primary-foreground">
              Přidat dodavatele
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 rounded-xl border-2 border-primary bg-card p-6">
            <p className="text-xl">
              Podíváme se k: <b>{sOdkazem.map((p) => p.nazev).join(", ")}</b>
            </p>
            {posledni && (
              <p className="text-muted-foreground">Naposledy jste přehled dělali {new Date(posledni).toLocaleDateString("cs-CZ")}.</p>
            )}
            <div>
              <button
                type="button"
                disabled={!!prubeh}
                onClick={() => void zacit()}
                className="inline-flex min-h-14 items-center gap-3 rounded-lg bg-primary px-8 text-xl font-bold text-primary-foreground disabled:opacity-60"
              >
                <RefreshCw className={`h-6 w-6 ${prubeh ? "animate-spin" : ""}`} />
                {prubeh ?? "Začít přehled"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const otazky = ["Nové zboží", "Co dodavatel už nemá", "Změny cen"];

  return (
    <div className="mx-auto grid max-w-3xl gap-6 text-lg">
      {krok <= 4 && (
        <ol aria-label="Postup" className="grid grid-cols-3 gap-2">
          {otazky.map((o, i) => {
            const c = i + 1;
            const styl =
              c === krok
                ? "bg-primary text-primary-foreground"
                : c < krok || krok === 4
                  ? "bg-accent text-accent-foreground"
                  : "border bg-card text-muted-foreground";
            return (
              <li key={o} className={`rounded-lg p-3 ${styl}`}>
                <span className="block text-sm font-semibold">Otázka {c} ze 3</span>
                <span className="block font-bold leading-tight">{o}</span>
              </li>
            );
          })}
        </ol>
      )}

      {prehled.chyby.length > 0 && krok <= 4 && (
        <p className="rounded-lg bg-amber-50 p-4 text-amber-950">
          Nepodařilo se stáhnout: {prehled.chyby.map((c) => c.dodavatel).join(", ")}. Zkusíme to příště, ostatní jde normálně.
        </p>
      )}

      {krok === 1 && (
        <section className="grid gap-4">
          <div>
            <h2 className="section-title text-4xl">
              Dodavatelé mají {sklonuj(prehled.nova.length, "nový produkt", "nové produkty", "nových produktů")}. Chcete je na web?
            </h2>
            <p className="mt-1 text-xl text-muted-foreground">Přidané zboží bude nejdřív skryté. Zveřejníte ho, až ho zkontrolujete.</p>
          </div>
          {prehled.nova.map((n) => (
            <div key={n.klic} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
              <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                {n.radek.produkt.obrazky[0] ? (
                  <img src={n.radek.produkt.obrazky[0]} alt="" loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <Bike className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-[1_1_240px]">
                <p className="text-xl font-bold">{nazevProWeb(n.radek.produkt)}</p>
                <p className="text-muted-foreground">
                  {n.dodavatel}
                  {n.radek.produkt.varianty.some((v) => v.velikost) &&
                    ` · ${n.radek.produkt.varianty.map((v) => v.velikost).filter(Boolean).join(", ")}`}
                  {` · ${formatCena(n.cenaNaWebu)}`}
                </p>
                {n.uzNaWebu && (
                  <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-base text-amber-950">
                    Podobný produkt už na webu máte: {n.uzNaWebu}. Proto je nastaveno Nechci, ať ho nemáte dvakrát.
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" className={tlacitko(volbaNoveho(n) === "ano")} onClick={() => nastav(n.klic, "ano")}>
                  Přidat
                </button>
                <button type="button" className={tlacitko(volbaNoveho(n) === "ne")} onClick={() => nastav(n.klic, "ne")}>
                  Nechci
                </button>
              </div>
            </div>
          ))}
          {prehled.novaBezKategorie > 0 && (
            <p className="rounded-lg bg-surface p-4">
              Dalších {prehled.novaBezKategorie} kusů je z kategorií, které jste zatím nepřiřadili (třeba díly). Ty tu
              neukazujeme. Když je chcete, zaškrtněte je u dodavatele v Zboží → Stáhnout od dodavatele → Upravit.
            </p>
          )}
        </section>
      )}

      {krok === 2 && (
        <section className="grid gap-4">
          <div>
            <h2 className="section-title text-4xl">
              {sklonuj(prehled.zmizela.length, "produkt už dodavatel nemá", "produkty už dodavatel nemá", "produktů už dodavatel nemá")}. Skrýt z webu?
            </h2>
            <p className="mt-1 text-xl text-muted-foreground">
              Jestli ho máte v prodejně, nechte ho na webu. Jinak je skryjte, ať si je nikdo neobjedná.
            </p>
          </div>
          {prehled.zmizela.map((z) => {
            const k = `z:${z.id}`;
            return (
              <div key={z.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
                <div className="min-w-0 flex-[1_1_240px]">
                  <p className="text-xl font-bold">{z.nazev}</p>
                  <p className="text-muted-foreground">{z.dodavatel}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={tlacitko(volba(k) === "ano")} onClick={() => nastav(k, "ano")}>
                    Skrýt
                  </button>
                  <button type="button" className={tlacitko(volba(k) === "ne")} onClick={() => nastav(k, "ne")}>
                    Mám ho v prodejně
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {krok === 3 && (
        <section className="grid gap-4">
          <div>
            <h2 className="section-title text-4xl">
              U {sklonuj(prehled.ceny.length, "produktu", "produktů", "produktů")} se změnila cena. Převzít nové ceny?
            </h2>
            <p className="mt-1 text-xl text-muted-foreground">
              Vlevo je cena, kterou máte teď na webu. Vpravo nová podle vašeho pravidla v Cenách.
            </p>
          </div>
          {prehled.ceny.map((c) => {
            const k = `c:${c.id}`;
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
                <p className="min-w-0 flex-[1_1_240px] text-xl font-bold">{c.nazev}</p>
                <p className="flex items-center gap-3 text-xl">
                  <span className="text-muted-foreground">{formatCena(c.cenaTed)}</span>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <span className="font-bold">{formatCena(c.cenaNova)}</span>
                </p>
                <div className="flex gap-2">
                  <button type="button" className={tlacitko(volba(k) === "ano")} onClick={() => nastav(k, "ano")}>
                    Převzít
                  </button>
                  <button type="button" className={tlacitko(volba(k) === "ne")} onClick={() => nastav(k, "ne")}>
                    Nechat
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {krok === 4 && (
        <section className="grid gap-3 rounded-xl border-2 border-primary bg-card p-6">
          <h2 className="section-title text-4xl">Shrnutí</h2>
          <ul className="grid gap-1 text-xl">
            <li>Přidá se {sklonuj(prehled.nova.filter((n) => volbaNoveho(n) === "ano").length, "nový produkt", "nové produkty", "nových produktů")} (skryté ke kontrole).</li>
            <li>Skryje se {sklonuj(prehled.zmizela.filter((z) => volba(`z:${z.id}`) === "ano").length, "produkt", "produkty", "produktů")}.</li>
            <li>Nová cena u {sklonuj(prehled.ceny.filter((c) => volba(`c:${c.id}`) === "ano").length, "produktu", "produktů", "produktů")}.</li>
            <li>U ostatního zboží se doplní sklad a čárové kódy.</li>
          </ul>
        </section>
      )}

      {krok === 5 && vysledek && (
        <section className="grid justify-items-center gap-4 rounded-xl border-2 border-primary bg-card p-10 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Check className="h-11 w-11" />
          </div>
          <h2 className="section-title text-4xl">Hotovo, máte klid do dalšího měsíce</h2>
          <p className="text-xl text-muted-foreground">
            Přidáno {sklonuj(vysledek.pridano, "produkt", "produkty", "produktů")}, skryto {vysledek.skryto}, nová cena u {vysledek.cen}.
            {vysledek.pridano > 0 && " Nové zboží najdete v Zboží jako skryté."}
          </p>
          <Link to="/admin" className="inline-flex min-h-14 items-center rounded-lg bg-primary px-8 text-xl font-bold text-primary-foreground">
            Zpět na Dnes
          </Link>
        </section>
      )}

      {krok <= 4 && (
        <div className="flex flex-wrap justify-between gap-3 border-t pt-4">
          <button type="button" onClick={zpet} disabled={!!prubeh} className="min-h-14 rounded-lg border-2 px-7 text-xl font-bold">
            Zpět
          </button>
          {krok < 4 ? (
            <button type="button" onClick={dalsi} className="min-h-14 rounded-lg bg-primary px-8 text-xl font-bold text-primary-foreground">
              Další
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void ulozit()}
              disabled={!!prubeh}
              className="min-h-14 rounded-lg bg-primary px-8 text-xl font-bold text-primary-foreground disabled:opacity-60"
            >
              {prubeh ?? "Uložit a dokončit"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
