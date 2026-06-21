import { Link } from "@tanstack/react-router";
import { Cloud, Map } from "lucide-react";

export function TabBar() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-[480px] items-stretch">
        <TabLink to="/" icon={<Cloud className="h-5 w-5" />} label="Weather" />
        <TabLink to="/map" icon={<Map className="h-5 w-5" />} label="Map" />
      </div>
    </nav>
  );
}

function TabLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-1 flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      activeProps={{ className: "text-foreground" }}
      activeOptions={{ exact: true }}
    >
      {icon}
      <span className="font-medium tracking-tight">{label}</span>
    </Link>
  );
}