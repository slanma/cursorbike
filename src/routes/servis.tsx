import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { BatteryCharging, Stethoscope, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/servis")({
  head: () => ({
    meta: [
      { title: "Servis kol a elektrokol — objednání | Cursorbike" },
      { name: "description", content: "Diagnostika, opravy a repase baterií. Objednejte se online, opravy do 48 hodin." },
      { property: "og:title", content: "Servis kol a elektrokol | Cursorbike" },
      { property: "og:description", content: "Rychlý a spolehlivý servis všech značek kol v Kravařích." },
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

function ServisPage() {
  const [odeslano, setOdeslano] = useState(false);

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
            <a href="tel:+420123456789" className="font-semibold text-primary">+420 123 456 789</a>.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
            <li>Po–Pá 9:00–17:00</li>
            <li>So 9:00–12:00</li>
            <li>Kravaře 123, 747 21</li>
          </ul>
        </div>

        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setOdeslano(true);
            toast.success("Poptávka odeslána", { description: "Ozveme se do jednoho pracovního dne." });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="jmeno">Jméno a příjmení</Label>
            <Input id="jmeno" required placeholder="Jan Novák" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="tel">Telefon</Label>
              <Input id="tel" type="tel" required placeholder="+420 …" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="datum">Preferovaný termín</Label>
              <Input id="datum" type="date" required />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="popis">Co je potřeba udělat?</Label>
            <Textarea id="popis" rows={4} placeholder="Např. seřízení převodů a výměna řetězu." />
          </div>
          <Button type="submit" size="lg">
            {odeslano ? "Odesláno – ozveme se" : "Odeslat poptávku"}
          </Button>
        </form>
      </div>
    </div>
  );
}
