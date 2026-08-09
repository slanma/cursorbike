import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { odeberSpravce, pridejSpravce, seznamSpravcu } from "@/lib/spravci.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/spravci")({
  component: Spravci,
});

function Spravci() {
  const qc = useQueryClient();
  const nacti = useServerFn(seznamSpravcu);
  const pridej = useServerFn(pridejSpravce);
  const odeber = useServerFn(odeberSpravce);
  const [email, setEmail] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["spravci"], queryFn: () => nacti({}) });

  const mPridej = useMutation({
    mutationFn: (e: string) => pridej({ data: { email: e } }),
    onSuccess: () => {
      toast.success("Správce přidán.");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["spravci"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Nepodařilo se přidat správce."),
  });

  const mOdeber = useMutation({
    mutationFn: (userId: string) => odeber({ data: { userId } }),
    onSuccess: () => {
      toast.success("Správce odebrán.");
      qc.invalidateQueries({ queryKey: ["spravci"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Nepodařilo se odebrat správce."),
  });

  const pocet = data?.length ?? 0;

  return (
    <div className="grid gap-8">
      <section className="rounded-lg border bg-card p-6 shadow-card">
        <h2 className="section-title text-xl">Správci prodejny</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Do administrace mohou mít přístup nejvýše dva lidé. Druhý správce se musí nejdřív zaregistrovat
          e-mailem a heslem na přihlašovací stránce, potom ho tady přidáte podle jeho e-mailu.
        </p>

        {isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Načítáme…</p>
        ) : (
          <ul className="mt-4 divide-y">
            {(data ?? []).map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <span className="font-semibold">
                  {s.email} {s.jaSam && <span className="text-muted-foreground">(vy)</span>}
                </span>
                {!s.jaSam && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={mOdeber.isPending}
                    onClick={() => {
                      if (confirm(`Opravdu odebrat přístup pro ${s.email}?`)) mOdeber.mutate(s.userId);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Odebrat
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border bg-card p-6 shadow-card">
        <h2 className="section-title text-xl">Přidat druhého správce</h2>
        {pocet >= 2 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Máte už dva správce. Chcete-li přidat jiného, nejdřív některého odeberte.
          </p>
        ) : (
          <form
            className="mt-4 grid gap-3 sm:max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              mPridej.mutate(email);
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="email-spravce">E-mail nového správce</Label>
              <Input
                id="email-spravce"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kolega@cursorbike.cz"
                required
              />
            </div>
            <Button type="submit" disabled={mPridej.isPending}>
              Přidat správce
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
