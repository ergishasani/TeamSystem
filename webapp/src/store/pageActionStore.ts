import { create } from 'zustand';
import { useEffect } from 'react';
import type { ReactNode, DependencyList } from 'react';

/**
 * The primary action rendered by the top-right button in the platform top bar.
 * Each page registers its own action via `usePageAction`, so the button does
 * something contextual (and fully functional) on every page.
 */
export interface PageAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** When true, the button is hidden entirely for this page. */
  hidden?: boolean;
}

interface PageActionState {
  action: PageAction | null;
  setAction: (a: PageAction | null) => void;
}

export const usePageActionStore = create<PageActionState>((set) => ({
  action: null,
  setAction: (action) => set({ action }),
}));

/**
 * Register the current page's top-bar action. Pass `null` (or `{ hidden: true }`)
 * to suppress the button. The action is cleared automatically on unmount, and
 * re-registered whenever `deps` change (use this to keep closures / dynamic
 * labels fresh, e.g. a loading state or the rows being exported).
 */
export function usePageAction(action: PageAction | null, deps: DependencyList = []) {
  const setAction = usePageActionStore((s) => s.setAction);
  useEffect(() => {
    setAction(action);
    return () => setAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
