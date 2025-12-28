/**
 * AURA Cloud Studio - Synth Drums
 *
 * Tone.js 합성 드럼 구현
 * - Kick: MembraneSynth (깊은 저음)
 * - Snare: NoiseSynth (찰진 소리)
 * - HiHat: MetalSynth (금속성 소리)
 * - Clap: NoiseSynth (짧은 decay)
 */

import * as Tone from 'tone';
import {
  DrumPart,
  DrumKitStyle,
  SynthDrumParams,
  OscillatorType,
  NoiseType,
} from '../../types/sound.types';

// ============================================
// 드럼킷 스타일별 기본 파라미터
// ============================================

/**
 * 스타일별 합성 드럼 파라미터 프리셋
 */
export const DRUM_STYLE_PARAMS: Record<DrumKitStyle, SynthDrumParams> = {
  trap: {
    kick: {
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
    },
    snare: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.2 },
    },
    hihat: {
      frequency: 300,
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    },
    clap: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
    },
  },

  lofi: {
    kick: {
      pitchDecay: 0.08,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.05, release: 0.8 },
    },
    snare: {
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0.01, release: 0.3 },
    },
    hihat: {
      frequency: 250,
      envelope: { attack: 0.002, decay: 0.08, release: 0.05 },
      harmonicity: 4,
      modulationIndex: 20,
      resonance: 3000,
      octaves: 1,
    },
    clap: {
      noise: { type: 'pink' },
      envelope: { attack: 0.005, decay: 0.12, sustain: 0, release: 0.15 },
    },
  },

  acoustic: {
    kick: {
      pitchDecay: 0.02,
      octaves: 3,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.5 },
    },
    snare: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0.01, release: 0.25 },
    },
    hihat: {
      frequency: 400,
      envelope: { attack: 0.001, decay: 0.12, release: 0.02 },
      harmonicity: 6,
      modulationIndex: 40,
      resonance: 5000,
      octaves: 1.2,
    },
    clap: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.08 },
    },
  },

  electronic: {
    kick: {
      pitchDecay: 0.03,
      octaves: 8,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 1 },
    },
    snare: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.15 },
    },
    hihat: {
      frequency: 350,
      envelope: { attack: 0.001, decay: 0.06, release: 0.01 },
      harmonicity: 5.5,
      modulationIndex: 50,
      resonance: 6000,
      octaves: 2,
    },
    clap: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 },
    },
  },

  hiphop: {
    kick: {
      pitchDecay: 0.04,
      octaves: 5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.35, sustain: 0.01, release: 0.8 },
    },
    snare: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.22, sustain: 0.02, release: 0.2 },
    },
    hihat: {
      frequency: 280,
      envelope: { attack: 0.001, decay: 0.1, release: 0.02 },
      harmonicity: 4.5,
      modulationIndex: 28,
      resonance: 4500,
      octaves: 1.3,
    },
    clap: {
      noise: { type: 'white' },
      envelope: { attack: 0.002, decay: 0.18, sustain: 0, release: 0.12 },
    },
  },

  pop: {
    kick: {
      pitchDecay: 0.025,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.25, sustain: 0.01, release: 0.6 },
    },
    snare: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.16, sustain: 0.01, release: 0.2 },
    },
    hihat: {
      frequency: 320,
      envelope: { attack: 0.001, decay: 0.08, release: 0.02 },
      harmonicity: 5,
      modulationIndex: 35,
      resonance: 5500,
      octaves: 1.4,
    },
    clap: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.14, sustain: 0, release: 0.1 },
    },
  },

  rock: {
    kick: {
      pitchDecay: 0.015,
      octaves: 3.5,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.18, sustain: 0.02, release: 0.4 },
    },
    snare: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0.02, release: 0.3 },
    },
    hihat: {
      frequency: 380,
      envelope: { attack: 0.001, decay: 0.14, release: 0.03 },
      harmonicity: 5.8,
      modulationIndex: 45,
      resonance: 5000,
      octaves: 1.5,
    },
    clap: {
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.1 },
    },
  },
};

// ============================================
// SynthDrums 클래스
// ============================================

/**
 * SynthDrums - Tone.js 합성 드럼 세트
 *
 * 각 드럼 파트를 합성 방식으로 생성하여
 * 외부 샘플 없이도 다양한 드럼 사운드 제공
 */
export class SynthDrums {
  // 각 드럼 파트의 신디사이저
  private kick: Tone.MembraneSynth;
  private snare: Tone.NoiseSynth;
  private hihat: Tone.MetalSynth;
  private clap: Tone.NoiseSynth;
  private perc: Tone.MetalSynth;  // 별도 perc 신디사이저

  // 개별 출력 게인
  private kickGain: Tone.Gain;
  private snareGain: Tone.Gain;
  private hihatGain: Tone.Gain;
  private clapGain: Tone.Gain;
  private percGain: Tone.Gain;

  // 마스터 출력
  private output: Tone.Gain;

  // 현재 스타일
  private _currentStyle: DrumKitStyle;

  // Humanize 설정 (0 ~ 1)
  private _humanizeAmount: number = 0;

  constructor(style: DrumKitStyle = 'trap') {
    this._currentStyle = style;
    const params = DRUM_STYLE_PARAMS[style];

    // 출력 게인 초기화
    this.output = new Tone.Gain(1);
    this.kickGain = new Tone.Gain(1);
    this.snareGain = new Tone.Gain(0.8);
    this.hihatGain = new Tone.Gain(0.6);
    this.clapGain = new Tone.Gain(0.7);
    this.percGain = new Tone.Gain(0.5);

    // Kick: MembraneSynth
    this.kick = new Tone.MembraneSynth({
      pitchDecay: params.kick.pitchDecay,
      octaves: params.kick.octaves,
      oscillator: params.kick.oscillator,
      envelope: params.kick.envelope,
    });

    // Snare: NoiseSynth
    this.snare = new Tone.NoiseSynth({
      noise: params.snare.noise,
      envelope: params.snare.envelope,
    });

    // HiHat: MetalSynth
    this.hihat = new Tone.MetalSynth({
      frequency: params.hihat.frequency,
      envelope: params.hihat.envelope,
      harmonicity: params.hihat.harmonicity,
      modulationIndex: params.hihat.modulationIndex,
      resonance: params.hihat.resonance,
      octaves: params.hihat.octaves,
    });

    // Clap: NoiseSynth (짧은 decay)
    this.clap = new Tone.NoiseSynth({
      noise: params.clap.noise,
      envelope: params.clap.envelope,
    });

    // Perc: 별도 MetalSynth (hihat과 다른 설정)
    this.perc = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.15, release: 0.05 },
      harmonicity: 3,
      modulationIndex: 20,
      resonance: 3000,
      octaves: 1,
    });

    // 라우팅 연결
    this.kick.connect(this.kickGain);
    this.snare.connect(this.snareGain);
    this.hihat.connect(this.hihatGain);
    this.clap.connect(this.clapGain);
    this.perc.connect(this.percGain);

    this.kickGain.connect(this.output);
    this.snareGain.connect(this.output);
    this.hihatGain.connect(this.output);
    this.clapGain.connect(this.output);
    this.percGain.connect(this.output);

    // EMERGENCY ROLLBACK: Direct connection to output (Ensure Sound!)
    this.output.toDestination();

    console.log(`SynthDrums initialized with style: ${style}`);
  }

  /**
   * 드럼 파트 트리거
   * Humanize가 적용되면 타이밍과 벨로시티에 랜덤 변화가 추가됨
   *
   * 정밀도 튜닝 (v2):
   * - 스케일링 팩터 0.5 적용 (100%에서도 음악적으로 허용 가능한 범위)
   * - 타이밍: 최대 ±15ms (기존 ±50ms의 30%)
   * - 벨로시티: 최대 ±10% (기존 ±20%의 50%)
   */
  public trigger(part: DrumPart, time?: Tone.Unit.Time, velocity: number = 1): void {
    const baseTime = (time !== undefined) ? Tone.Time(time).toSeconds() : Tone.now();

    // 스케일링 팩터: UI 값을 감쇠시켜 정밀 조작 가능
    const effectiveAmount = this._humanizeAmount * 0.5;

    // Humanize 적용: 타이밍 오프셋 (최대 ±15ms)
    // 0.03초 = 30ms, * (random - 0.5) = ±15ms
    const timingOffset = effectiveAmount * (Math.random() - 0.5) * 0.03;
    const triggerTime = baseTime + timingOffset;

    // Humanize 적용: 벨로시티 변화 (최대 ±10%)
    // 0.2 * effectiveAmount = 최대 ±10% 변화
    const velocityVariation = 1 + effectiveAmount * (Math.random() - 0.5) * 0.2;
    const humanizedVelocity = Math.max(0.3, Math.min(1, velocity * velocityVariation));

    switch (part) {
      case 'kick':
        this.kick.triggerAttackRelease('C1', '8n', triggerTime, humanizedVelocity);
        break;
      case 'snare':
        this.snare.triggerAttackRelease('8n', triggerTime, humanizedVelocity);
        break;
      case 'hihat':
        this.hihat.triggerAttackRelease('C4', '32n', triggerTime, humanizedVelocity * 0.8);
        break;
      case 'clap':
        this.clap.triggerAttackRelease('16n', triggerTime, humanizedVelocity);
        break;
      case 'perc':
      case 'tom':
        // 별도 perc 신디사이저 사용
        this.perc.triggerAttackRelease('C5', '16n', triggerTime, humanizedVelocity * 0.7);
        break;
      case 'crash':
      case 'ride':
        // crash/ride는 더 긴 decay로 처리
        this.perc.triggerAttackRelease('C6', '8n', triggerTime, humanizedVelocity * 0.5);
        break;
      default:
        console.warn(`Unknown drum part: ${part}`);
    }
  }

  /**
   * Humanize 설정 (0 ~ 1)
   * 0: 완벽한 기계적 타이밍
   * 1: 음악적으로 자연스러운 그루브 (타이밍 ±15ms, 벨로시티 ±10%)
   *
   * 내부적으로 0.5 스케일링 적용되어 섬세한 조작 가능
   */
  public setHumanize(amount: number): void {
    this._humanizeAmount = Math.max(0, Math.min(1, amount));
  }

  /**
   * 현재 Humanize 값 조회
   */
  public get humanizeAmount(): number {
    return this._humanizeAmount;
  }

  /**
   * 개별 파트 볼륨 설정
   */
  public setPartVolume(part: DrumPart, volume: number): void {
    const gain = Math.max(0, Math.min(1, volume));

    switch (part) {
      case 'kick':
        this.kickGain.gain.value = gain;
        break;
      case 'snare':
        this.snareGain.gain.value = gain;
        break;
      case 'hihat':
        this.hihatGain.gain.value = gain;
        break;
      case 'clap':
        this.clapGain.gain.value = gain;
        break;
    }
  }

  /**
   * 스타일 변경 (Kit Morph)
   */
  public setStyle(style: DrumKitStyle): void {
    if (this._currentStyle === style) return;

    const params = DRUM_STYLE_PARAMS[style];
    this._currentStyle = style;

    // Kick 파라미터 업데이트
    this.kick.set({
      pitchDecay: params.kick.pitchDecay,
      octaves: params.kick.octaves,
      oscillator: params.kick.oscillator,
      envelope: params.kick.envelope,
    });

    // Snare 파라미터 업데이트
    this.snare.set({
      noise: params.snare.noise,
      envelope: params.snare.envelope,
    });

    // HiHat 파라미터 업데이트
    this.hihat.set({
      frequency: params.hihat.frequency,
      envelope: params.hihat.envelope,
      harmonicity: params.hihat.harmonicity,
      modulationIndex: params.hihat.modulationIndex,
      resonance: params.hihat.resonance,
      octaves: params.hihat.octaves,
    });

    // Clap 파라미터 업데이트
    this.clap.set({
      noise: params.clap.noise,
      envelope: params.clap.envelope,
    });

    console.log(`SynthDrums style changed to: ${style}`);
  }

  /**
   * 현재 스타일 조회
   */
  public get currentStyle(): DrumKitStyle {
    return this._currentStyle;
  }

  /**
   * 커스텀 파라미터 적용
   */
  public setCustomParams(params: Partial<SynthDrumParams>): void {
    if (params.kick) {
      this.kick.set(params.kick);
    }
    if (params.snare) {
      this.snare.set(params.snare);
    }
    if (params.hihat) {
      this.hihat.set(params.hihat);
    }
    if (params.clap) {
      this.clap.set(params.clap);
    }
  }

  /**
   * 출력 노드 연결
   */
  public connect(destination: Tone.InputNode): this {
    this.output.connect(destination);
    return this;
  }

  /**
   * 출력 노드 연결 해제
   */
  public disconnect(): this {
    this.output.disconnect();
    return this;
  }

  /**
   * 마스터 볼륨 설정
   */
  public setVolume(volume: number): void {
    this.output.gain.value = Math.max(0, Math.min(2, volume));
  }

  /**
   * 웨이브폼 데이터 가져오기 (실시간 오디오 분석)
   * @deprecated 사용하지 않음 (AudioEngine 마스터 분석기 사용 권장)
   */
  public getWaveformData(): Float32Array {
    // Main.ts에서 AudioEngine으로 마이그레이션 예정
    return new Float32Array(0);
  }

  /**
   * 분석기 인스턴스 가져오기
   * @deprecated 사용하지 않음
   */
  public getAnalyser(): Tone.Analyser | null {
    return null;
  }

  /**
   * 리소스 정리
   */
  public dispose(): void {
    this.kick.dispose();
    this.snare.dispose();
    this.hihat.dispose();
    this.clap.dispose();
    this.perc.dispose();

    this.kickGain.dispose();
    this.snareGain.dispose();
    this.hihatGain.dispose();
    this.clapGain.dispose();
    this.percGain.dispose();

    // this.analyser.dispose(); // Removed
    this.output.dispose();

    console.log('SynthDrums disposed');
  }

  /**
   * 사용 가능한 스타일 목록
   */
  public static getAvailableStyles(): DrumKitStyle[] {
    return Object.keys(DRUM_STYLE_PARAMS) as DrumKitStyle[];
  }

  /**
   * 스타일 정보 조회
   */
  public static getStyleInfo(style: DrumKitStyle): { name: string; description: string } {
    const styleInfo: Record<DrumKitStyle, { name: string; description: string }> = {
      trap: { name: 'Trap', description: '강한 808 킥과 찰진 스네어' },
      lofi: { name: 'Lo-Fi', description: '먼지 낀 빈티지 사운드' },
      acoustic: { name: 'Acoustic', description: '실제 드럼 느낌' },
      electronic: { name: 'Electronic', description: '신디사이저 드럼' },
      hiphop: { name: 'Hip-Hop', description: '클래식 붐뱁 스타일' },
      pop: { name: 'Pop', description: '밝고 펀치감 있는 사운드' },
      rock: { name: 'Rock', description: '강한 킥과 스네어' },
    };

    return styleInfo[style];
  }
}
