type LayoutProps = {
  clinicName: string;
  slogan?: string;
  schedule?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode; // <-- NUEVO
};

export default function Layout({ clinicName, slogan, schedule, children, headerRight }: LayoutProps) {
  return (
    <>
      {/* sticky arriba */}
      <header className=" top-0 z-40 bg-gradient-to-b from-surface to-[var(--bg)] backdrop-blur-sm border-b border-b-[hsl(var(--border))] shadow-sm">
        <div className="mx-auto max-w-[1100px] px-4 py-3 relative">
          {/* Contenido centrado */}
          <div className="text-center">
            <h1 className="text-[hsl(var(--brand))] text-xl tracking-wider m-0">{clinicName}</h1>
            {slogan && <small className="text-text-muted block mt-1">{slogan}</small>}
            {schedule && <small className="text-text-muted block">Horario: {schedule}</small>}
          </div>

          {/* Acciones a la derecha del header */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {headerRight}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-4 py-6">
        <div className="mx-auto w-full max-w-[960px] flex flex-col gap-5">{children}</div>
      </main>
    </>
  );
}
