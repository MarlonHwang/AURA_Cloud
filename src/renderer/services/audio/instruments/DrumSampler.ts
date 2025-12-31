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

// ============================================
// DrumSampler 클래스 (Refactored: Static Chain / Dynamic Source)
// ============================================

/**
 * DrumSampler - 샘플 기반 드럼 머신 (Stability Optimized)
 *
 * Architecture:
 * - Static: GainNodes (Part -> Master)
 * - Dynamic: BufferSourceNodes (Created per trigger)
 *
 * 이 구조는 AudioContext의 가비지 컬렉션 부하를 줄이고,
 * 재생 중단(glitch) 없이 안정적인 폴리포니를 보장합니다.
 */
export class DrumSampler {
  // 1. Static Resources (Buffers)
  private buffers: Map<DrumPart, Tone.ToneAudioBuffer> = new Map();

  // 2. Static Graph (Gains)
  private gains: Map<DrumPart, Tone.Gain> = new Map();

  // 3. Master Output
  private output: Tone.Gain;

  // 상태
  private _currentKitId: string | null = null;
  private _isLoaded: boolean = false;
  private loadingPromise: Promise<void> | null = null;

  constructor() {
    this.output = new Tone.Gain(1);
    this.output.toDestination();
  }

  /**
   * 드럼킷 로드
   * - 샘플을 AudioBuffer로 로드하여 메모리에 보관
   * - 재생 시에는 이 버퍼를 참조하여 Source만 생성
   */
  public async loadKit(
    kitId: string,
    sampleUrls: Partial<Record<DrumPart, string>>
  ): Promise<void> {
    if (this.loadingPromise) {
      await this.loadingPromise;
    }

    this._isLoaded = false;
    this.loadingPromise = this._loadKitInternal(kitId, sampleUrls);
    await this.loadingPromise;
    this.loadingPromise = null;
  }

  private async _loadKitInternal(
    kitId: string,
    sampleUrls: Partial<Record<DrumPart, string>>
  ): Promise<void> {
    // 기존 리소스 정리
    this.disposeBuffers();

    const loadPromises: Promise<void>[] = [];

    // 각 파트별 버퍼 로드 및 Static Gain 생성
    for (const [part, url] of Object.entries(sampleUrls) as [DrumPart, string][]) {
      // 1. Static Gain 생성 (한 번만 만듦)
      const gain = new Tone.Gain(this.getDefaultGainForPart(part));
      gain.connect(this.output);
      this.gains.set(part, gain);

      // 2. Buffer 로드
      const buffer = new Tone.ToneAudioBuffer();
      const loadPromise = buffer.load(url)
        .then(() => {
          console.log(`Loaded buffer for ${part}: ${url}`);
        })
        .catch((e: Error) => { // Explicit type
          console.error(`Failed to load buffer for ${part}:`, e);
          throw e;
        });

      this.buffers.set(part, buffer);
      loadPromises.push(loadPromise);
    }

    try {
      await Promise.all(loadPromises);
      this._currentKitId = kitId;
      this._isLoaded = true;
      console.log(`DrumSampler kit loaded (Static Chain): ${kitId}`);
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
   * 드럼 파트 트리거 (Dynamic Source Creation)
   * - 매 트리거마다 새로운 ToneBufferSource 생성
   * - Static Gain에 연결 후 재생
   * - 재생 종료 시 Source 자동 폐기
   */
  public trigger(part: DrumPart, time?: Tone.Unit.Time, velocity: number = 1): void {
    if (!this._isLoaded) return;

    const buffer = this.buffers.get(part);
    const gainNode = this.gains.get(part);

    if (!buffer || !gainNode || !buffer.loaded) {
      return;
    }

    const triggerTime = time ?? Tone.now();

    // 1. Create Dynamic Source (Disposable)
    const source = new Tone.ToneBufferSource(buffer);

    // 2. Velocity Handling (Optional: Create temp gain or use playbackRate/curve if supported)
    // ToneBufferSource doesn't have 'volume' gain.
    // For true velocity without affecting other notes on same channel, we need a temp gain.
    const velocityGain = new Tone.Gain(velocity);

    // 3. Connect: Source -> VelocityGain -> PartGain -> Master -> Destination
    source.connect(velocityGain);
    velocityGain.connect(gainNode);

    // 4. Start Playback
    source.start(triggerTime);

    // 5. Automatic Disposal (Clean up dynamic nodes)
    source.onended = () => {
      source.dispose();
      velocityGain.dispose();
    };
  }

  /**
   * 해당 파트의 샘플이 있는지 확인
   */
  public hasPart(part: DrumPart): boolean {
    return this.buffers.has(part) && (this.buffers.get(part)?.loaded ?? false);
  }

  /**
   * 개별 파트 볼륨 설정 (Static Gain 조절)
   */
  public setPartVolume(part: DrumPart, volume: number): void {
    const gain = this.gains.get(part);
    if (gain) {
      // 램핑 적용하여 팝 노이즈 방지
      gain.gain.rampTo(Math.max(0, Math.min(2, volume)), 0.1);
    }
  }

  /**
   * 개별 파트 샘플 교체 (Hot Swap)
   */
  public async replaceSample(part: DrumPart, url: string): Promise<void> {
    // 기존 버퍼 정리
    const oldBuffer = this.buffers.get(part);
    if (oldBuffer) {
      oldBuffer.dispose();
    }

    // Static Gain 확인 또는 생성
    if (!this.gains.has(part)) {
      const newGain = new Tone.Gain(this.getDefaultGainForPart(part));
      newGain.connect(this.output);
      this.gains.set(part, newGain);
    }

    // 새 버퍼 로드
    const buffer = new Tone.ToneAudioBuffer();
    await buffer.load(url);

    this.buffers.set(part, buffer);
    this._isLoaded = true; // IMPORTANT: Enable triggering
    console.log(`Replaced sample for ${part}: ${url}`);
  }

  public get currentKitId(): string | null {
    return this._currentKitId;
  }

  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  public connect(destination: Tone.InputNode): this {
    this.output.connect(destination);
    return this;
  }

  public disconnect(): this {
    this.output.disconnect();
    return this;
  }

  public setVolume(volume: number): void {
    this.output.gain.value = Math.max(0, Math.min(2, volume));
  }

  private disposeBuffers(): void {
    this.buffers.forEach(b => b.dispose());
    this.buffers.clear();

    // Gains are static (until kit reload or dispose), but usually we keep them 
    // to prevent disconnection noise. However, full dispose clears them.
    this.gains.forEach(g => g.dispose());
    this.gains.clear();
  }

  public dispose(): void {
    this.disposeBuffers();
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
