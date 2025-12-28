import { create } from 'zustand';

interface SequencerState {
    stepCount: 16 | 32;
    toggleStepCount: () => void;
    setStepCount: (count: 16 | 32) => void;
}

export const useSequencerStore = create<SequencerState>((set) => ({
    stepCount: 16,
    toggleStepCount: () =>
        set((state) => ({ stepCount: state.stepCount === 16 ? 32 : 16 })),
    setStepCount: (count) => set({ stepCount: count }),
}));
