type LayoutProps = {
  clinicName: string;
  slogan?: string;
  schedule?: string;
  children: React.ReactNode;
};

export default function Layout({ clinicName, slogan, schedule, children }: LayoutProps) {
  return (
    <>
      <header className="sticky top-0 z-10 bg-gradient-to-b from-surface to-[var(--bg)] shadow-[0_4px_20px_rgba(0,0,0,.45)] text-center py-4">
        <h1 className="text-[hsl(var(--brand))] text-xl tracking-wider m-0">{clinicName}</h1>
        {slogan && <small className="text-text-muted block mt-1">{slogan}</small>}
        {schedule && <small className="text-text-muted block">Horario: {schedule}</small>}
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-6">
        <div className="mx-auto w-full max-w-[960px] flex flex-col gap-5">{children}</div>
      </main>
    </>
  );
}
