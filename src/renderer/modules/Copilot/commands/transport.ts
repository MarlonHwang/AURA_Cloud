import { bridge } from '../../../services/BridgeService';
import { useAudioStore } from '../../../stores/audioStore';
import { useTimelineStore } from '../../Timeline/store/useTimelineStore';

/**
 * Transport Control Module
 * 실제 오디오 엔진(AudioStore) 및 타임라인(TimelineStore) 제어
 */
export class TransportCommands {

    /**
     * 재생 (Play)
     */
    async play(): Promise<string> {
        const audioStore = useAudioStore.getState();
        const timelineStore = useTimelineStore.getState();
        const mode = timelineStore.playbackMode;

        // 1. Bridge Notify
        bridge.sendCommand('/transport/play', { mode });

        // 2. Client Engine Control
        // Pattern Mode는 State 변경만으로 main.ts가 감지하여 startSequencer() 실행
        // Song Mode는 명시적 Play가 필요할 수 있으나, main.ts 로직 통일성을 위해 State 우선 변경
        if (mode === 'PATTERN') {
            timelineStore.setIsPlaying(true);
            return "▶ Playing Pattern Mode";
        } else {
            // Song Mode는 오디오 엔진 직접 구동 + UI 동기화
            audioStore.play();
            timelineStore.setIsPlaying(true);
            return "▶ Playing Song Mode";
        }
    }

    /**
     * 정지 (Stop) - [Fix applied]
     * 원인: audioStore.stop()을 먼저 호출하면 main.ts의 구독 로직이 '이미 정지됨'으로 판단하여
     *       stopSequencer() 등 필수 정리 함수를 실행하지 않는 문제 발생.
     * 해결: setIsPlaying(false)를 먼저 호출하여 main.ts가 상태 변화를 감지하고 
     *       정상적인 종료 절차(Sequencer 정리 -> Engine Stop)를 밟도록 유도함.
     */
    async stop(): Promise<string> {
        const timelineStore = useTimelineStore.getState();

        // 1. Bridge Notify
        bridge.sendCommand('/transport/stop', {});

        // 2. Client Engine Control (State First Approach)
        // Timeline Store 상태를 끄면 -> main.ts의 subscriber가 감지하고 -> stopSequencer() / engine.stop() 실행
        timelineStore.setIsPlaying(false);

        return "⏹ Stopped.";
    }

    /**
     * 일시정지 (Pause)
     */
    async pause(): Promise<string> {
        const audioStore = useAudioStore.getState();
        const timelineStore = useTimelineStore.getState();

        bridge.sendCommand('/transport/stop', {});
        audioStore.pause();
        timelineStore.setIsPlaying(false);

        return "⏸ Paused.";
    }
}
