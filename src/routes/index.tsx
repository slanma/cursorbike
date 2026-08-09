import { createFileRoute, Link } from "@tanstack/react-router";
import { Bike, CalendarCheck, ChevronRight, Settings2, BatteryCharging, Wrench, Stethoscope, Store, MapPin, TestTube, ShieldCheck, Tag, Handshake } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import majitel from "@/assets/majitel-hero.jpg";
import { produkty } from "@/lib/produkty";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cursorbike — prodejna a servis jízdních kol v Kravařích" },
      {
        name: "description",
        content:
          "Osobní přístup, profesionální servis a vybraná kola i elektrokola. Cursorbike — vaše kolo v dobrých rukou.",
      },
      { property: "og:title", content: "Cursorbike — kola, elektrokola a servis" },
      {
        property: "og:description",
        content: "Prodejna a servis jízdních kol v Kravařích. Vyberte si kolo nebo si rezervujte servis.",
      },
    ],
  }),
  component: Home,
});

const sluzby = [
  {
    ikona: Stethoscope,
    nazev: "Diagnostika",
    text: "Prohlédneme kolo od šlapek po řídítka a řekneme vám, co skutečně potřebuje.",
  },
  { ikona: Wrench, nazev: "Opravy", text: "Od seřízení převodů po kompletní přestavbu. Většinu zvládneme do 48 hodin." },
  {
    ikona: BatteryCharging,
    nazev: "Repase baterií",
    text: "Vyměníme články ve vaší baterii a vrátíme elektrokolu původní dojezd.",
  },
];

const tipy = [
  {
    ikona: Settings2,
    nazev: "Tlak v pláštích hlídejte každý týden",
    text: "Správně nahuštěné pláště sníží riziko defektu a ušetří vám až 15 % energie při jízdě.",
  },
  {
    ikona: BatteryCharging,
    nazev: "Baterii skladujte na 60 %",
    text: "Přes zimu nechte baterii v teple a nabitou zhruba na 60 %. Vydrží tak výrazně déle.",
  },
  {
    ikona: Wrench,
    nazev: "Řetěz mažte po každém dešti",
    text: "Očištěný a namazaný řetěz vydrží třikrát déle a nezničí vám kazetu ani převodník.",
  },
];

const vyhody = [
  {
    ikona: Store,
    nazev: "Online e-shop & kamenná prodejna",
    body: [
      "Široký výběr pro každého: prodáváme klasická jízdní kola, moderní elektrokola všech typů i elektrokoloběžky a cyklo brašny.",
      "Komfortní modely: specializujeme se mimo jiné na bezpečná elektrokola s nízkým nástupem pro snadné nasedání.",
      "Vyzkoušení zdarma: vše si můžete prohlédnout na e-shopu a osobně otestovat přímo na naší prodejně v Kravařích.",
    ],
  },
  {
    ikona: Wrench,
    nazev: "Odborný cykloservis v regionu",
    body: [
      "Kompletní péče: provádíme profesionální opravy, údržbu, seřízení a diagnostiku kol.",
      "Repase baterií: nabízíme profesionální testování a repase baterií pro elektrokola a elektrokoloběžky. Vrátíme vaší baterii plnou kapacitu a ušetříme vám náklady za nákup nové.",
      "Pro všechny cyklisty: náš servis je plně otevřený — opravíme i kola a elektrokola zakoupená u jiných prodejců.",
    ],
  },
  {
    ikona: ShieldCheck,
    nazev: "Garance nejvýhodnější ceny",
    body: [
      "Trvale nízké ceny: držíme ceny produktů dlouhodobě pod úrovní běžné konkurence.",
      "Dorovnání ceny: pokud na internetu nebo v okolí narazíte na výhodnější nabídku, při návštěvě prodejny vám cenu dorovnáme.",
    ],
  },
];

function Home() {
  const vybrana = produkty.slice(0, 3);
  const vAkci = produkty.filter((p) => p.puvodniCena).slice(0, 3);
  const akcniNeboVybrane = vAkci.length ? vAkci : vybrana;


  return (
    <div>
      {/* HERO */}
      <section className="relative bg-ink text-ink-foreground">
        <div className="mx-auto grid max-w-7xl items-stretch gap-0 md:grid-cols-2">
          <div className="relative min-h-[280px] md:min-h-[520px]">
            <img
              src={majitel}
              alt="Petr, majitel prodejny Cursorbike, ve své dílně"
              width={1600}
              height={1104}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center gap-6 px-6 py-12 md:px-12 md:py-20">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Prodejna & servis Kravaře
            </span>
            <h1 className="text-4xl font-bold uppercase leading-[1.05] md:text-5xl">
              Cursorbike — vaše kolo <span className="text-primary">v dobrých rukou</span>
            </h1>
            <p className="max-w-md text-ink-muted">
              Osobní přístup, profesionální servis a vybraná kola přímo u nás v Kravařích. Poradíme vám s výběrem
              i s tím, co vaše kolo právě potřebuje.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/servis">Rezervujte si servis</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-ink-foreground/25 bg-transparent text-ink-foreground hover:bg-ink-foreground/10">
                <Link to="/kola">Prohlédnout kola</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PROČ MY — hlavní výhody */}
      <section className="border-b bg-card">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <h2 className="section-title text-3xl">Proč nakupovat u Cursorbike</h2>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {vyhody.map((v) => (
              <div key={v.nazev} className="flex flex-col rounded-lg border bg-background p-6 shadow-card">
                <v.ikona className="h-9 w-9 text-primary" />
                <h3 className="mt-4 text-xl font-bold">{v.nazev}</h3>
                <ul className="mt-4 space-y-3">
                  {v.body.map((b) => (
                    <li key={b} className="flex gap-2 text-sm text-muted-foreground">
                      <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AKCE & TIPY */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <h2 className="section-title text-3xl">Kola v akci &amp; tipy z dílny</h2>
            <p className="mt-2 text-muted-foreground">
              Vybral jsem pro vás kola se zvýhodněnou cenou a pár rad, které vám ušetří peníze i čas.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/kola">Všechna kola</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {akcniNeboVybrane.map((p) => (
            <ProductCard key={p.slug} produkt={p} />
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tipy.map((t) => (
            <div key={t.nazev} className="rounded-lg border bg-card p-6 shadow-card">
              <t.ikona className="h-7 w-7 text-primary" />
              <h3 className="mt-4 text-lg font-bold">{t.nazev}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-lg border bg-surface p-6 text-center shadow-card">
          <p className="text-muted-foreground">
            Chcete vědět, kdo za Cursorbike stojí?{" "}
            <Link to="/o-mne" className="font-semibold text-primary hover:underline">
              Přečtěte si o mně
            </Link>
            .
          </p>
        </div>
      </section>


      {/* SERVIS */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <h2 className="section-title text-3xl">Servis rychle a spolehlivě</h2>
              <p className="mt-2 text-muted-foreground">Objednejte se online, většinu oprav vyřídíme do dvou dnů.</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/servis">Objednat servis</Link>
            </Button>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {sluzby.map((s) => (
              <div key={s.nazev} className="rounded-lg border bg-card p-6 shadow-card">
                <s.ikona className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-bold">{s.nazev}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VYBRANÁ KOLA */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div>
            <h2 className="section-title text-3xl">Vybraná kola & e-kola</h2>
            <p className="mt-2 text-muted-foreground">Skladem v prodejně, připravená k okamžitému odvezení.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/kola">Celá nabídka</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vybrana.map((p) => (
            <ProductCard key={p.slug} produkt={p} />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-surface py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] md:px-6">
          <div>
            <h2 className="section-title text-3xl">Časté dotazy</h2>
            <p className="mt-2 text-muted-foreground">
              Nenašli jste odpověď? Zavolejte na <a href="tel:+420123456789" className="font-semibold text-primary">+420 123 456 789</a>.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-2 rounded-md bg-card px-3 py-2 shadow-card">
                <CalendarCheck className="h-4 w-4 text-primary" /> Servis do 48 hodin
              </span>
              <span className="inline-flex items-center gap-2 rounded-md bg-card px-3 py-2 shadow-card">
                <Bike className="h-4 w-4 text-primary" /> Testovací jízdy zdarma
              </span>
              <span className="inline-flex items-center gap-2 rounded-md bg-card px-3 py-2 shadow-card">
                <Settings2 className="h-4 w-4 text-primary" /> Seřízení po záběhu zdarma
              </span>
            </div>
          </div>

          <Accordion type="single" collapsible className="rounded-lg border bg-card px-5 shadow-card">
            <AccordionItem value="1">
              <AccordionTrigger>Jak dlouho trvá repase baterie?</AccordionTrigger>
              <AccordionContent>
                Standardně 5–10 pracovních dnů podle typu článků. Po celou dobu vám můžeme půjčit náhradní baterii.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="2">
              <AccordionTrigger>Servisujete i kola koupená jinde?</AccordionTrigger>
              <AccordionContent>
                Ano, staráme se o kola všech značek včetně elektrokol s motory Bosch, Shimano i Bafang.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="3">
              <AccordionTrigger>Můžu si kolo před koupí vyzkoušet?</AccordionTrigger>
              <AccordionContent>
                Samozřejmě. Testovací jízdu si domluvte telefonicky, kolo vám připravíme a nastavíme na míru.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="4">
              <AccordionTrigger>Jak probíhá objednávka z e-shopu?</AccordionTrigger>
              <AccordionContent>
                Kolo přidáte do košíku a odešlete poptávku. Ozveme se do jednoho pracovního dne a domluvíme převzetí
                v prodejně nebo dopravu.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}
