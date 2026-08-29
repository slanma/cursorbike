import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { nactiNastaveni, nactiPlatbu, ulozNastaveni, ulozPlatbu, type NastaveniEshopu } from "@/lib/eshop";
import { formatIban, naIban, type UdajePlatby } from "@/lib/platba";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin/nastaveni")({
  component: Nastaveni,
});

function Nastaveni() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["nastaveni"], queryFn: nactiNastaveni });
  const platba = useQuery({ queryKey: ["platba"], queryFn: nactiPlatbu });
  const [form, setForm] = useState<UdajePlatby | null>(null);

  const aktualni = form ?? platba.data ?? null;
  // IBAN se dopočítá z čísla účtu — obchodník ho zpravidla nezná zpaměti.
  const iban = aktualni ? naIban(aktualni.ucet) : null;

  const ulozitPlatbu = useMutation({
    mutationFn: async (u: UdajePlatby) => {
      const spocitany = naIban(u.ucet);
      if (u.ucet && !spocitany) throw new Error("Číslo účtu nedává smysl. Napište ho jako 123456789/0800.");
      await ulozPlatbu({ ...u, iban: spocitany ?? "" });
    },
    onSuccess: () => {
      toast.success("Platební údaje uloženy");
      qc.invalidateQueries({ queryKey: ["platba"] });
      setForm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ulozit = useMutation({
    mutationFn: (n: NastaveniEshopu) => ulozNastaveni(n),
    onSuccess: () => {
      toast.success("Nastavení uloženo");
      qc.invalidateQueries({ queryKey: ["nastaveni"] });
      qc.invalidateQueries({ queryKey: ["verejne-produkty"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading || !data) {
    return <p className="text-muted-foreground">Načítáme nastavení…</p>;
  }

  return (
    <div className="grid gap-8">
      <h2 className="section-title text-2xl">Nastavení e-shopu</h2>

      <div className="rounded-lg border bg-card p-6 shadow-card">
        <label className="flex items-start justify-between gap-6">
          <span>
            <span className="font-bold">Zobrazovat ukázková kola</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              Na webu je šest ukázkových kol, aby stránky nebyly prázdné. Až budete mít vlastní kola
              nahraná, tímto přepínačem ukázková schováte. Nezmizí nadobro — dají se kdykoli zapnout zpět.
            </span>
          </span>
          <Switch
            checked={data.zobrazovat_ukazkove}
            disabled={ulozit.isPending}
            onCheckedChange={(v) => ulozit.mutate({ ...data, zobrazovat_ukazkove: v })}
          />
        </label>
      </div>

      {/* PLATBA */}
      <div className="grid gap-4 rounded-lg border bg-card p-6 shadow-card">
        <div>
          <h3 className="text-base font-bold">Platba převodem a QR kód</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Zákazník po objednávce uvidí QR kód, načte ho v bankovní aplikaci a zaplatí. Stejný kód
            uvidíte i vy u objednávky. Nic to nestojí, žádná platební brána.
          </p>
        </div>

        {aktualni && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ucet">Číslo účtu</Label>
                <Input
                  id="ucet"
                  placeholder="19-2000145399/0800"
                  value={aktualni.ucet}
                  onChange={(e) => setForm({ ...aktualni, ucet: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Napište ho tak, jak ho znáte — i s předčíslím a lomítkem.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="prijemce">Název příjemce</Label>
                <Input
                  id="prijemce"
                  placeholder="Cursorbike s.r.o."
                  value={aktualni.jmeno_prijemce}
                  onChange={(e) => setForm({ ...aktualni, jmeno_prijemce: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="splatnost">Splatnost (dní)</Label>
                <Input
                  id="splatnost"
                  type="number"
                  min={1}
                  max={60}
                  value={aktualni.splatnost_dni}
                  onChange={(e) =>
                    setForm({ ...aktualni, splatnost_dni: Number(e.target.value) || 7 })
                  }
                />
              </div>
            </div>

            <div className="rounded-md border bg-surface p-4 text-sm">
              {aktualni.ucet ? (
                iban ? (
                  <>
                    <span className="text-muted-foreground">Pro QR kód se použije </span>
                    <span className="font-semibold">{formatIban(iban)}</span>
                    <span className="text-muted-foreground"> — spočítali jsme to z čísla účtu.</span>
                  </>
                ) : (
                  <span className="text-destructive">
                    Tohle číslo účtu neumíme přečíst. Zkuste tvar 123456789/0800.
                  </span>
                )
              ) : (
                <span className="text-muted-foreground">
                  Dokud číslo účtu nevyplníte, QR kód se zákazníkovi nezobrazí.
                </span>
              )}
            </div>

            <div>
              <Button
                disabled={ulozitPlatbu.isPending || !form}
                onClick={() => form && ulozitPlatbu.mutate(form)}
              >
                {ulozitPlatbu.isPending ? "Ukládám…" : "Uložit platební údaje"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
