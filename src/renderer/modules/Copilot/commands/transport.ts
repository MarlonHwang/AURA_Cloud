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
     * AudioEngine 시작 및 타임라인 진행
     */
    async play(): Promise<string> {
        const audioStore = useAudioStore.getState();
        const timelineStore = useTimelineStore.getState();
        const mode = timelineStore.playbackMode;

        // 1. Bridge Command (Python 엔진 동기화)
        bridge.sendCommand('/transport/play', { mode });

        // 2. Client Engine Control
        if (mode === 'PATTERN') {
            timelineStore.setIsPlaying(true); // 패턴 모드: 타임라인만 구동
            return "▶ Playing Pattern Mode";
        } else {
            audioStore.play(); // 송 모드: Tone.js 엔진 구동
            timelineStore.setIsPlaying(true);
            return "▶ Playing Song Mode";
        }
    }

    /**
     * 정지 (Stop)
     * 엔진 정지 및 타임라인 리셋
     */
    async stop(): Promise<string> {
        const audioStore = useAudioStore.getState();
        const timelineStore = useTimelineStore.getState();

        // 1. Bridge Command
        bridge.sendCommand('/transport/stop', {});

        // 2. Client Engine Control
        audioStore.stop();
        timelineStore.setIsPlaying(false);

        return "⏹ Stopped.";
    }

    /**
     * 일시정지 (Pause)
     */
    async pause(): Promise<string> {
        const audioStore = useAudioStore.getState();
        const timelineStore = useTimelineStore.getState();

        bridge.sendCommand('/transport/stop', {}); // Pause 커맨드 부재로 Stop 대체
        audioStore.pause();
        timelineStore.setIsPlaying(false);

        return "⏸ Paused.";
    }
}
