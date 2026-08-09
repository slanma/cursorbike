import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { kontakt } from "@/lib/kontakt";

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — prodejna Cursorbike v Kravařích" },
      { name: "description", content: "Novodvorská 310/13, 747 21 Kravaře. Telefon +420 606 713 763, e-mail cursorbike@seznam.cz. Prodejna, e-shop a cykloservis." },
      { property: "og:title", content: "Kontakt | Cursorbike Kravaře" },
      { property: "og:description", content: "Novodvorská 310/13, Kravaře · +420 606 713 763 · Po–Pá 9–12 a 13–17." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: KontaktPage,
});

function KontaktPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <h1 className="section-title text-4xl">Kontakt</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Prodejna, výdejní místo i cykloservis najdete na jedné adrese v Kravařích ve Slezsku.
      </p>

      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div className="grid gap-4">
          <div className="rounded-lg border bg-card p-6 shadow-card">
            <ul className="space-y-4 text-base">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>
                  <strong>{kontakt.nazev}</strong>
                  <br />
                  {kontakt.ulice}
                  <br />
                  {kontakt.psc} {kontakt.mesto}
                  <br />
                  <a href={kontakt.mapaOdkaz} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Zobrazit na mapě
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <Phone className="h-5 w-5 shrink-0 text-primary" />
                <a href={kontakt.telefonHref} className="font-semibold hover:text-primary">{kontakt.telefon}</a>
              </li>
              <li className="flex gap-3">
                <Mail className="h-5 w-5 shrink-0 text-primary" />
                <a href={kontakt.emailHref} className="hover:text-primary">{kontakt.email}</a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <table className="text-sm">
                  <tbody>
                    {kontakt.otviraciDoba.map((r) => (
                      <tr key={r.den}>
                        <td className="pr-4 font-medium">{r.den}</td>
                        <td>{r.cas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-lg border shadow-card">
            <iframe
              title="Mapa — prodejna Cursorbike, Novodvorská 310/13 Kravaře"
              src={kontakt.mapaEmbed}
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
