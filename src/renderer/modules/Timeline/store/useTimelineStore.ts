import { create } from 'zustand';

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
    setPlaybackMode: (mode: 'PATTERN' | 'SONG') => void;
    togglePlaybackMode: () => void;
    setIsPlaying: (isPlaying: boolean) => void;
}

export const useTimelineStore = create<TimelineState>((set) => ({
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

    setPlaybackMode: (mode: 'PATTERN' | 'SONG') => set({ playbackMode: mode }),
    togglePlaybackMode: () => set((state) => ({
        playbackMode: state.playbackMode === 'PATTERN' ? 'SONG' : 'PATTERN'
    })),
    setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
}));
