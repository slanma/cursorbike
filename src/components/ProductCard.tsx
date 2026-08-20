import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useKosik } from "@/lib/kosik";
import { dostupnost, formatCena, type Produkt } from "@/lib/produkty";

export function ProductCard({ produkt }: { produkt: Produkt }) {
  const { pridat } = useKosik();
  const stav = dostupnost(produkt);
  // Kolo s velikostmi rámu nejde koupit z výpisu — velikost se vybírá v detailu.
  const vybiraVelikost = produkt.velikosti.length > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-shadow hover:shadow-lg">
      <Link to="/kolo/$slug" params={{ slug: produkt.slug }} className="relative block bg-surface">
        <img
          src={produkt.obrazek}
          alt={produkt.nazev}
          width={900}
          height={700}
          loading="lazy"
          className="h-56 w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {produkt.oblibene && (
            <span className="rounded bg-primary px-2 py-1 text-xs font-bold uppercase text-primary-foreground">
              Oblíbené
            </span>
          )}
          {produkt.puvodniCena && (
            <span className="rounded bg-brand-red px-2 py-1 text-xs font-bold uppercase text-ink-foreground">
              Akce
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">{produkt.typ}</span>
        <h3 className="text-lg font-bold leading-tight">
          <Link to="/kolo/$slug" params={{ slug: produkt.slug }} className="hover:text-primary">
            {produkt.nazev}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{produkt.kratky}</p>
        <p className={`text-sm font-semibold ${stav.lzeKoupit ? "text-primary" : "text-muted-foreground"}`}>
          {stav.text}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {produkt.puvodniCena && (
              <div className="text-xs text-muted-foreground line-through">{formatCena(produkt.puvodniCena)}</div>
            )}
            <div className="text-xl font-bold">{formatCena(produkt.cena)}</div>
          </div>
          {vybiraVelikost || !stav.lzeKoupit ? (
            <Button asChild variant={stav.lzeKoupit ? "default" : "outline"}>
              <Link to="/kolo/$slug" params={{ slug: produkt.slug }}>
                {stav.lzeKoupit ? "Vybrat velikost" : "Detail"}
              </Link>
            </Button>
          ) : (
            <Button
              onClick={() => {
                pridat(produkt.slug);
                toast.success("Přidáno do košíku", { description: produkt.nazev });
              }}
            >
              Do košíku
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
