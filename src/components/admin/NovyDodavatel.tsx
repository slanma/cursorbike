import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Link2, Upload } from "lucide-react";
import type { FeedVysledek } from "@/lib/feed";
import { KdeNajduFeed } from "@/components/admin/KdeNajduFeed";
import { shrnSkupiny, vychoziVyber, vyfiltruj } from "@/lib/vyber-zbozi";
import { cenaPodlePravidla, type Zaokrouhleni } from "@/lib/ceny";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCena } from "@/lib/produkty";
import { cenaProduktu } from "@/lib/feed-import";
import { rozbalStazeny, stahniFeed } from "@/lib/feed-stahni.functions";
import {
  CILOVA_POLE,
  chybiPovinne,
  dekoduj,
  idDodavatele,
  nactiZdroj,
  navrhniProfil,
  sestavProdukty,
  type CilovePole,
  type ProfilDodavatele,
  type ZdrojFeedu,
  VELIKOST_Z_NAZVU,
  zkusZnamyFormat,
} from "@/lib/feed-univerzalni";

const VYBER = "h-10 w-full rounded-md border bg-background px-3 text-sm";

const DRUHY = [
  { druh: "elektrokola", nazev: "Elektrokola" },
  { druh: "kola", nazev: "Kola" },
  { druh: "ostatni", nazev: "Díly, doplňky a ostatní" },
] as const;

/** Stáhne feed z odkazu přes server a vrátí text ve správném kódování. */
export function useNactiZOdkazu() {
  const stahni = useServerFn(stahniFeed);
  return async (url: string) => {
    const { gzipBase64 } = await stahni({ data: { url } });
    return dekoduj(await rozbalStazeny(gzipBase64));
  };
}

const kratce = (s: string, max = 70) => (s.length > max ? `${s.slice(0, max)}…` : s);

/**
 * Přidání nového dodavatele (nebo úprava stávajícího).
 *
 * 1. Obsluha vloží odkaz nebo nahraje soubor.
 * 2. Program sám navrhne, které pole je název, cena, fotka… a ukáže ukázku.
 * 3. Obsluha jen zkontroluje, případně přehodí, a uloží.
 */
export function NovyDodavatel({
  puvodni,
  pocatecniText,
  pocatecniNazev,
  onUlozit,
  onZrusit,
}: {
  puvodni?: ProfilDodavatele | undefined;
  pocatecniText?: string | undefined;
  pocatecniNazev?: string | undefined;
  /** pravidlo = null znamená „ceny nastavím později". */
  onUlozit: (
    profil: ProfilDodavatele,
    vysledek: FeedVysledek,
    pravidlo: { procento: number; zaokrouhleni: Zaokrouhleni } | null,
  ) => void | Promise<void>;
  onZrusit: () => void;
}) {
  const nactiZOdkazu = useNactiZOdkazu();
  const [nazev, setNazev] = useState(puvodni?.nazev ?? pocatecniNazev ?? "");
  const [url, setUrl] = useState(puvodni?.url ?? "");
  const [znamy, setZnamy] = useState<FeedVysledek | null>(null);
  const [zdroj, setZdroj] = useState<ZdrojFeedu | null>(() => {
    if (!pocatecniText) return null;
    try {
      return nactiZdroj(pocatecniText);
    } catch {
      return null;
    }
  });
  const [text, setText] = useState(pocatecniText ?? "");
  const [profil, setProfil] = useState<ProfilDodavatele | null>(() =>
    zdroj ? (puvodni ?? navrhniProfil(pocatecniNazev ?? "", zdroj)) : null,
  );
  const [nacita, setNacita] = useState(false);
  const [pokrocile, setPokrocile] = useState(false);

  const prijmiText = (t: string, odkaz?: string) => {
    // Feed, pro který máme hotovou čtečku (Author, Crussis…), se nemusí nastavovat.
    const hotovy = zkusZnamyFormat(nazev || "feed", t);
    if (hotovy) {
      setText(t);
      setZnamy(hotovy);
      setZdroj(null);
      setProfil({
        id: hotovy.dodavatel,
        nazev: nazev.trim(),
        ...(odkaz ? { url: odkaz } : puvodni?.url ? { url: puvodni.url } : {}),
        pole: {},
        cenyBezDph: false,
        upravaCeny: 0,
        sklad: "kusy",
        znamyFormat: true,
        upraveno: new Date().toISOString(),
      });
      return;
    }
    setZnamy(null);
    const z = nactiZdroj(t, puvodni?.prvek);
    if (!z.polozky.length) throw new Error("Ve feedu jsme nenašli žádné produkty.");
    setText(t);
    setZdroj(z);
    // U úpravy se nechá to, co už bylo nastavené; jinak program navrhne sám.
    setProfil(puvodni ? { ...puvodni, ...(odkaz ? { url: odkaz } : {}) } : navrhniProfil(nazev, z, odkaz));
  };

  const nactiOdkaz = async () => {
    if (!url.trim()) {
      toast.error("Vložte odkaz na feed");
      return;
    }
    setNacita(true);
    try {
      prijmiText(await nactiZOdkazu(url.trim()), url.trim());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Feed se nepodařilo načíst");
    } finally {
      setNacita(false);
    }
  };

  const nactiSoubor = async (soubor: File) => {
    setNacita(true);
    try {
      if (!nazev.trim()) setNazev(soubor.name.replace(/\.[^.]+$/, ""));
      prijmiText(dekoduj(await soubor.arrayBuffer()));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Soubor se nepodařilo přečíst");
    } finally {
      setNacita(false);
    }
  };

  const zmenPrvek = (prvek: string) => {
    const z = nactiZdroj(text, prvek);
    setZdroj(z);
    setProfil(navrhniProfil(nazev, z, url || undefined));
  };

  /** Všechno, co ve feedu je — i díly a merch. */
  const vse = useMemo(() => {
    if (znamy) return znamy;
    if (!zdroj || !profil) return null;
    try {
      return sestavProdukty(zdroj, { ...profil, id: idDodavatele(nazev || "nahled") });
    } catch {
      return null;
    }
  }, [zdroj, profil, nazev, znamy]);

  const skupiny = useMemo(() => (vse ? shrnSkupiny(vse.produkty) : []), [vse]);
  const [brat, setBrat] = useState<string[] | null>(puvodni?.brat ?? null);
  // Při prvním načtení se zaškrtnou kola a elektrokola, ostatní ne.
  useEffect(() => {
    if (brat === null && skupiny.length) setBrat(vychoziVyber(skupiny));
  }, [brat, skupiny]);

  /** Jen to, co obchodník chce brát. */
  const nahled = useMemo(() => (vse ? vyfiltruj(vse, brat ?? undefined) : null), [vse, brat]);
  // Za kolik prodávat — nastaví se rovnou tady, ať se kola stáhnou už s cenou.
  const [procento, setProcento] = useState<number | null>(0);
  const [na990, setNa990] = useState(true);
  const [vlastni, setVlastni] = useState("");
  const [ukladam, setUkladam] = useState(false);
  const cenaPrikladu = nahled?.produkty.flatMap((p) => p.varianty.map((v) => v.cena)).find((c) => c > 0) ?? 0;

  const nastavDruh = (klice: string[], zapnout: boolean) =>
    setBrat((b) => {
      const bez = (b ?? []).filter((x) => !klice.includes(x));
      return zapnout ? [...bez, ...klice] : bez;
    });
  const prepniSkupinu = (klic: string) =>
    setBrat((b) => {
      const ted = b ?? [];
      return ted.includes(klic) ? ted.filter((x) => x !== klic) : [...ted, klic];
    });

  const nastavPole = (pole: CilovePole, klic: string) =>
    setProfil((p) => (p ? { ...p, pole: { ...p.pole, [pole]: klic || undefined } } : p));

  const ulozit = async () => {
    if (!profil || !nahled || (!zdroj && !znamy)) return;
    if (!nazev.trim()) {
      toast.error("Napište, jak se dodavatel jmenuje");
      return;
    }
    if (brat && brat.length === 0) {
      toast.error("Zaškrtněte aspoň jednu skupinu zboží, kterou chcete brát");
      return;
    }
    const chybi = chybiPovinne(profil);
    if (chybi.length) {
      toast.error(`Ještě vyberte: ${chybi.join(", ")}`);
      return;
    }
    const finalni: ProfilDodavatele = {
      ...profil,
      id: znamy ? znamy.dodavatel : (puvodni?.id ?? idDodavatele(nazev)),
      nazev: nazev.trim(),
      ...(url.trim() ? { url: url.trim() } : {}),
      ...(zdroj?.prvek ? { prvek: zdroj.prvek } : {}),
      ...(brat ? { brat } : {}),
      upraveno: new Date().toISOString(),
    };
    setUkladam(true);
    try {
      await onUlozit(
        finalni,
        vyfiltruj(znamy ?? sestavProdukty(zdroj!, finalni), brat ?? undefined),
        procento === null ? null : { procento, zaokrouhleni: na990 ? "990" : "zadne" },
      );
    } finally {
      setUkladam(false);
    }
  };

  const ukazka = (klic?: string) => {
    if (!klic || !zdroj) return "";
    return zdroj.pole.find((p) => p.klic === klic)?.ukazka ?? "";
  };

  const moznostiPole = (zdroj?.pole ?? []).filter((p) => p.vyplneno > 0);

  return (
    <div className="grid gap-5 rounded-lg border-2 border-primary bg-card p-6 shadow-card">
      <div>
        <p className="text-xl font-bold">{puvodni ? `Upravit dodavatele ${puvodni.nazev}` : "Přidat dodavatele"}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Stačí odkaz na feed nebo soubor. Co je co, navrhneme sami — vy jen zkontrolujete.
        </p>
      </div>

      {/* 1. ODKUD */}
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="nazev-dodavatele">Jak se dodavatel jmenuje</Label>
          <Input
            id="nazev-dodavatele"
            value={nazev}
            placeholder="Leader Fox"
            disabled={!!puvodni}
            onChange={(e) => setNazev(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="url-feedu">Odkaz na feed</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="url-feedu"
              value={url}
              placeholder="https://e-shop.dodavatel.cz/feed.xml"
              onChange={(e) => setUrl(e.target.value)}
            />
            <Button type="button" disabled={nacita} onClick={() => void nactiOdkaz()}>
              <Link2 className="mr-2 h-4 w-4" />
              {nacita ? "Načítám…" : "Načíst"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>Nebo nahrajte soubor:</span>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 font-semibold text-foreground hover:border-primary">
            <Upload className="h-4 w-4" /> Vybrat soubor
            <input
              type="file"
              accept=".xml,.csv,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void nactiSoubor(f);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <KdeNajduFeed />

      {znamy && (
        <p className="rounded-md border-2 border-primary bg-accent p-4 text-accent-foreground">
          Tenhle feed známe — <b>není potřeba nic nastavovat.</b> Jen níž zaškrtněte, co chcete brát.
        </p>
      )}

      {/* CO BRÁT */}
      {vse && skupiny.length > 0 && (
        <div className="grid gap-3 rounded-lg border-2 border-primary p-4 md:p-5">
          <div>
            <p className="text-xl font-bold">Co chcete od dodavatele brát?</p>
            <p className="text-sm text-muted-foreground">
              Kola a elektrokola jsme zaškrtli za vás. Co nezaškrtnete, na web nepůjde.
            </p>
          </div>
          {DRUHY.map((d) => {
            const vDruhu = skupiny.filter((s) => s.druh === d.druh);
            if (!vDruhu.length) return null;
            const vybrano = vDruhu.filter((s) => (brat ?? []).includes(s.klic));
            const vse = vybrano.length === vDruhu.length;
            const nic = vybrano.length === 0;
            const kusu = vDruhu.reduce((n, s) => n + s.pocet, 0);
            return (
              <div key={d.druh} className={`rounded-lg border-2 ${nic ? "bg-card" : "border-primary bg-accent"}`}>
                <label className="flex min-h-16 cursor-pointer items-center gap-4 px-4">
                  <input
                    type="checkbox"
                    checked={!nic}
                    ref={(el) => {
                      if (el) el.indeterminate = !nic && !vse;
                    }}
                    onChange={() => nastavDruh(vDruhu.map((s) => s.klic), nic)}
                    className="h-7 w-7 accent-[var(--primary)]"
                  />
                  <span className="flex-1 text-xl font-bold">{d.nazev}</span>
                  <span className="text-muted-foreground">{kusu} ks</span>
                </label>
                {vDruhu.length > 1 && (
                  <details className="px-4 pb-3">
                    <summary className="cursor-pointer text-sm text-muted-foreground">
                      Vybrat podrobněji ({vybrano.length} z {vDruhu.length} skupin)
                    </summary>
                    <div className="mt-2 grid gap-1 sm:grid-cols-2">
                      {vDruhu.map((s) => (
                        <label key={s.klic} className="flex min-h-11 cursor-pointer items-center gap-3 rounded px-2 hover:bg-card">
                          <input
                            type="checkbox"
                            checked={(brat ?? []).includes(s.klic)}
                            onChange={() => prepniSkupinu(s.klic)}
                            className="h-5 w-5 accent-[var(--primary)]"
                          />
                          <span className="flex-1">{s.nazev}</span>
                          <span className="text-sm text-muted-foreground">{s.pocet}</span>
                        </label>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
          {nahled && (
            <p className="text-lg">
              Budete brát <b>{nahled.produkty.length}</b> z {vse.produkty.length} produktů.
            </p>
          )}
        </div>
      )}

      {/* ZA KOLIK */}
      {vse && skupiny.length > 0 && (
        <div className="grid gap-3 rounded-lg border-2 border-primary p-4 md:p-5">
          <div>
            <p className="text-xl font-bold">Za kolik je chcete prodávat?</p>
          </div>
          <p className="rounded-md bg-amber-50 p-3 text-base text-amber-950">
            Sleva, kterou tu zadáte, platí pro <b>všechna kola od tohoto dodavatele</b> — i pro ta, která přibudou
            příště. Změnit ji můžete kdykoli v Cenách. Když chcete jedno kolo dát do akce zvlášť, uděláte to v Cenách
            u Ceny jednoho kola.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { p: 0, t: "Za cenu dodavatele" },
              { p: -5, t: "O 5 % levněji" },
              { p: -10, t: "O 10 % levněji" },
              { p: 5, t: "O 5 % dráž" },
            ].map((v) => (
              <button
                key={v.p}
                type="button"
                onClick={() => {
                  setProcento(v.p);
                  setVlastni("");
                }}
                className={`min-h-14 rounded-lg border-2 px-5 text-lg font-bold ${procento === v.p ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`}
              >
                {v.t}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setProcento(null);
                setVlastni("");
              }}
              className={`min-h-14 rounded-lg border-2 px-5 text-lg font-bold ${procento === null ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`}
            >
              Nastavím později
            </button>
          </div>
          <label
            className={`flex flex-wrap items-center gap-3 rounded-lg p-3 ${
              vlastni !== "" ? "border-2 border-primary bg-accent" : "border-2 border-dashed"
            }`}
          >
            <span className="text-lg font-bold">Nebo si zadejte vlastní slevu:</span>
            <span className="inline-flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={90}
                inputMode="numeric"
                placeholder="např. 7"
                value={vlastni}
                onChange={(e) => {
                  const t = e.target.value;
                  setVlastni(t);
                  if (t !== "") setProcento(-Math.min(90, Math.max(0, Number(t) || 0)));
                }}
                className="min-h-12 w-28 rounded-lg border-2 bg-background px-3 text-xl font-bold"
              />
              <span className="text-lg font-bold">% levněji</span>
            </span>
          </label>
          {procento !== null && (
            <label className="flex min-h-12 cursor-pointer items-center gap-3 text-lg">
              <input
                type="checkbox"
                checked={na990}
                onChange={(e) => setNa990(e.target.checked)}
                className="h-6 w-6 accent-[var(--primary)]"
              />
              Zaokrouhlit na …990 Kč
            </label>
          )}
          {procento !== null && cenaPrikladu > 0 && (
            <p className="rounded-md bg-accent p-3 text-lg text-accent-foreground">
              Příklad: dodavatel {formatCena(cenaPrikladu)} → u vás{" "}
              <b>{formatCena(cenaPodlePravidla(cenaPrikladu, { procento, zaokrouhleni: na990 ? "990" : "zadne" }))}</b>
            </p>
          )}
          {procento === null && (
            <p className="text-muted-foreground">Kola se stáhnou s cenou dodavatele a upravíte ji potom v Cenách.</p>
          )}
        </div>
      )}

      {/* 2. CO JE CO */}
      {zdroj && profil && !znamy && (
        <>
          <p className="rounded-md bg-surface p-3 text-sm">
            Ve feedu je <span className="font-bold">{zdroj.polozky.length}</span> položek
            {vse && (
              <>
                , to dělá <span className="font-bold">{vse.produkty.length}</span> produktů
                {vse.produkty.length < zdroj.polozky.length && " (velikosti jsme spojili)"}
              </>
            )}
            .
          </p>

          <details className="rounded-md border p-4">
            <summary className="cursor-pointer font-semibold">
              Zkontrolovat, co je co <span className="font-normal text-muted-foreground">(většinou není potřeba)</span>
            </summary>
          <div className="mt-4 grid gap-3">
            {CILOVA_POLE.map((c) => {
              const vybrano = profil.pole[c.pole] ?? "";
              const moznosti =
                c.pole === "parametry"
                  ? zdroj.skupinyParametru.map((s) => ({ klic: s, ukazka: "" }))
                  : moznostiPole;
              if (c.pole === "parametry" && !moznosti.length) return null;
              if (c.pole === "skupina" && !pokrocile) return null;
              return (
                <div key={c.pole} className="grid gap-1 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {c.popis}
                      {c.povinne && <span className="text-primary"> *</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.napoveda}</p>
                  </div>
                  <div className="grid gap-1">
                    <select className={VYBER} value={vybrano} onChange={(e) => nastavPole(c.pole, e.target.value)}>
                      <option value="">— nepoužívat —</option>
                      {c.pole === "velikost" && <option value={VELIKOST_Z_NAZVU}>Je v názvu (17", 19"…)</option>}
                      {moznosti.map((p) => (
                        <option key={p.klic} value={p.klic}>
                          {p.klic}
                        </option>
                      ))}
                    </select>
                    {vybrano && c.pole !== "parametry" && vybrano !== VELIKOST_Z_NAZVU && (
                      <p className="truncate text-xs text-muted-foreground">např. {kratce(ukazka(vybrano))}</p>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="dph">Ceny ve feedu jsou</Label>
                <select
                  id="dph"
                  className={VYBER}
                  value={profil.cenyBezDph ? "bez" : "s"}
                  onChange={(e) => setProfil({ ...profil, cenyBezDph: e.target.value === "bez" })}
                >
                  <option value="s">s DPH (koncové)</option>
                  <option value="bez">bez DPH — přičteme 21 %</option>
                </select>
              </div>
              {profil.pole.skladem && (
                <div className="grid gap-1.5">
                  <Label htmlFor="sklad">Sklad ve feedu je</Label>
                  <select
                    id="sklad"
                    className={VYBER}
                    value={profil.sklad}
                    onChange={(e) => setProfil({ ...profil, sklad: e.target.value as ProfilDodavatele["sklad"] })}
                  >
                    <option value="kusy">počet kusů</option>
                    <option value="dodaci-doba">dodací doba (0 = skladem)</option>
                    <option value="text">text („skladem", „ano"…)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          </details>

          {/* NÁHLED */}
          {nahled && nahled.produkty.length > 0 && (
            <div className="grid gap-3">
              <p className="font-semibold">Takhle to bude vypadat</p>
              {nahled.produkty.slice(0, 3).map((p) => (
                <div key={p.kod} className="flex gap-4 rounded-md border p-3">
                  <div className="h-20 w-24 shrink-0 overflow-hidden rounded bg-surface">
                    {p.obrazky[0] && (
                      <img src={p.obrazky[0]} alt="" loading="lazy" className="h-full w-full object-contain" />
                    )}
                  </div>
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold">{p.nazev}</p>
                    <p className="text-muted-foreground">
                      {formatCena(cenaProduktu(p))}
                      {p.varianty.some((v) => v.velikost) &&
                        ` · velikosti ${p.varianty.map((v) => v.velikost).filter(Boolean).join(", ")}`}
                      {p.barva && ` · ${p.barva}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.kategorieFeed || "bez kategorie"} · {p.obrazky.length} fotek
                      {p.parametry?.[0] && ` · ${p.parametry[0].polozky.length} parametrů`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {zdroj.kandidati && zdroj.kandidati.length > 1 && (
            <div className="text-sm">
              <button type="button" className="underline hover:text-primary" onClick={() => setPokrocile(!pokrocile)}>
                {pokrocile ? "Skrýt pokročilé" : "Pokročilé"}
              </button>
              {pokrocile && (
                <div className="mt-3 grid gap-1.5 sm:max-w-sm">
                  <Label htmlFor="prvek">Jedna položka feedu je prvek</Label>
                  <select id="prvek" className={VYBER} value={zdroj.prvek} onChange={(e) => zmenPrvek(e.target.value)}>
                    {zdroj.kandidati.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">Měňte jen když náhled vypadá úplně špatně.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2">
        {(zdroj || znamy) && profil && (
          <Button size="lg" className="min-h-14 px-8 text-lg" disabled={ukladam} onClick={() => void ulozit()}>
            {ukladam ? "Stahuji kola…" : `Stáhnout ${nahled ? nahled.produkty.length : ""} kol na web`}
          </Button>
        )}
        <Button variant="ghost" size="lg" onClick={onZrusit}>
          Zrušit
        </Button>
      </div>
      {(zdroj || znamy) && profil && (
        <p className="-mt-2 text-sm text-muted-foreground">
          Kola se stáhnou jako skrytá. Na konci je jedním kliknutím zveřejníte, nebo si je nejdřív projdete.
        </p>
      )}
    </div>
  );
}
