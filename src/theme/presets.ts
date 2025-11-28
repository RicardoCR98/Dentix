export type ThemeName = 'light' | 'dark'
export type FontName = 'Inter' | 'Poppins' | 'Roboto' | 'System'

export const fontMap: Record<FontName, string> = {
  Inter: 'Inter, ui-sans-serif, system-ui, sans-serif',
  Poppins: 'Poppins, ui-sans-serif, system-ui, sans-serif',
  Roboto: 'Roboto, ui-sans-serif, system-ui, sans-serif',
  System: 'ui-sans-serif, system-ui, sans-serif',
}

export const presets: ThemeName[] = ['light', 'dark']
