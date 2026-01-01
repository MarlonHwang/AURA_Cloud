import { bridge } from '../../../services/BridgeService';

/**
 * Transport Control Module
 * 재생, 정지 기본 제어 담당
 */
export class TransportCommands {

    /**
     * 재생 (Play)
     * Python Backend에 '/transport/play' 명령 전송
     */
    async play(): Promise<string> {
        bridge.sendCommand('/transport/play', { mode: 'PATTERN' }); // 기본값: 패턴 모드
        return "▶ Playing Pattern...";
    }

    /**
     * 정지 (Stop)
     * Python Backend에 '/transport/stop' 명령 전송
     */
    async stop(): Promise<string> {
        bridge.sendCommand('/transport/stop', {});
        return "⏹ Stopped.";
    }

    /**
     * 일시정지 (Pause)
     */
    async pause(): Promise<string> {
        // 현재 Python엔진은 Pause가 Stop과 유사하게 동작할 수 있음 (추후 구현)
        bridge.sendCommand('/transport/stop', {});
        return "⏸ Paused.";
    }
}
