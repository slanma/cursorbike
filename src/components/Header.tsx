import { Link } from "@tanstack/react-router";
import { Menu, Phone, ShoppingCart, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/cursorbike-logo-light.png";
import { useKosik } from "@/lib/kosik";
import { kontakt } from "@/lib/kontakt";

const odkazy = [
  { to: "/kola", label: "Kola" },
  { to: "/elektrokola", label: "Elektrokola" },
  { to: "/bazar", label: "Bazar" },
  { to: "/servis", label: "Servis" },
  { to: "/o-mne", label: "O mně" },
  { to: "/kontakt", label: "Kontakt" },
] as const;

export function Header() {
  const { pocetKusu } = useKosik();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background text-foreground">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 md:px-6">
        <Link to="/" className="flex min-w-0 items-center" onClick={() => setOpen(false)}>
          <img src={logo} alt="Cursorbike" className="h-11 w-auto shrink-0" width={220} height={60} />
        </Link>

        <div className="flex items-center gap-2 md:gap-6">
          <nav className="hidden items-center gap-6 md:flex">
            {odkazy.map((o) => (
              <Link
                key={o.to}
                to={o.to}
                className="text-sm font-semibold uppercase tracking-wide text-foreground/75 transition-colors hover:text-primary"
                activeProps={{ className: "text-primary" }}
              >
                {o.label}
              </Link>
            ))}
          </nav>

          <span className="hidden items-center gap-2 border-l pl-6 text-sm lg:flex">
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            <a href={kontakt.telefonHref} className="font-semibold hover:text-primary">{kontakt.telefon}</a>
          </span>

          <Link
            to="/kosik"
            className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface transition-colors hover:bg-primary hover:text-primary-foreground"
            aria-label="Košík"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
              {pocetKusu}
            </span>
          </Link>

          <button
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t md:hidden">
          {odkazy.map((o) => (
            <Link
              key={o.to}
              to={o.to}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-semibold uppercase tracking-wide text-foreground/80"
              activeProps={{ className: "text-primary" }}
            >
              {o.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
