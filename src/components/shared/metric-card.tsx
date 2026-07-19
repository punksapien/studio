import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string; // e.g., "+5.2% from last month"
  trendDirection?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricCard({ title, value, icon: Icon, description, trend, trendDirection, className }: MetricCardProps) {
  let trendColorClass = "text-muted-foreground";
  if (trendDirection === 'up') trendColorClass = "text-emerald-600 dark:text-emerald-400";
  if (trendDirection === 'down') trendColorClass = "text-red-600 dark:text-red-400";

  return (
    <Card className={cn("rounded-none shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {trend && <p className={`text-xs ${trendColorClass} mt-1`}>{trend}</p>}
      </CardContent>
    </Card>
  );
}
