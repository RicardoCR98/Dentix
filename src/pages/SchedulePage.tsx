export const SchedulePage = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))] ">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Agenda</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 lg:px-8">
          <div className="w-full max-w-3xl sm:max-w-4xl lg:max-w-6xl 2xl:max-w-[1400px] mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-4">
              <div className="card cardh">
                <div className="card-body">
                  <h2 className="card-title">
                    <span className="badge badge-success">
                      <span className="visually-hidden">Nueva</span>
                    </span>
                    Nueva historia
                  </h2>
                  <p className="card-text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Vestibulum et ligula in nunc bibendum fringilla a eu lectus.
                  </p>
                  <div className="card-actions">
                    <button className="btn btn-primary">
                      <span className="visually-hidden">Abrir</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Repeat for each card */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
