import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  email: z.string().trim().email({ message: "Zadejte platný e-mail" }).max(255),
  heslo: z.string().min(6, { message: "Heslo musí mít alespoň 6 znaků" }).max(72),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search["next"] === "string" ? { next: search["next"] as string } : {},
  head: () => ({
    meta: [
      { title: "Přihlášení do správy | Cursorbike" },
      { name: "description", content: "Přihlášení obchodníka do administrace e-shopu Cursorbike." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Přihlášení do správy | Cursorbike" },
      { property: "og:description", content: "Interní přihlášení do administrace." },
    ],
  }),
  component: AuthPage,
});

function bezpecnyCil(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

function AuthPage() {
  const navigate = useNavigate();
  const { next } = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [heslo, setHeslo] = useState("");
  const [odesila, setOdesila] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: bezpecnyCil(next) });
    });
  }, [navigate, next]);

  const odeslat = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, heslo });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Zkontrolujte údaje");
      return;
    }
    setOdesila(true);
    try {
      // Registrace na webu není. Účty zakládá jen stávající správce
      // v sekci Správci, stejně jako na vlachfitting.cz.
      const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.heslo });
      if (error) throw new Error("Špatný e-mail nebo heslo.");
      navigate({ to: bezpecnyCil(next) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Přihlášení se nezdařilo");
    } finally {
      setOdesila(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 md:px-6">
      <h1 className="section-title text-3xl">Správa e-shopu</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Přihlaste se, abyste mohli upravovat produkty, kategorie, objednávky a poptávky servisu.
      </p>

      <form onSubmit={odeslat} className="mt-8 grid gap-4 rounded-lg border bg-card p-6 shadow-card">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="heslo">Heslo</Label>
          <Input
            id="heslo"
            type="password"
            autoComplete="current-password"
            value={heslo}
            onChange={(e) => setHeslo(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" disabled={odesila}>
          Přihlásit se
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Přístup do správy zakládá správce prodejny.
        </p>
      </form>
    </div>
  );
}
