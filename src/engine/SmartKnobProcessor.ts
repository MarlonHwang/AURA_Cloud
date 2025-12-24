/**
 * AURA Cloud Studio - Smart Knob Processor
 *
 * AI Smart Knob 기능 명세서 기반:
 * - 카멜레온 노브: 트랙 내용에 따라 노브 기능이 자동 변경
 * - 모든 트랙에 동일한 노브 1개가 있지만, AI가 트랙 내용을 분석하여 노브의 기능이 자동으로 변함
 *
 * 예시:
 * - Kick → PUNCH: Transient Shaper + Low EQ + Compression
 * - Snare → CRACK: High-Mid EQ + Saturation + Gate
 * - Vocal → AIR: High-Shelf EQ + De-esser
 */

import * as Tone from 'tone';
import {
  InstrumentType,
  EffectType,
  SMART_KNOB_PROFILES,
  SmartKnobMapping,
} from '../types/audio.types';
import type { InstrumentTrack } from './InstrumentTrack';

/**
 * Smart Knob 값(0-100)을 이펙트 파라미터로 변환하는 매핑 정의
 */
interface EffectParameterMapping {
  // 각 이펙트 타입별 파라미터 매핑 함수
  // value: 0-100, returns: 해당 이펙트의 파라미터 값들
  [key: string]: (value: number) => Record<string, number>;
}

/**
 * SmartKnobProcessor - Smart Knob 로직 처리
 *
 * "사용자에게는 지금 당장 가장 필요한 '단 하나의 노브'만 보여준다"
 * 내부적으로는 여러 이펙트가 동시에 조절됨
 */
export class SmartKnobProcessor {
  /**
   * Smart Knob 값에 따른 이펙트 파라미터 매핑
   * 각 이펙트 타입별로 0-100 값을 실제 파라미터로 변환
   */
  private readonly effectMappings: EffectParameterMapping = {
    // Transient Shaper: 어택 강조
    transientShaper: (value: number) => ({
      attack: this.mapRange(value, 0, 100, 0, 1),      // 0-1
      release: this.mapRange(value, 0, 100, 0.1, 0.5), // 빠른 릴리즈
    }),

    // Low EQ: 저음 부스트 (50-60Hz)
    lowEQ: (value: number) => ({
      frequency: 60,
      gain: this.mapRange(value, 0, 100, 0, 12),       // 0-12dB 부스트
      Q: 1.5,
    }),

    // High-Mid EQ: 밝은 소리 (2-4kHz)
    highMidEQ: (value: number) => ({
      frequency: 3000,
      gain: this.mapRange(value, 0, 100, 0, 8),        // 0-8dB 부스트
      Q: 1.2,
    }),

    // High-Shelf EQ: 에어감 (10kHz+)
    highShelfEQ: (value: number) => ({
      frequency: 10000,
      gain: this.mapRange(value, 0, 100, 0, 6),        // 0-6dB 부스트
    }),

    // High-Pass Filter: 저음 잡음 제거
    highPassFilter: (value: number) => ({
      frequency: this.mapRange(value, 0, 100, 80, 400), // 80-400Hz 컷오프
      Q: 0.7,
    }),

    // Compression: 소리 압축
    compression: (value: number) => ({
      threshold: this.mapRange(value, 0, 100, 0, -30),  // 0 to -30dB
      ratio: this.mapRange(value, 0, 100, 1, 8),       // 1:1 to 8:1
      attack: 0.01,
      release: 0.1,
    }),

    // Saturation: 왜곡/배음
    saturation: (value: number) => ({
      distortion: this.mapRange(value, 0, 100, 0, 0.8), // 0-0.8
      wet: this.mapRange(value, 0, 100, 0, 0.6),        // 0-60% wet
    }),

    // Gate: 잔향 제거
    gate: (value: number) => ({
      threshold: this.mapRange(value, 0, 100, -100, -30), // -100 to -30dB
      attack: 0.001,
      release: 0.1,
    }),

    // Exciter: 고역 반짝임
    exciter: (value: number) => ({
      frequency: 4000,
      gain: this.mapRange(value, 0, 100, 0, 8),
      // Exciter는 High-Shelf EQ + Saturation 조합으로 구현
    }),

    // Stereo Imager: 좌우 폭
    stereoImager: (value: number) => ({
      width: this.mapRange(value, 0, 100, 0.5, 1.5),    // 0.5-1.5 (1=원본)
    }),

    // Reverb: 공간감
    reverb: (value: number) => ({
      decay: this.mapRange(value, 0, 100, 0.5, 4),      // 0.5-4초
      wet: this.mapRange(value, 0, 100, 0, 0.5),       // 0-50% wet
      preDelay: 0.01,
    }),

    // Delay: 지연
    delay: (value: number) => ({
      delayTime: this.mapRange(value, 0, 100, 0.1, 0.5),
      feedback: this.mapRange(value, 0, 100, 0, 0.4),
      wet: this.mapRange(value, 0, 100, 0, 0.3),
    }),

    // De-esser: 치찰음 억제
    deesser: (value: number) => ({
      frequency: 6000,
      threshold: this.mapRange(value, 0, 100, 0, -20),  // 높을수록 더 많이 억제
      ratio: 4,
    }),
  };

  /**
   * 값 범위 변환 유틸리티
   */
  private mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ): number {
    return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
  }

  /**
   * Smart Knob 적용
   *
   * @param track 대상 트랙
   * @param value 노브 값 (0-100)
   */
  public applySmartKnob(track: InstrumentTrack, value: number): void {
    const profile = SMART_KNOB_PROFILES[track.instrumentType];

    if (!profile) {
      console.warn(`No Smart Knob profile for instrument type: ${track.instrumentType}`);
      return;
    }

    // 트랙의 Smart Knob 값 업데이트
    track.setSmartKnobValue(value);

    // 프로필에 정의된 각 이펙트에 파라미터 적용
    profile.effects.forEach(effectType => {
      this.applyEffectParameters(track, effectType, value);
    });

    console.log(
      `Smart Knob [${profile.displayName}] applied to track "${track.name}": value=${value}`
    );
  }

  /**
   * 개별 이펙트 파라미터 적용
   */
  private applyEffectParameters(
    track: InstrumentTrack,
    effectType: EffectType,
    value: number
  ): void {
    const mapping = this.effectMappings[effectType];

    if (!mapping) {
      console.warn(`No mapping for effect type: ${effectType}`);
      return;
    }

    const params = mapping(value);

    // 트랙의 이펙트 체인에 파라미터 적용
    track.updateEffectParams(effectType, params);
  }

  /**
   * 특정 악기 타입의 Smart Knob 프로필 조회
   */
  public getProfile(instrumentType: InstrumentType) {
    return SMART_KNOB_PROFILES[instrumentType];
  }

  /**
   * Smart Knob 디스플레이 이름 조회
   */
  public getDisplayName(instrumentType: InstrumentType): string {
    return SMART_KNOB_PROFILES[instrumentType]?.displayName || 'TONE';
  }

  /**
   * 특정 이펙트의 파라미터 값 계산 (미리보기용)
   */
  public calculateEffectParams(
    effectType: EffectType,
    value: number
  ): Record<string, number> | null {
    const mapping = this.effectMappings[effectType];
    return mapping ? mapping(value) : null;
  }
}

/**
 * Smart Knob 프리셋 (추후 확장용)
 * 사용자 정의 프로필이나 장르별 프로필 저장
 */
export interface SmartKnobPreset {
  id: string;
  name: string;
  instrumentType: InstrumentType;
  effects: EffectType[];
  customMappings?: Record<EffectType, (value: number) => Record<string, number>>;
}

/**
 * 악기 타입 자동 감지 (향후 AI 기능)
 * 오디오 분석을 통해 트랙의 악기 타입을 자동 판별
 */
export async function detectInstrumentType(audioBuffer: AudioBuffer): Promise<InstrumentType> {
  // TODO: AI 기반 악기 분류 구현
  // - Spectral analysis
  // - ML 모델을 통한 분류
  // 현재는 기본값 반환
  console.log('Instrument detection not yet implemented');
  return 'generic';
}
