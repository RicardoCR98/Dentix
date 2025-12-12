// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { User, Wallet, BarChart3, Settings, FileText } from "lucide-react";
import { cn } from "../lib/cn";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/pacientes", icon: <User size={20} />, label: "Pacientes" },
  {
    to: "/registro-clinico",
    icon: <FileText size={20} />,
    label: "Registro clínico",
  },
  { to: "/finanzas", icon: <Wallet size={20} />, label: "Finanzas" },
  { to: "/reportes", icon: <BarChart3 size={20} />, label: "Reportes" },
  {
    to: "/configuracion",
    icon: <Settings size={20} />,
    label: "Configuración",
  },
];

interface SidebarProps {
  clinicName: string;
  slogan?: string;
  isCollapsed: boolean;
}

export function Sidebar({ clinicName, slogan, isCollapsed }: SidebarProps) {
  return (
    <aside
      className={cn(
        "h-screen bg-[hsl(var(--surface))] border-r border-[hsl(var(--border))] transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4">
        {!isCollapsed ? (
          <div>
            <h2 className="text-[hsl(var(--brand))] font-bold text-lg tracking-wide truncate">
              {clinicName}
            </h2>
            {slogan && (
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {slogan}
              </p>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--brand))]/10 flex items-center justify-center">
              <span className="text-[hsl(var(--brand))] font-bold text-sm">
                {clinicName.charAt(0)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-2">
          <div className={cn(isCollapsed && "hidden")}>
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
              Navegación
            </span>
          </div>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                    "hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]",
                    isActive
                      ? "bg-[hsl(var(--brand))]/10 text-[hsl(var(--brand))] font-medium"
                      : "text-[hsl(var(--muted-foreground))]",
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && (
                  <span className="text-sm truncate font-semibold">
                    {item.label}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer (opcional) */}
      {!isCollapsed && (
        <div className="p-4 border-t border-[hsl(var(--border))]">
          <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
            Hecho con ❤️ por {"CAPOS"}
          </p>
        </div>
      )}
    </aside>
  );
}
