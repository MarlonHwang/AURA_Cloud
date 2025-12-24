/**
 * AURA Cloud Studio - Audio Types
 * 기술 스택 합의서 기준: TypeScript
 */

// ============================================
// Smart Knob Types (AI Smart Knob 기능 명세서 기반)
// ============================================

/**
 * 악기 종류별 Smart Knob 프로필
 * 각 악기에 맞는 노브 이름과 내부 이펙트 체인이 매핑됨
 */
export type InstrumentType =
  | 'kick'      // PUNCH: 타격감, 저음 보강
  | 'snare'     // CRACK: 짝! 하는 소리, 고음 강조
  | 'hihat'     // CRISP: 찰랑거림, 잡음 제거
  | 'bass'      // GRIT: 거친 질감, 으르렁거림
  | 'piano'     // SPACE: 넓은 공간감, 울림
  | 'vocal'     // AIR: 숨소리, 투명함
  | 'synth'     // SHINE: 밝고 화려한 느낌
  | 'generic';  // 기본 프로필

/**
 * Smart Knob 디스플레이 이름 매핑
 */
export const SMART_KNOB_NAMES: Record<InstrumentType, string> = {
  kick: 'PUNCH',
  snare: 'CRACK',
  hihat: 'CRISP',
  bass: 'GRIT',
  piano: 'SPACE',
  vocal: 'AIR',
  synth: 'SHINE',
  generic: 'TONE',
};

/**
 * Smart Knob이 제어하는 이펙트 타입
 */
export type EffectType =
  | 'transientShaper'
  | 'lowEQ'
  | 'highMidEQ'
  | 'highShelfEQ'
  | 'highPassFilter'
  | 'compression'
  | 'saturation'
  | 'gate'
  | 'exciter'
  | 'stereoImager'
  | 'reverb'
  | 'delay'
  | 'deesser';

/**
 * Smart Knob 프로필 정의
 */
export interface SmartKnobProfile {
  displayName: string;
  effects: EffectType[];
  description: string;
}

/**
 * 악기별 Smart Knob 프로필 매핑
 */
export const SMART_KNOB_PROFILES: Record<InstrumentType, SmartKnobProfile> = {
  kick: {
    displayName: 'PUNCH',
    effects: ['transientShaper', 'lowEQ', 'compression'],
    description: '킥 드럼 타격감 강화',
  },
  snare: {
    displayName: 'CRACK',
    effects: ['highMidEQ', 'saturation', 'gate'],
    description: '스네어 찰진 소리 강화',
  },
  hihat: {
    displayName: 'CRISP',
    effects: ['highPassFilter', 'exciter'],
    description: '하이햇 선명도 강화',
  },
  bass: {
    displayName: 'GRIT',
    effects: ['saturation', 'highMidEQ'],
    description: '베이스 거친 질감 추가',
  },
  piano: {
    displayName: 'SPACE',
    effects: ['stereoImager', 'reverb'],
    description: '피아노 공간감 확장',
  },
  vocal: {
    displayName: 'AIR',
    effects: ['highShelfEQ', 'deesser'],
    description: '보컬 투명함 강화',
  },
  synth: {
    displayName: 'SHINE',
    effects: ['exciter', 'highShelfEQ'],
    description: '신디 밝기 강화',
  },
  generic: {
    displayName: 'TONE',
    effects: ['highMidEQ', 'compression'],
    description: '일반 톤 조절',
  },
};

// ============================================
// Track Types
// ============================================

/**
 * 트랙 상태
 */
export interface TrackState {
  id: string;
  name: string;
  instrumentType: InstrumentType;
  volume: number;      // -60 to +6 dB
  pan: number;         // -1 (L) to +1 (R)
  mute: boolean;
  solo: boolean;
  smartKnobValue: number;  // 0 to 100
  color: string;
}

/**
 * 트랙 생성 옵션
 */
export interface TrackOptions {
  name?: string;
  instrumentType?: InstrumentType;
  volume?: number;
  pan?: number;
  color?: string;
}

// ============================================
// Transport Types
// ============================================

/**
 * 재생 상태
 */
export type PlaybackState = 'stopped' | 'playing' | 'paused';

/**
 * Transport 상태
 */
export interface TransportState {
  playbackState: PlaybackState;
  isPlaying: boolean;               // 재생 중 여부 (play 버튼 상태용)
  bpm: number;
  timeSignature: [number, number];  // [beats, unit] e.g. [4, 4]
  position: string;                  // Tone.js Transport position format (Bar:Beat:Sixteenth)
  positionSeconds: number;           // 현재 위치 (초 단위)
  loop: boolean;
  loopStart: string;
  loopEnd: string;
}

// ============================================
// Audio Engine Types
// ============================================

/**
 * 오디오 엔진 상태
 */
export interface AudioEngineState {
  isInitialized: boolean;
  isContextRunning: boolean;
  masterVolume: number;
  transport: TransportState;
  tracks: TrackState[];
}

/**
 * 오디오 엔진 초기화 옵션
 */
export interface AudioEngineOptions {
  bpm?: number;
  timeSignature?: [number, number];
  masterVolume?: number;
}

// ============================================
// Effect Parameter Types
// ============================================

/**
 * 이펙트 파라미터 범위
 */
export interface EffectParameterRange {
  min: number;
  max: number;
  default: number;
  unit?: string;
}

/**
 * Smart Knob 값에 따른 이펙트 파라미터 매핑
 */
export interface SmartKnobMapping {
  effectType: EffectType;
  parameter: string;
  range: EffectParameterRange;
  curve?: 'linear' | 'exponential' | 'logarithmic';
}
