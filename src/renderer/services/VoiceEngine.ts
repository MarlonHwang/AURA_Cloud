// src/renderer/services/VoiceEngine.ts (Optimized by CTO Gemini)

import * as tf from '@tensorflow/tfjs';
import * as speechCommands from '@tensorflow-models/speech-commands';
import { audioEngine } from './audio/AudioEngine';
import { speechService } from './SpeechService';

export class VoiceEngine {
    private recognizer: speechCommands.SpeechCommandRecognizer | null = null;
    private isListening: boolean = false;
    private modelId: string = 'aura-voice-id-unicorn-v5-modern';
    public isLoaded: boolean = false;

    // Status Callbacks
    // Status Callbacks
    private onStatusChange: ((status: string) => void) | null = null;
    private onWakeWordDetected: (() => void) | null = null;
    public onStateChange: ((isActive: boolean) => void) | null = null; // [CTO Added] for UI Sync

    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private dataArray: Uint8Array | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private currentStream: MediaStream | null = null;

    constructor() {
        console.log('[VoiceEngine] Initializing UNICORN Engine...');
    }

    private updateStatus(msg: string) {
        if (this.onStatusChange) this.onStatusChange(msg);
    }

    public setCallbacks(onStatus: (status: string) => void, onWakeWord: () => void) {
        this.onStatusChange = onStatus;
        this.onWakeWordDetected = onWakeWord;
    }

    private initPromise: Promise<void> | null = null;

    public async initialize() {
        if (this.recognizer) return;

        // [CTO Fix] Ensure Audio is Awake
        if (this.audioContext?.state === 'suspended') await this.audioContext.resume();

        this.initPromise = (async () => {
            console.log(`[VoiceEngine] TFJS Version: ${tf.version.tfjs}`);

            // ★ [CTO FIX] SKIP UNICORN INIT (Manual Mode)
            console.log('[VoiceEngine] Skipped Unicorn Init (Manual Mode)');
            // this.updateStatus(`Initializing 'Marvin' Protocol...`);
            // await tf.setBackend('cpu');
            // await tf.ready();
            // this.recognizer = speechCommands.create('BROWSER_FFT');
            // await this.recognizer.ensureModelLoaded();

            // [FORCE] Setup Audio Graph for Level Meter
            await this.setupAudioGraph();

            this.isLoaded = true; // [FORCE READY]
            this.updateStatus('Ready (Manual Mode). Mic Active.');
        })();

        try {
            await this.initPromise;
        } catch (err: any) {
            console.error('[VoiceEngine] Init Failed:', err);
            this.updateStatus(`Error: ${err.message}`);
        }
    }

    private async setupAudioContext() {
        if (!this.audioContext) {
            // [CTO Fix] Remove forced sampleRate (let Browser/OS decide)
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    private async setupAudioGraph() {
        if (this.audioContext) return;

        // [CTO Check] Basic Audio (With Clean Constraints)
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true, // [Vital] Filter out Speaker Output (Music)
                noiseSuppression: true, // [Vital] Clear Voice
                autoGainControl: true   // [Vital] Consistent Volume
            }
        });
        this.currentStream = stream;

        await this.setupAudioContext();

        const ctx = this.audioContext;
        if (!ctx) throw new Error("AudioContext failed to initialize");

        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.source = ctx.createMediaStreamSource(stream);
        this.source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

        console.log('[VoiceEngine] Audio Graph Constructed (Always-On)');
    }

    public getAudioLevel(): number {
        if (!this.analyser || !this.dataArray) return 0;
        this.analyser.getByteFrequencyData(this.dataArray as any);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return (sum / this.dataArray.length) / 255;
    }

    public async startListening() {
        // [Manual Mode Guard Bypass]
        if (!this.recognizer) {
            console.log('[VoiceEngine] Not Ready but forcing start (Manual Mode)');
            await this.audioContext?.resume();
            return;
        }
        if (this.isListening) return;

        // [Force Resume] Ensure AudioContext is running before listening
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('[VoiceEngine] Force Resumed AudioContext');
        }

        this.isListening = true;
        this.updateStatus('Listening for "Marvin"...');

        await this.recognizer.listen(async (result: any) => {
            const scores = result.scores as Float32Array;
            const labels = this.recognizer!.wordLabels();
            const maxScore = Math.max(...(scores as unknown as number[]));
            const maxIndex = scores.indexOf(maxScore);
            const command = labels[maxIndex];

            if (command === 'marvin' && maxScore > 0.85) {
                console.log('🤖 [UNICORN] "Marvin" Detected!');
                this.triggerWakeWordAction();
            }

        }, {
            includeSpectrogram: false,
            probabilityThreshold: 0.75,
            invokeCallbackOnNoiseAndUnknown: true,
            overlapFactor: 0.50
        });
    }

    public stopListening() {
        if (this.recognizer && this.isListening) {
            this.recognizer.stopListening();
        }
        this.isListening = false;
        this.updateStatus('Paused');
        if (this.onStateChange) this.onStateChange(false);
    }

    // [CTO FIX] Push-to-Talk (PTT) Mode
    // Instead of toggling "Passive Listening", we trigger "Active Command Recording"
    public async toggleListening() {
        console.log('[VoiceEngine] PTT Button Clicked');

        // 1. Force Resume Audio
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('[VoiceEngine] AudioContext Resumed');
        }

        // 2. Ensure Mic is Ready (Brute Force)
        if (!this.currentStream || !this.currentStream.active) {
            console.log('[VoiceEngine] Requesting Mic for PTT...');
            try {
                await this.setupAudioGraph();
            } catch (e) {
                console.error('[VoiceEngine] PTT Mic Error:', e);
                return;
            }
        }

        // 3. Trigger Command Phase IMMEDIATELY (with warm-up delay)
        console.log('[VoiceEngine] Manual Trigger -> Executing Command Phase');

        // Notify UI (Listening State ON)
        this.isListening = true;
        this.updateStatus('🦄 Listening... (Warmup)');
        if (this.onStateChange) this.onStateChange(true);

        // [Fix] Add 300ms delay to prevent "Fade-In" cutting off the first syllable (e.g. "P" in "Play")
        setTimeout(() => {
            console.log('[VoiceEngine] Warmup Complete -> Recording Now');
            this.updateStatus('🦄 Speak Now!');
            this.triggerWakeWordAction();
        }, 300);
    }

    private triggerWakeWordAction() {
        this.updateStatus('🦄 Listening for Command...');
        audioEngine.setDucking(true);
        this.onWakeWordDetected?.();

        speechService.startListening({
            onStatus: (msg) => this.updateStatus(msg),
            onResult: (text) => {
                console.log('[VoiceEngine] Command Recognized:', text);
            }
        });
    }



    // ★ [CTO FIX 2] 장치 변경 시 에코 캔슬링이 되살아나는 버그 수정
    // ★ [CTO FIX 2] 장치 변경 시 강제 재연결 (중복 체크 제거)
    public async setDeviceId(deviceId: string) {
        // [FORCE CONNECT] activeDeviceId check removed to allow forced reset

        if (this.currentStream) {
            this.currentStream.getTracks().forEach(t => t.stop());
        }

        // [SIMPLEST REQUEST] No complex constraints
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                deviceId: { exact: deviceId },
                echoCancellation: true, // [Vital] Filter out Speaker Output (Music)
                noiseSuppression: true, // [Vital] Clear Voice
                autoGainControl: true   // [Vital] Consistent Volume
            }
        });

        this.currentStream = stream;

        // Reconnect Graph
        if (this.audioContext && this.analyser) {
            const newSource = this.audioContext.createMediaStreamSource(stream);
            this.source?.disconnect();
            this.source = newSource;
            this.source.connect(this.analyser);

            // [FORCE RESUME]
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            console.log('[VoiceEngine] Force connected & Resumed');
        }
    }

    // Compatibility Stubs
    public async checkPersistence(): Promise<boolean> { return false; }
    public async collectExample(label: string) { }
    public getExampleCount(label: string): number { return 0; }
    public async train() { }
    public async clearData() { }
    public async saveModel() { }
    public async loadModel() { }

    public async getAvailableDevices(): Promise<MediaDeviceInfo[]> {
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(d => d.kind === 'audioinput');
    }

    public getActiveDeviceLabel(): string {
        return this.currentStream?.getAudioTracks()[0]?.label || 'Default';
    }

    public async getMicStream() {
        return this.setupAudioGraph();
    }
}

export const voiceEngine = new VoiceEngine();
