import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { nactiKategorie } from "@/lib/eshop";
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

function SpravaKategorii() {
  const qc = useQueryClient();
  const [nazev, setNazev] = useState("");
  const [sekce, setSekce] = useState("kola");
  const [znacka, setZnacka] = useState("");

  const kategorie = useQuery({ queryKey: ["admin-kategorie"], queryFn: nactiKategorie });

  const pridat = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("kategorie").insert({
        nazev: nazev.trim(),
        slug: naSlug(`${znacka}-${nazev}`) || naSlug(nazev),
        sekce,
        znacka: naSlug(znacka) || null,
        poradi: (kategorie.data?.length ?? 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategorie přidána");
      setNazev("");
      setZnacka("");
      qc.invalidateQueries({ queryKey: ["admin-kategorie"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const smazat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("kategorie").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kategorie smazána");
      qc.invalidateQueries({ queryKey: ["admin-kategorie"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-8">
      <h2 className="section-title text-2xl">Kategorie a značky</h2>
      <p className="-mt-6 text-sm text-muted-foreground">
        Kategorie určuje, kde se produkt na webu zobrazí: sekce (Kola / Elektrokola / Bazar), značka a typ.
      </p>

      <form
        className="grid gap-4 rounded-lg border bg-card p-6 shadow-card sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (!nazev.trim()) {
            toast.error("Vyplňte název kategorie");
            return;
          }
          pridat.mutate();
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="sekce">Sekce</Label>
          <select
            id="sekce"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={sekce}
            onChange={(e) => setSekce(e.target.value)}
          >
            <option value="kola">Kola</option>
            <option value="elektrokola">Elektrokola</option>
            <option value="bazar">Bazar</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="znacka">Značka</Label>
          <Input id="znacka" maxLength={60} value={znacka} placeholder="Author" onChange={(e) => setZnacka(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nazevk">Název kategorie</Label>
          <Input id="nazevk" maxLength={80} value={nazev} placeholder='Pánská | Horská 29"' onChange={(e) => setNazev(e.target.value)} />
        </div>
        <Button type="submit" disabled={pridat.isPending}>
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
                <td className="px-4 py-3">{k.sekce}</td>
                <td className="px-4 py-3">{k.znacka ?? "—"}</td>
                <td className="px-4 py-3 font-semibold">{k.nazev}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Opravdu smazat kategorii „${k.nazev}"?`)) smazat.mutate(k.id);
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
    </div>
  );
}
