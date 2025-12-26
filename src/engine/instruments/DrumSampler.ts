/**
 * AURA Cloud Studio - Drum Sampler
 *
 * Tone.Sampler 기반 드럼 샘플러
 * - 외부 WAV 파일 로딩 가능
 * - 99Sounds 등 샘플팩 교체 가능한 구조
 * - Kit Morph 지원
 */

import * as Tone from 'tone';
import { DrumPart, DrumKitStyle, SamplerMap } from '../../types/sound.types';

// ============================================
// 드럼 파트별 기본 노트 매핑
// ============================================

/**
 * 드럼 파트별 MIDI 노트 매핑 (GM Standard)
 */
export const DRUM_NOTE_MAP: Record<DrumPart, string> = {
  kick: 'C1',    // 36
  snare: 'D1',   // 38
  hihat: 'F#1',  // 42
  clap: 'D#1',   // 39
  tom: 'A1',     // 45
  crash: 'C#2',  // 49
  ride: 'D#2',   // 51
  perc: 'G#1',   // 44
};

/**
 * 기본 드럼 샘플 URL (CDN에서 로드 - 추후 실제 URL로 교체)
 */
const DEFAULT_SAMPLE_BASE_URL = '/samples/drums/';

// ============================================
// DrumSampler 클래스
// ============================================

/**
 * DrumSampler - 샘플 기반 드럼 머신
 *
 * 외부 WAV/MP3 파일을 로드하여 드럼 사운드 재생
 * Kit Morph 시 패턴은 유지하고 샘플만 교체
 */
export class DrumSampler {
  // Tone.js 샘플러들 (파트별)
  private samplers: Map<DrumPart, Tone.Sampler> = new Map();

  // 개별 출력 게인
  private gains: Map<DrumPart, Tone.Gain> = new Map();

  // 마스터 출력
  private output: Tone.Gain;

  // 현재 로드된 킷 정보
  private _currentKitId: string | null = null;
  private _isLoaded: boolean = false;

  // 로딩 상태
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    this.output = new Tone.Gain(1);
    this.output.toDestination();
  }

  /**
   * 드럼킷 로드
   */
  public async loadKit(
    kitId: string,
    sampleUrls: Partial<Record<DrumPart, string>>
  ): Promise<void> {
    // 이미 로딩 중이면 대기
    if (this.loadingPromise) {
      await this.loadingPromise;
    }

    this._isLoaded = false;

    this.loadingPromise = this._loadKitInternal(kitId, sampleUrls);
    await this.loadingPromise;
    this.loadingPromise = null;
  }

  /**
   * 내부 킷 로드 로직
   */
  private async _loadKitInternal(
    kitId: string,
    sampleUrls: Partial<Record<DrumPart, string>>
  ): Promise<void> {
    // 기존 샘플러 정리
    this.disposeSamplers();

    const loadPromises: Promise<void>[] = [];

    // 각 파트별 샘플러 생성
    for (const [part, url] of Object.entries(sampleUrls) as [DrumPart, string][]) {
      const note = DRUM_NOTE_MAP[part];
      const gain = new Tone.Gain(this.getDefaultGainForPart(part));

      const sampler = new Tone.Sampler({
        urls: { [note]: url },
        baseUrl: '',
        onload: () => {
          console.log(`Loaded sample for ${part}: ${url}`);
        },
        onerror: (error) => {
          console.error(`Failed to load sample for ${part}:`, error);
        },
      });

      // 로드 완료 대기
      loadPromises.push(
        new Promise<void>((resolve, reject) => {
          sampler.context.rawContext.resume().then(() => {
            // Tone.loaded()로 모든 버퍼 로드 대기
            Tone.loaded()
              .then(() => resolve())
              .catch(reject);
          });
        })
      );

      sampler.connect(gain);
      gain.connect(this.output);

      this.samplers.set(part, sampler);
      this.gains.set(part, gain);
    }

    try {
      await Promise.all(loadPromises);
      this._currentKitId = kitId;
      this._isLoaded = true;
      console.log(`DrumSampler kit loaded: ${kitId}`);
    } catch (error) {
      console.error('Failed to load drum kit:', error);
      throw error;
    }
  }

  /**
   * 파트별 기본 게인값
   */
  private getDefaultGainForPart(part: DrumPart): number {
    const defaults: Partial<Record<DrumPart, number>> = {
      kick: 1.0,
      snare: 0.9,
      hihat: 0.7,
      clap: 0.8,
      tom: 0.85,
      crash: 0.6,
      ride: 0.5,
      perc: 0.75,
    };
    return defaults[part] ?? 0.8;
  }

  /**
   * 드럼 파트 트리거
   */
  public trigger(part: DrumPart, time?: Tone.Unit.Time, velocity: number = 1): void {
    if (!this._isLoaded) {
      // console.warn('DrumSampler not loaded yet'); // Suppress warning for hybrid usage
      // return; 
      // check if specific part exists even if kit not full loaded?
    }

    const sampler = this.samplers.get(part);
    if (!sampler) {
      // console.warn(`No sampler for part: ${part}`);
      return;
    }

    const note = DRUM_NOTE_MAP[part];
    const triggerTime = time ?? Tone.now();

    sampler.triggerAttackRelease(note, '8n', triggerTime, velocity);
  }

  /**
   * 해당 파트의 샘플이 있는지 확인
   */
  public hasPart(part: DrumPart): boolean {
    return this.samplers.has(part);
  }

  /**
   * 개별 파트 볼륨 설정
   */
  public setPartVolume(part: DrumPart, volume: number): void {
    const gain = this.gains.get(part);
    if (gain) {
      gain.gain.value = Math.max(0, Math.min(2, volume));
    }
  }

  /**
   * 개별 파트 샘플 교체
   */
  public async replaceSample(part: DrumPart, url: string): Promise<void> {
    const note = DRUM_NOTE_MAP[part];

    // 기존 샘플러 정리
    const oldSampler = this.samplers.get(part);
    if (oldSampler) {
      oldSampler.dispose();
    }

    // 새 샘플러 생성
    const gain = this.gains.get(part) || new Tone.Gain(this.getDefaultGainForPart(part));

    const sampler = new Tone.Sampler({
      urls: { [note]: url },
      baseUrl: '',
    });

    await Tone.loaded();

    sampler.connect(gain);

    if (!this.gains.has(part)) {
      gain.connect(this.output);
      this.gains.set(part, gain);
    }

    this.samplers.set(part, sampler);

    console.log(`Replaced sample for ${part}: ${url}`);
  }

  /**
   * 현재 킷 ID
   */
  public get currentKitId(): string | null {
    return this._currentKitId;
  }

  /**
   * 로드 상태
   */
  public get isLoaded(): boolean {
    return this._isLoaded;
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
   * 샘플러 정리
   */
  private disposeSamplers(): void {
    this.samplers.forEach((sampler) => sampler.dispose());
    this.samplers.clear();

    this.gains.forEach((gain) => gain.dispose());
    this.gains.clear();
  }

  /**
   * 전체 리소스 정리
   */
  public dispose(): void {
    this.disposeSamplers();
    this.output.dispose();
    this._isLoaded = false;
    this._currentKitId = null;
    console.log('DrumSampler disposed');
  }
}

// ============================================
// 범용 Sampler 클래스 (악기용)
// ============================================

/**
 * InstrumentSampler - 범용 악기 샘플러
 *
 * 피아노, 베이스 등 다양한 악기 샘플 로드
 */
export class InstrumentSampler {
  private sampler: Tone.Sampler | null = null;
  private output: Tone.Gain;
  private _isLoaded: boolean = false;
  private _instrumentId: string | null = null;

  constructor() {
    this.output = new Tone.Gain(1);
    this.output.toDestination();
  }

  /**
   * 악기 샘플 로드
   */
  public async load(
    instrumentId: string,
    samplerMap: SamplerMap,
    baseUrl: string = ''
  ): Promise<void> {
    // 기존 샘플러 정리
    if (this.sampler) {
      this.sampler.dispose();
    }

    this._isLoaded = false;

    this.sampler = new Tone.Sampler({
      urls: samplerMap,
      baseUrl,
      release: 1,
      onload: () => {
        console.log(`Instrument loaded: ${instrumentId}`);
      },
    });

    await Tone.loaded();

    this.sampler.connect(this.output);
    this._instrumentId = instrumentId;
    this._isLoaded = true;
  }

  /**
   * 노트 트리거
   */
  public triggerAttack(
    note: Tone.Unit.Frequency,
    time?: Tone.Unit.Time,
    velocity?: number
  ): void {
    if (!this._isLoaded || !this.sampler) {
      console.warn('InstrumentSampler not loaded');
      return;
    }

    this.sampler.triggerAttack(note, time, velocity);
  }

  /**
   * 노트 릴리즈
   */
  public triggerRelease(note: Tone.Unit.Frequency, time?: Tone.Unit.Time): void {
    if (!this._isLoaded || !this.sampler) return;

    this.sampler.triggerRelease(note, time);
  }

  /**
   * Attack + Release
   */
  public triggerAttackRelease(
    note: Tone.Unit.Frequency,
    duration: Tone.Unit.Time,
    time?: Tone.Unit.Time,
    velocity?: number
  ): void {
    if (!this._isLoaded || !this.sampler) {
      console.warn('InstrumentSampler not loaded');
      return;
    }

    this.sampler.triggerAttackRelease(note, duration, time, velocity);
  }

  /**
   * 로드 상태
   */
  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  /**
   * 현재 악기 ID
   */
  public get instrumentId(): string | null {
    return this._instrumentId;
  }

  /**
   * 출력 연결
   */
  public connect(destination: Tone.InputNode): this {
    this.output.connect(destination);
    return this;
  }

  /**
   * 출력 연결 해제
   */
  public disconnect(): this {
    this.output.disconnect();
    return this;
  }

  /**
   * 볼륨 설정
   */
  public setVolume(volume: number): void {
    this.output.gain.value = Math.max(0, Math.min(2, volume));
  }

  /**
   * 리소스 정리
   */
  public dispose(): void {
    if (this.sampler) {
      this.sampler.dispose();
      this.sampler = null;
    }
    this.output.dispose();
    this._isLoaded = false;
    this._instrumentId = null;
    console.log('InstrumentSampler disposed');
  }
}
