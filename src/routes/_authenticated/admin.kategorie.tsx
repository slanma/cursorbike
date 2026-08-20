import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { nactiKategorie, nactiZnacky } from "@/lib/eshop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

const SEKCE = [
  { hodnota: "kola", popisek: "Kola" },
  { hodnota: "elektrokola", popisek: "Elektrokola" },
  { hodnota: "bazar", popisek: "Bazar" },
] as const;

const popisekSekce = (s: string) => SEKCE.find((x) => x.hodnota === s)?.popisek ?? s;

function SpravaKategorii() {
  const qc = useQueryClient();

  const [znackaSekce, setZnackaSekce] = useState<string>("kola");
  const [znackaNazev, setZnackaNazev] = useState("");
  const [znackaPopis, setZnackaPopis] = useState("");

  const [katZnackaId, setKatZnackaId] = useState("");
  const [katNazev, setKatNazev] = useState("");

  const znacky = useQuery({ queryKey: ["admin-znacky"], queryFn: nactiZnacky });
  const kategorie = useQuery({ queryKey: ["admin-kategorie"], queryFn: nactiKategorie });

  const obnov = () => {
    qc.invalidateQueries({ queryKey: ["admin-znacky"] });
    qc.invalidateQueries({ queryKey: ["admin-kategorie"] });
    qc.invalidateQueries({ queryKey: ["katalog"] });
    qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
  };

  const pridatZnacku = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("znacky").insert({
        sekce: znackaSekce,
        slug: naSlug(znackaNazev),
        nazev: znackaNazev.trim(),
        popis: znackaPopis.trim(),
        poradi: (znacky.data?.filter((z) => z.sekce === znackaSekce).length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Značka přidána");
      setZnackaNazev("");
      setZnackaPopis("");
      obnov();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const smazatZnacku = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("znacky").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Značka smazána");
      obnov();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pridatKategorii = useMutation({
    mutationFn: async () => {
      const z = znacky.data?.find((x) => x.id === katZnackaId);
      if (!z) throw new Error("Nejdřív vyberte značku");
      const { error } = await supabase.from("kategorie").insert({
        // Slug musí být unikátní přes celou tabulku, proto obsahuje i sekci
        // a značku — jinak by se srazila „horská" u dvou různých značek.
        slug: `${z.sekce}-${z.slug}-${naSlug(katNazev)}`,
        nazev: katNazev.trim(),
        sekce: z.sekce,
        znacka: z.slug,
        znacka_id: z.id,
        poradi: (kategorie.data?.filter((k) => k.znacka_id === z.id).length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategorie přidána");
      setKatNazev("");
      obnov();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const smazatKategorii = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kategorie").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategorie smazána");
      obnov();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const seznamZnacek = [...(znacky.data ?? [])].sort(
    (a, b) => a.sekce.localeCompare(b.sekce) || a.poradi - b.poradi,
  );

  return (
    <div className="grid gap-10">
      <div>
        <h2 className="section-title text-2xl">Značky a kategorie</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Nejdřív založte značku (Author, Crussis…), potom pod ni kategorie („Pánská | Horská 29&quot;“).
          Značka se zobrazí jako dlaždice na stránce Kola nebo Elektrokola, kategorie jako tlačítko filtru
          uvnitř značky.
        </p>
      </div>

      {/* ZNAČKY */}
      <section className="grid gap-4">
        <h3 className="section-title text-lg">1. Značky</h3>

        <form
          className="grid gap-4 rounded-lg border bg-card p-6 shadow-card sm:grid-cols-[160px_1fr_2fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!znackaNazev.trim()) {
              toast.error("Vyplňte název značky");
              return;
            }
            pridatZnacku.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="z-sekce">Sekce</Label>
            <select
              id="z-sekce"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={znackaSekce}
              onChange={(e) => setZnackaSekce(e.target.value)}
            >
              {SEKCE.map((s) => (
                <option key={s.hodnota} value={s.hodnota}>
                  {s.popisek}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="z-nazev">Název značky</Label>
            <Input
              id="z-nazev"
              maxLength={60}
              value={znackaNazev}
              placeholder="Author"
              onChange={(e) => setZnackaNazev(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="z-popis">Popis (zobrazí se na dlaždici)</Label>
            <Input
              id="z-popis"
              maxLength={200}
              value={znackaPopis}
              placeholder="Pánská, dámská i dětská kola značky Author."
              onChange={(e) => setZnackaPopis(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={pridatZnacku.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Přidat
          </Button>
        </form>

        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-4 py-3">Sekce</th>
                <th className="px-4 py-3">Značka</th>
                <th className="px-4 py-3">Kategorií</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {seznamZnacek.map((z) => {
                const pocet = (kategorie.data ?? []).filter((k) => k.znacka_id === z.id).length;
                return (
                  <tr key={z.id}>
                    <td className="px-4 py-3">{popisekSekce(z.sekce)}</td>
                    <td className="px-4 py-3 font-semibold">{z.nazev}</td>
                    <td className="px-4 py-3">{pocet}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              `Opravdu smazat značku „${z.nazev}"? Smažou se i její kategorie (${pocet}).`,
                            )
                          )
                            smazatZnacku.mutate(z.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {seznamZnacek.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Zatím žádné značky.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* KATEGORIE */}
      <section className="grid gap-4">
        <h3 className="section-title text-lg">2. Kategorie</h3>

        <form
          className="grid gap-4 rounded-lg border bg-card p-6 shadow-card sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (!katZnackaId) {
              toast.error("Vyberte značku");
              return;
            }
            if (!katNazev.trim()) {
              toast.error("Vyplňte název kategorie");
              return;
            }
            pridatKategorii.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="k-znacka">Značka</Label>
            <select
              id="k-znacka"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={katZnackaId}
              onChange={(e) => setKatZnackaId(e.target.value)}
            >
              <option value="">— vyberte značku —</option>
              {seznamZnacek.map((z) => (
                <option key={z.id} value={z.id}>
                  {popisekSekce(z.sekce)} · {z.nazev}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="k-nazev">Název kategorie</Label>
            <Input
              id="k-nazev"
              maxLength={80}
              value={katNazev}
              placeholder={'Pánská | Horská 29"'}
              onChange={(e) => setKatNazev(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={pridatKategorii.isPending}>
            <Plus className="mr-2 h-4 w-4" /> Přidat
          </Button>
        </form>

        <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left">
              <tr>
                <th className="px-4 py-3">Sekce</th>
                <th className="px-4 py-3">Značka</th>
                <th className="px-4 py-3">Kategorie</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {(kategorie.data ?? []).map((k) => (
                <tr key={k.id}>
                  <td className="px-4 py-3">{popisekSekce(k.sekce)}</td>
                  <td className="px-4 py-3">
                    {seznamZnacek.find((z) => z.id === k.znacka_id)?.nazev ?? k.znacka ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold">{k.nazev}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Opravdu smazat kategorii „${k.nazev}"?`)) smazatKategorii.mutate(k.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
              {(kategorie.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Zatím žádné kategorie.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
