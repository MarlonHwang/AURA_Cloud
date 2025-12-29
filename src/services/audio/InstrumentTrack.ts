/**
 * AURA Cloud Studio - Instrument Track
 *
 * 개별 트랙의 모든 오디오 처리를 담당
 * - 볼륨, 팬, Mute/Solo
 * - Smart Knob 이펙트 체인
 * - 악기 타입에 따른 이펙트 프로필 자동 적용
 */

import * as Tone from 'tone';
import { v4 as uuidv4 } from 'uuid';
import {
  InstrumentType,
  TrackState,
  TrackOptions,
  EffectType,
  SMART_KNOB_PROFILES,
  SMART_KNOB_NAMES,
} from '../../types/audio.types';
import type { SmartKnobProcessor } from './SmartKnobProcessor';

/**
 * 트랙 기본 색상 (악기 타입별)
 */
const DEFAULT_TRACK_COLORS: Record<InstrumentType, string> = {
  kick: '#E85D4E',    // 빨강
  snare: '#FFB347',   // 주황
  hihat: '#87CEEB',   // 하늘색
  bass: '#4FD272',    // 초록
  piano: '#5DADE2',   // 파랑
  vocal: '#9D65D8',   // 보라
  synth: '#FF69B4',   // 핑크
  generic: '#808590', // 회색
};

/**
 * InstrumentTrack - 개별 트랙 클래스
 *
 * 신호 흐름:
 * [Input] -> [Effects Chain] -> [Channel Strip (Vol/Pan)] -> [Master]
 */
export class InstrumentTrack {
  // 트랙 식별
  public readonly id: string;
  private _name: string;
  private _instrumentType: InstrumentType;
  private _color: string;

  // Tone.js 노드
  private channel: Tone.Channel;        // 볼륨 + 팬 제어
  private effectsChain: Map<EffectType, Tone.ToneAudioNode> = new Map();
  private effectsInput: Tone.Gain;      // 이펙트 체인 입력
  private effectsOutput: Tone.Gain;     // 이펙트 체인 출력

  // 상태
  private _volume: number = 0;          // dB
  private _pan: number = 0;             // -1 to 1
  private _mute: boolean = false;
  private _solo: boolean = false;
  private _effectiveMute: boolean = false;  // 솔로 로직에 의한 실제 뮤트
  private _smartKnobValue: number = 50;     // 0-100

  // 참조
  private masterOutput: Tone.Gain;
  private smartKnobProcessor: SmartKnobProcessor;

  constructor(
    options: TrackOptions,
    masterOutput: Tone.Gain,
    smartKnobProcessor: SmartKnobProcessor
  ) {
    this.id = uuidv4();
    this._instrumentType = options.instrumentType || 'generic';
    this._name = options.name || this.generateDefaultName();
    this._color = options.color || DEFAULT_TRACK_COLORS[this._instrumentType];

    this.masterOutput = masterOutput;
    this.smartKnobProcessor = smartKnobProcessor;

    // Tone.js 노드 초기화
    this.channel = new Tone.Channel({
      volume: options.volume ?? 0,
      pan: options.pan ?? 0,
      mute: false,
    });

    this.effectsInput = new Tone.Gain(1);
    this.effectsOutput = new Tone.Gain(1);

    // 기본 연결: Input -> Output -> Channel -> Master
    this.effectsInput.connect(this.effectsOutput);
    this.effectsOutput.connect(this.channel);
    this.channel.connect(this.masterOutput);

    // 초기 볼륨/팬 설정
    this._volume = options.volume ?? 0;
    this._pan = options.pan ?? 0;

    // 악기 타입에 맞는 이펙트 체인 초기화
    this.initializeEffectsChain();

    console.log(`Track created: "${this._name}" (${this._instrumentType})`);
  }

  /**
   * 기본 트랙 이름 생성
   */
  private generateDefaultName(): string {
    const knobName = SMART_KNOB_NAMES[this._instrumentType];
    return `${knobName} Track`;
  }

  /**
   * 악기 타입에 맞는 이펙트 체인 초기화
   */
  private initializeEffectsChain(): void {
    const profile = SMART_KNOB_PROFILES[this._instrumentType];

    // 기존 이펙트 정리
    this.clearEffectsChain();

    // 프로필에 정의된 이펙트 생성
    profile.effects.forEach(effectType => {
      const effect = this.createEffect(effectType);
      if (effect) {
        this.effectsChain.set(effectType, effect);
      }
    });

    // 이펙트 체인 재연결
    this.reconnectEffectsChain();
  }

  /**
   * 이펙트 생성
   */
  private createEffect(effectType: EffectType): Tone.ToneAudioNode | null {
    switch (effectType) {
      case 'lowEQ':
      case 'highMidEQ':
        return new Tone.EQ3({
          low: 0,
          mid: 0,
          high: 0,
        });

      case 'highShelfEQ':
        return new Tone.Filter({
          type: 'highshelf',
          frequency: 10000,
          gain: 0,
        });

      case 'highPassFilter':
        return new Tone.Filter({
          type: 'highpass',
          frequency: 80,
          Q: 0.7,
        });

      case 'compression':
        return new Tone.Compressor({
          threshold: -24,
          ratio: 4,
          attack: 0.01,
          release: 0.1,
        });

      case 'saturation':
        return new Tone.Distortion({
          distortion: 0,
          wet: 0,
        });

      case 'gate':
        return new Tone.Gate({
          threshold: -100,
        });

      case 'reverb':
        return new Tone.Reverb({
          decay: 1.5,
          wet: 0,
          preDelay: 0.01,
        });

      case 'stereoImager':
        return new Tone.StereoWidener({
          width: 0.5,
        });

      case 'exciter':
        // Exciter는 High-Shelf EQ로 대체
        return new Tone.Filter({
          type: 'highshelf',
          frequency: 4000,
          gain: 0,
        });

      case 'transientShaper':
        // Transient Shaper는 Compressor로 근사
        return new Tone.Compressor({
          threshold: -20,
          ratio: 2,
          attack: 0.001,
          release: 0.05,
        });

      case 'deesser':
        // De-esser는 특정 주파수 대역 압축으로 구현
        return new Tone.MultibandCompressor({
          high: {
            threshold: -24,
            ratio: 4,
          },
        });

      case 'delay':
        return new Tone.FeedbackDelay({
          delayTime: 0.25,
          feedback: 0.2,
          wet: 0,
        });

      default:
        console.warn(`Unknown effect type: ${effectType}`);
        return null;
    }
  }

  /**
   * 이펙트 체인 연결
   */
  private reconnectEffectsChain(): void {
    // 기존 연결 해제
    this.effectsInput.disconnect();

    if (this.effectsChain.size === 0) {
      // 이펙트가 없으면 직접 연결
      this.effectsInput.connect(this.effectsOutput);
      return;
    }

    // 이펙트 체인 순서대로 연결
    const effects = Array.from(this.effectsChain.values());

    this.effectsInput.connect(effects[0]);

    for (let i = 0; i < effects.length - 1; i++) {
      effects[i].connect(effects[i + 1]);
    }

    effects[effects.length - 1].connect(this.effectsOutput);
  }

  /**
   * 이펙트 체인 정리
   */
  private clearEffectsChain(): void {
    this.effectsChain.forEach(effect => {
      effect.disconnect();
      effect.dispose();
    });
    this.effectsChain.clear();
  }

  // ============================================
  // Volume / Pan / Mute / Solo
  // ============================================

  /**
   * 볼륨 설정 (dB)
   */
  public setVolume(volumeDb: number): void {
    const clamped = Math.max(-60, Math.min(6, volumeDb));
    this._volume = clamped;
    this.channel.volume.value = clamped;
  }

  public get volume(): number {
    return this._volume;
  }

  /**
   * 팬 설정 (-1 to 1)
   */
  public setPan(pan: number): void {
    const clamped = Math.max(-1, Math.min(1, pan));
    this._pan = clamped;
    this.channel.pan.value = clamped;
  }

  public get pan(): number {
    return this._pan;
  }

  /**
   * 뮤트 설정
   */
  public setMute(mute: boolean): void {
    this._mute = mute;
    // 솔로 로직이 없으면 바로 적용
    if (!this._effectiveMute) {
      this.channel.mute = mute;
    }
  }

  public get mute(): boolean {
    return this._mute;
  }

  /**
   * 솔로 설정
   */
  public setSolo(solo: boolean): void {
    this._solo = solo;
    // AudioEngine에서 updateSoloState()를 호출해야 실제 적용됨
  }

  public get solo(): boolean {
    return this._solo;
  }

  /**
   * 실제 뮤트 상태 설정 (솔로 로직에 의해 호출됨)
   */
  public setEffectiveMute(mute: boolean): void {
    this._effectiveMute = mute;
    this.channel.mute = this._mute || mute;
  }

  // ============================================
  // Instrument Type & Smart Knob
  // ============================================

  /**
   * 악기 타입 변경
   */
  public setInstrumentType(type: InstrumentType): void {
    if (this._instrumentType === type) return;

    this._instrumentType = type;
    this._color = DEFAULT_TRACK_COLORS[type];

    // 이펙트 체인 재초기화
    this.initializeEffectsChain();

    // Smart Knob 재적용
    this.smartKnobProcessor.applySmartKnob(this, this._smartKnobValue);

    console.log(`Track "${this._name}" instrument type changed to: ${type}`);
  }

  public get instrumentType(): InstrumentType {
    return this._instrumentType;
  }

  /**
   * Smart Knob 값 설정
   */
  public setSmartKnobValue(value: number): void {
    this._smartKnobValue = Math.max(0, Math.min(100, value));
  }

  public get smartKnobValue(): number {
    return this._smartKnobValue;
  }

  /**
   * Smart Knob 디스플레이 이름
   */
  public get smartKnobName(): string {
    return SMART_KNOB_NAMES[this._instrumentType];
  }

  /**
   * 이펙트 파라미터 업데이트 (SmartKnobProcessor에서 호출)
   */
  public updateEffectParams(effectType: EffectType, params: Record<string, number>): void {
    const effect = this.effectsChain.get(effectType);

    if (!effect) {
      // 해당 이펙트가 없으면 생성
      const newEffect = this.createEffect(effectType);
      if (newEffect) {
        this.effectsChain.set(effectType, newEffect);
        this.reconnectEffectsChain();
      }
      return;
    }

    // 파라미터 적용
    try {
      this.applyParamsToEffect(effect, effectType, params);
    } catch (error) {
      console.error(`Failed to update effect params for ${effectType}:`, error);
    }
  }

  /**
   * 이펙트에 파라미터 적용
   */
  private applyParamsToEffect(
    effect: Tone.ToneAudioNode,
    effectType: EffectType,
    params: Record<string, number>
  ): void {
    switch (effectType) {
      case 'lowEQ':
        if (effect instanceof Tone.EQ3) {
          effect.low.value = params.gain || 0;
        }
        break;

      case 'highMidEQ':
        if (effect instanceof Tone.EQ3) {
          effect.mid.value = params.gain || 0;
        }
        break;

      case 'highShelfEQ':
      case 'exciter':
        if (effect instanceof Tone.Filter) {
          effect.gain.value = params.gain || 0;
          if (params.frequency) effect.frequency.value = params.frequency;
        }
        break;

      case 'highPassFilter':
        if (effect instanceof Tone.Filter) {
          effect.frequency.value = params.frequency || 80;
          if (params.Q) effect.Q.value = params.Q;
        }
        break;

      case 'compression':
      case 'transientShaper':
        if (effect instanceof Tone.Compressor) {
          if (params.threshold !== undefined) effect.threshold.value = params.threshold;
          if (params.ratio !== undefined) effect.ratio.value = params.ratio;
          if (params.attack !== undefined) effect.attack.value = params.attack;
          if (params.release !== undefined) effect.release.value = params.release;
        }
        break;

      case 'saturation':
        if (effect instanceof Tone.Distortion) {
          if (params.distortion !== undefined) effect.distortion = params.distortion;
          if (params.wet !== undefined) effect.wet.value = params.wet;
        }
        break;

      case 'gate':
        if (effect instanceof Tone.Gate) {
          if (params.threshold !== undefined) effect.threshold = params.threshold;
        }
        break;

      case 'reverb':
        if (effect instanceof Tone.Reverb) {
          if (params.wet !== undefined) effect.wet.value = params.wet;
          // decay는 생성 시에만 설정 가능
        }
        break;

      case 'stereoImager':
        if (effect instanceof Tone.StereoWidener) {
          if (params.width !== undefined) effect.width.value = params.width;
        }
        break;

      case 'delay':
        if (effect instanceof Tone.FeedbackDelay) {
          if (params.delayTime !== undefined) effect.delayTime.value = params.delayTime;
          if (params.feedback !== undefined) effect.feedback.value = params.feedback;
          if (params.wet !== undefined) effect.wet.value = params.wet;
        }
        break;
    }
  }

  // ============================================
  // Track Properties
  // ============================================

  public get name(): string {
    return this._name;
  }

  public setName(name: string): void {
    this._name = name;
  }

  public get color(): string {
    return this._color;
  }

  public setColor(color: string): void {
    this._color = color;
  }

  /**
   * 오디오 입력 노드 (외부에서 연결용)
   */
  public get input(): Tone.Gain {
    return this.effectsInput;
  }

  // ============================================
  // State Snapshot
  // ============================================

  /**
   * 트랙 상태 스냅샷 반환
   */
  public getState(): TrackState {
    return {
      id: this.id,
      name: this._name,
      instrumentType: this._instrumentType,
      volume: this._volume,
      pan: this._pan,
      mute: this._mute,
      solo: this._solo,
      smartKnobValue: this._smartKnobValue,
      color: this._color,
    };
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * 트랙 리소스 정리
   */
  public dispose(): void {
    this.clearEffectsChain();

    this.effectsInput.disconnect();
    this.effectsInput.dispose();

    this.effectsOutput.disconnect();
    this.effectsOutput.dispose();

    this.channel.disconnect();
    this.channel.dispose();

    console.log(`Track disposed: "${this._name}"`);
  }
}
