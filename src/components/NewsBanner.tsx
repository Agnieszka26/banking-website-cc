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
    <section className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card className="lg:col-span-2">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5">
          <div className="flex sm:flex-col items-center sm:items-center justify-start gap-2 sm:gap-0 sm:min-w-[70px] shrink-0">
            <div className="text-xs text-muted-foreground">24</div>
            <div className="text-sm font-semibold">KW</div>
            <div className="text-xs text-muted-foreground">2025</div>
          </div>

          <Separator orientation="vertical" className="hidden sm:block" />
          <Separator className="sm:hidden" />

          <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
            <div className="flex items-start gap-2 text-primary font-semibold text-sm sm:text-base">
              <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Zmiany w obsłudze systemu bankowości elektronicznej</span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
      <CardContent className="p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2 min-h-[100px] sm:min-h-[110px]">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
        <span className="text-xs sm:text-sm font-medium leading-tight">{label}</span>
      </CardContent>
    </Card>
  );
}