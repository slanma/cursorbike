import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bike, Camera, CheckCircle2, ClipboardList, Download, Eye, Mail, RefreshCw, Settings, Tag, Wrench } from "lucide-react";
import type { ComponentType } from "react";
import { supabase } from "@/integrations/supabase/client";
import { nactiProfily } from "@/lib/eshop";
import { jeCasNaPrehled, nactiPosledniPrehled } from "@/lib/mesicni-prehled";
import { sklonuj } from "@/lib/cestina";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dnes,
});


type Ukol = {
  klic: string;
  ikona: ComponentType<{ className?: string }>;
  titulek: string;
  popis: string;
  tlacitko: string;
  to: string;
  hlavni?: boolean;
  upozorneni?: boolean;
};

/**
 * Úvodní obrazovka „Dnes".
 *
 * Neukazuje tabulky, ale lidsky napsaný seznam toho, co je dnes potřeba
 * udělat — každá věc s jedním velkým tlačítkem. Když není co dělat, řekne
 * to taky. Je postavená pro obchodníka, který s počítačem moc nepracuje.
 */
function Dnes() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dnes"],
    queryFn: async () => {
      const zacatekMesice = new Date();
      zacatekMesice.setDate(1);
      zacatekMesice.setHours(0, 0, 0, 0);
      const [naWebu, cekaNaKontrolu, bezFotky, objednavky, poptavky, zpravy, mesic, profily, posledni] =
        await Promise.all([
          supabase.from("produkty").select("id", { count: "exact", head: true }).eq("aktivni", true),
          supabase
            .from("produkty")
            .select("id", { count: "exact", head: true })
            .eq("aktivni", false)
            .not("dodavatel", "is", null),
          supabase.from("produkty").select("id", { count: "exact", head: true }).is("obrazek_url", null),
          supabase.from("objednavky").select("id", { count: "exact", head: true }).eq("stav", "nova"),
          supabase.from("servis_poptavky").select("id", { count: "exact", head: true }).eq("stav", "nova"),
          supabase.from("zpravy").select("id", { count: "exact", head: true }).eq("stav", "nova"),
          supabase
            .from("objednavky")
            .select("id", { count: "exact", head: true })
            .gte("created_at", zacatekMesice.toISOString())
            .neq("stav", "zrusena"),
          nactiProfily().catch(() => []),
          nactiPosledniPrehled().catch(() => null),
        ]);
      const staryWeb = await supabase.from("nastaveni").select("hodnota").eq("klic", "stary-web-prevzat").maybeSingle();
      return {
        naWebu: naWebu.count ?? 0,
        cekaNaKontrolu: cekaNaKontrolu.count ?? 0,
        bezFotky: bezFotky.count ?? 0,
        noveObjednavky: objednavky.count ?? 0,
        novePoptavky: poptavky.count ?? 0,
        noveZpravy: zpravy.count ?? 0,
        objednavekMesic: mesic.count ?? 0,
        dodavateluSOdkazem: profily.filter((p) => p.url).length,
        posledniPrehled: posledni,
        staryWebPrevzat: !!staryWeb.data,
      };
    },
  });

  const ukoly: Ukol[] = [];
  if (data) {
    if (!data.staryWebPrevzat) {
      ukoly.push({
        klic: "stary-web",
        ikona: Download,
        titulek: "Převzít starý web",
        popis: "Než přepneme doménu, vezmeme ze starého webu ceny, akce, popisy a fotky. Web to udělá sám.",
        tlacitko: "Převzít",
        to: "/admin/stary-web",
        hlavni: true,
      });
    }
    if (data.noveObjednavky > 0) {
      ukoly.push({
        klic: "objednavky",
        ikona: ClipboardList,
        titulek: `Přišl${data.noveObjednavky === 1 ? "a" : data.noveObjednavky < 5 ? "y" : "o"} ${sklonuj(data.noveObjednavky, "nová objednávka", "nové objednávky", "nových objednávek")}`,
        popis: "Zákazníci čekají na potvrzení. Zkontrolujte je a pošlete výzvu k platbě.",
        tlacitko: "Vyřídit objednávky",
        to: "/admin/objednavky",
        hlavni: true,
      });
    }
    if (data.novePoptavky > 0) {
      ukoly.push({
        klic: "servis",
        ikona: Wrench,
        titulek: `${sklonuj(data.novePoptavky, "nová poptávka", "nové poptávky", "nových poptávek")} servisu`,
        popis: "Někdo chce opravit kolo. Zavolejte mu a domluvte termín.",
        tlacitko: "Podívat se",
        to: "/admin/servis",
      });
    }
    if (data.noveZpravy > 0) {
      ukoly.push({
        klic: "zpravy",
        ikona: Mail,
        titulek: `${sklonuj(data.noveZpravy, "nová zpráva", "nové zprávy", "nových zpráv")} z webu`,
        popis: "Zákazník poslal dotaz přes kontaktní formulář.",
        tlacitko: "Přečíst",
        to: "/admin/zpravy",
      });
    }
    if (data.dodavateluSOdkazem > 0 && jeCasNaPrehled(data.posledniPrehled)) {
      ukoly.push({
        klic: "prehled",
        ikona: RefreshCw,
        titulek: "Je čas na měsíční přehled od dodavatelů",
        popis: "Podíváme se, co mají dodavatelé nového a jestli změnili ceny. Odpovíte na tři otázky.",
        tlacitko: "Projít přehled",
        to: "/admin/prehled",
      });
    }
    if (data.cekaNaKontrolu > 0) {
      ukoly.push({
        klic: "kontrola",
        ikona: Eye,
        titulek: `${sklonuj(data.cekaNaKontrolu, "produkt čeká", "produkty čekají", "produktů čeká")} na kontrolu`,
        popis: "Přišly od dodavatele a zatím jsou skryté. Projděte je a zveřejněte.",
        tlacitko: "Zkontrolovat",
        to: "/admin/produkty",
      });
    }
    if (data.bezFotky > 0) {
      ukoly.push({
        klic: "fotky",
        ikona: Camera,
        titulek: `${sklonuj(data.bezFotky, "produkt nemá", "produkty nemají", "produktů nemá")} fotku`,
        popis: "Bez fotky se zboží špatně prodává. Vyfoťte ho mobilem a nahrajte.",
        tlacitko: "Doplnit fotky",
        to: "/admin/produkty",
        upozorneni: true,
      });
    }
  }

  const akce: { to: string; ikona: ComponentType<{ className?: string }>; nazev: string; popis: string }[] = [
    { to: "/admin/feedy", ikona: Bike, nazev: "Přidat zboží", popis: "Od dodavatele nebo ručně" },
    { to: "/admin/ceny", ikona: Tag, nazev: "Změnit ceny", popis: "Akce, slevy, celé značky" },
    { to: "/admin/objednavky", ikona: ClipboardList, nazev: "Objednávky a servis", popis: "Kdo co chce a co je hotové" },
    { to: "/admin/nastaveni", ikona: Settings, nazev: "Nastavení", popis: "Údaje o obchodě, účet, lidé" },
  ];

  return (
    <div className="grid gap-10 text-lg">
      <section>
        <h2 className="section-title text-4xl md:text-5xl">Dobrý den</h2>
        <p className="mt-2 text-xl text-muted-foreground">
          {isLoading
            ? "Díváme se, co je nového…"
            : ukoly.length === 0
              ? "Dnes nemáte na webu nic na práci."
              : `Dnes máte na webu ${sklonuj(ukoly.length, "jednu věc", "věci", "věcí")} na práci.`}
        </p>
      </section>

      <section aria-labelledby="dnes-nadpis" className="grid gap-3">
        <h3 id="dnes-nadpis" className="section-title text-3xl">Co udělat dnes</h3>
        {!isLoading && ukoly.length === 0 && (
          <div className="flex items-center gap-4 rounded-xl border-2 border-primary bg-card p-6">
            <CheckCircle2 className="h-10 w-10 shrink-0 text-primary" />
            <p className="text-xl font-semibold">Všechno je hotové. Můžete si dát kafe.</p>
          </div>
        )}
        {ukoly.map((u) => (
          <div
            key={u.klic}
            className={`flex flex-wrap items-center gap-5 rounded-xl bg-card p-5 md:p-6 ${u.hlavni ? "border-2 border-primary" : "border"}`}
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${u.upozorneni ? "bg-amber-100 text-amber-900" : "bg-accent text-accent-foreground"}`}
            >
              <u.ikona className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-[1_1_320px]">
              <p className="text-2xl font-bold">{u.titulek}</p>
              <p className="mt-0.5 text-muted-foreground">{u.popis}</p>
            </div>
            <Link
              to={u.to}
              className={`inline-flex min-h-14 items-center justify-center rounded-lg px-7 text-xl font-bold ${
                u.hlavni || !u.upozorneni
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border-2 border-primary text-primary hover:bg-primary/5"
              }`}
            >
              {u.tlacitko}
            </Link>
          </div>
        ))}
      </section>

      <section aria-labelledby="akce-nadpis" className="grid gap-3">
        <h3 id="akce-nadpis" className="section-title text-3xl">Co chcete udělat?</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {akce.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex min-h-44 flex-col gap-3 rounded-xl border bg-card p-6 transition-colors hover:border-primary"
            >
              <a.ikona className="h-11 w-11 text-primary" />
              <span className="text-2xl font-bold leading-tight">{a.nazev}</span>
              <span className="text-muted-foreground">{a.popis}</span>
            </Link>
          ))}
        </div>
      </section>

      {data && (
        <section aria-labelledby="stav-nadpis" className="grid gap-3">
          <h3 id="stav-nadpis" className="section-title text-3xl">Jak na tom jsme</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Cislo popis="Produktů na webu" hodnota={String(data.naWebu)} />
            <Cislo popis="Objednávek tento měsíc" hodnota={String(data.objednavekMesic)} />
            <Cislo
              popis="Poslední přehled od dodavatelů"
              hodnota={data.posledniPrehled ? new Date(data.posledniPrehled).toLocaleDateString("cs-CZ") : "zatím nebyl"}
            />
          </div>
        </section>
      )}

      <Pomoc />
    </div>
  );
}

function Cislo({ popis, hodnota }: { popis: string; hodnota: string }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-muted-foreground">{popis}</p>
      <p className="section-title mt-1 text-4xl">{hodnota}</p>
    </div>
  );
}

/** Pevní průvodci — nic nestojí a vždycky ukážou stejný postup. */
const NAVODY: { otazka: string; kroky: string[] }[] = [
  {
    otazka: "Jak dám produkt do akce?",
    kroky: [
      "Nahoře klikněte na Zboží.",
      "Do políčka Najít produkt napište kus názvu.",
      "U produktu klikněte na Upravit.",
      "Do políčka Původní cena napište cenu, za kterou se prodávalo dosud.",
      "Do políčka Cena napište novou akční cenu.",
      "Dole klikněte na Uložit. Na webu bude stará cena přeškrtnutá.",
    ],
  },
  {
    otazka: "Jak přidám zboží, které mám v prodejně?",
    kroky: [
      "Nahoře klikněte na Zboží.",
      "Klikněte na Přidat produkt ručně.",
      "Napište název, cenu a vyberte kategorii.",
      "Nahrajte fotku — stačí z mobilu.",
      "Zapněte přepínač Zobrazit na webu a klikněte na Uložit.",
    ],
  },
  {
    otazka: "Jak vyřídím objednávku?",
    kroky: [
      "Na této stránce klikněte na Vyřídit objednávky (nebo nahoře na Objednávky).",
      "Zkontrolujte, co si zákazník objednal a jestli to máte.",
      "Když platí převodem, klikněte na Ukázat QR kód k zaplacení a pošlete mu ho.",
      "Stav objednávky přepněte na Vyřizuje se. Až si zboží vyzvedne, přepněte na Dokončená.",
    ],
  },
  {
    otazka: "Jak přidám nového dodavatele?",
    kroky: [
      "Nahoře klikněte na Zboží a pak na Stáhnout zboží od dodavatele.",
      "Klikněte na Přidat dodavatele.",
      "Napište jeho jméno a vložte odkaz na feed, který vám poslal. Klikněte na Načíst.",
      "Web sám navrhne, co je název, cena a fotky. Podívejte se na ukázku dole.",
      "Klikněte na Uložit dodavatele a pokračovat. Příště už stačí měsíční přehled.",
    ],
  },
  {
    otazka: "Jak změním ceny u všeho zboží od jednoho dodavatele?",
    kroky: [
      "Nahoře klikněte na Ceny.",
      "Vyberte dodavatele.",
      "Klikněte, o kolik má být cena nižší nebo vyšší, a jak ji zaokrouhlit. Hned uvidíte příklad.",
      "Klikněte na Uložit pravidlo. Když se spletete, klikněte na Vrátit zpět.",
    ],
  },
];

function Pomoc() {
  return (
    <section id="pomoc" aria-labelledby="pomoc-nadpis" className="grid gap-4 rounded-xl bg-amber-50 p-6 md:p-8">
      <div>
        <h3 id="pomoc-nadpis" className="section-title text-3xl text-amber-950">
          Nevíte si rady?
        </h3>
        <p className="mt-1 text-xl text-amber-950">
          Klikněte na otázku a ukážeme vám postup krok za krokem. Nic nerozbijete — změny jdou vrátit.
        </p>
      </div>
      <div className="grid gap-3">
        {NAVODY.map((n) => (
          <details key={n.otazka} className="group rounded-lg bg-card">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 text-xl font-semibold">
              {n.otazka}
              <span className="text-primary group-open:rotate-180" aria-hidden="true">
                ▾
              </span>
            </summary>
            <ol className="grid gap-2 px-5 pb-5 text-lg">
              {n.kroky.map((k, i) => (
                <li key={k} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{k}</span>
                </li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </section>
  );
}
