// src/contexts/DockVisibilityContext.tsx
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface DockVisibilityContextType {
  isDockVisible: boolean;
  hideForModal: () => void;
  showAfterModal: () => void;
}

const DockVisibilityContext = createContext<DockVisibilityContextType | undefined>(undefined);

export function DockVisibilityProvider({ children }: { children: ReactNode }) {
  const [openModalsCount, setOpenModalsCount] = useState(0);

  const hideForModal = useCallback(() => {
    setOpenModalsCount(prev => prev + 1);
  }, []);

  const showAfterModal = useCallback(() => {
    setOpenModalsCount(prev => Math.max(0, prev - 1));
  }, []);

  const isDockVisible = openModalsCount === 0;

  return (
    <DockVisibilityContext.Provider value={{ isDockVisible, hideForModal, showAfterModal }}>
      {children}
    </DockVisibilityContext.Provider>
  );
}

export function useDockVisibility() {
  const context = useContext(DockVisibilityContext);
  if (!context) {
    throw new Error('useDockVisibility must be used within DockVisibilityProvider');
  }
  return context;
}
