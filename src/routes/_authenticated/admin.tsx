import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bike, ClipboardList, LayoutGrid, LogOut, Mail, Settings, Users, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { zjistiSpravce } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const odkazy = [
  { to: "/admin", label: "Přehled", icon: LayoutGrid, exact: true },
  { to: "/admin/produkty", label: "Produkty", icon: Bike, exact: false },
  { to: "/admin/kategorie", label: "Kategorie", icon: LayoutGrid, exact: false },
  { to: "/admin/objednavky", label: "Objednávky", icon: ClipboardList, exact: false },
  { to: "/admin/servis", label: "Servis", icon: Wrench, exact: false },
  { to: "/admin/zpravy", label: "Zprávy", icon: Mail, exact: false },
  { to: "/admin/spravci", label: "Správci", icon: Users, exact: false },
  { to: "/admin/nastaveni", label: "Nastavení", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const overit = useServerFn(zjistiSpravce);
  const { data, isLoading } = useQuery({ queryKey: ["je-spravce"], queryFn: () => overit({}) });

  if (isLoading) {
    return <div className="mx-auto max-w-5xl px-4 py-20 text-muted-foreground md:px-6">Načítáme správu…</div>;
  }

  if (!data?.admin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center md:px-6">
        <h1 className="section-title text-3xl">Nemáte přístup do správy</h1>
        <p className="mt-3 text-muted-foreground">
          Tento účet nemá oprávnění obchodníka. Přihlaste se prosím účtem prodejny.
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          Odhlásit se
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="section-title text-3xl">Správa prodejny</h1>
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Odhlásit se
        </Button>
      </div>

      <nav className="mt-6 flex flex-wrap gap-2">
        {odkazy.map((o) => (
          <Link
            key={o.to}
            to={o.to}
            activeOptions={{ exact: o.exact }}
            className="inline-flex items-center gap-2 rounded-md border-2 px-4 py-2.5 text-sm font-bold transition-colors hover:border-primary hover:bg-primary/5"
            activeProps={{ className: "border-primary bg-primary text-primary-foreground hover:bg-primary" }}
          >
            <o.icon className="h-4 w-4" />
            {o.label}
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </div>
  );
}
