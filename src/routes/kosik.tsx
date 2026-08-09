import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useKosik } from "@/lib/kosik";
import { formatCena } from "@/lib/produkty";

const objednavkaSchema = z.object({
  jmeno: z.string().trim().min(2, { message: "Vyplňte jméno" }).max(100),
  email: z.string().trim().email({ message: "Zadejte platný e-mail" }).max(255),
  telefon: z.string().trim().max(30).optional(),
  poznamka: z.string().trim().max(1000).optional(),
});

export const Route = createFileRoute("/kosik")({
  head: () => ({
    meta: [
      { title: "Košík | Cursorbike" },
      { name: "description", content: "Přehled vybraných kol a odeslání nezávazné objednávky." },
      { property: "og:title", content: "Košík | Cursorbike" },
      { property: "og:description", content: "Dokončete svou objednávku kola nebo elektrokola." },
    ],
  }),
  component: KosikPage,
});

function KosikPage() {
  const { radky, celkem, zmenit, odebrat, vyprazdnit } = useKosik();
  const [jmeno, setJmeno] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [poznamka, setPoznamka] = useState("");
  const [odesila, setOdesila] = useState(false);

  const odeslat = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = objednavkaSchema.safeParse({ jmeno, email, telefon, poznamka });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Zkontrolujte údaje");
      return;
    }
    setOdesila(true);
    try {
      const { data, error } = await supabase
        .from("objednavky")
        .insert({
          jmeno: parsed.data.jmeno,
          email: parsed.data.email,
          telefon: parsed.data.telefon || null,
          poznamka: parsed.data.poznamka || null,
          celkem,
        })
        .select("id")
        .single();
      if (error) throw error;

      const { error: chybaPolozek } = await supabase.from("objednavka_polozky").insert(
        radky.map((r) => ({
          objednavka_id: data.id,
          nazev: r.produkt.nazev,
          slug: r.produkt.slug,
          cena: r.produkt.cena,
          pocet: r.pocet,
        })),
      );
      if (chybaPolozek) throw chybaPolozek;

      vyprazdnit();
      setJmeno("");
      setEmail("");
      setTelefon("");
      setPoznamka("");
      toast.success("Objednávka odeslána", { description: "Ozveme se vám s potvrzením dostupnosti." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Objednávku se nepodařilo odeslat");
    } finally {
      setOdesila(false);
    }
  };


  return (
    <div className="mx-auto max-w-5xl px-4 py-12 md:px-6">
      <h1 className="section-title text-4xl">Košík</h1>

      {radky.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-card p-10 text-center shadow-card">
          <p className="text-muted-foreground">Košík je zatím prázdný.</p>
          <Button asChild className="mt-6">
            <Link to="/kola">Prohlédnout kola</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-4">
            {radky.map(({ produkt, pocet }) => (
              <div key={produkt.slug} className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-lg border bg-card p-4 shadow-card">
                <img
                  src={produkt.obrazek}
                  alt={produkt.nazev}
                  width={900}
                  height={700}
                  loading="lazy"
                  className="h-20 w-full rounded bg-surface object-contain"
                />
                <div className="min-w-0">
                  <h2 className="truncate font-bold">{produkt.nazev}</h2>
                  <p className="text-sm text-muted-foreground">{formatCena(produkt.cena)}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => zmenit(produkt.slug, pocet - 1)} aria-label="Ubrat">
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{pocet}</span>
                    <Button variant="outline" size="icon" onClick={() => zmenit(produkt.slug, pocet + 1)} aria-label="Přidat">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => odebrat(produkt.slug)} aria-label="Odebrat">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <button onClick={vyprazdnit} className="justify-self-start text-sm text-muted-foreground hover:text-destructive">
              Vyprázdnit košík
            </button>
          </div>

          <aside className="h-fit rounded-lg border bg-card p-6 shadow-card">
            <h2 className="section-title text-xl">Souhrn</h2>
            <div className="mt-4 flex justify-between text-sm text-muted-foreground">
              <span>Doprava</span>
              <span>Osobní odběr zdarma</span>
            </div>
            <div className="mt-2 flex justify-between border-t pt-4 text-lg font-bold">
              <span>Celkem</span>
              <span>{formatCena(celkem)}</span>
            </div>

            <form className="mt-6 grid gap-3" onSubmit={odeslat}>
              <div className="grid gap-1.5">
                <Label htmlFor="k-jmeno">Jméno a příjmení</Label>
                <Input id="k-jmeno" value={jmeno} maxLength={100} onChange={(e) => setJmeno(e.target.value)} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="k-email">E-mail</Label>
                <Input id="k-email" type="email" value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="k-tel">Telefon</Label>
                <Input id="k-tel" type="tel" value={telefon} maxLength={30} onChange={(e) => setTelefon(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="k-pozn">Poznámka</Label>
                <Textarea id="k-pozn" rows={3} value={poznamka} maxLength={1000} onChange={(e) => setPoznamka(e.target.value)} />
              </div>
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-primary" />
                <span>
                  Souhlasím s{" "}
                  <Link to="/obchodni-podminky" className="text-primary hover:underline">obchodními podmínkami</Link> a beru
                  na vědomí{" "}
                  <Link to="/ochrana-osobnich-udaju" className="text-primary hover:underline">
                    zásady zpracování osobních údajů
                  </Link>
                  .
                </span>
              </label>
              <Button type="submit" className="w-full" size="lg" disabled={odesila}>
                Odeslat objednávku
              </Button>
            </form>

            <p className="mt-3 text-xs text-muted-foreground">
              Objednávka je nezávazná — potvrdíme dostupnost a domluvíme převzetí. Kupní smlouva vzniká až naším
              potvrzením e-mailem.
            </p>

          </aside>

        </div>
      )}
    </div>
  );
}
