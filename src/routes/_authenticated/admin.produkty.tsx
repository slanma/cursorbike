import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { nactiDbProdukty, nactiKategorie, nahrajFotku, type DbProdukt } from "@/lib/eshop";
import { formatCena, type ParametrSkupina } from "@/lib/produkty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/produkty")({
  component: SpravaProduktu,
});

type Formular = {
  id?: string;
  nazev: string;
  slug: string;
  kategorie_id: string;
  cena: string;
  puvodni_cena: string;
  kratky: string;
  popis: string;
  obrazek_url: string;
  oblibene: boolean;
  aktivni: boolean;
  pro_koho: string;
  neni_pro_koho: string;
  parametry: string;
};

const prazdny: Formular = {
  nazev: "",
  slug: "",
  kategorie_id: "",
  cena: "",
  puvodni_cena: "",
  kratky: "",
  popis: "",
  obrazek_url: "",
  oblibene: false,
  aktivni: true,
  pro_koho: "",
  neni_pro_koho: "",
  parametry: "",
};

const naSlug = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Text ve tvaru "# Skupina" a řádků "Popisek: hodnota" převede na tabulky parametrů. */
function textNaParametry(text: string): ParametrSkupina[] {
  const skupiny: ParametrSkupina[] = [];
  for (const radek of text.split("\n")) {
    const r = radek.trim();
    if (!r) continue;
    if (r.startsWith("#")) {
      skupiny.push({ skupina: r.replace(/^#+\s*/, ""), polozky: [] });
      continue;
    }
    const i = r.indexOf(":");
    if (i === -1) continue;
    if (skupiny.length === 0) skupiny.push({ skupina: "Parametry", polozky: [] });
    skupiny[skupiny.length - 1]!.polozky.push({
      label: r.slice(0, i).trim(),
      hodnota: r.slice(i + 1).trim(),
    });
  }
  return skupiny;
}

function parametryNaText(parametry: ParametrSkupina[]): string {
  return parametry
    .map((s) => `# ${s.skupina}\n${s.polozky.map((p) => `${p.label}: ${p.hodnota}`).join("\n")}`)
    .join("\n\n");
}

function SpravaProduktu() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Formular | null>(null);
  const [nahrava, setNahrava] = useState(false);

  const kategorie = useQuery({ queryKey: ["admin-kategorie"], queryFn: nactiKategorie });
  const produkty = useQuery({ queryKey: ["admin-produkty"], queryFn: () => nactiDbProdukty(true) });

  const ulozit = useMutation({
    mutationFn: async (f: Formular) => {
      const zaznam = {
        nazev: f.nazev.trim(),
        slug: (f.slug.trim() || naSlug(f.nazev)).slice(0, 120),
        kategorie_id: f.kategorie_id || null,
        cena: Number(f.cena) || 0,
        puvodni_cena: f.puvodni_cena ? Number(f.puvodni_cena) : null,
        kratky: f.kratky.trim(),
        popis: f.popis.trim(),
        obrazek_url: f.obrazek_url || null,
        oblibene: f.oblibene,
        aktivni: f.aktivni,
        pro_koho: f.pro_koho.split("\n").map((x) => x.trim()).filter(Boolean),
        neni_pro_koho: f.neni_pro_koho.trim() || null,
        parametry: textNaParametry(f.parametry),
      };
      const { error } = f.id
        ? await supabase.from("produkty").update(zaznam).eq("id", f.id)
        : await supabase.from("produkty").insert(zaznam);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produkt uložen");
      setForm(null);
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const smazat = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("produkty").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Produkt smazán");
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const upravit = (p: DbProdukt) =>
    setForm({
      id: p.id,
      nazev: p.nazev,
      slug: p.slug,
      kategorie_id: p.kategorie_id ?? "",
      cena: String(p.cena),
      puvodni_cena: p.puvodni_cena ? String(p.puvodni_cena) : "",
      kratky: p.kratky,
      popis: p.popis,
      obrazek_url: p.obrazek_url ?? "",
      oblibene: p.oblibene,
      aktivni: p.aktivni,
      pro_koho: (p.pro_koho ?? []).join("\n"),
      neni_pro_koho: p.neni_pro_koho ?? "",
      parametry: parametryNaText(Array.isArray(p.parametry) ? p.parametry : []),
    });

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title text-2xl">Produkty</h2>
        <Button onClick={() => setForm({ ...prazdny })}>
          <Plus className="mr-2 h-4 w-4" /> Přidat produkt
        </Button>
      </div>

      {form && (
        <form
          className="grid gap-4 rounded-lg border bg-card p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.nazev.trim()) {
              toast.error("Vyplňte název produktu");
              return;
            }
            ulozit.mutate(form);
          }}
        >
          <h3 className="section-title text-lg">{form.id ? "Úprava produktu" : "Nový produkt"}</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="nazev">Název</Label>
              <Input id="nazev" value={form.nazev} maxLength={120} onChange={(e) => setForm({ ...form, nazev: e.target.value })} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Adresa v URL (nepovinné)</Label>
              <Input id="slug" value={form.slug} maxLength={120} placeholder={naSlug(form.nazev)} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="kat">Kategorie</Label>
              <select
                id="kat"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={form.kategorie_id}
                onChange={(e) => setForm({ ...form, kategorie_id: e.target.value })}
              >
                <option value="">— nezařazeno —</option>
                {(kategorie.data ?? []).map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.sekce === "elektrokola" ? "Elektrokola" : k.sekce === "bazar" ? "Bazar" : "Kola"} · {k.znacka ?? "—"} · {k.nazev}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cena">Cena (Kč)</Label>
                <Input id="cena" type="number" min={0} value={form.cena} onChange={(e) => setForm({ ...form, cena: e.target.value })} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="puvodni">Původní cena</Label>
                <Input id="puvodni" type="number" min={0} value={form.puvodni_cena} onChange={(e) => setForm({ ...form, puvodni_cena: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="kratky">Krátký popis (do výpisu)</Label>
            <Input id="kratky" maxLength={200} value={form.kratky} onChange={(e) => setForm({ ...form, kratky: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="popis">Popis</Label>
            <Textarea id="popis" rows={4} maxLength={4000} value={form.popis} onChange={(e) => setForm({ ...form, popis: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="foto">Fotka produktu</Label>
            <Input
              id="foto"
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setNahrava(true);
                try {
                  const url = await nahrajFotku(file);
                  setForm((f) => (f ? { ...f, obrazek_url: url } : f));
                  toast.success("Fotka nahrána");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Nahrání se nezdařilo");
                } finally {
                  setNahrava(false);
                }
              }}
            />
            {nahrava && <p className="text-sm text-muted-foreground">Nahrávám fotku…</p>}
            {form.obrazek_url && (
              <img src={form.obrazek_url} alt="Náhled produktu" className="h-32 w-auto rounded border bg-surface object-contain" />
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="prokoho">Pro koho je vhodné (každý bod na nový řádek)</Label>
            <Textarea id="prokoho" rows={4} value={form.pro_koho} onChange={(e) => setForm({ ...form, pro_koho: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="neni">Pro koho není vhodné</Label>
            <Input id="neni" maxLength={300} value={form.neni_pro_koho} onChange={(e) => setForm({ ...form, neni_pro_koho: e.target.value })} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="param">Parametry</Label>
            <Textarea
              id="param"
              rows={8}
              value={form.parametry}
              placeholder={"# Pohon a baterie\nMotor: Středový, 250 W\nBaterie: 630 Wh\n\n# Rám\nVelikosti: S / M / L"}
              onChange={(e) => setForm({ ...form, parametry: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Řádek začínající „#" je nadpis tabulky, ostatní řádky se píší jako „Popisek: hodnota".
            </p>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Switch checked={form.oblibene} onCheckedChange={(v) => setForm({ ...form, oblibene: v })} /> Označit jako oblíbené
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Switch checked={form.aktivni} onCheckedChange={(v) => setForm({ ...form, aktivni: v })} /> Zobrazit na webu
            </label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={ulozit.isPending || nahrava}>
              Uložit
            </Button>
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              Zrušit
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left">
            <tr>
              <th className="px-4 py-3">Produkt</th>
              <th className="px-4 py-3">Cena</th>
              <th className="px-4 py-3">Na webu</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {(produkty.data ?? []).map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-semibold">{p.nazev}</td>
                <td className="px-4 py-3">{formatCena(p.cena)}</td>
                <td className="px-4 py-3">{p.aktivni ? "Ano" : "Skryto"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => upravit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Opravdu smazat „${p.nazev}"?`)) smazat.mutate(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {(produkty.data ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  Zatím tu nejsou žádné produkty. Přidejte první tlačítkem nahoře.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
