import { Calendar } from "lucide-react";
import { Alert } from "../components/ui/Alert";

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
          <Alert variant="info">
            <div className="flex items-center gap-2">
              <Calendar size={20} />
              <div>
                <p className="font-medium">Sección en desarrollo</p>
                <p className="text-sm mt-1">
                  Esta sección se encuentra en desarrollo y no está disponible
                </p>
              </div>
            </div>
          </Alert>
        </main>
      </div>
    </div>
  );
};
