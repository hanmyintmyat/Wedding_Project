import { CheckCircle2, TriangleAlert } from "lucide-react";

export default function DatabaseHealth({ health }: { health: { connected: boolean; status: string; detail: string } }) {
  const Icon = health.connected ? CheckCircle2 : TriangleAlert;

  return (
    <div className="admin-panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Database</p>
        <h2 className="mt-2 font-serif text-2xl text-ink">{health.status}</h2>
        <p className="mt-1 text-sm text-muted">{health.detail}</p>
      </div>
      <Icon className={`h-7 w-7 ${health.connected ? "text-sage" : "text-red-700"}`} />
    </div>
  );
}
