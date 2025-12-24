/**
 * AURA Cloud Studio - Audio Store (Zustand)
 *
 * 기술 스택 합의서 기준: Zustand 상태 관리
 *
 * AudioEngine의 상태를 React 컴포넌트에서 사용할 수 있도록
 * Zustand Store로 래핑
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { AudioEngine, audioEngine } from '../engine/AudioEngine';
import {
  AudioEngineState,
  AudioEngineOptions,
  TrackState,
  TrackOptions,
  InstrumentType,
  PlaybackState,
} from '../types/audio.types';

// ============================================
// Store State Interface
// ============================================

interface AudioStoreState {
  // Engine State (AudioEngine에서 동기화)
  isInitialized: boolean;
  isContextRunning: boolean;
  masterVolume: number;

  // Transport State
  playbackState: PlaybackState;
  bpm: number;
  timeSignature: [number, number];
  position: string;
  isLooping: boolean;
  loopStart: string;
  loopEnd: string;

  // Tracks State
  tracks: TrackState[];

  // UI State (Store에서만 관리)
  selectedTrackId: string | null;
  isEngineLoading: boolean;
  error: string | null;
}

// ============================================
// Store Actions Interface
// ============================================

interface AudioStoreActions {
  // Initialization
  initializeEngine: (options?: AudioEngineOptions) => Promise<void>;

  // Transport Controls
  play: (startTime?: string) => void;
  stop: () => void;
  pause: () => void;
  setBpm: (bpm: number) => void;
  setTimeSignature: (numerator: number, denominator: number) => void;
  setPosition: (position: string) => void;
  setLoop: (enabled: boolean, start?: string, end?: string) => void;

  // Master Volume
  setMasterVolume: (volumeDb: number) => void;

  // Track Management
  createTrack: (options?: TrackOptions) => string;  // returns track ID
  deleteTrack: (trackId: string) => void;
  selectTrack: (trackId: string | null) => void;

  // Track Controls
  setTrackVolume: (trackId: string, volumeDb: number) => void;
  setTrackPan: (trackId: string, pan: number) => void;
  setTrackMute: (trackId: string, mute: boolean) => void;
  setTrackSolo: (trackId: string, solo: boolean) => void;
  setTrackName: (trackId: string, name: string) => void;
  setTrackColor: (trackId: string, color: string) => void;
  setTrackInstrumentType: (trackId: string, type: InstrumentType) => void;

  // Smart Knob
  setSmartKnob: (trackId: string, value: number) => void;

  // Internal
  syncFromEngine: () => void;
  clearError: () => void;
}

// ============================================
// Combined Store Type
// ============================================

type AudioStore = AudioStoreState & AudioStoreActions;

// ============================================
// Initial State
// ============================================

const initialState: AudioStoreState = {
  isInitialized: false,
  isContextRunning: false,
  masterVolume: 0,

  playbackState: 'stopped',
  bpm: 120,
  timeSignature: [4, 4],
  position: '0:0:0',
  isLooping: false,
  loopStart: '0:0:0',
  loopEnd: '4:0:0',

  tracks: [],

  selectedTrackId: null,
  isEngineLoading: false,
  error: null,
};

// ============================================
// Create Store
// ============================================

export const useAudioStore = create<AudioStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // ============================================
    // Initialization
    // ============================================

    initializeEngine: async (options?: AudioEngineOptions) => {
      set({ isEngineLoading: true, error: null });

      try {
        await audioEngine.initialize(options);

        // Engine 상태 변경 구독
        audioEngine.subscribe((state) => {
          get().syncFromEngine();
        });

        get().syncFromEngine();
        set({ isEngineLoading: false });
      } catch (error) {
        set({
          isEngineLoading: false,
          error: error instanceof Error ? error.message : 'Failed to initialize audio engine',
        });
        throw error;
      }
    },

    // ============================================
    // Transport Controls
    // ============================================

    play: (startTime?: string) => {
      audioEngine.play(startTime);
      get().syncFromEngine();
    },

    stop: () => {
      audioEngine.stop();
      get().syncFromEngine();
    },

    pause: () => {
      audioEngine.pause();
      get().syncFromEngine();
    },

    setBpm: (bpm: number) => {
      audioEngine.setBpm(bpm);
      get().syncFromEngine();
    },

    setTimeSignature: (numerator: number, denominator: number) => {
      audioEngine.setTimeSignature(numerator, denominator);
      get().syncFromEngine();
    },

    setPosition: (position: string) => {
      audioEngine.setPosition(position);
      get().syncFromEngine();
    },

    setLoop: (enabled: boolean, start?: string, end?: string) => {
      audioEngine.setLoop(enabled, start, end);
      get().syncFromEngine();
    },

    // ============================================
    // Master Volume
    // ============================================

    setMasterVolume: (volumeDb: number) => {
      audioEngine.setMasterVolume(volumeDb);
      get().syncFromEngine();
    },

    // ============================================
    // Track Management
    // ============================================

    createTrack: (options?: TrackOptions) => {
      const track = audioEngine.createTrack(options);
      get().syncFromEngine();
      return track.id;
    },

    deleteTrack: (trackId: string) => {
      const { selectedTrackId } = get();

      audioEngine.deleteTrack(trackId);

      // 선택된 트랙이 삭제되면 선택 해제
      if (selectedTrackId === trackId) {
        set({ selectedTrackId: null });
      }

      get().syncFromEngine();
    },

    selectTrack: (trackId: string | null) => {
      set({ selectedTrackId: trackId });
    },

    // ============================================
    // Track Controls
    // ============================================

    setTrackVolume: (trackId: string, volumeDb: number) => {
      const track = audioEngine.getTrack(trackId);
      if (track) {
        track.setVolume(volumeDb);
        get().syncFromEngine();
      }
    },

    setTrackPan: (trackId: string, pan: number) => {
      const track = audioEngine.getTrack(trackId);
      if (track) {
        track.setPan(pan);
        get().syncFromEngine();
      }
    },

    setTrackMute: (trackId: string, mute: boolean) => {
      const track = audioEngine.getTrack(trackId);
      if (track) {
        track.setMute(mute);
        audioEngine.updateSoloState();
        get().syncFromEngine();
      }
    },

    setTrackSolo: (trackId: string, solo: boolean) => {
      const track = audioEngine.getTrack(trackId);
      if (track) {
        track.setSolo(solo);
        audioEngine.updateSoloState();
        get().syncFromEngine();
      }
    },

    setTrackName: (trackId: string, name: string) => {
      const track = audioEngine.getTrack(trackId);
      if (track) {
        track.setName(name);
        get().syncFromEngine();
      }
    },

    setTrackColor: (trackId: string, color: string) => {
      const track = audioEngine.getTrack(trackId);
      if (track) {
        track.setColor(color);
        get().syncFromEngine();
      }
    },

    setTrackInstrumentType: (trackId: string, type: InstrumentType) => {
      audioEngine.setTrackInstrumentType(trackId, type);
      get().syncFromEngine();
    },

    // ============================================
    // Smart Knob
    // ============================================

    setSmartKnob: (trackId: string, value: number) => {
      audioEngine.setSmartKnob(trackId, value);
      get().syncFromEngine();
    },

    // ============================================
    // Internal
    // ============================================

    syncFromEngine: () => {
      const state = audioEngine.getState();

      set({
        isInitialized: state.isInitialized,
        isContextRunning: state.isContextRunning,
        masterVolume: state.masterVolume,
        playbackState: state.transport.playbackState,
        bpm: state.transport.bpm,
        timeSignature: state.transport.timeSignature,
        position: state.transport.position,
        isLooping: state.transport.loop,
        loopStart: state.transport.loopStart,
        loopEnd: state.transport.loopEnd,
        tracks: state.tracks,
      });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);

// ============================================
// Selectors (성능 최적화용)
// ============================================

/**
 * Transport 상태만 선택
 */
export const selectTransport = (state: AudioStore) => ({
  playbackState: state.playbackState,
  bpm: state.bpm,
  timeSignature: state.timeSignature,
  position: state.position,
  isLooping: state.isLooping,
});

/**
 * 특정 트랙 선택
 */
export const selectTrackById = (trackId: string) => (state: AudioStore) =>
  state.tracks.find(t => t.id === trackId);

/**
 * 선택된 트랙 조회
 */
export const selectSelectedTrack = (state: AudioStore) =>
  state.tracks.find(t => t.id === state.selectedTrackId);

/**
 * 모든 트랙 ID 목록
 */
export const selectTrackIds = (state: AudioStore) =>
  state.tracks.map(t => t.id);

/**
 * Smart Knob 관련 정보
 */
export const selectSmartKnobInfo = (trackId: string) => (state: AudioStore) => {
  const track = state.tracks.find(t => t.id === trackId);
  if (!track) return null;

  return {
    instrumentType: track.instrumentType,
    value: track.smartKnobValue,
  };
};

// ============================================
// Type Exports
// ============================================

export type { AudioStore, AudioStoreState, AudioStoreActions };
