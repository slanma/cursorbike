import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { nactiNastaveni, ulozNastaveni, type NastaveniEshopu } from "@/lib/eshop";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/nastaveni")({
  component: Nastaveni,
});

function Nastaveni() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["nastaveni"], queryFn: nactiNastaveni });

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
    </div>
  );
}
