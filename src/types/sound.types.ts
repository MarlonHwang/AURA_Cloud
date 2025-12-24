/**
 * AURA Cloud Studio - Sound Types
 *
 * 사운드 로딩 시스템 관련 타입 정의
 */

// ============================================
// Drum Kit Types
// ============================================

/**
 * 드럼 파트 종류
 */
export type DrumPart = 'kick' | 'snare' | 'hihat' | 'clap' | 'tom' | 'crash' | 'ride' | 'perc';

/**
 * 드럼킷 장르/스타일
 */
export type DrumKitStyle =
  | 'trap'       // 트랩 - 강한 808, 찰진 스네어
  | 'lofi'       // 로파이 - 먼지 낀 빈티지 사운드
  | 'acoustic'   // 어쿠스틱 - 실제 드럼 느낌
  | 'electronic' // 일렉트로닉 - 신디사이저 드럼
  | 'hiphop'     // 힙합 - 클래식 붐뱁
  | 'pop'        // 팝 - 밝고 펀치감 있는
  | 'rock';      // 락 - 강한 킥과 스네어

/**
 * 합성 드럼 파라미터 (Tone.js Synth 기반)
 */
export interface SynthDrumParams {
  kick: {
    pitchDecay: number;
    octaves: number;
    oscillator: { type: OscillatorType };
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
  };
  snare: {
    noise: { type: NoiseType };
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
  };
  hihat: {
    frequency: number;
    envelope: {
      attack: number;
      decay: number;
      release: number;
    };
    harmonicity: number;
    modulationIndex: number;
    resonance: number;
    octaves: number;
  };
  clap: {
    noise: { type: NoiseType };
    envelope: {
      attack: number;
      decay: number;
      sustain: number;
      release: number;
    };
  };
}

/**
 * 오실레이터 타입
 */
export type OscillatorType = 'sine' | 'square' | 'triangle' | 'sawtooth';

/**
 * 노이즈 타입
 */
export type NoiseType = 'white' | 'pink' | 'brown';

/**
 * 드럼킷 프리셋
 */
export interface DrumKitPreset {
  id: string;
  name: string;
  style: DrumKitStyle;
  description: string;
  synthParams: Partial<SynthDrumParams>;
  // 샘플 기반일 경우 사용
  sampleUrls?: Partial<Record<DrumPart, string>>;
  // 프리셋 메타데이터
  tags?: string[];
  bpmRange?: [number, number];  // 추천 BPM 범위
}

// ============================================
// Sampler Types
// ============================================

/**
 * 샘플 정보
 */
export interface SampleInfo {
  id: string;
  name: string;
  url: string;
  duration?: number;
  pitch?: string;  // 예: 'C4'
  category: SampleCategory;
  tags?: string[];
}

/**
 * 샘플 카테고리
 */
export type SampleCategory =
  | 'drums'
  | 'bass'
  | 'keys'
  | 'synth'
  | 'vocal'
  | 'fx'
  | 'loops'
  | 'oneshots';

/**
 * 샘플러 맵 (Tone.Sampler용)
 */
export interface SamplerMap {
  [note: string]: string;  // 예: { 'C4': 'url/to/sample.wav' }
}

// ============================================
// Instrument Types
// ============================================

/**
 * 악기 카테고리
 */
export type InstrumentCategory =
  | 'drums'
  | 'bass'
  | 'piano'
  | 'synth'
  | 'strings'
  | 'brass'
  | 'guitar'
  | 'vocal';

/**
 * 악기 프리셋
 */
export interface InstrumentPreset {
  id: string;
  name: string;
  category: InstrumentCategory;
  description?: string;
  // 합성 악기 파라미터
  synthType?: 'mono' | 'poly' | 'fm' | 'am' | 'membrane' | 'metal' | 'noise';
  synthParams?: Record<string, any>;
  // 샘플러 기반일 경우
  samplerMap?: SamplerMap;
  // 이펙트 프리셋
  effectsPreset?: string;
}

// ============================================
// Sound Library Types
// ============================================

/**
 * 사운드 라이브러리 상태
 */
export interface SoundLibraryState {
  isLoading: boolean;
  loadedKits: string[];
  loadedInstruments: string[];
  currentKit: string | null;
  error: string | null;
}

/**
 * 로딩 진행 상태
 */
export interface LoadingProgress {
  total: number;
  loaded: number;
  currentItem: string;
  percentage: number;
}

/**
 * Kit Morph 옵션
 */
export interface KitMorphOptions {
  // 패턴 유지 여부
  preservePattern: boolean;
  // 크로스페이드 시간 (ms)
  crossfadeDuration?: number;
  // BPM에 맞는 킷만 추천
  matchBpm?: boolean;
  // 현재 BPM
  currentBpm?: number;
}
