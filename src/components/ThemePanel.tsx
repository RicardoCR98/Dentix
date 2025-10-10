import * as Dialog from "@radix-ui/react-dialog";
import * as Select from "@radix-ui/react-select";
import { useState } from "react";
import {
  presets,
  type ThemeName,
  fontMap,
  type FontName,
} from "../theme/presets";
import { useTheme } from "../theme/ThemeProvider";
import { Button } from "./ui/Button";
import { Label } from "./ui/Label";
import { Divider } from "./ui/Divider";
import { Badge } from "./ui/Badge";
import { cn } from "../lib/cn";
import {
  Palette,
  Type,
  Sparkles,
  Check,
  X,
  ChevronDown,
  Sun,
  Moon,
  Leaf,
  Settings,
} from "lucide-react";

const themeIcons: Record<ThemeName, React.ReactNode> = {
  light: <Sun size={16} />,
  dark: <Moon size={16} />,
  greenapple: <Leaf size={16} />,
};

const themeLabels: Record<ThemeName, string> = {
  light: "Claro",
  dark: "Oscuro",
  greenapple: "Green Apple",
};

type ThemePanelProps = {
  inlineTrigger?: boolean; // <-- NUEVO: si true, botón normal (no fixed)
  label?: string; // <-- NUEVO: para renombrar el botón
};

export default function ThemePanel({
  inlineTrigger = false,
  label = "Diseño",
}: ThemePanelProps) {
  const { theme, setTheme, brandHsl, setBrand, font, setFont, size, setSize } =
    useTheme();
  const [open, setOpen] = useState(false);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant='secondary'
          size='sm'
          className={cn(!inlineTrigger && "fixed right-4 top-4 z-50 shadow-lg")}
        >
          <Settings size={18} />
          {label}
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]",
            "data-[state=open]:animate-[fadeIn_150ms_ease-out]",
            "data-[state=closed]:animate-[fadeOut_120ms_ease-in]"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed right-0 top-0 h-screen w-full max-w-[420px]",
            "bg-[hsl(var(--surface))] text-[hsl(var(--foreground))]",
            "shadow-2xl border-l border-[hsl(var(--border))]",
            "data-[state=open]:animate-[slideInOvershoot_260ms_cubic-bezier(0.16,1,0.3,1),settleFromLeft_120ms_ease-out_260ms]",
            "data-[state=closed]:animate-[slideOutToRight_200ms_ease-in]",
            "p-6 z-50 overflow-auto flex flex-col"
          )}
        >
          {/* Header */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 rounded-lg bg-[hsl(var(--brand))] flex items-center justify-center text-white'>
                <Sparkles size={20} />
              </div>
              <div>
                <Dialog.Title className='text-xl font-bold'>
                  Personalización
                </Dialog.Title>
                <p className='text-sm text-[hsl(var(--muted-foreground))]'>
                  Ajusta el diseño a tu gusto
                </p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className='w-8 h-8 rounded-md hover:bg-[hsl(var(--muted))] flex items-center justify-center transition-colors'
                aria-label='Cerrar'
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <Divider className="stagger-1" />

          {/* Temas predefinidos */}
          <div className='mb-6'>
            <Label className='flex items-center gap-2 mb-3'>
              <Palette size={16} className='text-[hsl(var(--brand))]' />
              Tema de color
            </Label>
            <div className='grid grid-cols-1 gap-2'>
              {presets.map((preset) => {
                const active = theme === preset;
                return (
                  <button
                    key={preset}
                    onClick={() => setTheme(preset)}
                    className={cn(
                      "relative rounded-lg p-4 text-left transition-all",
                      "border-2 hover:shadow-md",
                      active
                        ? "border-[hsl(var(--brand))] bg-[color-mix(in_oklab,hsl(var(--brand))_8%,transparent)]"
                        : "border-[hsl(var(--border))] bg-[hsl(var(--surface-soft))] hover:border-[hsl(var(--brand))]"
                    )}
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={cn(
                            "w-10 h-10 rounded-md flex items-center justify-center",
                            active
                              ? "bg-[hsl(var(--brand))] text-white"
                              : "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]"
                          )}
                        >
                          {themeIcons[preset]}
                        </div>
                        <div>
                          <div className='font-semibold'>
                            {themeLabels[preset]}
                          </div>
                          <div className='text-xs text-[hsl(var(--muted-foreground))]'>
                            {preset === "light" &&
                              "Fondo claro, ideal para el día"}
                            {preset === "dark" &&
                              "Fondo oscuro, ideal para la noche"}
                            {preset === "greenapple" &&
                              "Verde menta, fresco y único"}
                          </div>
                        </div>
                      </div>
                      {active && (
                        <div className='w-6 h-6 rounded-full bg-[hsl(var(--brand))] flex items-center justify-center text-white'>
                          <Check size={14} />
                        </div>
                      )}
                    </div>

                    {/* Vista previa de colores */}
                    <div className='flex gap-2 mt-3'>
                      <div
                        className='flex-1 h-8 rounded border border-[hsl(var(--border))]'
                        style={{
                          background:
                            preset === "dark"
                              ? "hsl(222 14% 8%)"
                              : preset === "greenapple"
                              ? "hsl(172 25% 98%)"
                              : "hsl(0 0% 98%)",
                        }}
                        title='Background'
                      />
                      <div
                        className='flex-1 h-8 rounded border border-[hsl(var(--border))]'
                        style={{
                          background:
                            preset === "dark"
                              ? "hsl(222 14% 11%)"
                              : "hsl(0 0% 100%)",
                        }}
                        title='Surface'
                      />
                      <div
                        className='flex-1 h-8 rounded'
                        style={{
                          background:
                            preset === "greenapple"
                              ? "hsl(172 49% 56%)"
                              : "hsl(217 91% 60%)",
                        }}
                        title='Brand'
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Divider />

          {/* Color de marca personalizado */}
          <div className='mb-6'>
            <Label className='flex items-center gap-2 mb-3'>
              <Palette size={16} className='text-[hsl(var(--brand))]' />
              Color de marca personalizado
            </Label>
            <div className='flex items-center gap-3'>
              <div className='relative'>
                <input
                  type='color'
                  className='w-14 h-14 rounded-lg cursor-pointer border-2 border-[hsl(var(--border))]'
                  value={hslToHex(brandHsl)}
                  onChange={(e) => setBrand(e.target.value)}
                  title='Selecciona tu color'
                />
                <div className='absolute inset-0 rounded-lg pointer-events-none ring-2 ring-[hsl(var(--border))]' />
              </div>
              <div className='flex-1'>
                <div className='text-sm font-medium mb-1'>Color actual</div>
                <div className='flex items-center gap-2'>
                  <Badge variant='default' className='font-mono text-xs'>
                    {hslToHex(brandHsl)}
                  </Badge>
                  <span className='text-xs text-[hsl(var(--muted-foreground))]'>
                    HSL: {brandHsl}
                  </span>
                </div>
              </div>
            </div>
            <p className='text-xs text-[hsl(var(--muted-foreground))] mt-2 flex items-start gap-2'>
              <span className='inline-block w-1 h-1 rounded-full bg-[hsl(var(--brand))] mt-1.5' />
              Este color afecta botones, enlaces, títulos y elementos destacados
            </p>
          </div>

          <Divider />

          {/* Tipografía */}
          <div className='mb-6'>
            <Label className='flex items-center gap-2 mb-3'>
              <Type size={16} className='text-[hsl(var(--brand))]' />
              Tipografía
            </Label>
            <Select.Root
              value={font}
              onValueChange={(v: FontName) => setFont(v)}
            >
              <Select.Trigger
                className={cn(
                  "inline-flex h-11 w-full items-center justify-between",
                  "rounded-lg border border-[hsl(var(--border))]",
                  "bg-[hsl(var(--surface))] px-4 text-sm",
                  "hover:bg-[hsl(var(--muted))]",
                  "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--brand))] focus:ring-offset-2",
                  "transition-colors"
                )}
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDown size={16} className='opacity-50' />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className={cn(
                    "overflow-hidden rounded-lg",
                    "bg-[hsl(var(--surface))] border border-[hsl(var(--border))]",
                    "shadow-lg z-50",
                    "data-[state=open]:animate-[scaleIn_150ms_ease-out]"
                  )}
                  position='popper'
                  sideOffset={5}
                >
                  <Select.Viewport className='p-1'>
                    {Object.keys(fontMap).map((fontName) => (
                      <Select.Item
                        key={fontName}
                        value={fontName}
                        className={cn(
                          "relative flex items-center px-8 py-2.5 rounded-md",
                          "text-sm outline-none cursor-pointer",
                          "hover:bg-[hsl(var(--muted))]",
                          "data-[state=checked]:bg-[hsl(var(--brand))] data-[state=checked]:text-white",
                          "transition-colors"
                        )}
                      >
                        <Select.ItemIndicator className='absolute left-2'>
                          <Check size={14} />
                        </Select.ItemIndicator>
                        <Select.ItemText
                          style={{ fontFamily: fontMap[fontName as FontName] }}
                        >
                          {fontName}
                        </Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
            <p className='text-xs text-[hsl(var(--muted-foreground))] mt-2'>
              Vista previa con{" "}
              <span
                style={{ fontFamily: fontMap[font] }}
                className='font-semibold'
              >
                {font}
              </span>
            </p>
          </div>

          <Divider />

          {/* Tamaño de texto */}
          <div className='mb-6'>
            <Label className='flex items-center gap-2 mb-3'>
              <Type size={16} className='text-[hsl(var(--brand))]' />
              Tamaño del texto
            </Label>
            <div className='grid grid-cols-3 gap-2'>
              {([14, 16, 18] as const).map((s) => (
                <Button
                  key={s}
                  variant={size === s ? "primary" : "secondary"}
                  size='md'
                  onClick={() => setSize(s)}
                  className='relative p-8'
                >
                  <div className='flex flex-col items-center gap-1'>
                    <span className='text-lg font-bold'>{s}</span>
                    <span className='text-xs opacity-80'>
                      {s === 14 ? "Pequeño" : s === 16 ? "Medio" : "Grande"}
                    </span>
                  </div>
                  {size === s && (
                    <div className='absolute top-1 right-1 w-2 h-2 rounded-full bg-white' />
                  )}
                </Button>
              ))}
            </div>
            <div className='mt-3 p-3 rounded-lg bg-[hsl(var(--muted))]'>
              <p className='text-xs text-[hsl(var(--muted-foreground))] mb-1'>
                Vista previa:
              </p>
              <p style={{ fontSize: `${size}px` }} className='font-medium'>
                El texto se verá así en toda la aplicación
              </p>
            </div>
          </div>

          {/* Footer con información */}
          <div className='mt-auto pt-4 border-t border-[hsl(var(--border))]'>
            <div className='flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]'>
              <Sparkles size={12} />
              <span>Los cambios se guardan automáticamente</span>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Animaciones personalizadas */}
      <style>{`
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOutToRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
      `}</style>
    </Dialog.Root>
  );
}

/* Utilidad: HSL "h s% l%" -> #hex para <input type="color"> */
function hslToHex(hsl: string): string {
  const [hStr, sStr, lStr] = hsl.split(" ");
  const h = parseFloat(hStr);
  let s = parseFloat(sStr);
  let l = parseFloat(lStr);
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let [r, g, b] = [0, 0, 0];
  if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
  else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
  else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
  else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
  else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const R = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const G = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const B = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${R}${G}${B}`;
}
