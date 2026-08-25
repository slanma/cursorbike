import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Vstupní stránka do správy prodejny.
 *
 * Vznikla proto, aby bylo na první pohled jasné, že sem běžný zákazník
 * nepatří — dřív se chodilo na obecné přihlášení a teprve za ním se
 * ukázalo, že účet nemá oprávnění.
 *
 * Přístup mají jen účty, kterým správce roli výslovně přidělil. Nově
 * zaregistrovaný účet ji nedostane sám od sebe.
 */
export const Route = createFileRoute("/sprava")({
  head: () => ({
    meta: [
      { title: "Správa prodejny | Cursorbike" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Sprava,
});

function Sprava() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [heslo, setHeslo] = useState("");
  const [odesila, setOdesila] = useState(false);
  const [prihlasen, setPrihlasen] = useState<string | null>(null);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setPrihlasen(data.user?.email ?? null));
  }, []);

  const prihlasit = async () => {
    if (!email.trim() || !heslo) {
      toast.error("Vyplňte e-mail i heslo");
      return;
    }
    setOdesila(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: heslo });
    setOdesila(false);
    if (error) {
      toast.error("Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo.");
      return;
    }
    void navigate({ to: "/admin" });
  };

  const odhlasit = async () => {
    await supabase.auth.signOut();
    setPrihlasen(null);
    toast.success("Odhlášeno");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:px-6">
      <div className="rounded-lg border bg-card p-8 shadow-card">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <h1 className="section-title text-2xl">Správa prodejny</h1>
        </div>

        <p className="mt-3 text-sm text-muted-foreground">
          Tahle část webu je jen pro obsluhu e-shopu — zakládání kol, ceny, sklad a objednávky.
          Pokud jste zákazník, tady nic nepotřebujete.
        </p>

        <div className="mt-5 rounded-md border bg-surface p-4 text-sm">
          <p className="font-semibold">Přístup mají dva účty</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>• správce webu</li>
            <li>• prodejna Cursorbike</li>
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Další účet přidá stávající správce v sekci Správci. Registrace na webu sama o sobě
            přístup do správy nedává.
          </p>
        </div>

        {prihlasen ? (
          <div className="mt-6 grid gap-3">
            <p className="text-sm">
              Jste přihlášeni jako <span className="font-semibold">{prihlasen}</span>.
            </p>
            <Button onClick={() => void navigate({ to: "/admin" })}>Pokračovat do správy</Button>
            <Button variant="outline" onClick={() => void odhlasit()}>
              Přihlásit se jiným účtem
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void prihlasit()}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="heslo">Heslo</Label>
              <Input
                id="heslo"
                type="password"
                autoComplete="current-password"
                value={heslo}
                onChange={(e) => setHeslo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void prihlasit()}
              />
            </div>
            <Button onClick={() => void prihlasit()} disabled={odesila}>
              {odesila ? "Přihlašuji…" : "Přihlásit se do správy"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
