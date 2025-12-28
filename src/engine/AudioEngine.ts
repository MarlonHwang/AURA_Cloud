/**
 * AURA Cloud Studio - Audio Engine Core
 *
 * 기술 스택 합의서 기준:
 * - Tone.js: 메인 오디오 엔진 (Web Audio API 추상화)
 * - TypeScript: 타입 안정성
 *
 * 핵심 API 구조:
 * - TransportAPI: play(), stop(), setBpm() / 타임라인 동기화
 * - SmartInstrumentAPI: loadKit(), kitMorph(genre) / 핫스왑 지원
 * - MacroEffectAPI: setSmartKnob(trackType, value) / EQ+Comp+Reverb 동시 제어
 */

import * as Tone from 'tone';
import {
  InstrumentType,
  TrackState,
  TrackOptions,
  PlaybackState,
  TransportState,
  AudioEngineState,
  AudioEngineOptions,
  SMART_KNOB_PROFILES,
  EffectType,
} from '../types/audio.types';
import { InstrumentTrack } from './InstrumentTrack';
import { SmartKnobProcessor } from './SmartKnobProcessor';

/**
 * AudioEngine - AURA Cloud Studio의 핵심 오디오 엔진
 *
 * Singleton 패턴으로 구현하여 전역에서 하나의 인스턴스만 사용
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  // Tone.js 컴포넌트
  private masterGain: Tone.Gain;
  private limiter: Tone.Limiter;
  private masterAnalyser: Tone.Analyser;

  // 트랙 관리
  private tracks: Map<string, InstrumentTrack> = new Map();

  // Smart Knob 프로세서
  private smartKnobProcessor: SmartKnobProcessor;

  // 상태
  private _isInitialized: boolean = false;
  private _masterVolume: number = 0; // dB

  // 상태 변경 리스너 (Zustand 연동용)
  private stateChangeListeners: Set<(state: AudioEngineState) => void> = new Set();

  // Playhead 추적
  private positionUpdateInterval: ReturnType<typeof setInterval> | null = null;
  private positionChangeListeners: Set<(position: number) => void> = new Set();
  private _currentPositionSeconds: number = 0;

  private constructor() {
    // Master 출력 체인: Gain -> Limiter -> Destination
    this.masterGain = new Tone.Gain(1);
    this.limiter = new Tone.Limiter(-1);

    // FAN-OUT ROUTING Strategy:
    // 1. Audio Path: Gain -> Limiter -> Destination (Ensure Sound!)
    this.masterGain.connect(this.limiter);
    this.limiter.toDestination();

    // 2. Visual Path: Gain -> Analyser (Side-chain for Visuals)
    this.masterAnalyser = new Tone.Analyser('waveform', 256);
    this.masterGain.connect(this.masterAnalyser);

    // [CRITICAL FIX] Force Wake: Connect Analyser to silent destination
    // Web Audio optimization might silence disconnected nodes.
    const dummyGain = new Tone.Gain(0).toDestination();
    this.masterAnalyser.connect(dummyGain);

    // Smart Knob 프로세서 초기화
    this.smartKnobProcessor = new SmartKnobProcessor();
  }

  /**
   * Singleton 인스턴스 획득
   */
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  // ============================================
  // 초기화 및 Context 관리
  // ============================================

  /**
   * 외부 오디오 노드를 마스터 버스에 연결
   */
  public connectToMaster(node: Tone.ToneAudioNode): void {
    node.connect(this.masterGain);
  }

  /**
   * 마스터 입력 노드 반환 (직접 연결용)
   */
  public get masterInput(): Tone.Gain {
    return this.masterGain;
  }

  /**
   * 마스터 웨이브폼 데이터 조회
   */
  public getWaveformData(): Float32Array {
    // masterAnalyser가 초기화되지 않았을 경우 대비
    if (!this.masterAnalyser) return new Float32Array(0);
    return this.masterAnalyser.getValue() as Float32Array;
  }

  /**
   * 시각화 전용 연결 (오디오 출력 없음, 웨이브폼 분석만 수행)
   * Safe Mode: Audio Path와 분리하여 시각화 수행
   */
  public connectToVisualizer(node: Tone.ToneAudioNode): void {
    if (this.masterAnalyser) {
      console.log('[AudioEngine] Connecting node to visualizer:', node);
      node.connect(this.masterAnalyser);
    } else {
      console.warn('[AudioEngine] Visualizer connection failed: Master Analyser is null');
    }
  }

  /**
   * 시각화 입력 노드 반환 (SynthDrums 등 Wrapper 클래스 연결용)
   */
  public get visualizerInput(): Tone.ToneAudioNode {
    return this.masterAnalyser;
  }

  /**
   * 오디오 엔진 초기화
   * 사용자 제스처 후 호출되어야 함 (Web Audio API 정책)
   */
  public async initialize(options: AudioEngineOptions = {}): Promise<void> {
    if (this._isInitialized) {
      console.warn('AudioEngine already initialized');
      return;
    }

    try {
      // Tone.js Context 시작
      await Tone.start();
      console.log('Tone.js context started');

      // Transport 설정
      const { bpm = 120, timeSignature = [4, 4], masterVolume = 0 } = options;

      Tone.getTransport().bpm.value = bpm;
      Tone.getTransport().timeSignature = timeSignature;

      this.setMasterVolume(masterVolume);

      this._isInitialized = true;
      this.notifyStateChange();

      console.log(`AudioEngine initialized: BPM=${bpm}, TimeSignature=${timeSignature}`);
    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error);
      throw error;
    }
  }

  /**
   * Context 상태 확인
   */
  public get isContextRunning(): boolean {
    return Tone.getContext().state === 'running';
  }

  /**
   * 초기화 상태 확인
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  // ============================================
  // TransportAPI - 재생 제어
  // ============================================

  /**
   * 재생 시작
   */
  public play(startTime?: string): void {
    if (!this._isInitialized) {
      console.warn('AudioEngine not initialized');
      return;
    }

    const transport = Tone.getTransport();

    if (startTime) {
      transport.position = startTime;
    }

    transport.start();
    this.startPositionTracking();
    this.notifyStateChange();
  }

  /**
   * 재생 정지 (처음으로 돌아감)
   */
  public stop(): void {
    const transport = Tone.getTransport();
    transport.stop();
    transport.position = 0;
    this._currentPositionSeconds = 0;
    this.stopPositionTracking();
    this.notifyPositionChange(0);
    this.notifyStateChange();
  }

  /**
   * 현재 재생 중인지 확인
   */
  public get isPlaying(): boolean {
    return Tone.getTransport().state === 'started';
  }

  /**
   * 현재 재생 상태 반환
   */
  public get playbackState(): PlaybackState {
    const state = Tone.getTransport().state;
    switch (state) {
      case 'started':
        return 'playing';
      case 'paused':
        return 'paused';
      default:
        return 'stopped';
    }
  }

  /**
   * BPM 설정
   */
  public setBpm(bpm: number): void {
    if (bpm < 20 || bpm > 300) {
      console.warn('BPM out of range (20-300):', bpm);
      return;
    }

    Tone.getTransport().bpm.value = bpm;
    this.notifyStateChange();
  }

  /**
   * BPM 조회
   */
  public get bpm(): number {
    return Tone.getTransport().bpm.value;
  }

  /**
   * 박자표 설정
   */
  public setTimeSignature(numerator: number, denominator: number): void {
    Tone.getTransport().timeSignature = [numerator, denominator];
    this.notifyStateChange();
  }

  /**
   * 현재 재생 위치 조회
   */
  public get position(): string {
    return Tone.getTransport().position.toString();
  }

  /**
   * 재생 위치 설정
   */
  public setPosition(position: string): void {
    Tone.getTransport().position = position;
    this.notifyStateChange();
  }

  /**
   * 루프 설정
   */
  public setLoop(enabled: boolean, start?: string, end?: string): void {
    const transport = Tone.getTransport();
    transport.loop = enabled;

    if (start) transport.loopStart = start;
    if (end) transport.loopEnd = end;

    this.notifyStateChange();
  }

  // ============================================
  // Playhead Tracking - 위치 추적 시스템
  // ============================================

  /**
   * 현재 위치 (초 단위)
   */
  public getCurrentPosition(): number {
    return this._currentPositionSeconds;
  }

  /**
   * 현재 위치 (Bar:Beat:Sixteenth 형식)
   */
  public getCurrentPositionBBS(): string {
    return Tone.getTransport().position.toString();
  }

  /**
   * 위치 변경 콜백 등록
   */
  public onPositionChange(callback: (positionSeconds: number) => void): () => void {
    this.positionChangeListeners.add(callback);

    // 구독 해제 함수 반환
    return () => {
      this.positionChangeListeners.delete(callback);
    };
  }

  /**
   * 위치 추적 시작 (재생 시 호출)
   */
  private startPositionTracking(): void {
    // 기존 interval 정리
    this.stopPositionTracking();

    // 60fps에 가까운 업데이트 (약 16.67ms)
    this.positionUpdateInterval = setInterval(() => {
      const transport = Tone.getTransport();
      this._currentPositionSeconds = transport.seconds;
      this.notifyPositionChange(this._currentPositionSeconds);
    }, 16);
  }

  /**
   * 위치 추적 중지 (정지 시 호출)
   */
  private stopPositionTracking(): void {
    if (this.positionUpdateInterval) {
      clearInterval(this.positionUpdateInterval);
      this.positionUpdateInterval = null;
    }
  }

  /**
   * 위치 변경 알림
   */
  private notifyPositionChange(positionSeconds: number): void {
    this.positionChangeListeners.forEach(listener => listener(positionSeconds));
  }

  // ============================================
  // Master Volume Control
  // ============================================

  /**
   * 마스터 볼륨 설정 (dB)
   */
  public setMasterVolume(volumeDb: number): void {
    const clampedVolume = Math.max(-60, Math.min(6, volumeDb));
    this._masterVolume = clampedVolume;
    this.masterGain.gain.value = Tone.gainToDb(Tone.dbToGain(clampedVolume));
    this.notifyStateChange();
  }

  /**
   * 마스터 볼륨 조회
   */
  public get masterVolume(): number {
    return this._masterVolume;
  }

  // ============================================
  // Track Management
  // ============================================

  /**
   * 새 트랙 생성
   */
  public createTrack(options: TrackOptions = {}): InstrumentTrack {
    const track = new InstrumentTrack(options, this.masterGain, this.smartKnobProcessor);
    this.tracks.set(track.id, track);
    this.notifyStateChange();
    return track;
  }

  /**
   * 트랙 조회
   */
  public getTrack(trackId: string): InstrumentTrack | undefined {
    return this.tracks.get(trackId);
  }

  /**
   * 트랙 삭제
   */
  public deleteTrack(trackId: string): boolean {
    const track = this.tracks.get(trackId);
    if (track) {
      track.dispose();
      this.tracks.delete(trackId);
      this.notifyStateChange();
      return true;
    }
    return false;
  }

  /**
   * 모든 트랙 조회
   */
  public getAllTracks(): InstrumentTrack[] {
    return Array.from(this.tracks.values());
  }

  /**
   * 솔로 상태 관리 (하나의 트랙만 솔로일 때 나머지 뮤트)
   */
  public updateSoloState(): void {
    const tracks = this.getAllTracks();
    const hasSoloTrack = tracks.some(track => track.solo);

    tracks.forEach(track => {
      if (hasSoloTrack) {
        // 솔로 트랙이 있으면 솔로가 아닌 트랙은 뮤트
        track.setEffectiveMute(!track.solo);
      } else {
        // 솔로 트랙이 없으면 개별 뮤트 상태 적용
        track.setEffectiveMute(track.mute);
      }
    });

    this.notifyStateChange();
  }

  // ============================================
  // SmartInstrumentAPI
  // ============================================

  /**
   * 트랙의 악기 타입 변경 (핫스왑)
   */
  public setTrackInstrumentType(trackId: string, instrumentType: InstrumentType): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.setInstrumentType(instrumentType);
      this.notifyStateChange();
    }
  }

  /**
   * Kit Morph - 장르에 맞는 샘플 세트로 변경 (향후 구현)
   */
  public async kitMorph(trackId: string, genre: string): Promise<void> {
    // TODO: AI 기반 샘플 매칭 로직 구현
    console.log(`Kit morph requested for track ${trackId} to genre: ${genre}`);
  }

  // ============================================
  // MacroEffectAPI - Smart Knob
  // ============================================

  /**
   * Smart Knob 값 설정
   * 악기 타입에 따라 적절한 이펙트 체인이 자동으로 조절됨
   *
   * @param trackId 트랙 ID
   * @param value 노브 값 (0-100)
   */
  public setSmartKnob(trackId: string, value: number): void {
    const track = this.tracks.get(trackId);
    if (!track) {
      console.warn(`Track not found: ${trackId}`);
      return;
    }

    // 값 범위 제한
    const clampedValue = Math.max(0, Math.min(100, value));

    // Smart Knob 프로세서를 통해 이펙트 적용
    this.smartKnobProcessor.applySmartKnob(track, clampedValue);

    this.notifyStateChange();
  }

  /**
   * 특정 트랙의 Smart Knob 프로필 조회
   */
  public getSmartKnobProfile(trackId: string): typeof SMART_KNOB_PROFILES[InstrumentType] | null {
    const track = this.tracks.get(trackId);
    if (!track) return null;

    return SMART_KNOB_PROFILES[track.instrumentType];
  }

  // ============================================
  // State Management (Zustand 연동)
  // ============================================

  /**
   * 현재 엔진 상태 스냅샷
   */
  public getState(): AudioEngineState {
    const transport = Tone.getTransport();

    return {
      isInitialized: this._isInitialized,
      isContextRunning: this.isContextRunning,
      masterVolume: this._masterVolume,
      transport: {
        playbackState: this.playbackState,
        isPlaying: this.isPlaying,
        bpm: transport.bpm.value,
        timeSignature: transport.timeSignature as [number, number],
        position: transport.position.toString(),
        positionSeconds: this._currentPositionSeconds,
        loop: transport.loop,
        loopStart: transport.loopStart.toString(),
        loopEnd: transport.loopEnd.toString(),
      },
      tracks: this.getAllTracks().map(track => track.getState()),
    };
  }

  /**
   * 상태 변경 리스너 등록
   */
  public subscribe(listener: (state: AudioEngineState) => void): () => void {
    this.stateChangeListeners.add(listener);

    // 구독 해제 함수 반환
    return () => {
      this.stateChangeListeners.delete(listener);
    };
  }

  /**
   * 상태 변경 알림
   */
  private notifyStateChange(): void {
    const state = this.getState();
    this.stateChangeListeners.forEach(listener => listener(state));
  }

  // ============================================
  // Cleanup
  // ============================================

  /**
   * 엔진 정리 (메모리 해제)
   */
  public dispose(): void {
    // 모든 트랙 정리
    this.tracks.forEach(track => track.dispose());
    this.tracks.clear();

    // Transport 정지
    Tone.getTransport().stop();
    Tone.getTransport().cancel();

    // Master 체인 정리
    this.masterGain.disconnect();
    this.limiter.disconnect();

    this._isInitialized = false;
    this.stateChangeListeners.clear();

    AudioEngine.instance = null;
  }
}

// 편의를 위한 싱글톤 인스턴스 export
export const audioEngine = AudioEngine.getInstance();
