import { create } from 'zustand';

// ============================================
// Transport Types (Async Queue)
// ============================================
export type TransportStatus = 'STOPPED' | 'PLAYING' | 'PAUSED';

export type TransportIntent =
    | { type: 'PLAY' }
    | { type: 'PAUSE' }
    | { type: 'STOP' }
    | { type: 'TOGGLE_PLAYBACK' }
    | { type: 'SET_TEMPO'; bpm: number }
    | { type: 'SEEK'; position: number };

export interface Track {
    id: number;
    name: string;
    type: 'midi' | 'audio';
    color: string;
    isMuted: boolean;
    isSolo: boolean;
}

interface TimelineState {
    tracks: Track[];
    setTracks: (tracks: Track[]) => void;
    toggleMute: (trackId: number) => void;
    toggleSolo: (trackId: number) => void;

    // Snap State
    isSnapEnabled: boolean;
    snapInterval: string;
    setSnapEnabled: (enabled: boolean) => void;
    setSnapInterval: (interval: string) => void;

    // Playback State
    playbackMode: 'PATTERN' | 'SONG';
    isPlaying: boolean;
    // status: TransportStatus; // Derived or explicit? Let's use isPlaying for now to maintain compat, or add status
    transportStatus: TransportStatus; // New explicit status

    // Async Queue State
    isProcessing: boolean;
    intentQueue: TransportIntent[];

    // Actions
    dispatchIntent: (intent: TransportIntent) => void;
    processNextIntent: () => Promise<void>;

    setPlaybackMode: (mode: 'PATTERN' | 'SONG') => void;
    togglePlaybackMode: () => void;
    setIsPlaying: (isPlaying: boolean) => void;

    // Step Sequencer State
    stepCount: 16 | 32;
    drumTracks: DrumTrack[];
    sequencerPatterns: Record<string, StepPattern[]>;

    // Playhead state
    currentStep: number;
    setCurrentStep: (step: number) => void;

    setStepCount: (count: 16 | 32) => void;
    addDrumTrack: (track: DrumTrack) => void;
    toggleStep: (trackId: string, stepIndex: number) => void;
    setPatternMultiplier: (trackId: string, stepIndex: number, multiplier: number) => void;
}

// Types
export interface DrumTrack {
    id: string;
    name: string;
    color: string;
    soundType?: string; // DrumPart or generic
}

export interface StepPattern {
    active: boolean;
    velocity: number;
    multiplier: number;
}

// Initial Data Helper
const createEmptyPattern = (steps: number): StepPattern[] =>
    Array.from({ length: steps }, () => ({ active: false, velocity: 1, multiplier: 1 }));

const INITIAL_STEPS = 16;
const initialPatterns: Record<string, StepPattern[]> = {
    kick: createEmptyPattern(32), // Reserve 32 slots but logic uses StepCount
    snare: createEmptyPattern(32),
    hihat: createEmptyPattern(32),
    perc: createEmptyPattern(32),
};

// Basic Beat Setup
initialPatterns.kick[0].active = true;
initialPatterns.kick[4].active = true;
initialPatterns.kick[8].active = true;
initialPatterns.kick[12].active = true;
initialPatterns.snare[4].active = true;
initialPatterns.snare[12].active = true;
initialPatterns.hihat[0].active = true;
initialPatterns.hihat[2].active = true;
initialPatterns.hihat[4].active = true;
initialPatterns.hihat[6].active = true;
initialPatterns.hihat[8].active = true;
initialPatterns.hihat[10].active = true;
initialPatterns.hihat[12].active = true;
initialPatterns.hihat[14].active = true;


export const useTimelineStore = create<TimelineState>((set, get) => ({
    // Initialize with 4 Default Tracks as requested
    tracks: [
        { id: 1, name: 'Melody', type: 'midi', color: 'neon-sky', isMuted: false, isSolo: false },
        { id: 2, name: 'Drums', type: 'midi', color: 'neon-red', isMuted: false, isSolo: false },
        { id: 3, name: 'Bass', type: 'midi', color: 'neon-green', isMuted: false, isSolo: false },
        { id: 4, name: 'Piano', type: 'midi', color: 'neon-blue', isMuted: false, isSolo: false },
        { id: 5, name: 'Synth', type: 'midi', color: 'neon-yellow', isMuted: false, isSolo: false },
        { id: 6, name: 'Pad', type: 'midi', color: 'neon-purple', isMuted: false, isSolo: false }
    ],

    setTracks: (tracks) => set({ tracks }),

    toggleMute: (trackId) => set((state) => ({
        tracks: state.tracks.map(t =>
            t.id === trackId ? { ...t, isMuted: !t.isMuted } : t
        )
    })),

    toggleSolo: (trackId) => set((state) => ({
        tracks: state.tracks.map(t =>
            t.id === trackId ? { ...t, isSolo: !t.isSolo } : t
        )
    })),

    // Snap State
    isSnapEnabled: true,
    snapInterval: 'BAR',
    setSnapEnabled: (enabled) => set({ isSnapEnabled: enabled }),
    setSnapInterval: (interval) => set({ snapInterval: interval }),

    // Playback State (The Brain)
    playbackMode: 'PATTERN', // Default to PATTERN
    isPlaying: false,
    transportStatus: 'STOPPED',

    // Step Sequencer State (Restored)
    stepCount: 16,
    drumTracks: [
        { id: 'kick', name: 'Kick', color: '#FF6B6B', soundType: 'kick' },
        { id: 'snare', name: 'Snare', color: '#4DFFFF', soundType: 'snare' },
        { id: 'hihat', name: 'Hi-Hat', color: '#4FD272', soundType: 'hihat' },
        { id: 'perc', name: 'Perc', color: '#D45FFF', soundType: 'perc' },
    ],
    sequencerPatterns: initialPatterns,

    // Async Queue
    isProcessing: false,
    intentQueue: [],

    // ------------------------------------------
    // Public Action: dispatchIntent
    // ------------------------------------------
    dispatchIntent: (intent) => {
        set((state) => ({
            intentQueue: [...state.intentQueue, intent]
        }));

        // Trigger queue processor if not already running
        if (!get().isProcessing) {
            get().processNextIntent();
        }
    },

    // ------------------------------------------
    // Internal: Process Queue
    // ------------------------------------------
    processNextIntent: async () => {
        const { intentQueue } = get();

        // Base case
        if (intentQueue.length === 0) {
            set({ isProcessing: false });
            return;
        }

        // Lock
        set({ isProcessing: true });

        // Peek
        const [currentIntent, ...remainingQueue] = intentQueue;

        // Execute Logic
        const currentState = get().transportStatus;
        console.log(`[Transport] Processing Intent: ${currentIntent.type} | Current: ${currentState}`);

        // Async simulation/Microtask
        await new Promise(resolve => setTimeout(resolve, 0));

        switch (currentIntent.type) {
            case 'PLAY':
                if (currentState !== 'PLAYING') {
                    set({ transportStatus: 'PLAYING', isPlaying: true });
                }
                break;

            case 'PAUSE':
                if (currentState === 'PLAYING') {
                    set({ transportStatus: 'PAUSED', isPlaying: false });
                }
                break;

            case 'STOP':
                set({ transportStatus: 'STOPPED', isPlaying: false, currentStep: 0 }); // Reset step on stop
                break;

            case 'TOGGLE_PLAYBACK':
                if (currentState === 'PLAYING') {
                    set({ transportStatus: 'PAUSED', isPlaying: false });
                } else {
                    set({ transportStatus: 'PLAYING', isPlaying: true });
                }
                break;

            // SET_TEMPO, SEEK logic can be added here if needed
        }

        // Dequeue and recurse
        set((state) => ({ intentQueue: state.intentQueue.slice(1) }));
        get().processNextIntent();
    },

    setPlaybackMode: (mode: 'PATTERN' | 'SONG') => set({ playbackMode: mode }),
    togglePlaybackMode: () => set((state) => ({
        playbackMode: state.playbackMode === 'PATTERN' ? 'SONG' : 'PATTERN'
    })),
    setIsPlaying: (isPlaying: boolean) => set({ isPlaying, transportStatus: isPlaying ? 'PLAYING' : 'PAUSED' }), // Sync helper

    setStepCount: (count: 16 | 32) => set((state) => {
        // Just update step count. The patterns are already big enough (32).
        return { stepCount: count };
    }),

    // Playhead Position (Synced with Audio Engine)
    currentStep: 0,
    setCurrentStep: (step: number) => set({ currentStep: step }),

    addDrumTrack: (track: DrumTrack) => set((state) => {
        // Init pattern for new track
        const newPatterns = { ...state.sequencerPatterns };
        if (!newPatterns[track.id]) {
            newPatterns[track.id] = createEmptyPattern(32);
        }
        return {
            drumTracks: [...state.drumTracks, track],
            sequencerPatterns: newPatterns
        };
    }),

    toggleStep: (trackId: string, stepIndex: number) => set((state) => {
        const patterns = { ...state.sequencerPatterns };
        if (patterns[trackId]) {
            // Shallow copy the array to trigger update
            const newTrackPattern = [...patterns[trackId]];
            // Toggle active
            newTrackPattern[stepIndex] = {
                ...newTrackPattern[stepIndex],
                active: !newTrackPattern[stepIndex].active,
                // Reset multiplier if deactivating? Optional.
                multiplier: !newTrackPattern[stepIndex].active ? 1 : newTrackPattern[stepIndex].multiplier
            };
            patterns[trackId] = newTrackPattern;
            return { sequencerPatterns: patterns };
        }
        return {};
    }),

    setPatternMultiplier: (trackId: string, stepIndex: number, multiplier: number) => set((state) => {
        const patterns = { ...state.sequencerPatterns };
        if (patterns[trackId]) {
            const newTrackPattern = [...patterns[trackId]];
            newTrackPattern[stepIndex] = {
                ...newTrackPattern[stepIndex],
                multiplier: multiplier
            };
            patterns[trackId] = newTrackPattern;
            return { sequencerPatterns: patterns };
        }
        return {};
    }),
}));
