import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Bike, Download, Eye, EyeOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { nactiDbProdukty, nactiKategorie, nahrajFotku, type DbProdukt } from "@/lib/eshop";
import { formatCena, type ParametrSkupina } from "@/lib/produkty";
import { sklonuj } from "@/lib/cestina";
import { nazevSekce } from "@/lib/sekce";
import { stahniFotky } from "@/lib/fotky.functions";
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
  /** Cena při otevření formuláře — když ji obchodník změní, je to ruční cena. */
  cenaPriOtevreni?: string;
  puvodni_cena: string;
  kratky: string;
  popis: string;
  obrazek_url: string;
  obrazky: string[];
  oblibene: boolean;
  aktivni: boolean;
  pro_koho: string;
  neni_pro_koho: string;
  parametry: string;
  velikosti: string;
  skladem: string;
  na_objednavku: boolean;
  ean: string;
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
  obrazky: [],
  oblibene: false,
  aktivni: true,
  pro_koho: "",
  neni_pro_koho: "",
  parametry: "",
  velikosti: "",
  skladem: "0",
  na_objednavku: true,
  ean: "",
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
  const [vybrane, setVybrane] = useState<Set<string>>(new Set());
  const [hledani, setHledani] = useState("");
  const [filtrKategorie, setFiltrKategorie] = useState("");
  const [rychlyFiltr, setRychlyFiltr] = useState<"vse" | "web" | "skryte" | "bezfotky" | "elektrokola" | "kola" | "doplnky">("vse");
  const [ukazat, setUkazat] = useState(30);
  const [hromadnaKategorie, setHromadnaKategorie] = useState("");
  const [stahovaniPrubeh, setStahovaniPrubeh] = useState<string | null>(null);

  const kategorie = useQuery({ queryKey: ["admin-kategorie"], queryFn: nactiKategorie });

  /**
   * Hromadné akce. S dvěma stovkami kol se jinak nedá pracovat — zveřejnit
   * padesát kol po jednom je půlhodina klikání.
   */
  const hromadne = useMutation({
    mutationFn: async (akce: "zobrazit" | "skryt" | "smazat" | "presunout") => {
      const ids = [...vybrane];
      if (!ids.length) throw new Error("Nic není vybrané");
      if (akce === "smazat") {
        const { error } = await supabase.from("produkty").delete().in("id", ids);
        if (error) throw error;
      } else if (akce === "presunout") {
        if (!hromadnaKategorie) throw new Error("Vyberte kategorii");
        const { error } = await supabase
          .from("produkty")
          .update({ kategorie_id: hromadnaKategorie })
          .in("id", ids);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("produkty")
          .update({ aktivni: akce === "zobrazit" })
          .in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Hotovo");
      setVybrane(new Set());
      setHromadnaKategorie("");
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
      qc.invalidateQueries({ queryKey: ["pocty-produktu"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const produkty = useQuery({ queryKey: ["admin-produkty"], queryFn: () => nactiDbProdukty(true) });

  const nazevKategorie = (id: string | null) =>
    kategorie.data?.find((k) => k.id === id)?.nazev ?? "—";

  const kategorieKola = (id: string | null) => kategorie.data?.find((k) => k.id === id);
  const sekceKola = (id: string | null) => kategorieKola(id)?.sekce ?? "kola";

  const vyhovuje = (p: DbProdukt, f: typeof rychlyFiltr) =>
    f === "vse" ||
    (f === "web" && p.aktivni) ||
    (f === "skryte" && !p.aktivni) ||
    (f === "bezfotky" && !p.obrazek_url) ||
    (f === "elektrokola" && sekceKola(p.kategorie_id) === "elektrokola") ||
    (f === "kola" && sekceKola(p.kategorie_id) === "kola") ||
    (f === "doplnky" && sekceKola(p.kategorie_id) === "doplnky");

  const seznam = (produkty.data ?? []).filter((p) => {
    if (!vyhovuje(p, rychlyFiltr)) return false;
    if (filtrKategorie && p.kategorie_id !== filtrKategorie) return false;
    if (!hledani.trim()) return true;
    return p.nazev.toLowerCase().includes(hledani.trim().toLowerCase());
  });

  const vsechnyVybrane = seznam.length > 0 && seznam.every((p) => vybrane.has(p.id));
  const prepnout = (id: string) =>
    setVybrane((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

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
        obrazky: f.obrazky,
        velikosti: f.velikosti
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        skladem: Number(f.skladem) || 0,
        na_objednavku: f.na_objednavku,
        ean: f.ean.trim() || null,
        oblibene: f.oblibene,
        aktivni: f.aktivni,
        pro_koho: f.pro_koho.split("\n").map((x) => x.trim()).filter(Boolean),
        neni_pro_koho: f.neni_pro_koho.trim() || null,
        parametry: textNaParametry(f.parametry),
        // Ručně změněnou cenu už pravidlo ani měsíční přehled nepřepíšou.
        ...(!f.id || f.cena !== f.cenaPriOtevreni ? { cena_rucne: true } : {}),
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

  /**
   * Fotky u naimportovaných kol vedou odkazem na starý web, který se v září
   * vypne. Tímhle se stáhnou k nám, po dávkách po 20 kolech, aby to server
   * zvládl.
   */
  const stahnout = useMutation({
    mutationFn: async () => {
      const ids = [...vybrane];
      if (!ids.length) throw new Error("Nic není vybrané");
      let stazeno = 0;
      let preskoceno = 0;
      const chyby: string[] = [];
      for (let i = 0; i < ids.length; i += 20) {
        const davka = ids.slice(i, i + 20);
        setStahovaniPrubeh(`Stahuji fotky… ${Math.min(i + davka.length, ids.length)} z ${ids.length}`);
        const v = await stahniFotky({ data: { ids: davka } });
        stazeno += v.stazeno;
        preskoceno += v.preskoceno;
        chyby.push(...v.chyby);
      }
      return { stazeno, preskoceno, chyby };
    },
    onSuccess: (v) => {
      if (v.chyby.length) {
        toast.warning(`Stáhnuto ${v.stazeno} kol, u ${v.chyby.length} to nešlo`, {
          description: v.chyby.slice(0, 3).join(" · "),
        });
      } else {
        toast.success(`Fotky stáhnuty u ${v.stazeno} kol${v.preskoceno ? `, ${v.preskoceno} už bylo hotových` : ""}`);
      }
      qc.invalidateQueries({ queryKey: ["admin-produkty"] });
      qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setStahovaniPrubeh(null),
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
      cenaPriOtevreni: String(p.cena),
      puvodni_cena: p.puvodni_cena ? String(p.puvodni_cena) : "",
      kratky: p.kratky,
      popis: p.popis,
      obrazek_url: p.obrazek_url ?? "",
      obrazky: Array.isArray(p.obrazky) ? p.obrazky : [],
      velikosti: (p.velikosti ?? []).join(", "),
      skladem: String(p.skladem ?? 0),
      na_objednavku: p.na_objednavku ?? true,
      ean: p.ean ?? "",
      oblibene: p.oblibene,
      aktivni: p.aktivni,
      pro_koho: (p.pro_koho ?? []).join("\n"),
      neni_pro_koho: p.neni_pro_koho ?? "",
      parametry: parametryNaText(Array.isArray(p.parametry) ? p.parametry : []),
    });

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title text-3xl md:text-4xl">Zboží</h2>
      </div>

      {/* JAK PŘIDAT KOLA */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/admin/feedy"
          className="flex flex-col gap-2 rounded-xl border-2 border-primary bg-card p-5 transition-colors hover:bg-primary/5"
        >
          <span className="flex items-center gap-3 text-2xl font-bold">
            <Download className="h-7 w-7 text-primary" /> Stáhnout zboží od dodavatele
          </span>
          <span className="text-lg text-muted-foreground">
            Doporučujeme. Vložíte odkaz od dodavatele a web stáhne zboží i s fotkami, velikostmi a cenami.
          </span>
          <span className="mt-1 inline-flex min-h-12 w-fit items-center rounded-lg bg-primary px-5 text-lg font-bold text-primary-foreground">
            Začít
          </span>
        </Link>
        <button
          type="button"
          onClick={() => setForm({ ...prazdny })}
          className="flex flex-col gap-2 rounded-xl border-2 bg-card p-5 text-left transition-colors hover:border-primary"
        >
          <span className="flex items-center gap-3 text-2xl font-bold">
            <Plus className="h-7 w-7 text-primary" /> Přidat produkt ručně
          </span>
          <span className="text-lg text-muted-foreground">
            Jeden produkt, který máte v prodejně a dodavatel ho v nabídce nemá — třeba bazarové kolo.
          </span>
          <span className="mt-1 inline-flex min-h-12 w-fit items-center rounded-lg border-2 px-5 text-lg font-bold">
            Přidat
          </span>
        </button>
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
                    {nazevSekce(k.sekce)} · {k.znacka ?? "—"} · {k.nazev}
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

          <div className="grid gap-4 rounded-lg border bg-surface p-4 sm:grid-cols-3">
            <div className="grid gap-2 sm:col-span-3">
              <Label htmlFor="velikosti">Velikosti rámu</Label>
              <Input
                id="velikosti"
                value={form.velikosti}
                placeholder="S, M, L, XL"
                onChange={(e) => setForm({ ...form, velikosti: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Oddělujte čárkou. Když necháte prázdné, zákazník velikost nevybírá (doplňky, dětská kola).
                Jakmile je vyplněná, kolo nejde koupit bez zvolené velikosti.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="skladem">Skladem (ks)</Label>
              <Input
                id="skladem"
                type="number"
                min={0}
                value={form.skladem}
                onChange={(e) => setForm({ ...form, skladem: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ean">EAN / čárový kód</Label>
              <Input
                id="ean"
                maxLength={20}
                value={form.ean}
                placeholder="8590000000000"
                onChange={(e) => setForm({ ...form, ean: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
              <Switch
                checked={form.na_objednavku}
                onCheckedChange={(v) => setForm({ ...form, na_objednavku: v })}
              />
              Lze objednat i když není skladem
            </label>
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
            <Label htmlFor="galerie">Další fotky do galerie</Label>
            <Input
              id="galerie"
              type="file"
              accept="image/*"
              multiple
              onChange={async (e) => {
                const soubory = Array.from(e.target.files ?? []);
                if (!soubory.length) return;
                setNahrava(true);
                try {
                  const url = await Promise.all(soubory.map(nahrajFotku));
                  setForm((f) => (f ? { ...f, obrazky: [...f.obrazky, ...url] } : f));
                  toast.success(soubory.length > 1 ? "Fotky nahrány" : "Fotka nahrána");
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Nahrání se nezdařilo");
                } finally {
                  setNahrava(false);
                  e.target.value = "";
                }
              }}
            />
            {form.obrazky.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {form.obrazky.map((url) => (
                  <div key={url} className="relative">
                    <img src={url} alt="" className="h-24 w-28 rounded border bg-surface object-contain" />
                    <button
                      type="button"
                      aria-label="Odebrat fotku"
                      onClick={() =>
                        setForm((f) => (f ? { ...f, obrazky: f.obrazky.filter((x) => x !== url) } : f))
                      }
                      className="absolute -right-2 -top-2 rounded-full border bg-background p-1 shadow"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
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

      {/* HLEDÁNÍ A RYCHLÉ FILTRY */}
      <div className="grid gap-4">
        <label className="relative block">
          <span className="sr-only">Najít produkt podle názvu</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
          <input
            id="hledani"
            value={hledani}
            onChange={(e) => {
              setHledani(e.target.value);
              setUkazat(30);
            }}
            placeholder="Najít produkt — napište kus názvu, třeba Liberty"
            className="min-h-14 w-full rounded-xl border-2 bg-card pl-14 pr-4 text-xl"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["vse", "Všechna"],
              ["web", "Na webu"],
              ["skryte", "Skrytá"],
              ["bezfotky", "Bez fotky"],
              ["elektrokola", "Elektrokola"],
              ["kola", "Kola"],
              ["doplnky", "Doplňky"],
            ] as const
          ).map(([klic, text]) => {
            const pocet = (produkty.data ?? []).filter((p) => vyhovuje(p, klic)).length;
            if (klic === "doplnky" && pocet === 0) return null;
            return (
              <button
                key={klic}
                type="button"
                onClick={() => {
                  setRychlyFiltr(klic);
                  setUkazat(30);
                }}
                className={`min-h-12 rounded-full border-2 px-5 text-lg font-semibold ${rychlyFiltr === klic ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary"}`}
              >
                {text} <span className="opacity-70">{pocet}</span>
              </button>
            );
          })}
        </div>
        <details className="text-base">
          <summary className="cursor-pointer text-muted-foreground">Hledat podle kategorie</summary>
          <select
            id="filtr"
            className="mt-2 min-h-12 w-full rounded-lg border-2 bg-background px-3 text-lg"
            value={filtrKategorie}
            onChange={(e) => setFiltrKategorie(e.target.value)}
          >
            <option value="">všechny kategorie</option>
            {(kategorie.data ?? []).map((k) => (
              <option key={k.id} value={k.id}>
                {nazevSekce(k.sekce)} · {k.znacka ?? "—"} · {k.nazev}
              </option>
            ))}
          </select>
        </details>
      </div>

      {vybrane.size > 0 && (
        <div className="sticky top-2 z-10 grid gap-3 rounded-lg border-2 border-primary bg-card p-4 shadow-card">
          <p className="font-bold">Vybráno {vybrane.size} kol — co s nimi?</p>
          {stahovaniPrubeh && <p className="text-sm text-muted-foreground">{stahovaniPrubeh}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => hromadne.mutate("zobrazit")} disabled={hromadne.isPending}>
              Zobrazit na webu
            </Button>
            <Button size="sm" variant="outline" onClick={() => hromadne.mutate("skryt")} disabled={hromadne.isPending}>
              Skrýt z webu
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => stahnout.mutate()}
              disabled={stahnout.isPending}
            >
              Stáhnout fotky k nám
            </Button>
            <Button size="sm" variant="outline" onClick={() => setVybrane(new Set())}>
              Zrušit výběr
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm(`Opravdu smazat ${vybrane.size} kol? Tohle už nejde vzít zpět.`))
                  hromadne.mutate("smazat");
              }}
              disabled={hromadne.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Smazat
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-2 border-t pt-3">
            <div className="grid gap-2">
              <Label htmlFor="presun">Přesunout do jiné kategorie</Label>
              <select
                id="presun"
                className="h-10 min-w-72 rounded-md border bg-background px-3 text-sm"
                value={hromadnaKategorie}
                onChange={(e) => setHromadnaKategorie(e.target.value)}
              >
                <option value="">— vyberte kategorii —</option>
                {(kategorie.data ?? []).map((k) => (
                  <option key={k.id} value={k.id}>
                    {nazevSekce(k.sekce)} ·{" "}
                    {k.znacka ?? "—"} · {k.nazev}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={!hromadnaKategorie || hromadne.isPending}
              onClick={() => hromadne.mutate("presunout")}
            >
              Přesunout
            </Button>
          </div>
        </div>
      )}

      {/* SEZNAM KOL */}
      <div className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg text-muted-foreground">
            {seznam.length === (produkty.data ?? []).length ? sklonuj(seznam.length, "produkt", "produkty", "produktů") : `${seznam.length} z ${sklonuj((produkty.data ?? []).length, "produktu", "produktů", "produktů")}`}
          </p>
          {seznam.length > 0 && (
            <label className="flex min-h-12 cursor-pointer items-center gap-3 text-lg">
              <input
                type="checkbox"
                className="h-6 w-6 accent-[var(--primary)]"
                checked={vsechnyVybrane}
                onChange={() => setVybrane(vsechnyVybrane ? new Set() : new Set(seznam.map((p) => p.id)))}
              />
              Vybrat všechna zobrazená
            </label>
          )}
        </div>

        {seznam.slice(0, ukazat).map((p) => {
          const k = kategorieKola(p.kategorie_id);
          const zarazeni = k
            ? `${nazevSekce(k.sekce)} · ${k.znacka ?? ""} · ${k.nazev}`
            : "Bez kategorie";
          return (
            <div
              key={p.id}
              className={`flex flex-wrap items-center gap-4 rounded-xl border-2 bg-card p-3 md:p-4 ${vybrane.has(p.id) ? "border-primary" : ""}`}
            >
              <input
                type="checkbox"
                aria-label={`Vybrat ${p.nazev}`}
                className="h-6 w-6 shrink-0 accent-[var(--primary)]"
                checked={vybrane.has(p.id)}
                onChange={() => prepnout(p.id)}
              />
              <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                {p.obrazek_url ? (
                  <img src={p.obrazek_url} alt="" loading="lazy" className="h-full w-full object-contain" />
                ) : (
                  <span className="grid justify-items-center text-xs text-muted-foreground">
                    <Bike className="h-8 w-8" />
                    bez fotky
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-[1_1_260px]">
                <p className="text-xl font-bold leading-tight">{p.nazev}</p>
                <p className="mt-1 truncate text-muted-foreground">{zarazeni}</p>
                <p className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="text-2xl font-bold">{formatCena(p.cena)}</span>
                  <span
                    className={`rounded-full px-3 py-0.5 text-sm font-bold ${p.aktivni ? "bg-accent text-accent-foreground" : "bg-surface text-muted-foreground"}`}
                  >
                    {p.aktivni ? "Na webu" : "Skryté"}
                  </span>
                  {(p.skladem ?? 0) > 0 && <span className="text-sm text-muted-foreground">skladem {p.skladem} ks</span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="lg" className="min-h-12 px-5 text-lg" onClick={() => upravit(p)}>
                  <Pencil className="mr-2 h-5 w-5" /> Upravit
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-12 px-4 text-lg"
                  onClick={async () => {
                    const { error } = await supabase.from("produkty").update({ aktivni: !p.aktivni }).eq("id", p.id);
                    if (error) return void toast.error(error.message);
                    toast.success(p.aktivni ? "Skryto z webu." : "Je na webu.");
                    qc.invalidateQueries({ queryKey: ["admin-produkty"] });
                    qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
                  }}
                >
                  {p.aktivni ? <EyeOff className="mr-2 h-5 w-5" /> : <Eye className="mr-2 h-5 w-5" />}
                  {p.aktivni ? "Skrýt" : "Zveřejnit"}
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="min-h-12 px-3"
                  aria-label={`Smazat ${p.nazev}`}
                  onClick={() => {
                    if (confirm(`Opravdu smazat „${p.nazev}"? Tohle už nejde vzít zpět.`)) smazat.mutate(p.id);
                  }}
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
              </div>
            </div>
          );
        })}

        {seznam.length > ukazat && (
          <button
            type="button"
            onClick={() => setUkazat(ukazat + 30)}
            className="min-h-14 rounded-xl border-2 bg-card text-lg font-semibold hover:border-primary"
          >
            Ukázat další ({Math.min(30, seznam.length - ukazat)})
          </button>
        )}

        {seznam.length === 0 && (
          <p className="rounded-xl border bg-card p-8 text-center text-lg text-muted-foreground">
            {(produkty.data ?? []).length === 0
              ? "Zatím tu není žádné zboží. Stáhněte ho od dodavatele nebo přidejte ručně tlačítky nahoře."
              : "Hledání nic nenašlo."}
          </p>
        )}
      </div>
    </div>
  );
}
