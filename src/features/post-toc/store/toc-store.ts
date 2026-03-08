import { create } from "zustand/react";

interface TocStoreState {
    headingsObserver: IntersectionObserver | null;
    headingsInView: Set<string>;
    hoverTocId: string | null;
    clickTocId: string | null;
    clear: () => void;
    initializeFeedObserver: (root: HTMLElement | null) => void;
    updateHoverTocId: (id: string | null) => void;
    updateClickTocId: (id: string | null) => void;
}

export const useTocStore = create<TocStoreState>((set, get) => {
    return {
        headingsObserver: null,
        headingsInView: new Set(),
        hoverTocId: null,
        clickTocId: null,
        clear: () => {
            get().headingsObserver?.disconnect();

            set({
                headingsInView: new Set(),
                hoverTocId: null,
            });
        },
        initializeFeedObserver: root => {
            if (!root) return;

            const existing = get().headingsObserver;
            if (existing) return;

            let rafId: number | null = null;
            let pendingEntries: IntersectionObserverEntry[] = [];

            const observer = new IntersectionObserver(
                entries => {
                    pendingEntries.push(...entries);

                    if (rafId !== null) return;

                    rafId = requestAnimationFrame(() => {
                        const entriesToProcess = pendingEntries;
                        pendingEntries = [];
                        rafId = null;

                        set(state => {
                            const next = new Set(state.headingsInView);
                            let changed = false;

                            for (const entry of entriesToProcess) {
                                const id = (entry.target as HTMLElement).dataset
                                    .tocId;
                                if (!id) continue;

                                if (entry.isIntersecting) {
                                    if (!next.has(id)) {
                                        next.add(id);
                                        changed = true;
                                    }
                                } else {
                                    if (next.delete(id)) changed = true;
                                }
                            }

                            if (!changed) return state;
                            return { headingsInView: next };
                        });
                    });
                },
                { root },
            );

            set({
                headingsObserver: observer,
            });
        },
        updateHoverTocId: id => set({ hoverTocId: id }),
        updateClickTocId: id => set({ clickTocId: id }),
    };
});
