export default function PreviewPanel() {
  return (
    <div className="admin-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sage">Live Preview</p>
          <h3 className="mt-2 font-serif text-2xl text-ink">Invitation Website</h3>
        </div>
        <div className="flex gap-2">
          <a href="/invite?to=Phyo%20Thandar%20Aung" target="_blank" className="rounded-full bg-sage px-4 py-2 text-sm font-bold text-white">
            Preview Website
          </a>
        </div>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_260px]">
        <iframe title="Desktop invitation preview" src="/invite?to=Phyo%20Thandar%20Aung" className="h-[480px] w-full rounded-xl border border-sage/15 bg-white" />
        <iframe title="Mobile invitation preview" src="/invite?to=Phyo%20Thandar%20Aung" className="mx-auto h-[480px] w-[230px] rounded-[1.5rem] border-4 border-ink/70 bg-white" />
      </div>
    </div>
  );
}
