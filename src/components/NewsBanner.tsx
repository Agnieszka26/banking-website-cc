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
import { Link } from "@tanstack/react-router";
import type { NewsItem } from "#/server/news/types";

function getDateParts(value?: string) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return { day: "--", month: "--", year: "----" };
  }
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date
      .toLocaleString("pl-PL", { month: "short" })
      .replace(".", "")
      .toUpperCase(),
    year: String(date.getFullYear()),
  };
}

export default function NewsBanner({ latest }: { latest?: NewsItem | null }) {
  const { day, month, year } = getDateParts(latest?.created_at);

  return (
    <section className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card className="lg:col-span-2">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5">
          <div className="flex sm:flex-col items-center sm:items-center justify-start gap-2 sm:gap-0 sm:min-w-[70px] shrink-0">
            <div className="text-xs text-muted-foreground">{day}</div>
            <div className="text-sm font-semibold">{month}</div>
            <div className="text-xs text-muted-foreground">{year}</div>
          </div>

          <Separator orientation="vertical" className="hidden sm:block" />
          <Separator className="sm:hidden" />

          <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
            <div className="flex items-start gap-2 text-primary font-semibold text-sm sm:text-base">
              <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {latest?.title ??
                  "Zmiany w obsłudze systemu bankowości elektronicznej"}
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {latest?.subtitle ??
                latest?.body ??
                "Brak aktualnych komunikatów serwisowych."}
            </p>

            {latest ? (
              <Link to="/news/$newsId" params={{ newsId: String(latest.id) }}>
                <Button variant="link" className="px-0 h-auto">
                  Czytaj więcej <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link to="/news">
                <Button variant="link" className="px-0 h-auto">
                  Czytaj więcej <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
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