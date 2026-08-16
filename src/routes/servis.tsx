import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BatteryCharging, Stethoscope, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { kontakt } from "@/lib/kontakt";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { drobkyLd, jsonLdScript, kanonicka, servisLd } from "@/lib/seo";

export const Route = createFileRoute("/servis")({
  head: () => ({
    meta: [
      { title: "Servis kol a elektrokol — objednání | Cursorbike" },
      { name: "description", content: "Diagnostika, opravy a repase baterií. Objednejte se online, opravy do 48 hodin." },
      { property: "og:title", content: "Servis kol a elektrokol | Cursorbike" },
      { property: "og:description", content: "Rychlý a spolehlivý servis všech značek kol v Kravařích." },
    ],
    links: [kanonicka("/servis")],
    scripts: [
      jsonLdScript(servisLd()),
      jsonLdScript(drobkyLd([{ nazev: "Úvod", cesta: "/" }, { nazev: "Servis", cesta: "/servis" }])),
    ],
  }),
  component: ServisPage,
});

const cenik = [
  { ikona: Stethoscope, nazev: "Diagnostika", cena: "od 250 Kč", text: "Kontrola celého kola a návrh oprav." },
  { ikona: Wrench, nazev: "Malý servis", cena: "od 690 Kč", text: "Seřízení převodů, brzd, kontrola pohyblivých částí." },
  { ikona: Wrench, nazev: "Velký servis", cena: "od 1 490 Kč", text: "Rozebrání, vyčištění, výměna lanek a mazání." },
  { ikona: BatteryCharging, nazev: "Repase baterie", cena: "od 4 900 Kč", text: "Výměna článků a test kapacity." },
];

const poptavkaSchema = z.object({
  jmeno: z.string().trim().min(2, { message: "Vyplňte jméno" }).max(100),
  email: z.string().trim().email({ message: "Zadejte platný e-mail" }).max(255),
  telefon: z.string().trim().max(30).optional(),
  termin: z.string().trim().max(30).optional(),
  popis: z.string().trim().max(1000).optional(),
});

function ServisPage() {
  const [odeslano, setOdeslano] = useState(false);
  const [odesila, setOdesila] = useState(false);
  const [jmeno, setJmeno] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [termin, setTermin] = useState("");
  const [popis, setPopis] = useState("");
  const [typSluzby, setTypSluzby] = useState(cenik[0]!.nazev);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="section-title text-4xl">Servis</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Postaráme se o kola všech značek včetně elektrokol. Většinu oprav zvládneme do 48 hodin.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-4">
        {cenik.map((s) => (
          <div key={s.nazev} className="rounded-lg border bg-card p-6 shadow-card">
            <s.ikona className="h-7 w-7 text-primary" />
            <h2 className="mt-4 text-lg font-bold">{s.nazev}</h2>
            <p className="mt-1 text-sm font-semibold text-brand-red">{s.cena}</p>
            <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 grid gap-10 rounded-lg border bg-card p-6 shadow-card md:grid-cols-2 md:p-10">
        <div>
          <h2 className="section-title text-2xl">Objednat termín</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Vyplňte formulář a my se vám ozveme s potvrzením termínu. Nebo zavolejte na{" "}
            <a href={kontakt.telefonHref} className="font-semibold text-primary">{kontakt.telefon}</a>.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>Po–Pá 9:00–12:00 a 13:00–17:00</li>
            <li>So a Ne zavřeno</li>
            <li>{kontakt.adresaJednoradek}</li>
          </ul>
        </div>

        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const parsed = poptavkaSchema.safeParse({ jmeno, email, telefon, termin, popis });
            if (!parsed.success) {
              toast.error(parsed.error.issues[0]?.message ?? "Zkontrolujte údaje");
              return;
            }
            setOdesila(true);
            try {
              const { error } = await supabase.from("servis_poptavky").insert({
                jmeno: parsed.data.jmeno,
                email: parsed.data.email,
                telefon: parsed.data.telefon || null,
                termin: parsed.data.termin || null,
                popis: parsed.data.popis || null,
                typ_sluzby: typSluzby,
              });
              if (error) throw error;
              setOdeslano(true);
              setJmeno("");
              setEmail("");
              setTelefon("");
              setTermin("");
              setPopis("");
              toast.success("Poptávka odeslána", { description: "Ozveme se do jednoho pracovního dne." });
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Poptávku se nepodařilo odeslat");
            } finally {
              setOdesila(false);
            }
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="jmeno">Jméno a příjmení</Label>
            <Input id="jmeno" required maxLength={100} value={jmeno} onChange={(e) => setJmeno(e.target.value)} placeholder="Jan Novák" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" required maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@email.cz" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tel">Telefon</Label>
              <Input id="tel" type="tel" maxLength={30} value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="+420 …" />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="typ">Co potřebujete</Label>
              <select
                id="typ"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={typSluzby}
                onChange={(e) => setTypSluzby(e.target.value)}
              >
                {cenik.map((s) => (
                  <option key={s.nazev} value={s.nazev}>
                    {s.nazev}
                  </option>
                ))}
                <option value="Jiné">Jiné</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="datum">Preferovaný termín</Label>
              <Input id="datum" type="date" value={termin} onChange={(e) => setTermin(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="popis">Co je potřeba udělat?</Label>
            <Textarea id="popis" rows={4} maxLength={1000} value={popis} onChange={(e) => setPopis(e.target.value)} placeholder="Např. seřízení převodů a výměna řetězu." />
          </div>
          <label className="flex items-start gap-2 text-xs text-muted-foreground">
            <input type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
            <span>
              Beru na vědomí{" "}
              <Link to="/ochrana-osobnich-udaju" className="text-primary hover:underline">
                zásady zpracování osobních údajů
              </Link>
              .
            </span>
          </label>
          <Button type="submit" size="lg" disabled={odesila}>
            {odeslano ? "Odesláno – ozveme se" : "Odeslat poptávku"}
          </Button>
        </form>

      </div>
    </div>
  );
}
