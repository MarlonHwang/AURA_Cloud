/**
 * AURA Cloud Studio - Audio Engine Module
 *
 * 이 모듈은 AURA의 핵심 오디오 엔진 기능을 제공합니다.
 *
 * 주요 API:
 * - TransportAPI: 재생 제어 (play, stop, pause, setBpm)
 * - SmartInstrumentAPI: 악기 관리 (loadKit, kitMorph)
 * - MacroEffectAPI: Smart Knob 제어 (setSmartKnob)
 */

// Core Engine
export { AudioEngine, audioEngine } from './AudioEngine';

// Track
export { InstrumentTrack } from './InstrumentTrack';

// Smart Knob
export {
  SmartKnobProcessor,
  detectInstrumentType,
  type SmartKnobPreset,
} from './SmartKnobProcessor';

// Re-export types
export type {
  InstrumentType,
  TrackState,
  TrackOptions,
  PlaybackState,
  TransportState,
  AudioEngineState,
  AudioEngineOptions,
  EffectType,
  SmartKnobProfile,
} from '../types/audio.types';

export {
  SMART_KNOB_NAMES,
  SMART_KNOB_PROFILES,
} from '../types/audio.types';
