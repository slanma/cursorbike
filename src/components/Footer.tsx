import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/cursorbike-logo.jpg.asset.json";
import { kontakt } from "@/lib/kontakt";


export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <img src={logo.url} alt="Cursorbike" className="h-9 w-auto" width={220} height={60} loading="lazy" />
          <p className="mt-4 text-sm text-ink-muted">
            Rodinná prodejna a servis jízdních kol. Osobní přístup, poctivá práce a kola, která si sami rádi půjčíme.
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
            <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" /> Kravaře 123, 747 21</li>
            <li className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" /> +420 123 456 789</li>
            <li className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" /> email@cursorbike.cz</li>
          </ul>
        </div>

        <div>
          <h3 className="section-title text-sm text-primary">Otevírací doba</h3>
          <ul className="mt-4 space-y-2 text-sm text-ink-muted">
            <li className="flex gap-2"><Clock className="h-4 w-4 shrink-0 text-primary" /> Po–Pá 9:00–17:00</li>
            <li className="pl-6">So 9:00–12:00</li>
            <li className="pl-6">Ne zavřeno</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-foreground/10 py-4 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} Cursorbike — všechna práva vyhrazena
      </div>
    </footer>
  );
}
