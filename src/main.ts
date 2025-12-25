/**
 * AURA Cloud Studio - Main Entry Point
 *
 * Vite + TypeScript 기반 애플리케이션 진입점
 */

import { audioEngine, soundLibrary, DRUM_KIT_PRESETS } from './engine';
import type { DrumPart } from './types/sound.types';

// ============================================
// Engine Initialization
// ============================================

console.log('[AURA] Main.ts loaded');
console.log('[AURA] Available Drum Kits:', DRUM_KIT_PRESETS.map(k => k.name));

/**
 * 오디오 엔진 초기화 (사용자 제스처 필요)
 */
async function initializeAudio(): Promise<void> {
  try {
    await audioEngine.initialize({ bpm: 120 });
    console.log('[AURA] Audio Engine initialized');

    // 기본 드럼킷 로드
    await soundLibrary.loadDrumKit('trap-808');
    console.log('[AURA] Default drum kit loaded:', soundLibrary.currentDrumKitPreset?.name);
  } catch (error) {
    console.error('[AURA] Failed to initialize audio:', error);
  }
}

// ============================================
// UI Event Handlers
// ============================================

/**
 * DOM 초기화
 */
function setupUI(): void {
  // Edit Dock Tab Switching
  setupEditDockTabs();

  // Step Sequencer Grid
  setupStepSequencer();

  // Drum Pad Triggers (트랙 이름 클릭)
  setupDrumPadTriggers();

  // Transport Controls
  setupTransportControls();

  console.log('[AURA] UI Setup Complete');
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
 * Step Sequencer 그리드 설정
 */
function setupStepSequencer(): void {
  const rows = document.querySelectorAll('.step-seq-row');

  rows.forEach(row => {
    const cells = row.querySelectorAll('.step-seq-cell');
    const trackName = row.getAttribute('data-track') as DrumPart;
    const color = row.getAttribute('data-color') || '#4FD272';

    cells.forEach((cell, stepIndex) => {
      cell.addEventListener('click', () => {
        cell.classList.toggle('active');

        if (cell.classList.contains('active')) {
          (cell as HTMLElement).style.backgroundColor = color;
          (cell as HTMLElement).style.boxShadow = `0 0 10px ${color}40`;
        } else {
          (cell as HTMLElement).style.backgroundColor = '';
          (cell as HTMLElement).style.boxShadow = '';
        }

        console.log(`[AURA] Step ${stepIndex + 1} toggled for ${trackName}`);
      });
    });
  });
}

/**
 * 드럼 패드 트리거 (트랙 이름 클릭 시 소리 재생 + 킷 변경)
 */
function setupDrumPadTriggers(): void {
  const trackHeaders = document.querySelectorAll('.step-seq-track-header');

  trackHeaders.forEach(header => {
    const trackName = header.getAttribute('data-track') as DrumPart;
    const nameElement = header.querySelector('.step-seq-track-name');

    if (nameElement && trackName) {
      // 클릭 시 소리 재생
      nameElement.addEventListener('click', async (e) => {
        e.stopPropagation();

        // 오디오 컨텍스트가 초기화되지 않았으면 초기화
        if (!audioEngine.isInitialized) {
          await initializeAudio();
        }

        // 드럼 트리거
        soundLibrary.triggerDrum(trackName);

        // 시각적 피드백
        const el = nameElement as HTMLElement;
        el.style.transform = 'scale(1.1)';
        el.style.textShadow = `0 0 10px ${el.style.color || '#fff'}`;
        setTimeout(() => {
          el.style.transform = '';
          el.style.textShadow = '';
        }, 100);

        console.log(`[AURA] Triggered: ${trackName}`);
      });

      // 더블클릭 시 다음 킷으로 모프
      nameElement.addEventListener('dblclick', async (e) => {
        e.stopPropagation();

        const nextKitId = await soundLibrary.morphToNextKit();
        const preset = soundLibrary.currentDrumKitPreset;

        console.log(`[AURA] Kit Morphed to: ${preset?.name}`);

        // TODO: UI에 현재 킷 이름 표시 업데이트
      });
    }
  });
}

/**
 * Transport 컨트롤 설정
 */
function setupTransportControls(): void {
  const playBtn = document.querySelector('.transport-btn[title="Play"]');
  const stopBtn = document.querySelector('.transport-btn[title="Stop"]');

  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      if (!audioEngine.isInitialized) {
        await initializeAudio();
      }
      audioEngine.play();
      console.log('[AURA] Transport: Play');
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      audioEngine.stop();
      console.log('[AURA] Transport: Stop');
    });
  }
}

// ============================================
// Socket.IO Connection (Python Backend)
// ============================================

/**
 * Python 백엔드 연결
 */
function setupBackendConnection(): void {
  const BACKEND_URL = 'http://localhost:5000';

  // Socket.IO는 npm 패키지로 import
  import('socket.io-client').then(({ io }) => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnectionAttempts: 3
    });

    socket.on('connect', () => {
      console.log('[AURA] Connected to Python backend');
      updateEngineStatus('connected', 'Engine Ready');
    });

    socket.on('disconnect', () => {
      console.log('[AURA] Disconnected from Python backend');
      updateEngineStatus('error', 'Disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('[AURA] Backend connection error:', error);
      updateEngineStatus('error', 'Engine Offline');
    });

    // 전역에 노출
    (window as any).AURABackend = {
      socket,
      emit: (event: string, data: any) => socket.emit(event, data)
    };
  }).catch(err => {
    console.warn('[AURA] Socket.IO not available:', err);
  });
}

/**
 * 엔진 상태 표시 업데이트
 */
function updateEngineStatus(status: string, text: string): void {
  const indicator = document.getElementById('engineStatusIndicator');
  const statusText = document.getElementById('engineStatusText');

  if (indicator) {
    indicator.className = 'engine-status-indicator ' + status;
  }
  if (statusText) {
    statusText.textContent = text;
  }
}

// ============================================
// App Bootstrap
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('[AURA] DOM Ready');

  setupUI();
  setupBackendConnection();

  console.log('[AURA] Engine Connected');
});

// 전역 API 노출 (디버깅용)
(window as any).AURA = {
  audioEngine,
  soundLibrary,
  DRUM_KIT_PRESETS,
  initializeAudio
};
