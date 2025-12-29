// src/layouts/DashboardLayout.tsx
import { useState } from "react";
import { Outlet, useOutletContext, useLocation } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import ThemePanel from "../components/ThemePanel";
import ShortcutsHelp from "../components/ShortcutsHelp";
import { Button } from "../components/ui/Button";
import {
  PopoverRoot,
  PopoverTrigger,
  PopoverContent,
} from "../components/ui/Popover";
import { Info, Menu, X, History } from "lucide-react";

interface DashboardLayoutProps {
  clinicName: string;
  slogan?: string;
}

interface OutletContextType {
  isTimelineSidebarOpen: boolean;
  setIsTimelineSidebarOpen: (isOpen: boolean) => void;
}

export function DashboardLayout({ clinicName, slogan }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isTimelineSidebarOpen, setIsTimelineSidebarOpen] = useState(false);
  const location = useLocation();

  // Only show timeline button in patient record page
  const showTimelineButton = location.pathname === "/registro-clinico";

  return (
    <div className="flex h-screen overflow-hidden bg-[hsl(var(--background))] ">
      {/* Sidebar */}
      <Sidebar
        clinicName={clinicName}
        slogan={slogan}
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-12 border-b border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 flex items-center justify-between gap-2">
          {/* Left side - Toggle button */}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 h-9 flex items-center gap-2"
            title={isSidebarCollapsed ? "Abrir menú" : "Cerrar menú"}
          >
            {isSidebarCollapsed ? <Menu size={20} /> : <X size={20} />}

            {/* Texto que aparece solo cuando el sidebar NO está colapsado */}
            {!isSidebarCollapsed && <span className="text-sm">Contraer</span>}

            {isSidebarCollapsed && <span className="text-sm">Menú</span>}
          </Button>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Timeline Toggle Button - Only show in patient record page */}
            {showTimelineButton && (
              <button
                onClick={() => setIsTimelineSidebarOpen(!isTimelineSidebarOpen)}
                className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] transition-colors"
                title="Timeline de sesiones"
              >
                <History
                  size={20}
                  className={`transition-colors ${
                    isTimelineSidebarOpen
                      ? "text-[hsl(var(--brand))]"
                      : "text-[hsl(var(--muted-foreground))]"
                  }`}
                />
              </button>
            )}

            {/* Theme Panel */}
            <ThemePanel inlineTrigger />

            {/* Shortcuts Help */}
            <PopoverRoot>
              <PopoverTrigger
                asChild
                className="cursor-pointer inline-flex items-center justify-center rounded-full p-1 hover:bg-[hsl(var(--muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))]"
              >
                <button title="Atajos de teclado">
                  <Info
                    size={20}
                    className="text-[hsl(var(--muted-foreground))]"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80">
                <ShortcutsHelp />
              </PopoverContent>
            </PopoverRoot>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 lg:px-8">
          <div className="w-full max-w-3xl sm:max-w-4xl lg:max-w-6xl 2xl:max-w-[1400px] mx-auto">
            <Outlet
              context={{
                isTimelineSidebarOpen,
                setIsTimelineSidebarOpen,
              } satisfies OutletContextType}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

// Hook for child components to access the context
export function useTimelineSidebar() {
  return useOutletContext<OutletContextType>();
}
