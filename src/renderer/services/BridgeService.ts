// src/renderer/services/BridgeService.ts
import { io, Socket } from 'socket.io-client';

// Singleton Pattern으로 구현하여 앱 어디서든 하나의 통신선을 공유한다.
class BridgeService {
    private socket: Socket | null = null;
    private static instance: BridgeService;

    public static getInstance(): BridgeService {
        if (!BridgeService.instance) {
            BridgeService.instance = new BridgeService();
        }
        return BridgeService.instance;
    }

    // 연결 시도 (Connect)
    // src/python/server.py (Flask/SocketIO)와 연결된다.
    public connect() {
        if (this.socket) return;

        // Python Engine Port: 5000 (기본값)
        this.socket = io('http://localhost:5000', {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true
        });

        this.setupListeners();
    }

    // 기본 리스너 (Listeners)
    private setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('%c🟢 [Bridge] Python Engine Connected!', 'color: #B5D948; font-weight: bold; font-size: 12px;');
        });

        this.socket.on('disconnect', () => {
            console.warn('%c🔴 [Bridge] Engine Disconnected', 'color: #FF4D4D; font-weight: bold;');
        });
    }

    // 명령 전송 (Send Command)
    // 예: bridge.sendCommand('/track/volume', { trackId: 1, value: 0.8 })
    public sendCommand(address: string, payload: any) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('command', { address, payload });
        } else {
            console.warn('[Bridge] Cannot send command. Engine not connected.');
        }
    }
}

export const bridge = BridgeService.getInstance();
