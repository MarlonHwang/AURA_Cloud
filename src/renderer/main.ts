/**
 * AURA Cloud Studio - Main Entry Point
 *
 * Vite + TypeScript 기반 애플리케이션 진입점
 * Step Sequencer + Tone.js 오디오 엔진
 */

import * as Tone from 'tone';
import Sortable from 'sortablejs';
import { audioEngine, soundLibrary, DRUM_KIT_PRESETS } from './services/audio';
import type { DrumPart } from './types/sound.types';
import { persistenceManager, StoredFile } from './utils/PersistenceManager';
import { useAudioStore } from './stores/audioStore';
import { useTimelineStore } from './modules/Timeline/store/useTimelineStore';
import { bridge } from './services/BridgeService';

// [System] Initialize Bridge Connection
console.log('[System] Initializing AURA Cloud...');
bridge.connect();
import './index.css'; // Import Tailwind Styles

// React & UI Modules
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Copilot } from './modules/Copilot';
import { TimelineView } from './modules/Timeline/TimelineView';

// ============================================
// Types & Constants
// ============================================

interface StepPattern {
  active: boolean;
  velocity: number;
  multiplier: number;
}

type TrackPatterns = Record<DrumPart, StepPattern[]>;

let TOTAL_STEPS = 16;
let currentStepMode: 16 | 32 = 16;
const DRUM_TRACKS: { name: DrumPart; displayName: string; color: string }[] = [
  { name: 'kick', displayName: 'Kick', color: '#FF6B6B' },
  { name: 'snare', displayName: 'Snare', color: '#4DFFFF' },
  { name: 'hihat', displayName: 'Hi-Hat', color: '#4FD272' },
  { name: 'perc', displayName: 'Perc', color: '#D45FFF' },
];

// Available track colors for new tracks
const TRACK_COLORS = [
  '#FF6B6B', // Red (Kick)
  '#4DFFFF', // Cyan (Snare)
  '#4FD272', // Green (Hi-Hat)
  '#D45FFF', // Purple (Perc)
  '#FFB347', // Orange
  '#FF69B4', // Pink
  '#7B68EE', // Medium Slate Blue
  '#00CED1', // Dark Turquoise
];

// Track counter for naming new tracks
let trackCounter = 4;

// Custom tracks list (for tracking dynamically added tracks)
interface CustomTrack {
  id: string;
  name: string;
  color: string;
  soundType: DrumPart | null; // Fallback drum sound (null for empty)
  customSampleUrl: string | null; // Blob URL for custom audio
  player?: any; // Tone.Player instance for custom sample
}
const customTracks: CustomTrack[] = [];

// Default tracks custom sample storage (for drag & drop on existing tracks)
interface DefaultTrackSample {
  customSampleUrl: string | null;
  player?: any;
  originalName: string;
}
const defaultTrackSamples: Record<string, DefaultTrackSample> = {};

// UI Sound Effects Player (separate from music engine)
let uiSfxPlayer: Tone.Player | null = null;
let uiSfxSynth: Tone.Synth | null = null;

// ============================================
// State
// ============================================

let isAudioInitialized = false;
let isPlaying = false;
let currentStep = 0;
let sequenceId: number | null = null;

// 패턴 데이터: 각 트랙별 16스텝
const patterns: TrackPatterns = {
  kick: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1, multiplier: 1 })),
  snare: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1, multiplier: 1 })),
  hihat: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1, multiplier: 1 })),
  clap: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1, multiplier: 1 })),
  tom: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1, multiplier: 1 })),
  crash: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1, multiplier: 1 })),
  ride: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1, multiplier: 1 })),
  perc: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1, multiplier: 1 })),
};

// 기본 패턴 (4/4 기본 비트)
patterns.kick[0].active = true;
patterns.kick[4].active = true;
patterns.kick[8].active = true;
patterns.kick[12].active = true;
patterns.snare[4].active = true;
patterns.snare[12].active = true;
patterns.hihat[0].active = true;
patterns.hihat[2].active = true;
patterns.hihat[4].active = true;
patterns.hihat[6].active = true;
patterns.hihat[8].active = true;
patterns.hihat[10].active = true;
patterns.hihat[12].active = true;
patterns.hihat[14].active = true;

// ============================================
// Status Update
// ============================================

function updateStatus(text: string, color: string = '#888'): void {
  const statusEl = document.getElementById('status');
  const indicatorEl = document.querySelector('.status-indicator');

  if (statusEl) {
    statusEl.textContent = text;
    statusEl.style.color = color;
  }

  // Update indicator state based on color
  if (indicatorEl) {
    indicatorEl.classList.remove('loading', 'error');
    if (color === '#FFA500') {
      indicatorEl.classList.add('loading');
    } else if (color === '#FF6B6B') {
      indicatorEl.classList.add('error');
    }
  }

  console.log(`[AURA] Status: ${text}`);
}

// ============================================
// Audio Engine Initialization
// ============================================

console.log('[AURA] Main.ts loaded');
console.log('[AURA] Available Drum Kits:', DRUM_KIT_PRESETS.map(k => k.name));

async function initializeAudio(): Promise<boolean> {
  if (isAudioInitialized) {
    return true;
  }

  try {
    updateStatus('Starting audio...', '#FFA500');

    // 1. Tone.js 오디오 컨텍스트 시작
    await Tone.start();
    console.log('[AURA] Tone.js context started, state:', Tone.context.state);

    // 2. AudioEngine 초기화
    await audioEngine.initialize({ bpm: 120 });
    console.log('[AURA] Audio Engine initialized');

    // 3. 기본 드럼킷 로드
    updateStatus('Loading sounds...', '#FFA500');
    await soundLibrary.loadDrumKit('trap-808');
    console.log('[AURA] Drum kit loaded:', soundLibrary.currentDrumKitPreset?.name);

    // 4. Transport 설정
    Tone.getTransport().bpm.value = 120;

    // 5. UI Sound Effects 초기화
    initializeUiSfx();

    isAudioInitialized = true;
    updateStatus('Ready to Play!', '#4FD272');

    return true;
  } catch (error) {
    console.error('[AURA] Failed to initialize audio:', error);
    updateStatus('Audio Error!', '#FF6B6B');
    return false;
  }
}

// ============================================
// UI Sound Effects
// ============================================

/**
 * UI 효과음 초기화 (합성 사운드 기반)
 */
function initializeUiSfx(): void {
  // 합성 기반 UI 효과음 (외부 파일 불필요)
  uiSfxSynth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.005,
      decay: 0.1,
      sustain: 0.05,
      release: 0.2,
    },
  }).toDestination();

  // 볼륨 조절 (UI 사운드는 작게)
  uiSfxSynth.volume.value = -12;

  console.log('[AURA] UI SFX initialized (synth-based)');
}

/**
 * 샘플 로드 성공 시 효과음 재생
 * "철컥" 하는 장착 사운드
 */
function playEquipSound(): void {
  if (!uiSfxSynth) return;

  // 빠른 2음 시퀀스로 "철컥" 느낌
  const now = Tone.now();
  uiSfxSynth.triggerAttackRelease('C5', '32n', now);
  uiSfxSynth.triggerAttackRelease('G5', '16n', now + 0.05);

  console.log('[AURA] Equip sound played');
}

/**
 * 트랙 헤더에 임팩트 스플래시 효과 적용
 */
function triggerImpactSplash(header: HTMLElement): void {
  // 기존 애니메이션 클래스 제거 (재트리거 가능하도록)
  header.classList.remove('impact-splash');

  // 강제 리플로우로 애니메이션 리셋
  void header.offsetWidth;

  // 애니메이션 클래스 추가
  header.classList.add('impact-splash');

  // 효과음 재생
  playEquipSound();

  // 애니메이션 종료 후 클래스 제거 (0.5초 후)
  setTimeout(() => {
    header.classList.remove('impact-splash');
  }, 500);
}

// ============================================
// Step Sequencer Logic
// ============================================

// ============================================
// Step Sequencer Logic (Refactored to check Store)
// ============================================

/**
 * 시퀀서 스케줄링 시작
 */
function startSequencer(): void {
  if (sequenceId !== null) return;

  const transport = Tone.getTransport();

  // Schedule repeat
  sequenceId = transport.scheduleRepeat((time) => {
    // 1. Get State from Store (Single Source of Truth)
    const store = useTimelineStore.getState();
    const { stepCount, drumTracks, sequencerPatterns } = store;

    // 2. Iterate Tracks
    drumTracks.forEach(track => {
      const pattern = sequencerPatterns[track.id];
      if (!pattern) return;

      const stepData = pattern[currentStep];
      if (stepData?.active) {
        const multiplier = stepData.multiplier || 1;
        const trackSample = defaultTrackSamples[track.id];

        // Trigger Sound Logic
        const triggerSound = (t: number) => {
          if (trackSample?.player && trackSample.player.loaded && trackSample.customSampleUrl) {
            trackSample.player.start(t);
          } else {
            // Use soundType if available, or track.id as fallback
            soundLibrary.triggerDrum((track.soundType || track.id) as any, t, stepData.velocity);
          }
        };

        if (multiplier === 1) {
          triggerSound(time);
        } else {
          const interval = Tone.Time('16n').toSeconds() / multiplier;
          for (let i = 0; i < multiplier; i++) {
            triggerSound(time + (i * interval));
          }
        }
      }
    });

    // Custom Tracks (Legacy/Extra support if needed, but drumTracks largely covers it)
    customTracks.forEach(track => {
      // ... handled by drumTracks if added to store, 
      // but if customTracks is separate, we might need similar logic.
      // For now, assuming drumTracks covers the UI tracks.
    });

    // UI 하이라이트 업데이트 (Update Store for React Sync)
    // Use Tone.Draw to sync with animation frame
    Tone.getDraw().schedule(() => {
      useTimelineStore.getState().setCurrentStep(currentStep);
    }, time);

    // 다음 스텝으로
    currentStep = (currentStep + 1) % stepCount;
  }, '16n') as unknown as number;

  transport.start();
  // isPlaying = true; // Managed by Store

  console.log('[AURA] Sequencer started (Store-driven)');
}

/**
 * 시퀀서 정지
 */
function stopSequencer(): void {
  const transport = Tone.getTransport();

  if (sequenceId !== null) {
    transport.clear(sequenceId);
    sequenceId = null;
  }

  transport.stop();
  transport.position = 0;
  currentStep = 0;
  // isPlaying = false; // Managed by Store

  console.log('[AURA] Sequencer stopped');
}

// ============================================
// UI Setup (Cleaned)
// ============================================

function setupUI(): void {
  // setupStepSequencerGrid(); // Removed: Handled by React
  // setupStepCountToggle();   // Removed: Handled by React
  // setupKeyboardShortcuts(); // Removed: Handled by HeaderView

  // Keep these as they might still be non-React or global
  setupEditDockTabs();
  setupBpmControl();
  setupKitSelector();
  setupSoundLibraryTabs();
  setupSwingControl();
  setupAddTrackButton();
  setupSyncScroll();
  setupTrackSorting();
  setupHumanizeSlider();
  setupContextFocus();

  console.log('[AURA] UI Setup Complete (React Hybird Mode)');

  // ============================================
  // React Store Subscriptions
  // ============================================

  // Subscribe to Timeline Store for Playback/Mode changes
  useTimelineStore.subscribe((state: any) => {
    const { isPlaying, playbackMode } = state;

    if (isPlaying && playbackMode === 'PATTERN') {
      if (Tone.Transport.state !== 'started') {
        startSequencer();
      }
    } else if (!isPlaying && playbackMode === 'PATTERN') {
      if (Tone.Transport.state === 'started') {
        stopSequencer();
      }
    } else if (playbackMode === 'SONG') {
      // Song Mode Logic
      if (sequenceId !== null) {
        const transport = Tone.getTransport();
        transport.clear(sequenceId);
        sequenceId = null;
      }

      if (isPlaying && Tone.Transport.state !== 'started') {
        audioEngine.play();
      } else if (!isPlaying && Tone.Transport.state === 'started') {
        audioEngine.stop();
      }
    }
  });
}

/**
 * 컨텍스트 포커스 설정 (Step 1: Click Detection)
 */
function setupContextFocus(): void {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    // 시퀀서 영역 판별
    // Note: 'step-cell', 'step-seq-row' 등 시퀀서 내부 요소 클릭, 혹은 패널 컨테이너
    const isSequencer = target.closest('.step-seq-grid-area') ||
      target.closest('.step-seq-track-header') ||
      target.closest('.edit-dock-panel[data-panel="step-seq"]');

    if (isSequencer) {
      if (useAudioStore.getState().activePanel !== 'sequencer') {
        useAudioStore.getState().setActivePanel('sequencer');
        console.log('Current Focus: sequencer'); // 요청된 로그
        updateStatus('Focus: Sequencer', '#4DFFFF');
      }
    } else {
      if (useAudioStore.getState().activePanel !== 'global') {
        useAudioStore.getState().setActivePanel('global');
        console.log('Current Focus: global'); // 요청된 로그
        updateStatus('Focus: Global', '#888');
      }
    }
  });

  console.log('[AURA] Context Focus Listener Initialized');
}

/**
 * 재생/정지 토글
 */
export async function togglePlayback(): Promise<void> {
  // 오디오 초기화
  if (!isAudioInitialized) {
    const success = await initializeAudio();
    if (!success) return;
  }

  // Use Intent Dispatch (Async Queue)
  const playbackMode = useTimelineStore.getState().playbackMode;

  useTimelineStore.getState().dispatchIntent({ type: 'TOGGLE_PLAYBACK' });

  // Sync AudioStore if needed (Legacy Support for Song Mode)
  // We can probably move this into the subscription or keep it here for immediate effect
  // But strictly, let's keep it here for now until AudioStore is fully reactive.
  const isPlayingNow = useTimelineStore.getState().transportStatus === 'PLAYING'; // Note: This might be stale if async queue hasn't processed
  // Actually, better to let the SUBSCRIPTION handle the side effects.

  console.log(`[AURA] Playback Toggled via Shortcut (${playbackMode})`);
}

/**
 * 스텝 우클릭 배수 순환 설정 (X1 -> X2 -> X3 -> X4 -> Reset)
 */
function setupStepMultiplierCycle(): void {
  const grid = document.querySelector('.step-seq-grid');

  if (!grid) {
    console.warn('[AURA] Step sequencer grid not found');
    return;
  }

  // 그리드 내 우클릭 감지
  grid.addEventListener('contextmenu', (e: Event) => {
    const mouseEvent = e as MouseEvent;
    const target = mouseEvent.target as HTMLElement;
    const cell = target.closest('.step-cell') as HTMLElement;

    // 활성화된(active) 스텝 셀에서만 작동
    if (cell && cell.classList.contains('active')) {
      mouseEvent.preventDefault();

      const stepIndex = parseInt(cell.getAttribute('data-step') || '0', 10);
      const row = cell.closest('.step-seq-row');
      const trackName = row?.getAttribute('data-track') as DrumPart;

      if (trackName && (patterns as any)[trackName]) {
        // 배수 순환 (1 -> 2 -> 3 -> 4 -> 1)
        let currentMultiplier = (patterns as any)[trackName][stepIndex].multiplier || 1;
        let nextMultiplier = (currentMultiplier % 4) + 1;

        // 데이터 업데이트
        (patterns as any)[trackName][stepIndex].multiplier = nextMultiplier;

        // UI 업데이트 (배지 표시)
        if (nextMultiplier > 1) {
          cell.setAttribute('data-multiplier', nextMultiplier.toString());
        } else {
          cell.removeAttribute('data-multiplier');
        }

        console.log(`[AURA] Multiplier cycled to x${nextMultiplier} for ${trackName} step ${stepIndex + 1}`);
      }
    }
  });

  console.log('[AURA] Step Multiplier Cycle (Right-Click) initialized');
}

/**
 * 드럼 패드 트리거 (트랙 헤더 전체 클릭)
 */
function setupDrumPadTriggers(): void {
  const trackHeaders = document.querySelectorAll('.step-seq-track-header');

  trackHeaders.forEach(header => {
    const trackName = header.getAttribute('data-track') as DrumPart;
    const headerEl = header as HTMLElement;

    if (trackName) {
      // Initialize default track sample storage
      const trackInfo = DRUM_TRACKS.find(t => t.name === trackName);
      if (trackInfo && !defaultTrackSamples[trackName]) {
        defaultTrackSamples[trackName] = {
          customSampleUrl: null,
          player: undefined,
          originalName: trackInfo.displayName
        };
      }

      // 헤더 전체 클릭 시 소리 재생 (주사위 버튼 제외)
      headerEl.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;

        // 주사위 버튼(.smart-rand-btn) 클릭은 무시
        if (target.closest('.smart-rand-btn')) {
          return;
        }

        if (!isAudioInitialized) {
          await initializeAudio();
        }

        // Play custom sample if available, otherwise use synth drum
        const trackSample = defaultTrackSamples[trackName];
        if (trackSample?.player && trackSample.customSampleUrl) {
          trackSample.player.start();
        } else {
          soundLibrary.triggerDrum(trackName);
        }

        // 시각적 피드백 - 헤더 전체에 효과
        headerEl.style.transform = 'scale(1.02)';
        headerEl.style.filter = 'brightness(1.3)';
        setTimeout(() => {
          headerEl.style.transform = '';
          headerEl.style.filter = '';
        }, 100);

        console.log(`[AURA] Triggered: ${trackName}`);
      });

      // 커서 스타일 추가
      headerEl.style.cursor = 'pointer';

      // Setup drag and drop for default tracks
      setupDefaultTrackDragDrop(headerEl, trackName);

      // 더블클릭 시 킷 변경
      headerEl.addEventListener('dblclick', async (e) => {
        const target = e.target as HTMLElement;

        // 주사위 버튼 클릭은 무시
        if (target.closest('.smart-rand-btn')) {
          return;
        }

        if (!isAudioInitialized) {
          await initializeAudio();
        }

        updateStatus('Morphing kit...', '#FFA500');
        await soundLibrary.morphToNextKit();
        const preset = soundLibrary.currentDrumKitPreset;
        updateStatus(`Kit: ${preset?.name || 'Unknown'}`, '#4FD272');
      });
    }
  });
}

/**
 * 기본 트랙 헤더 드래그 앤 드롭 설정
 */
function setupDefaultTrackDragDrop(header: HTMLElement, trackName: DrumPart): void {
  // Disabled: Handled by global delegation in initTrackDropZones
  // header.style.border = "1px solid pink"; // Debug: showing delegation is active
}

/**
 * Edit Dock 탭 전환
 */
function setupEditDockTabs(): void {
  const tabs = document.querySelectorAll('.edit-dock-tab');
  const panels = document.querySelectorAll('.edit-dock-panel');
  const container = document.querySelector('.edit-dock-panels-container') as HTMLElement;

  console.log(`[AURA] Edit Dock: Found ${tabs.length} tabs and ${panels.length} panels`);

  // 컨테이너 상태 확인
  if (container) {
    const containerStyle = window.getComputedStyle(container);
    console.log(`[AURA DEBUG] Container:`, {
      display: containerStyle.display,
      height: containerStyle.height,
      offsetHeight: container.offsetHeight,
      position: containerStyle.position
    });
  } else {
    console.error('[AURA] Container .edit-dock-panels-container NOT FOUND!');
  }

  // 패널 표시/숨김을 클래스로 제어 (CSS에서 .active가 display: flex)
  const showPanel = (index: number) => {
    panels.forEach((p, i) => {
      const panel = p as HTMLElement;
      if (i === index) {
        panel.classList.add('active');

        // 디버깅: computed style 확인
        requestAnimationFrame(() => {
          const computedStyle = window.getComputedStyle(panel);
          console.log(`[AURA DEBUG] Panel ${i} (${panel.dataset.panel}):`, {
            display: computedStyle.display,
            position: computedStyle.position,
            top: computedStyle.top,
            height: computedStyle.height,
            offsetHeight: panel.offsetHeight,
            boundingRect: panel.getBoundingClientRect()
          });

          // 부모 체인 확인
          let parent = panel.parentElement;
          let level = 0;
          while (parent && level < 3) {
            const ps = window.getComputedStyle(parent);
            console.log(`[AURA DEBUG] Parent ${level} (${parent.className.split(' ')[0]}):`, {
              display: ps.display,
              height: ps.height,
              offsetHeight: parent.offsetHeight,
              position: ps.position
            });
            parent = parent.parentElement;
            level++;
          }
        });
      } else {
        panel.classList.remove('active');
      }
    });
  };

  // 초기 상태: 첫 번째 패널만 표시
  showPanel(0);

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      console.log(`[AURA] Tab ${index} clicked: ${tab.textContent}`);

      tabs.forEach(t => t.classList.remove('active', 'focused'));
      tab.classList.add('active', 'focused');

      showPanel(index);
      console.log(`[AURA] Activated panel ${index}: ${(panels[index] as HTMLElement)?.dataset.panel}`);
    });
  });
}

/**
 * BPM 컨트롤 설정
 */
function setupBpmControl(): void {
  const bpmValue = document.getElementById('bpmValue');
  const bpmUp = document.getElementById('bpmUp');
  const bpmDown = document.getElementById('bpmDown');

  if (bpmUp && bpmDown && bpmValue) {
    bpmUp.addEventListener('click', () => {
      const current = Tone.getTransport().bpm.value;
      const newBpm = Math.min(300, current + 5);
      Tone.getTransport().bpm.value = newBpm;
      bpmValue.textContent = newBpm.toFixed(3);
    });

    bpmDown.addEventListener('click', () => {
      const current = Tone.getTransport().bpm.value;
      const newBpm = Math.max(40, current - 5);
      Tone.getTransport().bpm.value = newBpm;
      bpmValue.textContent = newBpm.toFixed(3);
    });
  }
}

/**
 * 드럼킷 셀렉터 설정
 * HTML select 값을 SoundLibrary 킷 ID로 매핑
 */
function setupKitSelector(): void {
  const kitSelect = document.getElementById('kit-select') as HTMLSelectElement;

  if (!kitSelect) {
    console.warn('[AURA] Kit selector not found');
    return;
  }

  // HTML select 값 → SoundLibrary 킷 ID 매핑
  const kitIdMap: Record<string, string> = {
    'synth': 'trap-808',           // Synth (Default) → Trap 808 Synth
    'tr808': 'sample-808',         // TR-808 Classic → 샘플 기반 808
    'tr909': 'sample-909',         // TR-909 House → 샘플 기반 909
    'acoustic': 'sample-acoustic', // Acoustic Kit → 샘플 기반 어쿠스틱
    'electronic': 'sample-electronic', // Electronic Kit → 샘플 기반 일렉트로닉
  };

  kitSelect.addEventListener('change', async () => {
    const selectedValue = kitSelect.value;
    const kitId = kitIdMap[selectedValue];

    if (!kitId) {
      console.warn(`[AURA] Unknown kit value: ${selectedValue}`);
      return;
    }

    // 오디오 초기화
    if (!isAudioInitialized) {
      await initializeAudio();
    }

    // 로딩 상태 표시
    kitSelect.classList.add('loading');
    updateStatus(`Loading ${kitSelect.options[kitSelect.selectedIndex].text}...`, '#FFA500');

    try {
      // 킷 로드
      await soundLibrary.loadDrumKit(kitId);

      // 완료 상태
      const kitName = kitSelect.options[kitSelect.selectedIndex].text;
      updateStatus(`Kit: ${kitName}`, '#4FD272');
      console.log(`[AURA] Kit changed to: ${kitName} (${kitId})`);
    } catch (error) {
      console.error('[AURA] Failed to load kit:', error);
      updateStatus('Kit load failed!', '#FF6B6B');
    } finally {
      kitSelect.classList.remove('loading');
    }
  });

  console.log('[AURA] Kit selector configured');
}

/**
 * Sound Library Tab Control
 */
function setupSoundLibraryTabs(): void {
  const tabs = document.querySelectorAll('.lib-tab');
  const contentKits = document.getElementById('lib-content-kits');
  const contentSamples = document.getElementById('lib-content-samples');

  if (!contentKits || !contentSamples) {
    return;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 1. Activate UI
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 2. Toggle Content
      const target = (tab as HTMLElement).dataset.tab;
      if (target === 'kits') {
        contentKits.style.display = 'block';
        contentSamples.style.display = 'none';
      } else {
        contentKits.style.display = 'none';
        contentSamples.style.display = 'block';
      }

      console.log(`[AURA] Tab switched: ${target}`);
    });
  });

  console.log('[AURA] Sound Library tabs configured');
}

/**
 * Swing Slider Control (New)
 */
function setupSwingControl(): void {
  const slider = document.getElementById('swing-slider') as HTMLInputElement;
  const valueDisplay = document.getElementById('swing-value');

  if (!slider || !valueDisplay) {
    console.warn('[AURA] Swing slider elements not found');
    return;
  }

  // 슬라이더 값 변경 시 처리
  const updateSwing = (value: number) => {
    // UI 업데이트
    valueDisplay.textContent = `${value}%`;

    // Tone.js Swing 적용 (0-1 범위)
    // 0% -> 0, 100% -> 1 (보통 0.2~0.3이 강한 스윙이지만 1까지 지원)
    if (Tone && Tone.Transport) {
      Tone.Transport.swing = value / 100;
    }

    console.log(`[AURA] Swing set to ${value}%`);
  };

  // input 이벤트: 드래그 중 실시간 업데이트
  slider.addEventListener('input', () => {
    updateSwing(parseInt(slider.value, 10));
  });

  // 초기값 적용
  updateSwing(parseInt(slider.value, 10));

  console.log('[AURA] Swing control initialized');
}

/**
 * 16/32 스텝 토글 설정
 *
 * 핵심: justify-content를 절대 변경하지 않음!
 * 항상 flex-start 상태에서 marginLeft로 위치 조정
 */
// [Legacy Step Logic Removed: Handled by React Store]

// ============================================
// Add Track Functionality
// ============================================

/**
 * Add Track 버튼 설정
 */
function setupAddTrackButton(): void {
  const addTrackBtn = document.querySelector('.add-track-btn');

  if (!addTrackBtn) {
    console.warn('[AURA] Add track button not found');
    return;
  }

  addTrackBtn.addEventListener('click', async () => {
    // Audio init on first interaction
    if (!isAudioInitialized) {
      await initializeAudio();
    }

    addNewTrack();
  });

  console.log('[AURA] Add track button configured');
}

/**
 * 새 트랙 추가
 */
function addNewTrack(): void {
  const tracksContainer = document.querySelector('.step-seq-tracks');
  const gridContainer = document.querySelector('.step-seq-grid');

  if (!tracksContainer || !gridContainer) {
    console.error('[AURA] Track containers not found');
    return;
  }

  // Generate track ID and select color
  trackCounter++;
  const trackId = `track${trackCounter}`;
  const colorIndex = (trackCounter - 1) % TRACK_COLORS.length;
  const trackColor = TRACK_COLORS[colorIndex];
  const trackName = `Track ${trackCounter}`;

  // Create track header
  const trackHeader = createTrackHeader(trackId, trackName, trackColor);
  tracksContainer.appendChild(trackHeader);

  // Inject CSS for dynamic track styling (FX knobs, etc.)
  addDynamicTrackStyle(trackColor);

  // Create grid row
  const gridRow = createGridRow(trackId, trackColor);
  gridContainer.appendChild(gridRow);

  // Initialize pattern data for new track
  (patterns as any)[trackId] = Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1, multiplier: 1 }));

  // Add to custom tracks list for playback
  customTracks.push({
    id: trackId,
    name: trackName,
    color: trackColor,
    soundType: null, // Empty by default
    customSampleUrl: null // Will be set when user drops audio file
  });

  // Setup click events for the new row -- REMOVED (Using delegation)
  // setupNewRowEvents(gridRow, trackId);

  // Setup header click  // Header Event
  setupHeaderClickEvent(trackHeader, trackId);
  // setupTrackDragDrop removed - using initTrackDropZones delegationrop for custom samples

  console.log(`[AURA] Added new track: ${trackName} (${trackColor})`);
}

/**
 * 트랙 헤더 엘리먼트 생성
 */
function createTrackHeader(trackId: string, trackName: string, color: string): HTMLElement {
  const header = document.createElement('div');
  header.className = 'step-seq-track-header';
  header.setAttribute('data-track', trackId);
  header.setAttribute('data-color', color);

  // Convert hex to rgba for background
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  header.style.background = `rgba(${r}, ${g}, ${b}, 0.2)`;
  header.style.borderLeft = `3px solid ${color}`;

  header.innerHTML = `
    <div class="smart-rand-btn" title="Smart Randomize">
      <svg viewBox="0 0 24 24" class="dice-icon">
        <rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
        <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
      </svg>
      <span class="smart-rand-label">Smart Rand</span>
    </div>
    <span class="step-seq-track-name" style="color: ${color};">${trackName}</span>
  `;

  return header;
}

/**
 * 그리드 행 엘리먼트 생성 (16 또는 32 스텝)
 */
function createGridRow(trackId: string, color: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'step-seq-row';
  row.setAttribute('data-track', trackId);
  row.setAttribute('data-color', color);
  row.style.setProperty('--track-color', color);

  // Create beat groups based on current step mode
  const beatGroupCount = currentStepMode === 32 ? 8 : 4;

  for (let groupIndex = 0; groupIndex < beatGroupCount; groupIndex++) {
    const beatGroup = document.createElement('div');
    beatGroup.className = 'step-beat-group';

    for (let cellIndex = 0; cellIndex < 4; cellIndex++) {
      const stepIndex = (groupIndex * 4) + cellIndex;
      const cell = document.createElement('div');
      cell.className = 'step-cell';
      cell.setAttribute('data-step', stepIndex.toString());
      beatGroup.appendChild(cell);
    }

    row.appendChild(beatGroup);
  }

  // Integrated FX
  const divider = document.createElement('div');
  divider.className = 'row-divider';
  row.appendChild(divider);

  const fxGroup = document.createElement('div');
  fxGroup.className = 'fx-controls-group';

  const knobData = [
    { title: 'Volume', val: '0%' },
    { title: 'Reverb', val: '0%' },
    { title: 'Delay', val: '0%' },
    { title: 'Compressor', val: '0%' }
  ];

  knobData.forEach(k => {
    const knob = document.createElement('div');
    knob.className = 'fx-knob mini';
    knob.style.setProperty('--val', k.val);
    knob.title = k.title;
    fxGroup.appendChild(knob);
  });

  row.appendChild(fxGroup);

  return row;
}

/**
 * 새 그리드 행에 이벤트 설정
 */
/**
 * Unified Grid Event Delegation
 * Replaces individual cell event listeners
 */
function setupGridDelegation(): void {
  const grid = document.querySelector('.step-seq-grid');
  if (!grid) return;

  grid.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;
    const cell = target.closest('.step-cell');

    if (!cell) return;

    // Audio Context Init
    if (!isAudioInitialized) {
      await initializeAudio();
    }

    const row = cell.closest('.step-seq-row');
    if (!row) return;

    const trackId = row.getAttribute('data-track'); // 'Kick' or 'track1'
    const stepIndex = parseInt(cell.getAttribute('data-step') || '0', 10);

    if (!trackId) return;

    // Toggle Pattern
    const trackPatterns = (patterns as any)[trackId];
    if (trackPatterns && trackPatterns[stepIndex]) {
      trackPatterns[stepIndex].active = !trackPatterns[stepIndex].active;

      const isActive = trackPatterns[stepIndex].active;

      if (isActive) {
        cell.classList.add('active');

        // Play Sound Logic
        // 1. Check Default Tracks
        const defaultCustomSample = (defaultTrackSamples as any)[trackId];

        // 2. Check Custom Tracks
        const customTrack = customTracks.find(t => t.id === trackId);

        // Priority 1: Default Track with Custom Sample
        if (defaultCustomSample?.player && defaultCustomSample.player.loaded && defaultCustomSample.customSampleUrl) {
          defaultCustomSample.player.stop();
          defaultCustomSample.player.start();
        }
        // Priority 2: Custom Track with Sample
        else if (customTrack?.player && customTrack.player.loaded && customTrack.customSampleUrl) {
          customTrack.player.stop();
          customTrack.player.start();
        }
        // Priority 3: Standard / Fallback Sound
        else {
          // For custom tracks without sample, soundType might be null, so triggerDrum handles it (or silence)
          const sound = (customTrack?.soundType) || trackId;
          soundLibrary.triggerDrum(sound as any);
        }

      } else {
        cell.classList.remove('active');
        // Reset multiplier on deactivate
        trackPatterns[stepIndex].multiplier = 1;
        cell.removeAttribute('data-multiplier');
      }

      console.log(`[AURA] Step ${stepIndex + 1} toggled for ${trackId}: ${isActive}`);
    }
  });

  console.log('[AURA] Grid delegation setup complete');
}

/**
 * 트랙 헤더 클릭 이벤트 설정
 */
function setupHeaderClickEvent(header: HTMLElement, trackId: string): void {
  header.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    // Ignore Smart Rand button and sound selector clicks
    if (target.closest('.smart-rand-btn') || target.closest('.track-sound-selector')) {
      return;
    }

    if (!isAudioInitialized) {
      await initializeAudio();
    }

    // Trigger sound based on custom track's sample or fallback
    const customTrack = customTracks.find(t => t.id === trackId);

    if (customTrack?.player && customTrack.player.loaded && customTrack.customSampleUrl) {
      customTrack.player.stop();
      customTrack.player.start();
    } else if (customTrack?.soundType) {
      soundLibrary.triggerDrum(customTrack.soundType);
    } else {
      // Try fallback to trackId if soundType is null (e.g. initial empty track)
      soundLibrary.triggerDrum(trackId as any);
    }

    // Visual feedback
    header.style.transform = 'scale(1.02)';
    header.style.filter = 'brightness(1.3)';
    setTimeout(() => {
      header.style.transform = '';
      header.style.filter = '';
    }, 100);

    console.log(`[AURA] Triggered: ${trackId}`);
  });

  header.style.cursor = 'pointer';
}

/**
 * 트랙 헤더와 그리드 스크롤 동기화
 */
function setupSyncScroll(): void {
  const tracksContainer = document.querySelector('.step-seq-tracks') as HTMLElement;
  const gridScroll = document.querySelector('.step-seq-grid-scroll') as HTMLElement;

  if (!tracksContainer || !gridScroll) {
    console.warn('[AURA] Scroll containers not found');
    return;
  }

  // Sync track headers scroll with grid scroll
  tracksContainer.addEventListener('scroll', () => {
    gridScroll.scrollTop = tracksContainer.scrollTop;
  });

  gridScroll.addEventListener('scroll', () => {
    tracksContainer.scrollTop = gridScroll.scrollTop;
  });

  console.log('[AURA] Scroll sync configured');
}

// ============================================
// Track Drag & Drop Sorting (SortableJS)
// ============================================

/**
 * 트랙 드래그 앤 드롭 정렬 설정
 * SortableJS를 사용하여 트랙 순서를 변경할 수 있도록 함
 */
function setupTrackSorting(): void {
  const tracksContainer = document.querySelector('.step-seq-tracks') as HTMLElement;
  const gridContainer = document.querySelector('.step-seq-grid') as HTMLElement;

  if (!tracksContainer || !gridContainer) {
    console.warn('[AURA] Track sorting containers not found');
    return;
  }

  // 트랙 헤더 Sortable 인스턴스
  const headerSortable = Sortable.create(tracksContainer, {
    animation: 150,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    handle: '.step-seq-track-header',
    ghostClass: 'sortable-ghost',
    chosenClass: 'sortable-chosen',
    dragClass: 'sortable-drag',
    filter: '.step-seq-add-track', // Add Track 버튼은 드래그 제외

    onStart: (evt) => {
      // 드래그 시작 시 그리드 행에도 동일한 클래스 추가
      const gridRows = gridContainer.querySelectorAll('.step-seq-row');
      if (gridRows[evt.oldIndex!]) {
        gridRows[evt.oldIndex!].classList.add('sortable-chosen');
      }
      document.body.classList.add('sorting-tracks');
    },

    onMove: (evt) => {
      // 그리드 행도 실시간으로 위치 변경
      const gridRows = Array.from(gridContainer.querySelectorAll('.step-seq-row'));
      const oldIndex = evt.dragged.dataset.sortableOldIndex
        ? parseInt(evt.dragged.dataset.sortableOldIndex)
        : gridRows.indexOf(evt.dragged as any);

      // 트랙 헤더의 이동 방향에 따라 그리드 행도 동기화
      const draggedHeader = evt.dragged as HTMLElement;
      const relatedHeader = evt.related as HTMLElement;

      const draggedTrack = draggedHeader.getAttribute('data-track');
      const relatedTrack = relatedHeader?.getAttribute('data-track');

      if (draggedTrack && relatedTrack) {
        const draggedRow = gridContainer.querySelector(`.step-seq-row[data-track="${draggedTrack}"]`);
        const relatedRow = gridContainer.querySelector(`.step-seq-row[data-track="${relatedTrack}"]`);

        if (draggedRow && relatedRow) {
          // willInsertAfter가 true면 관련 요소 뒤에, false면 앞에 삽입
          if (evt.willInsertAfter) {
            relatedRow.after(draggedRow);
          } else {
            relatedRow.before(draggedRow);
          }
        }
      }

      return true;
    },

    onEnd: (evt) => {
      document.body.classList.remove('sorting-tracks');

      // 모든 선택 클래스 제거
      document.querySelectorAll('.sortable-chosen, .sortable-ghost').forEach(el => {
        el.classList.remove('sortable-chosen', 'sortable-ghost');
      });

      const oldIndex = evt.oldIndex!;
      const newIndex = evt.newIndex!;

      if (oldIndex === newIndex) return;

      // 트랙 순서 변경 로깅
      console.log(`[AURA] Track moved from index ${oldIndex} to ${newIndex}`);

      // 패턴 데이터 재정렬은 필요 없음 (트랙 ID로 관리됨)
      // 그리드 행은 onMove에서 이미 동기화됨

      // 커스텀 트랙 배열 재정렬 (인덱스가 기본 트랙 수보다 클 때만)
      const defaultTrackCount = DRUM_TRACKS.length;
      if (oldIndex >= defaultTrackCount && newIndex >= defaultTrackCount) {
        const customOldIdx = oldIndex - defaultTrackCount;
        const customNewIdx = newIndex - defaultTrackCount;

        if (customOldIdx >= 0 && customOldIdx < customTracks.length) {
          const [movedTrack] = customTracks.splice(customOldIdx, 1);
          customTracks.splice(customNewIdx, 0, movedTrack);
        }
      }
    }
  });

  console.log('[AURA] Track sorting configured with SortableJS');
}

// ============================================
// Humanize Slider Control
// ============================================

/**
 * Humanize 슬라이더 초기화 및 이벤트 연결
 */
function setupHumanizeSlider(): void {
  const slider = document.getElementById('humanize-slider') as HTMLInputElement;
  const valueDisplay = document.getElementById('humanize-value');

  if (!slider || !valueDisplay) {
    console.warn('[AURA] Humanize slider elements not found');
    return;
  }

  // 슬라이더 값 변경 시 처리
  const updateHumanize = (value: number) => {
    // UI 업데이트
    valueDisplay.textContent = `${value}%`;

    // 오디오 엔진에 적용 (0-100 -> 0-1 변환)
    soundLibrary.setHumanize(value / 100);

    console.log(`[AURA] Humanize set to ${value}%`);
  };

  // input 이벤트: 드래그 중 실시간 업데이트
  slider.addEventListener('input', () => {
    updateHumanize(parseInt(slider.value, 10));
  });

  // 초기값 적용
  updateHumanize(parseInt(slider.value, 10));

  console.log('[AURA] Humanize slider initialized');
}

// ============================================
// Add CSS for current step highlight
// ============================================

function injectStyles(): void {
  const style = document.createElement('style');

  // Generate CSS only for NEW track colors (not the original 4)
  // Original colors (#FF6B6B, #4DFFFF, #4FD272, #D45FFF) already have styles in index.html
  const originalColors = ['#FF6B6B', '#4DFFFF', '#4FD272', '#D45FFF'];
  const newColors = TRACK_COLORS.filter(c => !originalColors.includes(c));

  const colorStyles = newColors.map(color => {
    // Convert hex to rgba components
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    return `
    .step-seq-row[data-color="${color}"] .step-cell {
      border: 1px solid rgba(${r}, ${g}, ${b}, 0.35);
      box-shadow: inset 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.15);
    }
    .step-seq-row[data-color="${color}"] .fx-knob.mini {
      border: 2px solid rgba(${r}, ${g}, ${b}, 0.3);
      background: radial-gradient(closest-side, #16161C 50%, transparent 54%),
                  conic-gradient(from 180deg, ${color} var(--val), rgba(${r}, ${g}, ${b}, 0.1) 0);
      box-shadow: inset 0 0 5px rgba(${r}, ${g}, ${b}, 0.1);
    }
    .step-seq-row[data-color="${color}"] .fx-knob.mini.active {
      border-color: ${color};
      box-shadow: 0 0 10px rgba(${r}, ${g}, ${b}, 0.5);
    }
    .step-seq-row[data-color="${color}"] .step-cell.active {
      background: rgba(${r}, ${g}, ${b}, 0.3);
      border: 2px solid ${color};
      box-shadow: 0 0 12px ${color}, 0 0 20px rgba(${r}, ${g}, ${b}, 0.4), inset 0 0 0 3px rgba(0, 0, 0, 0.3), inset 0 0 0 4px rgba(${r}, ${g}, ${b}, 0.6);
    }
    .step-seq-row[data-color="${color}"] .step-cell.current::before {
      border-color: ${color};
      box-shadow: 0 0 15px ${color}, 0 0 30px rgba(${r}, ${g}, ${b}, 0.5);
    }
    .step-seq-row[data-color="${color}"] .step-cell.ghost {
      background: rgba(${r}, ${g}, ${b}, 0.08);
      box-shadow: inset 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.3);
    }
  `;
  }).join('\n');


  style.textContent = `
    .step-cell.current {
      outline: 2px solid #fff !important;
      outline-offset: -2px;
      animation: pulse 0.1s ease-out;
    }

    @keyframes pulse {
      0% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .play-btn.playing .play-icon {
      border-color: transparent transparent transparent #4FD272 !important;
    }

    ${colorStyles}
  `;
  document.head.appendChild(style);
}

/**
 * 동적으로 단일 트랙 색상에 대한 스타일 주입
 */
function addDynamicTrackStyle(color: string): void {
  // 중복 주입 방지
  if (document.getElementById(`style-${color}`)) return;

  const style = document.createElement('style');
  style.id = `style-${color}`;

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  style.textContent = `
    .step-seq-row[data-color="${color}"] .step-cell {
      border: 1px solid rgba(${r}, ${g}, ${b}, 0.35);
      box-shadow: inset 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.15);
    }
    .step-seq-row[data-color="${color}"] .fx-knob.mini {
      border: 2px solid rgba(${r}, ${g}, ${b}, 0.3) !important;
      background: radial-gradient(closest-side, #16161C 50%, transparent 54%),
                  conic-gradient(from 180deg, ${color} var(--val), rgba(${r}, ${g}, ${b}, 0.1) 0) !important;
      box-shadow: inset 0 0 5px rgba(${r}, ${g}, ${b}, 0.1) !important;
    }
    .step-seq-row[data-color="${color}"] .fx-knob.mini.active {
      border-color: ${color} !important;
      box-shadow: 0 0 12px ${color}, 0 0 20px rgba(${r}, ${g}, ${b}, 0.4), inset 0 0 0 3px rgba(0, 0, 0, 0.3), inset 0 0 0 4px rgba(${r}, ${g}, ${b}, 0.6) !important;
    }
    .step-seq-row[data-color="${color}"] .step-cell.active {
      background: rgba(${r}, ${g}, ${b}, 0.3);
      border: 2px solid ${color};
      box-shadow: 0 0 12px ${color}, 0 0 20px rgba(${r}, ${g}, ${b}, 0.4), inset 0 0 0 3px rgba(0, 0, 0, 0.3), inset 0 0 0 4px rgba(${r}, ${g}, ${b}, 0.6);
    }
    .step-seq-row[data-color="${color}"] .step-cell.current::before {
      border-color: ${color};
      box-shadow: 0 0 15px ${color}, 0 0 30px rgba(${r}, ${g}, ${b}, 0.5);
    }
    .step-seq-row[data-color="${color}"] .step-cell.ghost {
      background: rgba(${r}, ${g}, ${b}, 0.08);
      box-shadow: inset 0 0 0 1px rgba(${r}, ${g}, ${b}, 0.3);
    }
  `;

  document.head.appendChild(style);
  console.log(`[AURA] Added dynamic style for color ${color}`);
}



// ============================================
// Wave Visualizer (Real Audio Analyser)
// ============================================

let waveAnimationId: number | null = null;

/**
 * 실시간 오디오 웨이브폼 비주얼라이저
 * SynthDrums의 Analyser에서 실제 오디오 데이터를 읽어 렌더링
 */
function animateWave(): void {
  const wavePath = document.getElementById('wave-path');
  const waveVisualizer = document.getElementById('waveVisualizer');

  if (!wavePath) return;

  function updateWave() {
    // AudioEngine 마스터 분석기에서 데이터 가져오기 (모든 소스 시각화)
    let waveformData: Float32Array | null = null;

    if (audioEngine && audioEngine.isInitialized) {
      waveformData = audioEngine.getWaveformData();
    } else {
      // Fallback: Try soundLibrary if AudioEngine not ready (though deprecated)
      // or just wait.
    }

    const topPoints: string[] = [];
    const bottomPoints: string[] = [];

    if (waveformData && waveformData.length > 0) {
      const bufferLength = waveformData.length;
      // 데이터가 너무 많으면 가독성이 떨어지므로 샘플링 (예: 128개 포인트)
      const step = Math.max(1, Math.floor(bufferLength / 128));

      for (let i = 0; i < bufferLength; i += step) {
        const x = (i / bufferLength) * 100;
        const amplitude = waveformData[i] * 35; // 진폭 스케일 조정 (0-50 범위 내)

        topPoints.push(`${x.toFixed(1)},${(50 - amplitude).toFixed(1)}`);
        bottomPoints.push(`${x.toFixed(1)},${(50 + amplitude).toFixed(1)}`);
      }
    } else {
      // 데이터가 없을 때 평평한 중앙선
      topPoints.push("0,50");
      topPoints.push("100,50");
      bottomPoints.push("100,50");
      bottomPoints.push("0,50");
    }

    // SVG path 생성 (Mirrored Wave: 상단 경로를 따라갔다가 하단 경로를 역순으로 돌아옴)
    if (topPoints.length > 0) {
      const pathD = `M${topPoints[0]} ` +
        topPoints.map(p => `L${p}`).join(' ') +
        ` L${bottomPoints[bottomPoints.length - 1]} ` +
        [...bottomPoints].reverse().map(p => `L${p}`).join(' ') +
        ` Z`;

      if (wavePath) {
        wavePath.setAttribute('d', pathD);
      }
    }

    // playing 클래스 토글
    if (isPlaying) {
      waveVisualizer?.classList.add('playing');
    } else {
      waveVisualizer?.classList.remove('playing');
    }

    waveAnimationId = requestAnimationFrame(updateWave);
  }

  updateWave();
}

/**
 * 웨이브 애니메이션 중지
 */
function stopWaveAnimation(): void {
  if (waveAnimationId !== null) {
    cancelAnimationFrame(waveAnimationId);
    waveAnimationId = null;
  }
}

// ============================================
// App Bootstrap
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[AURA] DOM Ready - Version 2.1 (Fixes Applied)');

  // CSS 주입
  injectStyles();

  // UI 설정
  setupUI();

  // Audio Routing Setup: SynthDrums -> AudioEngine
  if (soundLibrary && audioEngine) {
    const synthDrums = soundLibrary.getSynthDrums();
    if (synthDrums) {
      console.log('[AURA] Connecting SynthDrums to AudioEngine Master (Visuals Only)');
      // Parallel Routing: Audio goes to Destination (internal), Visuals go to AudioEngine
      synthDrums.connect(audioEngine.visualizerInput);
    }
  }

  // 웨이브 비주얼라이저 시작
  animateWave();

  // 백엔드 연결 (BridgeService at startup)
  // setupBackendConnection();

  // 초기 상태
  updateStatus('Click to start', '#888');

  console.log('[AURA] Application Ready');
});

// 전역 API 노출 (디버깅용)
(window as any).AURA = {
  audioEngine,
  soundLibrary,
  DRUM_KIT_PRESETS,
  initializeAudio,
  patterns,
  startSequencer,
  stopSequencer,
  Tone
};

// Sample Browser Logic

// ============================================
// Sample Browser Logic (FL Studio Style)
// ============================================

const sampleData = {
  "Packs": {
    "Drums": {
      "Kicks": ["Kick_01.wav", "Kick_02.wav", "Kick_808.wav", "Kick_Hard.wav"],
      "Snares": ["Snare_01.wav", "Snare_02.wav", "Snare_Trap.wav", "Snare_Clap.wav"],
      "Hats": ["HiHat_Closed.wav", "HiHat_Open.wav", "HiHat_Trap.wav"],
      "Percs": ["Perc_01.wav", "Perc_Click.wav", "Perc_Wood.wav"]
    },
    "Instruments": {
      "Keys": ["Piano_C3.wav", "Rhodes_C3.wav"],
      "Bass": ["SubBass_C2.wav", "Reese_C2.wav"]
    },
    "FX": ["Impact_01.wav", "Riser_01.wav", "Sweep_Down.wav"]
  },
  "User Library": {
    "Recordings": [],
    "Downloads": []
  }
};

function renderFileTree(container: HTMLElement, data: any, level: number = 0) {
  if (level === 0) container.innerHTML = '';

  for (const key in data) {
    const value = data[key];
    const isFolder = typeof value === 'object' && !Array.isArray(value);
    const isFileArray = Array.isArray(value);

    if (isFolder) {
      // Folder Item
      const folderDiv = document.createElement('div');
      folderDiv.className = `tree-item folder-item indent-${level}`;
      folderDiv.innerHTML = `
                <svg class="tree-icon" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                ${key}
            `;
      container.appendChild(folderDiv);

      // Container for children (initially hidden)
      const childrenContainer = document.createElement('div');
      childrenContainer.style.display = 'none';
      container.appendChild(childrenContainer);

      // Toggle Logic
      folderDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        folderDiv.classList.toggle('folder-open');
        childrenContainer.style.display = childrenContainer.style.display === 'none' ? 'block' : 'none';
        // Change icon if needed? CSS handles color.
      });

      renderFileTree(childrenContainer, value, level + 1);
    } else if (isFileArray) {
      // Folder containing files
      const folderDiv = document.createElement('div');
      folderDiv.className = `tree-item folder-item indent-${level}`;
      folderDiv.innerHTML = `
                 <svg class="tree-icon" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>
                 ${key}
             `;
      container.appendChild(folderDiv);

      const childrenContainer = document.createElement('div');
      childrenContainer.style.display = 'none';
      container.appendChild(childrenContainer);

      folderDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        folderDiv.classList.toggle('folder-open');
        childrenContainer.style.display = childrenContainer.style.display === 'none' ? 'block' : 'none';
      });

      value.forEach((file: string) => {
        const fileDiv = document.createElement('div');
        fileDiv.className = `tree-item file-item indent-${level + 1}`;
        fileDiv.innerHTML = `
                    <svg class="tree-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                    ${file}
                `;
        fileDiv.setAttribute('draggable', 'true');

        // Preview Logic
        fileDiv.addEventListener('click', (e) => {
          e.stopPropagation();
          // Select item style
          document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('selected'));
          fileDiv.classList.add('selected');

          // Play preview sound
          playPreviewSound(file);
        });

        // Drag Start
        fileDiv.addEventListener('dragstart', (e) => {
          if (e.dataTransfer) {
            e.dataTransfer.setData('application/json', JSON.stringify({
              type: 'sample',
              name: file,
              category: key
            }));
            e.dataTransfer.effectAllowed = 'copy';
          }
        });

        childrenContainer.appendChild(fileDiv);
      });
    }
  }
}

// Simple preview synth
async function playPreviewSound(fileName?: string) {
  // 1. Check if it's a real file
  if (fileName && userFiles.has(fileName)) {
    const file = userFiles.get(fileName);
    if (file) {
      const url = URL.createObjectURL(file);
      const player = new Tone.Player(url).toDestination();
      await Tone.loaded();
      player.start();
      return;
    }
  }

  // 2. Standard Beep Fallback
  if (!uiSfxSynth) {
    uiSfxSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
    }).toDestination();
  }

  // Mock Sound Logic
  const name = (fileName || "").toLowerCase();
  let note = "C4";
  let duration = "32n";

  if (name.includes("kick")) note = "C2";
  else if (name.includes("snare")) note = "G2";
  else if (name.includes("hihat") || name.includes("hat")) { note = "F#4"; duration = "64n"; }
  else if (name.includes("clap")) note = "D#3";
  else if (name.includes("bass")) note = "A1";

  uiSfxSynth.triggerAttackRelease(note, duration);

}

function initSampleBrowser() {
  const browserOverlay = document.getElementById('sample-browser-overlay');
  const samplesBtn = document.querySelector('.samples-box .samples-trigger-btn'); // The right box
  const closeBtn = document.querySelector('.browser-close');
  const treeContainer = document.getElementById('browser-tree-content');

  if (browserOverlay && samplesBtn && treeContainer) {
    // Toggle Overlay
    samplesBtn.addEventListener('click', () => {
      browserOverlay.classList.toggle('active');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        browserOverlay.classList.remove('active');
      });
    }

    // Render Tree
    renderFileTree(treeContainer, sampleData);
  }
}

// ============================================
// Drag & Drop on Track Headers
// ============================================


// ============================================
// Drag & Drop on Track Headers (Event Delegation)
// ============================================


function initTrackDropZones() {
  const tracksContainer = document.querySelector('.step-seq-tracks');
  if (!tracksContainer) {
    console.warn("Sequencer Tracks Container (.step-seq-tracks) not found!");
    return;
  }

  console.log("[AURA] Initializing Track Drop Zones (Delegation)...");

  tracksContainer.addEventListener('dragover', (e: Event) => {
    const dragEvent = e as DragEvent;
    dragEvent.preventDefault();
    const target = dragEvent.target as HTMLElement;
    const header = target.closest('.step-seq-track-header');
    if (header) {
      (header as HTMLElement).style.backgroundColor = 'rgba(56, 64, 80, 0.8)'; // Highlight
      if (dragEvent.dataTransfer) dragEvent.dataTransfer.dropEffect = 'copy';
    }
  });

  tracksContainer.addEventListener('dragleave', (e) => {
    const target = e.target as HTMLElement;
    const header = target.closest('.step-seq-track-header');
    if (header) {
      // Restore original background
      const color = (header as HTMLElement).getAttribute('data-color');
      if (color) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        (header as HTMLElement).style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
      } else {
        (header as HTMLElement).style.backgroundColor = '';
      }
    }
  });

  tracksContainer.addEventListener('drop', async (e: Event) => {
    const dragEvent = e as DragEvent;
    dragEvent.preventDefault();

    // RESUME AUDIO CONTEXT (Essential for browser autoplay policy)
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
        console.log("[AURA] Audio Context Resumed by Drop Event");
      } catch (err) {
        console.warn("[AURA] Failed to resume AudioContext:", err);
      }
    }

    const target = e.target as HTMLElement;
    const header = target.closest('.step-seq-track-header') as HTMLElement;

    if (!header) return;

    // console.log("[AURA] Drop on Track Header:", header);

    // Restore original background
    const color = header.getAttribute('data-color');
    if (color) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      header.style.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.2)`;
    } else {
      header.style.backgroundColor = '';
    }

    const trackId = header.getAttribute('data-track');
    if (!trackId) {
      console.error("Track ID not found on header");
      return;
    }

    if (dragEvent.dataTransfer) {
      // Internal Drop (Sample Browser)
      const data = dragEvent.dataTransfer.getData('application/json');
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'sample') {
            console.log("Processing Internal Drop:", parsed);

            const nameEl = header.querySelector('.step-seq-track-name');
            if (nameEl) nameEl.textContent = parsed.name.split('/').pop().replace('.wav', '');

            // Helper to find file in userFiles or basic mock handling
            if (typeof userFiles !== 'undefined' && userFiles.has(parsed.name)) {
              const file = userFiles.get(parsed.name);
              if (file) {
                const url = URL.createObjectURL(file);
                try {
                  await soundLibrary.loadCustomSample(trackId as any, url);

                  // FORCE TRIGGER - IMMEDIATE
                  console.log(`[AURA] Internal Drop Load Complete. Triggering Sound for ${trackId}...`);
                  soundLibrary.triggerDrum(trackId as any);

                  // REMOVED: Safety Delay trigger which caused double playback

                  console.log("Loaded Custom Sample:", parsed.name);
                } catch (err) {
                  console.error("[AURA] Internal Drop Trigger Failed:", err);
                }
              }
            } else {
              console.warn("File not found in userFiles registry:", parsed.name);
            }
          }
        } catch (e) { console.error("Drop Parse Error:", e); }
      }

      if (dragEvent.dataTransfer && dragEvent.dataTransfer.files.length > 0) {
        const file = dragEvent.dataTransfer.files[0];
        console.log("Processing External Drop:", file.name);

        if (file.name.match(/\.(wav|mp3|ogg)$/i)) {
          const nameEl = header.querySelector('.step-seq-track-name');
          if (nameEl) nameEl.textContent = file.name.replace(/\.[^/.]+$/, "");

          const url = URL.createObjectURL(file);
          // Ensure soundLibrary exists
          // Ensure soundLibrary exists
          if (typeof customTracks !== 'undefined') {
            const trackIdStr = trackId as string;
            const customTrack = customTracks.find(t => t.id === trackIdStr);

            if (customTrack) {
              // Dispose previous player if exists
              if (customTrack.player) {
                customTrack.player.dispose();
              }

              // Explicitly load buffer first for reliability
              const buffer = new Tone.Buffer(
                url,
                () => {
                  console.log(`[AURA] Custom sample buffer loaded for ${trackIdStr}: ${file.name}`);

                  // Dispose previous player if exists (double check)
                  if (customTrack.player) {
                    customTrack.player.dispose();
                  }

                  // Create new player with loaded buffer
                  // 1. Audio Path (Critical)
                  const player = new Tone.Player(buffer).toDestination();

                  // 2. Visual Path (Secondary - Safe Mode)
                  if (audioEngine) {
                    audioEngine.connectToVisualizer(player);
                  }

                  customTrack.customSampleUrl = url;
                  customTrack.player = player;
                  customTrack.name = file.name.replace(/\.[^/.]+$/, '');
                  customTrack.soundType = null; // Ensure no fallback sound

                  // Update track name in UI
                  const trackNameEl = header.querySelector('.step-seq-track-name');
                  if (trackNameEl) {
                    trackNameEl.textContent = customTrack.name;
                  }

                  // Impact splash effect
                  if (typeof triggerImpactSplash !== 'undefined') {
                    triggerImpactSplash(header);
                  }

                  // Play preview safely
                  if (player.loaded) {
                    player.start();
                    console.log(`[AURA] Preview triggered for ${trackIdStr}`);
                  }
                },
                (e: any) => {
                  console.error('[AURA] Buffer load error:', e);
                  header.classList.add('error-pulse');
                }
              );
            }
          }
        }
      }
    }
  });
}

// Call init functions on DOMContentLoaded or end of script
// We'll append this to the window init if possible, or just call at end of file if it runs after DOM.
// This main.ts seems to run `setupUI()` etc.

// Initialize Browser Features
document.addEventListener('DOMContentLoaded', () => {
  initSampleBrowser();
  setTimeout(initTrackDropZones, 1000); // Wait for tracks to render?
});



// actually I defined new_logic above with comments.

const userFiles = new Map<string, File | Blob>();

// Helper: Show/Hide Spinner
function toggleSpinner(show: boolean, text: string = "Processing...") {
  const loader = document.getElementById('library-loader');
  const textEl = document.getElementById('loader-text');
  if (loader && textEl) {
    textEl.textContent = text;
    loader.style.display = show ? 'flex' : 'none';
  }
}

// 1. Enhanced Tree Builder (Handles Nested Paths)
function buildNestedFileTree(files: (File | StoredFile)[]) {
  const tree: any = {};

  files.forEach(file => {
    // Determine path: webkitRelativePath for input files, .path for StoredFile
    const path = (file as any).webkitRelativePath || (file as any).path;

    if (!path || !path.match(/\.(wav|mp3|ogg)$/i)) return; // Filter audio only

    // Register to global map (userFiles)
    userFiles.set(path, (file as any).blob || file);

    const parts = path.split('/');
    let current = tree;

    parts.forEach((part: string, index: number) => {
      if (index === parts.length - 1) {
        // It's a file
        if (!current._files) current._files = [];
        current._files.push(path); // Store full path for retrieval
      } else {
        // It's a folder
        if (!current[part]) current[part] = {};
        current = current[part];
      }
    });
  });

  return tree;
}

// 2. Enhanced Tree Renderer (Recursive & Collapsible)
function renderNestedTree(container: HTMLElement, tree: any, level = 0) {
  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.paddingLeft = level === 0 ? '0' : '15px';
  ul.style.marginTop = '4px';

  // Sort: Folders first, then files
  const keys = Object.keys(tree).filter(k => k !== '_files').sort();

  // Render Folders
  keys.forEach(folderName => {
    const li = document.createElement('li');
    li.style.marginBottom = '2px';

    const details = document.createElement('details');
    details.open = level < 1; // Open top level only by default

    const summary = document.createElement('summary');
    summary.style.cursor = 'pointer';
    summary.style.color = '#C0C6C5';
    summary.style.fontSize = '13px';
    summary.style.userSelect = 'none';
    summary.style.outline = 'none';
    summary.innerHTML = `<span style="opacity:0.7">📁</span> ${folderName}`;

    // Hover effect styles inline or class
    summary.style.transition = 'color 0.2s';
    summary.onmouseenter = () => summary.style.color = '#FFF';
    summary.onmouseleave = () => summary.style.color = '#C0C6C5';

    details.appendChild(summary);

    // Recursive rendering for children
    const childrenContainer = document.createElement('div');
    renderNestedTree(childrenContainer, tree[folderName], level + 1);
    details.appendChild(childrenContainer);

    li.appendChild(details);
    ul.appendChild(li);
  });

  // Render Files (Draggable)
  if (tree._files && tree._files.length > 0) {
    tree._files.forEach((filePath: string) => {
      const fileName = filePath.split('/').pop()?.replace(/\.[^/.]+$/, "") || "Unknown";
      const li = document.createElement('li');
      li.style.padding = '4px 8px';
      li.style.cursor = 'grab';
      li.style.color = '#808590';
      li.style.fontSize = '12px';
      li.style.borderRadius = '4px';
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.gap = '6px';
      li.innerHTML = `<span style="color:#4FD272; font-size:10px">♪</span> ${fileName}`;

      // Drag Properties
      li.draggable = true;
      li.addEventListener('dragstart', (e) => {
        const sampleData = { type: 'sample', name: filePath }; // Use full path key
        e.dataTransfer!.setData('application/json', JSON.stringify(sampleData));
        e.dataTransfer!.effectAllowed = 'copy';

        // Visual feedback
        li.style.opacity = '0.5';
      });

      li.addEventListener('dragend', () => {
        li.style.opacity = '1';
      });

      // Preview Click
      li.addEventListener('click', async (e) => {
        e.stopPropagation();

        // Active Highlight
        document.querySelectorAll('.sample-file-active').forEach(el => {
          el.classList.remove('sample-file-active');
          (el as HTMLElement).style.background = 'transparent';
          (el as HTMLElement).style.color = '#808590';
        });
        li.classList.add('sample-file-active');
        li.style.background = 'rgba(79, 210, 114, 0.1)';
        li.style.color = '#4FD272';

        // Play Audio
        if (userFiles.has(filePath)) {
          const fileOrBlob = userFiles.get(filePath);
          if (fileOrBlob) {
            try {
              if (Tone.context.state !== 'running') await Tone.start();

              const url = URL.createObjectURL(fileOrBlob);
              const player = new Tone.Player(url).toDestination();
              await Tone.loaded();
              player.start();
            } catch (err) {
              console.error("Preview Failed:", err);
            }
          }
        }
      });

      ul.appendChild(li);
    });
  }

  container.appendChild(ul);
}


// 3. Init Import with Persistence
function initImportFeature() {
  console.log("Initializing Persistent Import...");

  // Restore on Load
  restoreLibrary();

  // 5. Open/Close Browser Logic (Delegation)
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const overlay = document.getElementById('sample-browser-overlay');

    // Open Trigger
    if (target.closest('.samples-trigger-btn')) {
      console.log("[Browser] Open Triggered");
      if (overlay) {
        overlay.style.display = 'flex';
        // Animation Reset
        overlay.style.animation = 'none';
        overlay.offsetHeight;
        overlay.style.animation = 'popupFadeIn 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)';
      }
    }

    // Close Trigger
    if (target.closest('.browser-close')) {
      console.log("[Browser] Close Triggered");
      if (overlay) overlay.style.display = 'none';
    }

    // Click Outside to Close
    if (overlay && overlay.style.display === 'flex') {
      if (!target.closest('#sample-browser-overlay') && !target.closest('.samples-trigger-btn')) {
        overlay.style.display = 'none';
      }
    }

    // Import Trigger
    const importBtn = target.closest('.browser-import-btn');
    if (importBtn) {
      const input = document.getElementById('folder-input') as HTMLInputElement;
      if (input) input.click();
    }
  });

  const folderInput = document.getElementById('folder-input') as HTMLInputElement;
  if (folderInput) {
    folderInput.addEventListener('change', async (e) => {
      if (folderInput.files && folderInput.files.length > 0) {
        console.log(`[Library] Importing ${folderInput.files.length} files...`);

        toggleSpinner(true, "Saving to Library...");

        try {
          // Save to DB
          await persistenceManager.saveFiles(folderInput.files);
          console.log("[Library] Files saved to database.");

          // Restore to update UI and Registry
          await restoreLibrary();

        } catch (err) {
          console.error("Import/Save Failed:", err);
          alert("Failed to save library. Check console.");
        } finally {
          toggleSpinner(false);
        }
      }
    });
  }
}

// 4. Restore Library from DB
async function restoreLibrary() {
  toggleSpinner(true, "Restoring Library...");
  try {
    const storedFiles = await persistenceManager.getAllFiles();
    if (storedFiles && storedFiles.length > 0) {
      console.log(`[Library] Restoring ${storedFiles.length} files from DB...`);

      // Re-populate userFiles map and build tree
      userFiles.clear();
      const tree = buildNestedFileTree(storedFiles);

      const container = document.getElementById('browser-tree-content');
      if (container) {
        container.innerHTML = '';
        renderNestedTree(container, tree);
      }
      console.log("[Library] Restoration Complete.");
    } else {
      console.log("[Library] No stored files found.");
      const container = document.getElementById('browser-tree-content');
      if (container) container.innerHTML = '<div style="padding:20px; text-align:center; color:#666; font-size:12px">No samples loaded.<br>Click folder icon to import.</div>';
    }
  } catch (err) {
    console.error("Library Restore Failed:", err);
    console.warn("Library restore failed (schema mismatch?), resetting DB...", err);
    try {
      await persistenceManager.clearLibrary();
      console.log("DB Cleared to prevent startup crash.");
    } catch (clearErr) {
      console.error("Failed to clear DB:", clearErr);
    }
  } finally {
    toggleSpinner(false);
  }
}

// 5. FX Controls (Pro Level)
// 5. FX Controls (Pro Level)
// 5. FX Controls (Pro Level)
function initFXControls() {
  const container = document.querySelector('.step-seq-grid'); // Fixed: Listen on GRID, not tracks

  if (!container) {
    console.warn("FX container not found");
    return;
  }

  // Knob Drag Interaction
  container.addEventListener('mousedown', (e) => {
    const mouseEvent = e as MouseEvent;
    const knob = (mouseEvent.target as HTMLElement).closest('.fx-knob');
    if (!knob) return;

    mouseEvent.preventDefault();
    const startY = mouseEvent.clientY;

    // Get current val from style or default (remove %)
    let currentVal = parseFloat((knob as HTMLElement).style.getPropertyValue('--val').replace('%', '')) || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY; // Up is positive
      let newVal = Math.max(0, Math.min(100, currentVal + deltaY)); // 1px = 1% sensitivity sensitivity

      // Update visual
      (knob as HTMLElement).style.setProperty('--val', `${newVal}%`);

      // Toggle highlight
      if (newVal > 0) {
        knob.classList.add('active');
        // Optional: Highlight border based on track color
      } else {
        knob.classList.remove('active');
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // Keep double click for settings if needed
  container.addEventListener('dblclick', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.fx-knob')) {
      console.log("Open FX Settings");
    }
  });
}

// ============================================
// Backend Connection
// ============================================



// Legacy backend connection removed in favor of BridgeService
// function setupBackendConnection() { ... }

// Initialize
// Initialize
// [Legacy Init Block Removed - Prevent Conflict with React]

// ==========================================
// Fix: Prevent Browser Native Drop (Open File)
// ==========================================
window.addEventListener('dragover', (e) => {
  e.preventDefault();
}, false);

window.addEventListener('drop', (e) => {
  e.preventDefault();
}, false);


// ==================== LAYOUT RESIZING LOGIC ====================
// ==================== LAYOUT RESIZING LOGIC ====================
(function initLayoutResizing() {
  const init = () => {
    console.log('[AURA] Initializing Layout Resizers...');
    const leftPanel = document.getElementById('leftPanel');
    const rightPanel = document.getElementById('rightPanel');
    const bottomPanel = document.getElementById('bottomPanel');
    const resizerLeft = document.getElementById('resizerLeft');
    const resizerRight = document.getElementById('resizerRight');
    const resizerBottom = document.getElementById('resizerBottom');

    console.log('[AURA] Resizer Elements Status:', {
      left: !!leftPanel && !!resizerLeft,
      right: !!rightPanel && !!resizerRight,
      bottom: !!bottomPanel
    });

    // Load Saved State
    const savedConfig = JSON.parse(localStorage.getItem('aura-layout-config') || '{}');
    if (savedConfig.leftWidth && leftPanel) leftPanel.style.width = savedConfig.leftWidth + 'px';
    if (savedConfig.rightWidth && rightPanel) rightPanel.style.width = savedConfig.rightWidth + 'px';
    if (savedConfig.bottomHeight && bottomPanel) bottomPanel.style.height = savedConfig.bottomHeight + 'px';

    // Save State Helper
    const saveState = () => {
      const config = {
        leftWidth: leftPanel ? parseInt(leftPanel.style.width) : 280,
        rightWidth: rightPanel ? parseInt(rightPanel.style.width) : 340,
        bottomHeight: bottomPanel ? parseInt(bottomPanel.style.height) : 300
      };
      localStorage.setItem('aura-layout-config', JSON.stringify(config));
    };

    // Resizer Handler Factory
    const createResizer = (resizer: any, direction: any, target: any, isRightSide: boolean = false) => {
      if (!resizer || !target) {
        console.warn(`[AURA] Resizer or Target missing for ${isRightSide ? 'Right' : 'Left/Bottom'}`);
        return;
      }

      resizer.addEventListener('mousedown', (e: any) => {
        e.preventDefault();
        resizer.classList.add('resizing');

        const startX = e.clientX;
        const startY = e.clientY;
        // Use getBoundingClientRect for sub-pixel precision matches visual size
        const rect = target.getBoundingClientRect();
        const startWidth = rect.width;
        const startHeight = rect.height;

        console.log(`[AURA] Resize Start: ${isRightSide ? 'Right' : 'Left'} | StartW: ${startWidth}`);

        const onMouseMove = (moveEvent: any) => {
          if (direction === 'horizontal') {
            // Vertical Resizer (Changes Width)
            let newWidth;
            if (isRightSide) {
              // For right panel, moving left (negative delta) increases width
              newWidth = startWidth - (moveEvent.clientX - startX);
            } else {
              newWidth = startWidth + (moveEvent.clientX - startX);
            }

            // Constraints
            if (newWidth < 250) newWidth = 250;
            if (newWidth > 800) newWidth = 800;

            target.style.width = newWidth + 'px';
          } else {
            // Horizontal Resizer (Changes Height)
            const newHeight = startHeight - (moveEvent.clientY - startY);
            if (newHeight > 100 && newHeight < 800) {
              target.style.height = newHeight + 'px';
            }
          }

          // Force global resize event for Canvas/React re-renders
          window.dispatchEvent(new Event('resize'));
        };

        const onMouseUp = () => {
          resizer.classList.remove('resizing');
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          saveState();
          console.log('[AURA] Resize End');
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });
    };

    createResizer(resizerLeft, 'horizontal', leftPanel, false);
    createResizer(resizerRight, 'horizontal', rightPanel, true);
    createResizer(resizerBottom, 'vertical', bottomPanel, false);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init(); // Run immediately if already loaded
  }
})();


// ==================== EDIT DOCK TAB SWITCHING ====================
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.edit-dock-tab');
  const panels = document.querySelectorAll('.edit-dock-panel');

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      // 1. Update Tab UI
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 2. Switch Panel
      // Get panel name from text or data attribute if mapped. 
      // Here we assume index matching or data-panel matching.
      // HTML Structure: Tabs are [Step Seq, Piano Roll, Mixer, Audio, Sampler]
      // Panels are [step-seq, piano-roll, mixer, audio, sampler]

      // Let's rely on data-panel mapping if possible, or index.
      // But buttons don't have data-target. Let's use index.

      panels.forEach(p => p.classList.remove('active'));

      // Note: There might be more tabs than panels or vice versa?
      // "Audio" and "Sampler" are inactive/placeholders.

      const panelName = tab.textContent.trim();
      let targetPanelId = '';

      if (panelName === 'Step Seq') targetPanelId = 'step-seq';
      else if (panelName === 'Piano Roll') targetPanelId = 'piano-roll';
      else if (panelName === 'Mixer') targetPanelId = 'mixer';
      else if (panelName === 'Audio') targetPanelId = 'audio';
      else if (panelName === 'Sampler') targetPanelId = 'sampler';

      if (targetPanelId) {
        const targetPanel = document.querySelector(`.edit-dock-panel[data-panel="${targetPanelId}"]`);
        if (targetPanel) {
          targetPanel.classList.add('active');
          console.log('Switched to:', targetPanelId);
        }
      }
    });
  });
});

// ==================== REACT MOUNTING ====================
import { HeaderView } from './modules/Header/HeaderView';
import { InspirationPanel } from './modules/Inspiration/InspirationPanel';

// [CTO Fix] Safe Mount Helper (Prevent 'createRoot' Duplicate Error)
function safeMount(containerId: string, Component: React.FC | React.ComponentClass, name: string) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[Main] ${name} root element (#${containerId}) not found`);
    return;
  }

  try {
    // Check if root already exists to prevent crash
    if ((container as any)._reactRoot) {
      console.log(`[Main] ${name} already mounted (HMR/Reload detected). Updating...`);
      (container as any)._reactRoot.render(React.createElement(Component));
      return;
    }

    const root = createRoot(container);
    (container as any)._reactRoot = root; // Store root ref
    root.render(React.createElement(Component));
    console.log(`[AURA] ${name} mounted successfully`);

  } catch (error) {
    console.error(`[Main] Failed to mount ${name}:`, error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[AURA] DOM Content Loaded - Starting Mount Process');

  // 1. Mount Header (Top Panel)
  safeMount('header-root', HeaderView, 'Header');

  // 2. Mount Inspiration Panel (Left Panel)
  safeMount('generator-root', InspirationPanel, 'InspirationPanel');

  // 3. Mount AI Copilot (Right Panel)
  safeMount('copilot-root', Copilot, 'AI Copilot');

  // 4. Mount Timeline View (Center Panel)
  safeMount('timeline-root', TimelineView as any, 'Timeline View');
});
