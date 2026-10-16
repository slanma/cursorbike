import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { nactiKategorie, nactiZnacky } from "@/lib/eshop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/kategorie")({
  component: SpravaKategorii,
});

const naSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/**
 * Nabídka webu — značky a kategorie.
 *
 * Dřív to byly dvě tabulky a dva formuláře nad sebou, což odpovídalo tomu,
 * jak jsou data v databázi, ale ne tomu, jak si to člověk představuje.
 * Nově je to jeden seznam ve stejné struktuře, jakou vidí zákazník na webu,
 * a přidávat se dá přímo na místě, kam věc patří.
 */
const SEKCE = [
  { hodnota: "kola", popisek: "Kola" },
  { hodnota: "elektrokola", popisek: "Elektrokola" },
  { hodnota: "bazar", popisek: "Bazar" },
  { hodnota: "doplnky", popisek: "Doplňky a díly" },
] as const;

function SpravaKategorii() {
  const qc = useQueryClient();
  const [novaZnacka, setNovaZnacka] = useState<string | null>(null);
  const [nazevZnacky, setNazevZnacky] = useState("");
  const [novaKategorie, setNovaKategorie] = useState<string | null>(null);
  const [nazevKategorie, setNazevKategorie] = useState("");
  const [prepisuje, setPrepisuje] = useState<string | null>(null);
  const [novyNazev, setNovyNazev] = useState("");

  const znacky = useQuery({ queryKey: ["admin-znacky"], queryFn: nactiZnacky });
  const kategorie = useQuery({ queryKey: ["admin-kategorie"], queryFn: nactiKategorie });
  const pocty = useQuery({
    queryKey: ["pocty-produktu"],
    queryFn: async () => {
      const { data, error } = await supabase.from("produkty").select("kategorie_id");
      if (error) throw error;
      const mapa = new Map<string, number>();
      for (const p of data ?? []) {
        if (p.kategorie_id) mapa.set(p.kategorie_id, (mapa.get(p.kategorie_id) ?? 0) + 1);
      }
      return mapa;
    },
  });

  const obnov = () => {
    for (const k of ["admin-znacky", "admin-kategorie", "katalog", "verejne-produkty", "pocty-produktu"]) {
      qc.invalidateQueries({ queryKey: [k] });
    }
  };

  const pridatZnacku = useMutation({
    mutationFn: async ({ sekce, nazev }: { sekce: string; nazev: string }) => {
      const { error } = await supabase.from("znacky").insert({
        sekce,
        slug: naSlug(nazev),
        nazev: nazev.trim(),
        poradi: (znacky.data?.filter((z) => z.sekce === sekce).length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Značka přidána");
      setNovaZnacka(null);
      setNazevZnacky("");
      obnov();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pridatKategorii = useMutation({
    mutationFn: async ({ znackaId, nazev }: { znackaId: string; nazev: string }) => {
      const z = znacky.data?.find((x) => x.id === znackaId);
      if (!z) throw new Error("Značka nenalezena");
      const { error } = await supabase.from("kategorie").insert({
        // Adresa musí být jedinečná na celém webu, proto obsahuje i sekci
        // a značku — jinak by se srazila „horská" u dvou různých značek.
        slug: `${z.sekce}-${z.slug}-${naSlug(nazev)}`,
        nazev: nazev.trim(),
        sekce: z.sekce,
        znacka: z.slug,
        znacka_id: z.id,
        poradi: (kategorie.data?.filter((k) => k.znacka_id === z.id).length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategorie přidána");
      setNovaKategorie(null);
      setNazevKategorie("");
      obnov();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Přepsání názvu. Adresa (slug) se schválně nemění — jinak by se rozbily odkazy. */
  const prejmenovat = useMutation({
    mutationFn: async ({ tabulka, id, nazev }: { tabulka: "znacky" | "kategorie"; id: string; nazev: string }) => {
      const { error } = await supabase.from(tabulka).update({ nazev: nazev.trim() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Název změněn");
      setPrepisuje(null);
      setNovyNazev("");
      obnov();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Posun v pořadí — prohodí se pořadová čísla se sousedem. */
  const posunout = useMutation({
    mutationFn: async ({
      tabulka,
      a,
      b,
    }: {
      tabulka: "znacky" | "kategorie";
      a: { id: string; poradi: number };
      b: { id: string; poradi: number };
    }) => {
      const { error: e1 } = await supabase.from(tabulka).update({ poradi: b.poradi }).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from(tabulka).update({ poradi: a.poradi }).eq("id", b.id);
      if (e2) throw e2;
    },
    onSuccess: obnov,
    onError: (e: Error) => toast.error(e.message),
  });

  const smazat = useMutation({
    mutationFn: async ({ tabulka, id }: { tabulka: "znacky" | "kategorie"; id: string }) => {
      const { error } = await supabase.from(tabulka).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Smazáno");
      obnov();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (znacky.isLoading || kategorie.isLoading) {
    return <p className="text-muted-foreground">Načítám nabídku…</p>;
  }

  return (
    <div className="grid gap-8">
      <div>
        <h2 className="section-title text-2xl">Nabídka na webu</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Takhle je nabídka rozdělená na webu. <span className="font-semibold">Kola</span> a{" "}
          <span className="font-semibold">Elektrokola</span> jsou stránky v horním menu, pod nimi jsou
          značky a pod každou značkou kategorie, podle kterých si zákazník vybírá.
        </p>
      </div>

      {SEKCE.map((sekce) => {
        const znackySekce = (znacky.data ?? [])
          .filter((z) => z.sekce === sekce.hodnota)
          .sort((a, b) => a.poradi - b.poradi || a.nazev.localeCompare(b.nazev, "cs"));

        return (
          <section key={sekce.hodnota} className="rounded-lg border bg-card shadow-card">
            <h3 className="section-title border-b px-6 py-4 text-lg">{sekce.popisek}</h3>

            <div className="divide-y">
              {znackySekce.map((z) => {
                const kat = (kategorie.data ?? [])
                  .filter((k) => k.znacka_id === z.id)
                  .sort((a, b) => a.poradi - b.poradi || a.nazev.localeCompare(b.nazev, "cs"));
                const celkemKol = kat.reduce((s, k) => s + (pocty.data?.get(k.id) ?? 0), 0);

                return (
                  <div key={z.id} className="px-6 py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {prepisuje === z.id ? (
                          <>
                            <Input
                              autoFocus
                              className="max-w-xs"
                              maxLength={60}
                              value={novyNazev}
                              onChange={(e) => setNovyNazev(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && novyNazev.trim())
                                  prejmenovat.mutate({ tabulka: "znacky", id: z.id, nazev: novyNazev });
                                if (e.key === "Escape") setPrepisuje(null);
                              }}
                            />
                            <Button
                              size="sm"
                              disabled={!novyNazev.trim()}
                              onClick={() => prejmenovat.mutate({ tabulka: "znacky", id: z.id, nazev: novyNazev })}
                            >
                              Uložit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setPrepisuje(null)}>
                              Zrušit
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-base font-bold">{z.nazev}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Přepsat název značky ${z.nazev}`}
                              onClick={() => {
                                setPrepisuje(z.id);
                                setNovyNazev(z.nazev);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              {celkemKol === 0 ? "zatím žádná kola" : `${celkemKol} kol`}
                            </span>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        className="text-sm text-muted-foreground underline hover:text-destructive"
                        onClick={() => {
                          if (
                            confirm(
                              `Smazat značku „${z.nazev}"?\n\nSmažou se i její kategorie (${kat.length}). Kola zůstanou, ale zmizí z webu, dokud je nezařadíte jinam.`,
                            )
                          )
                            smazat.mutate({ tabulka: "znacky", id: z.id });
                        }}
                      >
                        Smazat značku
                      </button>
                    </div>

                    <ul className="mt-3 grid gap-1">
                      {kat.map((k) => (
                        <li
                          key={k.id}
                          className="flex items-center justify-between gap-3 rounded-md px-3 py-2 hover:bg-surface"
                        >
                          {prepisuje === k.id ? (
                            <span className="flex flex-1 flex-wrap items-center gap-2">
                              <Input
                                autoFocus
                                className="max-w-xs"
                                maxLength={80}
                                value={novyNazev}
                                onChange={(e) => setNovyNazev(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && novyNazev.trim())
                                    prejmenovat.mutate({ tabulka: "kategorie", id: k.id, nazev: novyNazev });
                                  if (e.key === "Escape") setPrepisuje(null);
                                }}
                              />
                              <Button
                                size="sm"
                                disabled={!novyNazev.trim()}
                                onClick={() =>
                                  prejmenovat.mutate({ tabulka: "kategorie", id: k.id, nazev: novyNazev })
                                }
                              >
                                Uložit
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setPrepisuje(null)}>
                                Zrušit
                              </Button>
                            </span>
                          ) : (
                            <span className="flex flex-1 items-center gap-2 text-sm">
                              {k.nazev}
                              <span className="text-muted-foreground">({pocty.data?.get(k.id) ?? 0})</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label={`Přepsat název kategorie ${k.nazev}`}
                                onClick={() => {
                                  setPrepisuje(k.id);
                                  setNovyNazev(k.nazev);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Posunout nahoru"
                              disabled={kat.indexOf(k) === 0}
                              onClick={() =>
                                posunout.mutate({
                                  tabulka: "kategorie",
                                  a: { id: k.id, poradi: k.poradi },
                                  b: {
                                    id: kat[kat.indexOf(k) - 1]!.id,
                                    poradi: kat[kat.indexOf(k) - 1]!.poradi,
                                  },
                                })
                              }
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label="Posunout dolů"
                              disabled={kat.indexOf(k) === kat.length - 1}
                              onClick={() =>
                                posunout.mutate({
                                  tabulka: "kategorie",
                                  a: { id: k.id, poradi: k.poradi },
                                  b: {
                                    id: kat[kat.indexOf(k) + 1]!.id,
                                    poradi: kat[kat.indexOf(k) + 1]!.poradi,
                                  },
                                })
                              }
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Smazat kategorii ${k.nazev}`}
                            onClick={() => {
                              if (confirm(`Smazat kategorii „${k.nazev}"?`))
                                smazat.mutate({ tabulka: "kategorie", id: k.id });
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                          </span>
                        </li>
                      ))}
                      {kat.length === 0 && (
                        <li className="px-3 py-2 text-sm text-muted-foreground">
                          Značka zatím nemá žádnou kategorii.
                        </li>
                      )}
                    </ul>

                    {novaKategorie === z.id ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border bg-surface p-3">
                        <Input
                          autoFocus
                          className="max-w-sm"
                          maxLength={80}
                          placeholder='například: Pánská | Horská 29"'
                          value={nazevKategorie}
                          onChange={(e) => setNazevKategorie(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && nazevKategorie.trim())
                              pridatKategorii.mutate({ znackaId: z.id, nazev: nazevKategorie });
                            if (e.key === "Escape") setNovaKategorie(null);
                          }}
                        />
                        <Button
                          size="sm"
                          disabled={!nazevKategorie.trim() || pridatKategorii.isPending}
                          onClick={() => pridatKategorii.mutate({ znackaId: z.id, nazev: nazevKategorie })}
                        >
                          Uložit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setNovaKategorie(null)}>
                          <X className="mr-1 h-4 w-4" /> Zrušit
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setNovaKategorie(z.id);
                          setNazevKategorie("");
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Přidat kategorii k {z.nazev}
                      </Button>
                    )}
                  </div>
                );
              })}

              {znackySekce.length === 0 && (
                <p className="px-6 py-5 text-sm text-muted-foreground">
                  V sekci {sekce.popisek} zatím není žádná značka.
                </p>
              )}
            </div>

            <div className="border-t px-6 py-4">
              {novaZnacka === sekce.hodnota ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    autoFocus
                    className="max-w-sm"
                    maxLength={60}
                    placeholder="například: Rock Machine"
                    value={nazevZnacky}
                    onChange={(e) => setNazevZnacky(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && nazevZnacky.trim())
                        pridatZnacku.mutate({ sekce: sekce.hodnota, nazev: nazevZnacky });
                      if (e.key === "Escape") setNovaZnacka(null);
                    }}
                  />
                  <Button
                    size="sm"
                    disabled={!nazevZnacky.trim() || pridatZnacku.isPending}
                    onClick={() => pridatZnacku.mutate({ sekce: sekce.hodnota, nazev: nazevZnacky })}
                  >
                    Uložit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setNovaZnacka(null)}>
                    <X className="mr-1 h-4 w-4" /> Zrušit
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNovaZnacka(sekce.hodnota);
                    setNazevZnacky("");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" /> Přidat značku do {sekce.popisek}
                </Button>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
