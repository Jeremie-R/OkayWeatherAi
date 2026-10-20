import { Link } from "@tanstack/react-router";
import { MapPin, ChevronDown, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <header className="flex items-center justify-between gap-2 px-5 pt-8 pb-4">
      <Button
        variant="ghost"
        onClick={onClick}
        className="h-auto gap-1.5 px-2 py-1 -ml-2 text-left hover:bg-muted/60"
      >
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-base font-semibold tracking-tight">{name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Link
        to="/settings"
        aria-label="Settings"
        className="-mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </header>
  );
}
