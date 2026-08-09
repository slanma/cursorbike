import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, RefreshCcw, ShieldCheck, Wrench } from "lucide-react";
import { Drobky } from "@/components/Drobky";
import { kontakt } from "@/lib/kontakt";

export const Route = createFileRoute("/bazar")({
  head: () => ({
    meta: [
      { title: "Bazar — ověřená ojetá kola a elektrokola | Cursorbike" },
      {
        name: "description",
        content: "Bazar jízdních kol a elektrokol v Kravařích. Každé kolo prohlédnuté v dílně, baterie otestované, se zárukou.",
      },
      { property: "og:title", content: "Bazar | Cursorbike" },
      { property: "og:description", content: "Ojetá kola a elektrokola prověřená naším servisem." },
    ],
  }),
  component: BazarPage,
});

const body = [
  {
    icon: Wrench,
    nadpis: "Prověřeno v dílně",
    text: "Každé bazarové kolo projde kompletní kontrolou, seřízením a výměnou opotřebených dílů.",
  },
  {
    icon: ShieldCheck,
    nadpis: "Otestované baterie",
    text: "U elektrokol měříme reálnou kapacitu baterie a výsledek vám ukážeme před nákupem.",
  },
  {
    icon: RefreshCcw,
    nadpis: "Výkup a protiúčet",
    text: "Staré kolo vykoupíme nebo odečteme z ceny nového. Stačí ho přivézt na prodejnu.",
  },
];

function BazarPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
      <Drobky items={[{ label: "Bazar" }]} />
      <h1 className="section-title text-4xl">Bazar</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Ojetá kola a elektrokola prověřená naším servisem. Nabídka se mění každý týden — aktuální kusy máme
        vystavené na prodejně v Kravařích.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {body.map((b) => (
          <div key={b.nadpis} className="rounded-lg border bg-card p-6 shadow-card">
            <b.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-lg font-bold">{b.nadpis}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border bg-surface p-6">
        <h2 className="text-xl font-bold">Máte zájem o konkrétní kolo?</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Napište nám, co hledáte a v jaké cenové relaci — ozveme se, jakmile takové kolo do bazaru naskladníme.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            to="/kontakt"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Napsat nám
          </Link>
          <a
            href="tel:+420123456789"
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold"
          >
            <Phone className="h-4 w-4" /> {kontakt.telefon}
          </a>
        </div>
      </div>
    </div>
  );
}
