/**
 * AURA Cloud Studio - Sound Library
 *
 * 사운드 라이브러리 관리자
 * - 드럼킷 프리셋 관리
 * - 악기 프리셋 관리
 * - Kit Morph 기능
 * - 샘플 로딩/캐싱
 */

import * as Tone from 'tone';
import {
  DrumPart,
  DrumKitStyle,
  DrumKitPreset,
  InstrumentPreset,
  InstrumentCategory,
  SoundLibraryState,
  LoadingProgress,
  KitMorphOptions,
} from '../../types/sound.types';
import { SynthDrums, DRUM_STYLE_PARAMS } from '../instruments/SynthDrums';
import { DrumSampler, InstrumentSampler } from '../instruments/DrumSampler';

// ============================================
// CDN 샘플 URL (GitHub Raw)
// ============================================

/**
 * GitHub에서 호스팅되는 무료 드럼 샘플 URL
 * Source: https://github.com/tidalcycles/Dirt-Samples (CC0 License)
 * Source: https://github.com/shiningjason/drum-sounds (MIT License)
 */
const SAMPLE_CDN = {
  // Tidal Cycles Dirt-Samples (CC0)
  dirt: 'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master',
  // Shining Jason drum sounds (MIT)
  jason: 'https://raw.githubusercontent.com/shiningjason/drum-sounds/master',
};

/**
 * 샘플 기반 드럼킷 URL 매핑
 */
export const SAMPLE_DRUM_KITS = {
  // Acoustic Kit (shiningjason)
  acoustic: {
    kick: `${SAMPLE_CDN.jason}/bass-drum-1.mp3`,
    snare: `${SAMPLE_CDN.jason}/acoustic-snare.mp3`,
    hihat: `${SAMPLE_CDN.jason}/closed-hihat.mp3`,
    hihatOpen: `${SAMPLE_CDN.jason}/open-hihat.mp3`,
    perc: `${SAMPLE_CDN.jason}/high-tom.mp3`,
    crash: `${SAMPLE_CDN.jason}/crash-cymbal-1.mp3`,
    ride: `${SAMPLE_CDN.jason}/ride-cymbal-1.mp3`,
  },
  // Electronic Kit (Dirt-Samples)
  electronic: {
    kick: `${SAMPLE_CDN.dirt}/bd/BT0A0A7.wav`,
    snare: `${SAMPLE_CDN.dirt}/sd/rytm-01-classic.wav`,
    hihat: `${SAMPLE_CDN.dirt}/hh/000_hh3closedhh.wav`,
    hihatOpen: `${SAMPLE_CDN.dirt}/hh/003_hh3openhh.wav`,
    perc: `${SAMPLE_CDN.dirt}/perc/002_perc2.wav`,
  },
  // 808 Kit (Dirt-Samples)
  tr808: {
    kick: `${SAMPLE_CDN.dirt}/808bd/BD0000.wav`,
    snare: `${SAMPLE_CDN.dirt}/808sd/SD0000.wav`,
    hihat: `${SAMPLE_CDN.dirt}/808hc/HC00.wav`,
    hihatOpen: `${SAMPLE_CDN.dirt}/808oh/OH00.wav`,
    perc: `${SAMPLE_CDN.dirt}/808mt/MT00.wav`,
    clap: `${SAMPLE_CDN.dirt}/cp/HANDCLP0.wav`,
  },
  // 909 Kit (Dirt-Samples)
  tr909: {
    kick: `${SAMPLE_CDN.dirt}/909/BT0A0D0.wav`,
    snare: `${SAMPLE_CDN.dirt}/909/ST0T0S3.wav`,
    hihat: `${SAMPLE_CDN.dirt}/909/HHCD0.wav`,
    hihatOpen: `${SAMPLE_CDN.dirt}/909/HHOD0.wav`,
    perc: `${SAMPLE_CDN.dirt}/909/MT0D3.wav`,
    clap: `${SAMPLE_CDN.dirt}/909/HANDCLP0.wav`,
  },
};

// ============================================
// 드럼킷 프리셋 정의
// ============================================

/**
 * 내장 드럼킷 프리셋 (합성 + 샘플 기반)
 */
export const DRUM_KIT_PRESETS: DrumKitPreset[] = [
  // ========== 샘플 기반 킷 ==========
  {
    id: 'sample-808',
    name: 'TR-808 Classic',
    style: 'trap',
    description: '클래식 Roland TR-808 사운드',
    sampleUrls: SAMPLE_DRUM_KITS.tr808,
    tags: ['808', 'classic', 'roland', 'vintage'],
    bpmRange: [70, 160],
  },
  {
    id: 'sample-909',
    name: 'TR-909 House',
    style: 'electronic',
    description: '하우스/테크노의 전설 TR-909',
    sampleUrls: SAMPLE_DRUM_KITS.tr909,
    tags: ['909', 'house', 'techno', 'roland'],
    bpmRange: [120, 140],
  },
  {
    id: 'sample-acoustic',
    name: 'Acoustic Kit',
    style: 'acoustic',
    description: '리얼 어쿠스틱 드럼 세트',
    sampleUrls: SAMPLE_DRUM_KITS.acoustic,
    tags: ['acoustic', 'real', 'live', 'natural'],
    bpmRange: [60, 180],
  },
  {
    id: 'sample-electronic',
    name: 'Electronic Kit',
    style: 'electronic',
    description: '모던 일렉트로닉 드럼',
    sampleUrls: SAMPLE_DRUM_KITS.electronic,
    tags: ['electronic', 'modern', 'digital'],
    bpmRange: [100, 150],
  },
  // ========== 합성 기반 킷 ==========
  {
    id: 'trap-808',
    name: 'Trap 808 (Synth)',
    style: 'trap',
    description: '강한 808 베이스와 찰진 스네어',
    synthParams: DRUM_STYLE_PARAMS.trap,
    tags: ['trap', 'hip-hop', '808', 'hard', 'synth'],
    bpmRange: [130, 160],
  },
  {
    id: 'lofi-dusty',
    name: 'Lo-Fi Dusty',
    style: 'lofi',
    description: '먼지 쌓인 빈티지 드럼',
    synthParams: DRUM_STYLE_PARAMS.lofi,
    tags: ['lofi', 'chill', 'vintage', 'mellow'],
    bpmRange: [70, 95],
  },
  {
    id: 'acoustic-live',
    name: 'Acoustic Live',
    style: 'acoustic',
    description: '실제 드럼 세트 느낌',
    synthParams: DRUM_STYLE_PARAMS.acoustic,
    tags: ['acoustic', 'live', 'natural', 'organic'],
    bpmRange: [80, 140],
  },
  {
    id: 'electronic-edm',
    name: 'Electronic EDM',
    style: 'electronic',
    description: '일렉트로닉 댄스 뮤직용',
    synthParams: DRUM_STYLE_PARAMS.electronic,
    tags: ['electronic', 'edm', 'dance', 'club'],
    bpmRange: [120, 150],
  },
  {
    id: 'hiphop-boombap',
    name: 'Hip-Hop Boom Bap',
    style: 'hiphop',
    description: '클래식 붐뱁 스타일',
    synthParams: DRUM_STYLE_PARAMS.hiphop,
    tags: ['hiphop', 'boombap', 'classic', '90s'],
    bpmRange: [85, 100],
  },
  {
    id: 'pop-modern',
    name: 'Pop Modern',
    style: 'pop',
    description: '밝고 펀치감 있는 팝 드럼',
    synthParams: DRUM_STYLE_PARAMS.pop,
    tags: ['pop', 'modern', 'bright', 'punchy'],
    bpmRange: [100, 130],
  },
  {
    id: 'rock-powerful',
    name: 'Rock Powerful',
    style: 'rock',
    description: '파워풀한 록 드럼',
    synthParams: DRUM_STYLE_PARAMS.rock,
    tags: ['rock', 'powerful', 'heavy', 'energetic'],
    bpmRange: [100, 140],
  },
];

// ============================================
// 악기 프리셋 정의
// ============================================

/**
 * 내장 악기 프리셋
 */
export const INSTRUMENT_PRESETS: InstrumentPreset[] = [
  {
    id: 'synth-bass-sub',
    name: 'Sub Bass',
    category: 'bass',
    description: '깊은 서브 베이스',
    synthType: 'mono',
    synthParams: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.8, release: 0.5 },
      filterEnvelope: { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.5 },
    },
  },
  {
    id: 'synth-lead-saw',
    name: 'Saw Lead',
    category: 'synth',
    description: '밝은 소우 리드',
    synthType: 'mono',
    synthParams: {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 },
    },
  },
  {
    id: 'synth-pad-warm',
    name: 'Warm Pad',
    category: 'synth',
    description: '따뜻한 패드 사운드',
    synthType: 'poly',
    synthParams: {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 0.3, sustain: 0.8, release: 1.5 },
    },
  },
  {
    id: 'fm-bell',
    name: 'FM Bell',
    category: 'synth',
    description: 'FM 신디 벨 사운드',
    synthType: 'fm',
    synthParams: {
      harmonicity: 3.01,
      modulationIndex: 14,
      envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 1 },
    },
  },
];

// ============================================
// SoundLibrary 클래스
// ============================================

/**
 * SoundLibrary - 사운드 라이브러리 관리자
 *
 * 모든 사운드 리소스의 로딩, 캐싱, 관리를 담당
 */
export class SoundLibrary {
  private static instance: SoundLibrary | null = null;

  // 합성 드럼 인스턴스
  private synthDrums: SynthDrums | null = null;

  // 샘플 드럼 인스턴스
  private drumSampler: DrumSampler | null = null;

  // 악기 샘플러 캐시
  private instrumentSamplers: Map<string, InstrumentSampler> = new Map();

  // 현재 선택된 프리셋
  private _currentDrumKitId: string | null = null;

  // 로딩 상태
  private _isLoading: boolean = false;

  // 상태 변경 리스너
  private stateChangeListeners: Set<(state: SoundLibraryState) => void> = new Set();

  private constructor() {
    // 기본 합성 드럼 초기화
    this.synthDrums = new SynthDrums('trap');
    this._currentDrumKitId = 'trap-808';
  }

  /**
   * Singleton 인스턴스 획득
   */
  public static getInstance(): SoundLibrary {
    if (!SoundLibrary.instance) {
      SoundLibrary.instance = new SoundLibrary();
    }
    return SoundLibrary.instance;
  }

  // ============================================
  // Drum Kit 관리
  // ============================================

  /**
   * 드럼킷 로드 (합성 방식)
   */
  public async loadDrumKit(kitId: string): Promise<void> {
    const preset = DRUM_KIT_PRESETS.find((p) => p.id === kitId);

    if (!preset) {
      console.warn(`Drum kit not found: ${kitId}`);
      return;
    }

    this._isLoading = true;
    this.notifyStateChange();

    try {
      // 샘플 기반 킷인지 합성 기반인지 확인
      if (preset.sampleUrls && Object.keys(preset.sampleUrls).length > 0) {
        // 샘플 기반 킷 로드
        await this.loadSampleDrumKit(kitId, preset.sampleUrls);
      } else if (preset.synthParams) {
        // 합성 기반 킷 로드
        this.loadSynthDrumKit(preset.style, preset.synthParams);
      }

      this._currentDrumKitId = kitId;
      console.log(`Drum kit loaded: ${preset.name}`);
    } catch (error) {
      console.error('Failed to load drum kit:', error);
      throw error;
    } finally {
      this._isLoading = false;
      this.notifyStateChange();
    }
  }

  /**
   * 합성 드럼킷 로드
   */
  private loadSynthDrumKit(
    style: DrumKitStyle,
    params?: Partial<typeof DRUM_STYLE_PARAMS.trap>
  ): void {
    if (!this.synthDrums) {
      this.synthDrums = new SynthDrums(style);
    } else {
      this.synthDrums.setStyle(style);
    }

    if (params) {
      this.synthDrums.setCustomParams(params);
    }
  }

  /**
   * 샘플 드럼킷 로드
   */
  private async loadSampleDrumKit(
    kitId: string,
    sampleUrls: Partial<Record<DrumPart, string>>
  ): Promise<void> {
    if (!this.drumSampler) {
      this.drumSampler = new DrumSampler();
    }

    await this.drumSampler.loadKit(kitId, sampleUrls);
  }

  /**
   * 드럼 파트 트리거
   */
  public triggerDrum(
    part: DrumPart,
    time?: Tone.Unit.Time,
    velocity: number = 1
  ): void {
    // 현재 활성화된 드럼 소스 사용
    if (this.drumSampler?.isLoaded) {
      this.drumSampler.trigger(part, time, velocity);
    } else if (this.synthDrums) {
      this.synthDrums.trigger(part, time, velocity);
    } else {
      console.warn('No drum source available');
    }
  }

  /**
   * 합성 드럼 인스턴스 조회
   */
  public getSynthDrums(): SynthDrums | null {
    return this.synthDrums;
  }

  /**
   * 드럼 샘플러 인스턴스 조회
   */
  public getDrumSampler(): DrumSampler | null {
    return this.drumSampler;
  }

  /**
   * 드럼킷을 출력에 연결
   */
  public connectDrumsTo(destination: Tone.InputNode): void {
    if (this.synthDrums) {
      this.synthDrums.connect(destination);
    }
    if (this.drumSampler) {
      this.drumSampler.connect(destination);
    }
  }

  // ============================================
  // Kit Morph
  // ============================================

  /**
   * Kit Morph - 패턴 유지하면서 킷만 교체
   */
  public async kitMorph(
    targetKitId: string,
    options: KitMorphOptions = { preservePattern: true }
  ): Promise<void> {
    const targetPreset = DRUM_KIT_PRESETS.find((p) => p.id === targetKitId);

    if (!targetPreset) {
      console.warn(`Target kit not found: ${targetKitId}`);
      return;
    }

    // BPM 매칭 옵션이 있으면 검증
    if (options.matchBpm && options.currentBpm && targetPreset.bpmRange) {
      const [minBpm, maxBpm] = targetPreset.bpmRange;
      if (options.currentBpm < minBpm || options.currentBpm > maxBpm) {
        console.warn(
          `Kit "${targetPreset.name}" BPM range (${minBpm}-${maxBpm}) doesn't match current BPM (${options.currentBpm})`
        );
      }
    }

    // 크로스페이드 적용 (추후 구현)
    if (options.crossfadeDuration && options.crossfadeDuration > 0) {
      // TODO: 크로스페이드 구현
      console.log(`Crossfade morph not yet implemented`);
    }

    // 킷 로드
    await this.loadDrumKit(targetKitId);

    console.log(`Kit morphed to: ${targetPreset.name}`);
  }

  /**
   * 다음 킷으로 모프 (순환)
   */
  public async morphToNextKit(): Promise<string> {
    const currentIndex = DRUM_KIT_PRESETS.findIndex(
      (p) => p.id === this._currentDrumKitId
    );
    const nextIndex = (currentIndex + 1) % DRUM_KIT_PRESETS.length;
    const nextKit = DRUM_KIT_PRESETS[nextIndex];

    await this.kitMorph(nextKit.id);
    return nextKit.id;
  }

  /**
   * 이전 킷으로 모프 (순환)
   */
  public async morphToPrevKit(): Promise<string> {
    const currentIndex = DRUM_KIT_PRESETS.findIndex(
      (p) => p.id === this._currentDrumKitId
    );
    const prevIndex =
      (currentIndex - 1 + DRUM_KIT_PRESETS.length) % DRUM_KIT_PRESETS.length;
    const prevKit = DRUM_KIT_PRESETS[prevIndex];

    await this.kitMorph(prevKit.id);
    return prevKit.id;
  }

  /**
   * BPM에 맞는 킷 추천
   */
  public getKitsForBpm(bpm: number): DrumKitPreset[] {
    return DRUM_KIT_PRESETS.filter((preset) => {
      if (!preset.bpmRange) return true;
      const [minBpm, maxBpm] = preset.bpmRange;
      return bpm >= minBpm && bpm <= maxBpm;
    });
  }

  /**
   * 스타일로 킷 필터링
   */
  public getKitsByStyle(style: DrumKitStyle): DrumKitPreset[] {
    return DRUM_KIT_PRESETS.filter((preset) => preset.style === style);
  }

  /**
   * 태그로 킷 검색
   */
  public searchKitsByTag(tag: string): DrumKitPreset[] {
    const lowerTag = tag.toLowerCase();
    return DRUM_KIT_PRESETS.filter((preset) =>
      preset.tags?.some((t) => t.toLowerCase().includes(lowerTag))
    );
  }

  // ============================================
  // Instrument 관리
  // ============================================

  /**
   * 악기 로드
   */
  public async loadInstrument(instrumentId: string): Promise<InstrumentSampler | null> {
    // 이미 로드된 경우 캐시에서 반환
    if (this.instrumentSamplers.has(instrumentId)) {
      return this.instrumentSamplers.get(instrumentId)!;
    }

    const preset = INSTRUMENT_PRESETS.find((p) => p.id === instrumentId);

    if (!preset) {
      console.warn(`Instrument not found: ${instrumentId}`);
      return null;
    }

    this._isLoading = true;
    this.notifyStateChange();

    try {
      // 샘플러 기반 악기
      if (preset.samplerMap) {
        const sampler = new InstrumentSampler();
        await sampler.load(instrumentId, preset.samplerMap);
        this.instrumentSamplers.set(instrumentId, sampler);
        return sampler;
      }

      // 합성 악기는 별도 처리 필요 (추후 구현)
      console.log(`Synth instrument "${preset.name}" loaded (synth-based)`);
      return null;
    } catch (error) {
      console.error('Failed to load instrument:', error);
      throw error;
    } finally {
      this._isLoading = false;
      this.notifyStateChange();
    }
  }

  /**
   * 악기 프리셋 조회
   */
  public getInstrumentPreset(instrumentId: string): InstrumentPreset | undefined {
    return INSTRUMENT_PRESETS.find((p) => p.id === instrumentId);
  }

  /**
   * 카테고리별 악기 목록
   */
  public getInstrumentsByCategory(category: InstrumentCategory): InstrumentPreset[] {
    return INSTRUMENT_PRESETS.filter((p) => p.category === category);
  }

  // ============================================
  // State & Getters
  // ============================================

  /**
   * 현재 드럼킷 ID
   */
  public get currentDrumKitId(): string | null {
    return this._currentDrumKitId;
  }

  /**
   * 현재 드럼킷 프리셋
   */
  public get currentDrumKitPreset(): DrumKitPreset | undefined {
    return DRUM_KIT_PRESETS.find((p) => p.id === this._currentDrumKitId);
  }

  /**
   * 로딩 상태
   */
  public get isLoading(): boolean {
    return this._isLoading;
  }

  /**
   * 모든 드럼킷 프리셋
   */
  public getAllDrumKitPresets(): DrumKitPreset[] {
    return [...DRUM_KIT_PRESETS];
  }

  /**
   * 모든 악기 프리셋
   */
  public getAllInstrumentPresets(): InstrumentPreset[] {
    return [...INSTRUMENT_PRESETS];
  }

  /**
   * 현재 상태 스냅샷
   */
  public getState(): SoundLibraryState {
    return {
      isLoading: this._isLoading,
      loadedKits: this._currentDrumKitId ? [this._currentDrumKitId] : [],
      loadedInstruments: Array.from(this.instrumentSamplers.keys()),
      currentKit: this._currentDrumKitId,
      error: null,
    };
  }

  // ============================================
  // State Change Listeners
  // ============================================

  /**
   * 상태 변경 리스너 등록
   */
  public subscribe(listener: (state: SoundLibraryState) => void): () => void {
    this.stateChangeListeners.add(listener);
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  /**
   * 상태 변경 알림
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeListeners.forEach((listener) => listener(state));
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * 리소스 정리
   */
  public dispose(): void {
    if (this.synthDrums) {
      this.synthDrums.dispose();
      this.synthDrums = null;
    }

    if (this.drumSampler) {
      this.drumSampler.dispose();
      this.drumSampler = null;
    }

    this.instrumentSamplers.forEach((sampler) => sampler.dispose());
    this.instrumentSamplers.clear();

    this._currentDrumKitId = null;
    this.stateChangeListeners.clear();

    SoundLibrary.instance = null;

    console.log('SoundLibrary disposed');
  }
}

// 편의를 위한 싱글톤 인스턴스 export
export const soundLibrary = SoundLibrary.getInstance();
