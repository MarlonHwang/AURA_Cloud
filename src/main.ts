/**
 * AURA Cloud Studio - Main Entry Point
 *
 * Vite + TypeScript 기반 애플리케이션 진입점
 * Step Sequencer + Tone.js 오디오 엔진
 */

import * as Tone from 'tone';
import { audioEngine, soundLibrary, DRUM_KIT_PRESETS } from './engine';
import type { DrumPart } from './types/sound.types';

// ============================================
// Types & Constants
// ============================================

interface StepPattern {
  active: boolean;
  velocity: number;
}

type TrackPatterns = Record<DrumPart, StepPattern[]>;

const TOTAL_STEPS = 16;
const DRUM_TRACKS: { name: DrumPart; displayName: string; color: string }[] = [
  { name: 'kick', displayName: 'Kick', color: '#FF6B6B' },
  { name: 'snare', displayName: 'Snare', color: '#4DFFFF' },
  { name: 'hihat', displayName: 'Hi-Hat', color: '#4FD272' },
  { name: 'perc', displayName: 'Perc', color: '#D45FFF' },
];

// ============================================
// State
// ============================================

let isAudioInitialized = false;
let isPlaying = false;
let currentStep = 0;
let sequenceId: number | null = null;

// 패턴 데이터: 각 트랙별 16스텝
const patterns: TrackPatterns = {
  kick: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1 })),
  snare: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1 })),
  hihat: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1 })),
  clap: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1 })),
  tom: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1 })),
  crash: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1 })),
  ride: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1 })),
  perc: Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1 })),
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
  if (statusEl) {
    statusEl.textContent = text;
    statusEl.style.color = color;
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
// Step Sequencer Logic
// ============================================

/**
 * 시퀀서 스케줄링 시작
 */
function startSequencer(): void {
  if (sequenceId !== null) return;

  const transport = Tone.getTransport();

  // 16n = 16분음표 간격으로 스케줄
  sequenceId = transport.scheduleRepeat((time) => {
    // 현재 스텝의 모든 트랙 확인
    DRUM_TRACKS.forEach(track => {
      const pattern = patterns[track.name];
      if (pattern[currentStep]?.active) {
        // 소리 트리거
        soundLibrary.triggerDrum(track.name, time, pattern[currentStep].velocity);
      }
    });

    // UI 하이라이트 업데이트 (메인 스레드에서)
    Tone.getDraw().schedule(() => {
      highlightCurrentStep(currentStep);
    }, time);

    // 다음 스텝으로
    currentStep = (currentStep + 1) % TOTAL_STEPS;
  }, '16n') as unknown as number;

  transport.start();
  isPlaying = true;

  console.log('[AURA] Sequencer started');
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
  isPlaying = false;

  // 하이라이트 제거
  clearAllHighlights();

  console.log('[AURA] Sequencer stopped');
}

/**
 * 현재 스텝 하이라이트
 */
function highlightCurrentStep(step: number): void {
  // 이전 하이라이트 제거
  document.querySelectorAll('.step-cell.current').forEach(cell => {
    cell.classList.remove('current');
  });

  // 현재 스텝 하이라이트
  document.querySelectorAll(`.step-cell[data-step="${step}"]`).forEach(cell => {
    cell.classList.add('current');
  });
}

/**
 * 모든 하이라이트 제거
 */
function clearAllHighlights(): void {
  document.querySelectorAll('.step-cell.current').forEach(cell => {
    cell.classList.remove('current');
  });
}

// ============================================
// UI Setup
// ============================================

function setupUI(): void {
  setupPlayButton();
  setupStopButton();
  setupStepSequencerGrid();
  setupEditDockTabs();
  setupBpmControl();
  setupKeyboardShortcuts();

  console.log('[AURA] UI Setup Complete');
}

/**
 * 키보드 단축키 설정
 */
function setupKeyboardShortcuts(): void {
  document.addEventListener('keydown', async (e) => {
    // 입력 필드에서는 단축키 무시
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.code) {
      case 'Space':
        e.preventDefault(); // 스크롤 방지
        await togglePlayback();
        break;
    }
  });

  console.log('[AURA] Keyboard shortcuts configured (Space = Play/Stop)');
}

/**
 * 재생/정지 토글
 */
async function togglePlayback(): Promise<void> {
  // 오디오 초기화
  if (!isAudioInitialized) {
    const success = await initializeAudio();
    if (!success) return;
  }

  const playBtn = document.querySelector('.play-btn');

  if (isPlaying) {
    // 정지
    stopSequencer();
    playBtn?.classList.remove('playing');
    updateStatus('Stopped', '#888');
  } else {
    // 재생
    startSequencer();
    playBtn?.classList.add('playing');
    updateStatus('Playing...', '#4FD272');
  }

  console.log('[AURA] Playback toggled, isPlaying:', isPlaying);
}

/**
 * Play 버튼 설정
 */
function setupPlayButton(): void {
  const playBtn = document.getElementById('play-btn') || document.querySelector('.play-btn');

  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      await togglePlayback();
    });

    console.log('[AURA] Play button configured');
  }
}

/**
 * Stop 버튼 설정
 */
function setupStopButton(): void {
  const stopBtn = document.querySelector('.stop-btn');

  if (stopBtn) {
    stopBtn.addEventListener('click', async () => {
      if (!isAudioInitialized) {
        await initializeAudio();
      }

      stopSequencer();

      const playBtn = document.querySelector('.play-btn');
      if (playBtn) {
        playBtn.classList.remove('playing');
      }

      // 스텝을 처음으로 리셋
      currentStep = 0;
      clearAllHighlights();

      updateStatus('Stopped', '#888');
      console.log('[AURA] Stop button clicked');
    });

    console.log('[AURA] Stop button configured');
  }
}

/**
 * Step Sequencer 그리드 이벤트 설정
 */
function setupStepSequencerGrid(): void {
  const rows = document.querySelectorAll('.step-seq-row');

  rows.forEach(row => {
    const trackName = row.getAttribute('data-track') as DrumPart;
    const color = row.getAttribute('data-color') || '#4FD272';
    const cells = row.querySelectorAll('.step-cell');

    cells.forEach((cell) => {
      // data-step 속성에서 스텝 인덱스 가져오기 (HTML에서 이미 설정됨)
      const stepIndex = parseInt(cell.getAttribute('data-step') || '0', 10);

      // HTML의 기존 active 상태를 패턴 데이터에 동기화
      if (cell.classList.contains('active')) {
        if (patterns[trackName]) {
          patterns[trackName][stepIndex].active = true;
        }
      }

      // 패턴 데이터와 UI 동기화 (CSS 클래스만 사용)
      if (patterns[trackName]?.[stepIndex]?.active) {
        cell.classList.add('active');
      }

      // 클릭 이벤트
      cell.addEventListener('click', async () => {
        // 오디오 초기화 (첫 클릭 시)
        if (!isAudioInitialized) {
          await initializeAudio();
        }

        // 패턴 토글
        if (patterns[trackName]) {
          patterns[trackName][stepIndex].active = !patterns[trackName][stepIndex].active;

          if (patterns[trackName][stepIndex].active) {
            cell.classList.add('active');
            // 셀 활성화 시 소리 재생
            soundLibrary.triggerDrum(trackName);
          } else {
            cell.classList.remove('active');
          }
        }

        console.log(`[AURA] Step ${stepIndex + 1} toggled for ${trackName}:`, patterns[trackName]?.[stepIndex]?.active);
      });
    });
  });

  // 트랙 이름 클릭 시 소리 재생
  setupDrumPadTriggers();

  console.log('[AURA] Step Sequencer grid configured');
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

        soundLibrary.triggerDrum(trackName);

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
 * Edit Dock 탭 전환
 */
function setupEditDockTabs(): void {
  const tabs = document.querySelectorAll('.edit-dock-tab');
  const panels = document.querySelectorAll('.edit-dock-panel');

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active', 'focused'));
      tab.classList.add('active', 'focused');

      panels.forEach(p => p.classList.remove('active'));
      if (panels[index]) {
        panels[index].classList.add('active');
      }
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

// ============================================
// Add CSS for current step highlight
// ============================================

function injectStyles(): void {
  const style = document.createElement('style');
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
  `;
  document.head.appendChild(style);
}

// ============================================
// Socket.IO Connection (Python Backend)
// ============================================

function setupBackendConnection(): void {
  const BACKEND_URL = 'http://localhost:5000';

  import('socket.io-client').then(({ io }) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnectionAttempts: 3
    });

    socket.on('connect', () => {
      console.log('[AURA] Connected to Python backend');
    });

    socket.on('disconnect', () => {
      console.log('[AURA] Disconnected from Python backend');
    });

    socket.on('connect_error', (error) => {
      console.error('[AURA] Backend connection error:', error.message);
    });

    (window as any).AURABackend = {
      socket,
      emit: (event: string, data: any) => socket.emit(event, data)
    };
  }).catch(err => {
    console.warn('[AURA] Socket.IO not available:', err.message);
  });
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
    // SynthDrums에서 실시간 웨이브폼 데이터 가져오기
    const synthDrums = soundLibrary.getSynthDrums();
    let waveformData: Float32Array | null = null;

    if (synthDrums) {
      waveformData = synthDrums.getWaveformData();
    }

    const points: string[] = [];

    if (waveformData && waveformData.length > 0) {
      // 실제 오디오 데이터로 웨이브폼 그리기
      const bufferLength = waveformData.length;

      for (let i = 0; i < bufferLength; i++) {
        const x = (i / bufferLength) * 100;
        // 오디오 데이터는 -1 ~ 1 범위, 50을 중심으로 스케일링
        const amplitude = waveformData[i] * 40; // 진폭 스케일
        const y = 50 - amplitude; // 위쪽이 양수

        points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
      }
    } else {
      // 오디오 데이터가 없으면 평평한 라인
      for (let i = 0; i <= 50; i++) {
        const x = (i / 50) * 100;
        points.push(`${x},50`);
      }
    }

    // SVG path 생성 (아래쪽 채우기 포함)
    if (points.length > 0) {
      const pathD = `M0,100 L0,${points[0].split(',')[1]} ` +
                    points.map(p => `L${p}`).join(' ') +
                    ` L100,100 Z`;
      wavePath.setAttribute('d', pathD);
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
  console.log('[AURA] DOM Ready');

  // CSS 주입
  injectStyles();

  // UI 설정
  setupUI();

  // 웨이브 비주얼라이저 시작
  animateWave();

  // 백엔드 연결
  setupBackendConnection();

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
