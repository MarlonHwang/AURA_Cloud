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
  setupStepCountToggle();
  setupKitSelector();
  setupKitMorphButton();
  setupAddTrackButton();
  setupSyncScroll();

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
 * Kit Morph 버튼 설정
 */
function setupKitMorphButton(): void {
  const morphBtn = document.querySelector('.kit-morph-btn');
  const kitSelect = document.getElementById('kit-select') as HTMLSelectElement;

  if (!morphBtn) {
    console.warn('[AURA] Kit morph button not found');
    return;
  }

  morphBtn.addEventListener('click', async () => {
    // 오디오 초기화
    if (!isAudioInitialized) {
      await initializeAudio();
    }

    // 모핑 애니메이션 시작
    morphBtn.classList.add('morphing');
    updateStatus('Morphing kit...', '#FFA500');

    try {
      // 다음 킷으로 모프
      await soundLibrary.morphToNextKit();

      // UI 업데이트
      const preset = soundLibrary.currentDrumKitPreset;
      updateStatus(`Kit: ${preset?.name || 'Unknown'}`, '#4FD272');

      // Select 박스도 업데이트 (가능한 경우)
      if (kitSelect && preset) {
        // 역방향 매핑으로 select 값 찾기
        const reverseMap: Record<string, string> = {
          'trap-808': 'synth',
          'sample-808': 'tr808',
          'sample-909': 'tr909',
          'sample-acoustic': 'acoustic',
          'sample-electronic': 'electronic',
        };
        const selectValue = reverseMap[preset.id];
        if (selectValue) {
          kitSelect.value = selectValue;
        }
      }

      console.log(`[AURA] Morphed to: ${preset?.name}`);
    } catch (error) {
      console.error('[AURA] Kit morph failed:', error);
      updateStatus('Morph failed!', '#FF6B6B');
    } finally {
      // 애니메이션 종료
      setTimeout(() => {
        morphBtn.classList.remove('morphing');
      }, 500);
    }
  });

  console.log('[AURA] Kit morph button configured');
}

/**
 * 16/32 스텝 토글 설정
 *
 * 핵심: justify-content를 절대 변경하지 않음!
 * 항상 flex-start 상태에서 marginLeft로 위치 조정
 */
function setupStepCountToggle(): void {
  const toggleBtn = document.querySelector('.step-count-toggle');
  const stepValue = toggleBtn?.querySelector('.step-count-value');
  const grid = document.querySelector('.step-seq-grid');
  const wrapper = document.querySelector('.step-seq-wrapper') as HTMLElement;
  const container = document.querySelector('.step-seq-container') as HTMLElement;

  if (!toggleBtn || !stepValue || !grid || !wrapper || !container) {
    console.warn('[AURA] Step count toggle elements not found');
    return;
  }

  // 초기화: 항상 flex-start 사용, 중앙 정렬은 marginLeft로 계산
  function initializePosition(): void {
    wrapper.style.justifyContent = 'flex-start';
    const wrapperWidth = wrapper.clientWidth;
    const containerWidth = container.offsetWidth;
    const centeredMargin = Math.max(0, (wrapperWidth - containerWidth) / 2);
    container.style.marginLeft = `${centeredMargin}px`;
  }

  // 페이지 로드 시 초기 위치 설정
  requestAnimationFrame(() => {
    initializePosition();
  });

  // 윈도우 리사이즈 시 16스텝 모드면 중앙 재계산
  window.addEventListener('resize', () => {
    if (currentStepMode === 16) {
      const wrapperWidth = wrapper.clientWidth;
      const containerWidth = container.offsetWidth;
      const centeredMargin = Math.max(0, (wrapperWidth - containerWidth) / 2);
      container.style.marginLeft = `${centeredMargin}px`;
    }
  });

  let savedLeftPosition: number | null = null;

  toggleBtn.addEventListener('click', () => {
    if (currentStepMode === 16) {
      // 16 → 32 확장
      // 현재 marginLeft 값을 그대로 저장 (이미 flex-start 상태)
      savedLeftPosition = parseFloat(container.style.marginLeft) || 0;

      // 셀 추가 (위치는 이미 고정되어 있으므로 flicker 없음)
      expandTo32Steps();
      currentStepMode = 32;
      TOTAL_STEPS = 32;
      stepValue.textContent = '16';  // 32스텝 모드에서는 "16 STEPS" 표시 (축소 가능)
      toggleBtn.classList.add('expanded');
      grid.classList.add('steps-32');
    } else {
      // 32 → 16 축소
      // 먼저 축소 후 중앙 위치 계산
      const wrapperWidth = wrapper.clientWidth;

      // 셀 제거
      collapseTo16Steps();
      currentStepMode = 16;
      TOTAL_STEPS = 16;
      stepValue.textContent = '32';  // 16스텝 모드에서는 "32 STEPS" 표시 (확장 가능)
      toggleBtn.classList.remove('expanded');
      grid.classList.remove('steps-32');

      // 애니메이션 완료 후 중앙 재계산 (200ms는 remove 애니메이션 시간)
      setTimeout(() => {
        const containerWidth = container.offsetWidth;
        const centeredMargin = Math.max(0, (wrapperWidth - containerWidth) / 2);
        container.style.marginLeft = `${centeredMargin}px`;
      }, 210);

      savedLeftPosition = null;
    }

    console.log(`[AURA] Step mode changed to ${currentStepMode}`);
  });

  console.log('[AURA] Step count toggle configured');
}

/**
 * 16스텝에서 32스텝으로 확장
 */
function expandTo32Steps(): void {
  const rows = document.querySelectorAll('.step-seq-row');
  const ruler = document.querySelector('.step-seq-ruler');

  // 상단 룰러에 5, 6, 7, 8 비트 추가
  if (ruler) {
    for (let beat = 5; beat <= 8; beat++) {
      const rulerBeat = document.createElement('div');
      rulerBeat.className = 'step-seq-ruler-beat new-beat';
      rulerBeat.style.animationDelay = `${(beat - 5) * 0.05}s`;
      rulerBeat.innerHTML = `
        <div class="ruler-tick"><span class="beat-label">${beat}</span></div>
        <div class="ruler-tick"></div>
        <div class="ruler-tick"></div>
        <div class="ruler-tick"></div>
      `;
      ruler.appendChild(rulerBeat);
    }
  }

  // 각 트랙에 beat-group 단위로 셀 추가
  rows.forEach(row => {
    const trackName = row.getAttribute('data-track') as DrumPart;
    const color = row.getAttribute('data-color') || '#4FD272';

    // 패턴 데이터 확장 (16~31번 스텝 추가)
    if (patterns[trackName] && patterns[trackName].length === 16) {
      for (let i = 16; i < 32; i++) {
        patterns[trackName].push({ active: false, velocity: 1 });
      }
    }

    // 4개의 beat-group 추가 (각각 4셀씩)
    for (let groupIndex = 0; groupIndex < 4; groupIndex++) {
      const beatGroup = document.createElement('div');
      beatGroup.className = 'step-beat-group new-beat-group';
      beatGroup.style.animationDelay = `${groupIndex * 0.05}s`;

      // 각 그룹에 4개의 셀 추가
      for (let cellIndex = 0; cellIndex < 4; cellIndex++) {
        const stepIndex = 16 + (groupIndex * 4) + cellIndex;
        const cell = document.createElement('div');
        cell.className = 'step-cell';
        cell.setAttribute('data-step', stepIndex.toString());

        // 클릭 이벤트
        cell.addEventListener('click', async () => {
          if (!isAudioInitialized) {
            await initializeAudio();
          }

          if (patterns[trackName]) {
            patterns[trackName][stepIndex].active = !patterns[trackName][stepIndex].active;

            if (patterns[trackName][stepIndex].active) {
              cell.classList.add('active');
              soundLibrary.triggerDrum(trackName);
            } else {
              cell.classList.remove('active');
            }
          }

          console.log(`[AURA] Step ${stepIndex + 1} toggled for ${trackName}:`, patterns[trackName]?.[stepIndex]?.active);
        });

        beatGroup.appendChild(cell);
      }

      row.appendChild(beatGroup);
    }
  });
}

/**
 * 32스텝에서 16스텝으로 축소
 */
function collapseTo16Steps(): void {
  const rows = document.querySelectorAll('.step-seq-row');
  const ruler = document.querySelector('.step-seq-ruler');

  // 상단 룰러에서 5, 6, 7, 8 비트 제거
  if (ruler) {
    const rulerBeats = ruler.querySelectorAll('.step-seq-ruler-beat');
    rulerBeats.forEach((beat, index) => {
      if (index >= 4) {
        beat.classList.add('removing');
        setTimeout(() => {
          beat.remove();
        }, 200);
      }
    });
  }

  // 각 트랙에서 추가된 beat-group 제거
  rows.forEach(row => {
    const trackName = row.getAttribute('data-track') as DrumPart;

    // beat-group 중 뒤의 4개 제거 (인덱스 4~7)
    const beatGroups = row.querySelectorAll('.step-beat-group');
    beatGroups.forEach((group, index) => {
      if (index >= 4) {
        group.classList.add('removing');
        setTimeout(() => {
          group.remove();
        }, 200);
      }
    });

    // 패턴 데이터 축소 (16~31번 스텝 제거)
    if (patterns[trackName] && patterns[trackName].length === 32) {
      patterns[trackName].length = 16;
    }
  });

  // 현재 스텝이 16 이상이면 리셋
  if (currentStep >= 16) {
    currentStep = 0;
  }
}

// ============================================
// Add Track Functionality
// ============================================

/**
 * Add Track 버튼 설정
 */
function setupAddTrackButton(): void {
  const addTrackBtn = document.querySelector('.step-seq-add-track');

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

  // Create grid row
  const gridRow = createGridRow(trackId, trackColor);
  gridContainer.appendChild(gridRow);

  // Initialize pattern data for new track
  (patterns as any)[trackId] = Array.from({ length: TOTAL_STEPS }, () => ({ active: false, velocity: 1 }));

  // Setup click events for the new row
  setupNewRowEvents(gridRow, trackId);

  // Setup header click to trigger sound
  setupHeaderClickEvent(trackHeader, trackId);

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

  return row;
}

/**
 * 새 그리드 행에 이벤트 설정
 */
function setupNewRowEvents(row: HTMLElement, trackId: string): void {
  const cells = row.querySelectorAll('.step-cell');

  cells.forEach((cell) => {
    const stepIndex = parseInt(cell.getAttribute('data-step') || '0', 10);

    cell.addEventListener('click', async () => {
      if (!isAudioInitialized) {
        await initializeAudio();
      }

      const trackPatterns = (patterns as any)[trackId];
      if (trackPatterns) {
        trackPatterns[stepIndex].active = !trackPatterns[stepIndex].active;

        if (trackPatterns[stepIndex].active) {
          cell.classList.add('active');
          // Trigger a percussion sound for custom tracks
          soundLibrary.triggerDrum('perc');
        } else {
          cell.classList.remove('active');
        }
      }

      console.log(`[AURA] Step ${stepIndex + 1} toggled for ${trackId}:`, trackPatterns?.[stepIndex]?.active);
    });
  });
}

/**
 * 트랙 헤더 클릭 이벤트 설정
 */
function setupHeaderClickEvent(header: HTMLElement, trackId: string): void {
  header.addEventListener('click', async (e) => {
    const target = e.target as HTMLElement;

    // Ignore Smart Rand button clicks
    if (target.closest('.smart-rand-btn')) {
      return;
    }

    if (!isAudioInitialized) {
      await initializeAudio();
    }

    // Trigger perc sound for custom tracks
    soundLibrary.triggerDrum('perc');

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
// Add CSS for current step highlight
// ============================================

function injectStyles(): void {
  const style = document.createElement('style');

  // Generate CSS for all track colors (including new ones)
  const colorStyles = TRACK_COLORS.map(color => `
    .step-seq-row[data-color="${color}"] .step-cell {
      border-color: ${color}33;
    }
    .step-seq-row[data-color="${color}"] .step-cell.active {
      background: ${color};
      border-color: ${color};
      box-shadow: 0 0 8px ${color}80;
    }
    .step-seq-row[data-color="${color}"] .step-cell.current::before {
      background: ${color}40;
    }
  `).join('\n');


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
