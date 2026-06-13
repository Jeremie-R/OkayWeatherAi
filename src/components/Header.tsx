import { MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <header className="px-5 pt-8 pb-4">
      <Button
        variant="ghost"
        onClick={onClick}
        className="h-auto gap-1.5 px-2 py-1 -ml-2 text-left hover:bg-muted/60"
      >
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-base font-semibold tracking-tight">{name}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </Button>
    </header>
  );
}