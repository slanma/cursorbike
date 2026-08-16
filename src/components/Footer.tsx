import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { kontakt } from "@/lib/kontakt";
import { otevriNastaveniCookies } from "@/components/CookieLista";
import { prodavajici } from "@/lib/pravni";


export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <img
            src="/cursorbike-logo-svetly.png"
            alt="Cursorbike"
            className="h-9 w-auto"
            width={359}
            height={79}
            loading="lazy"
          />
          <p className="mt-4 text-sm text-ink-muted">
            Prodejna, e-shop a cykloservis v Kravařích ve Slezsku. Na trhu od roku {kontakt.odRoku}.
          </p>

        </div>

        <div>
          <h3 className="section-title text-sm text-primary">Nabídka</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li><Link to="/kola" className="hover:text-primary">Kola</Link></li>
            <li><Link to="/elektrokola" className="hover:text-primary">Elektrokola</Link></li>
            <li><Link to="/bazar" className="hover:text-primary">Bazar</Link></li>
            <li><Link to="/servis" className="hover:text-primary">Servis</Link></li>

            <li><Link to="/kontakt" className="hover:text-primary">Kontakt</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="section-title text-sm text-primary">Kontakt</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-muted">
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /> {kontakt.adresaJednoradek}</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /> <a href={kontakt.telefonHref} className="hover:text-primary">{kontakt.telefon}</a></li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" /> <a href={kontakt.emailHref} className="hover:text-primary">{kontakt.email}</a></li>
          </ul>
        </div>

        <div>
          <h3 className="section-title text-sm text-primary">Otevírací doba</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-primary" /> Po–Pá 9:00–12:00 a 13:00–17:00</li>
            <li className="pl-6">Sobota zavřeno</li>
            <li className="pl-6">Neděle zavřeno</li>
          </ul>
        </div>

      </div>

      <div className="border-t border-ink-foreground/10 py-5">
        <nav className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-6 gap-y-2 px-4 text-sm text-ink-muted md:px-6">
          <Link to="/obchodni-podminky" className="hover:text-primary">Obchodní podmínky</Link>
          <Link to="/ochrana-osobnich-udaju" className="hover:text-primary">Ochrana osobních údajů</Link>
          <Link to="/odstoupeni-od-smlouvy" className="hover:text-primary">Odstoupení od smlouvy</Link>
          <button type="button" onClick={otevriNastaveniCookies} className="hover:text-primary">
            Nastavení cookies
          </button>
        </nav>
      </div>

      <div className="border-t border-ink-foreground/10 py-4 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} {prodavajici.oznaceni}, IČO {prodavajici.ico} — všechna práva vyhrazena
        {" · "}
        <Link to="/auth" className="hover:text-primary">
          Správa e-shopu
        </Link>
      </div>
    </footer>
  );
}
