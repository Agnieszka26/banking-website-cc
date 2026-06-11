import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Phone,
  MapPin,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Megaphone,
} from "lucide-react";

export default function NewsBanner() {
  return (
    <section className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* LEFT: News card */}
      <Card 
      // className="lg:col-span-2"
      >
        <CardContent className="p-6 flex gap-4">
          {/* Date block */}
          <div className="flex flex-col items-center justify-start min-w-[70px]">
            <div className="text-xs text-muted-foreground">24</div>
            <div className="text-sm font-semibold">KW</div>
            <div className="text-xs text-muted-foreground">2025</div>
          </div>

          <Separator orientation="vertical" />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Megaphone className="w-4 h-4" />
              Zmiany w obsłudze systemu bankowości elektronicznej
            </div>

            <p className="text-sm text-muted-foreground">
              Informujemy o planowanych pracach serwisowych w dniach
              30.04.2025 - 02.05.2025. W tym czasie dostęp do systemu może być
              ograniczony.
            </p>

            <Button variant="link" className="px-0 h-auto">
              Czytaj więcej <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RIGHT: Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <ActionTile icon={Phone} label="Kontakt" />
        <ActionTile icon={MapPin} label="Placówki i bankomaty" />
        <ActionTile icon={HelpCircle} label="Najczęściej zadawane pytania" />
        <ActionTile icon={ShieldCheck} label="Bezpieczny bank" />
      </div>
    </section>
  );
}

function ActionTile({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <Card className="hover:shadow-md transition cursor-pointer">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
        <Icon className="w-6 h-6 text-primary" />
        <span className="text-sm font-medium leading-tight">{label}</span>
      </CardContent>
    </Card>
  );
}