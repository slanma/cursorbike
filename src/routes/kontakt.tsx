import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — prodejna Cursorbike v Kravařích" },
      { name: "description", content: "Adresa, otevírací doba a kontakty na prodejnu a servis kol Cursorbike." },
      { property: "og:title", content: "Kontakt | Cursorbike" },
      { property: "og:description", content: "Najdete nás v Kravařích. Zavolejte nebo napište, rádi poradíme." },
    ],
  }),
  component: KontaktPage,
});

function KontaktPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="section-title text-4xl">Kontakt</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Zastavte se v prodejně, zavolejte nebo napište. Na vše odpovídáme do jednoho pracovního dne.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="grid gap-4">
          <div className="rounded-lg border bg-card p-6 shadow-card">
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /> Kravaře 123, 747 21 Kravaře</li>
              <li className="flex gap-3"><Phone className="h-5 w-5 shrink-0 text-primary" /> <a href="tel:+420123456789" className="hover:text-primary">+420 123 456 789</a></li>
              <li className="flex gap-3"><Mail className="h-5 w-5 shrink-0 text-primary" /> <a href="mailto:email@cursorbike.cz" className="hover:text-primary">email@cursorbike.cz</a></li>
              <li className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-primary" /> Po–Pá 9:00–17:00 · So 9:00–12:00</li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-lg border shadow-card">
            <iframe
              title="Mapa — prodejna Cursorbike"
              src="https://www.openstreetmap.org/export/embed.html?bbox=18.0%2C49.90%2C18.06%2C49.94&layer=mapnik"
              className="h-72 w-full border-0"
              loading="lazy"
            />
          </div>
        </div>

        <form
          className="grid gap-4 rounded-lg border bg-card p-6 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Zpráva odeslána", { description: "Děkujeme, brzy se ozveme." });
          }}
        >
          <h2 className="section-title text-2xl">Napište nám</h2>
          <div className="grid gap-2">
            <Label htmlFor="jmeno">Jméno</Label>
            <Input id="jmeno" required placeholder="Jan Novák" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required placeholder="jan@email.cz" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="zprava">Zpráva</Label>
            <Textarea id="zprava" rows={5} required placeholder="Dobrý den, rád bych se zeptal…" />
          </div>
          <Button type="submit" size="lg">Odeslat zprávu</Button>
        </form>
      </div>
    </div>
  );
}
