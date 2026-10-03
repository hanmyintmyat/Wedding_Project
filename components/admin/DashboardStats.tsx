import { CalendarHeart, CheckCircle2, Clock, Heart, Users, XCircle } from "lucide-react";

const icons = {
  TotalGuests: Users,
  Invited: Heart,
  Accepted: CheckCircle2,
  Pending: Clock,
  Declined: XCircle,
  TotalRSVPGuests: CalendarHeart
};

export default function DashboardStats({ stats }: { stats: Record<keyof typeof icons, number> }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Object.entries(stats).map(([key, value]) => {
        const Icon = icons[key as keyof typeof icons];
        return (
          <div key={key} className="admin-panel p-5">
            <Icon className="h-5 w-5 text-sage" />
            <p className="mt-5 text-3xl font-bold text-ink">{value}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-muted">{key.replace(/([A-Z])/g, " $1").trim()}</p>
          </div>
        );
      })}
    </div>
  );
}
