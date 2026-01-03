
import { bridge } from './BridgeService';
import { audioEngine } from './audio/AudioEngine';

interface SpeechStatus {
    listening: boolean;
}

class SpeechService {
    private isListening = false;
    private injectTarget: any | null = null;
    private callbacks: { onStatus: (status: string) => void; onResult: (text: string) => void } | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private audioChunks: Blob[] = [];

    private recognition: any | null = null; // Native Recognizer

    constructor() {
        // [Browser Native Support Check]
        if ('webkitSpeechRecognition' in window) {
            console.log('[SpeechService] Native Speech Recognition Available');
            const SpeechRecognition = (window as any).webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.lang = 'en-US'; // Default to English for commands (or ko-KR)
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
        } else {
            console.log('[SpeechService] Native STT Not Found -> Backend Mode Only');
        }
    }

    public setInjectTarget(target: any) {
        this.injectTarget = target;
    }

    public async startListening(callbacks: { onStatus: (status: string) => void; onResult: (text: string) => void }) {
        if (this.isListening) return;
        this.isListening = true;
        this.callbacks = callbacks;

        // [Strategy] Try Native First
        if (this.recognition) {
            this.updateStatus('🦄 Listening (Native)...');
            console.log('[SpeechService] Starting Native Recognition...');

            this.recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                console.log('[SpeechService] Native Result:', text);
                this.handleResult(text);
                if (this.callbacks?.onResult) this.callbacks.onResult(text);
                this.isListening = false;
            };

            this.recognition.onerror = (event: any) => {
                console.warn('[SpeechService] Native Error:', event.error);

                if (event.error === 'network' || event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    console.log('[SpeechService] Native STT failed. Falling back to Backend (Vosk)...');
                    this.recognition = null; // Prevent loops
                    this.useBackendFallback();
                } else {
                    this.updateStatus('❌ Voice Error: ' + event.error);
                    this.isListening = false;
                }
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    // Ended without result
                    this.isListening = false;
                    this.updateStatus('❌ No speech detected');
                }
            };

            try {
                this.recognition.start();
            } catch (e) {
                console.error("Native Start Error", e);
                this.useBackendFallback(); // Fallback
            }
        } else {
            this.useBackendFallback();
        }
    }

    private async useBackendFallback() {
        console.log('[SpeechService] Starting Backend Capture...');
        this.updateStatus('🎤 Listening (Backend)...');
        this.audioChunks = [];

        try {
            // Use Headset Mic (same as VoiceEngine ideally, but getUserMedia default is safer for now)
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = async () => {
                console.log('[SpeechService] Recording stopped. Processing...');
                this.updateStatus('⏳ Processing...');

                // Create Blob
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                const arrayBuffer = await audioBlob.arrayBuffer();

                // Convert WebM to WAV (PCM)
                const wavBuffer = await this.convertToWav(arrayBuffer);
                const base64Audio = this.arrayBufferToBase64(wavBuffer);

                // [Fix] Register One-Time Listener BEFORE emitting
                // This guarantees the socket is ready and we catch the response to THIS request.
                if (bridge.socket) {
                    bridge.socket.once('recognition_result', (data: any) => {
                        console.log('[SpeechService] Backend Result:', data);

                        // Restore Audio
                        audioEngine.setDucking(false);
                        this.isListening = false;

                        if (data.success && data.text) {
                            this.handleResult(data.text);
                            // Also call the original callback if it wants to know
                            if (this.callbacks?.onResult) this.callbacks.onResult(data.text);
                        } else {
                            this.updateStatus('❌ Error: ' + (data.message || 'Unknown'));
                        }
                    });

                    // Send to Backend
                    bridge.socket.emit('recognize_audio', { audio: base64Audio });
                } else {
                    console.error('[SpeechService] Socket not ready!');
                    this.updateStatus('❌ Network Error');
                    audioEngine.setDucking(false);
                    this.isListening = false;
                }

                // Stop tracks
                stream.getTracks().forEach(track => track.stop());
            };

            this.mediaRecorder.start();

            // Auto-stop after 4 seconds
            setTimeout(() => {
                if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
            }, 4000);

        } catch (e) {
            console.error('[SpeechService] Mic Error:', e);
            this.updateStatus('❌ Mic Error');
            audioEngine.setDucking(false);
            this.isListening = false;
        }
    }

    private handleResult(text: string) {
        this.updateStatus(`✅ Recognized: "${text}"`);

        // Inject into Chat
        const event = new CustomEvent('aura-voice-command', { detail: { text } });
        window.dispatchEvent(event);
    }

    private updateStatus(msg: string) {
        if (this.callbacks) this.callbacks.onStatus(msg);
    }

    // --- Audio Utilities ---

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private async convertToWav(webmBuffer: ArrayBuffer): Promise<ArrayBuffer> {
        // Decode WebM to AudioBuffer using Web Audio API
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(webmBuffer);

        // Encode AudioBuffer to WAV
        return this.audioBufferToWav(audioBuffer);
    }

    private audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
        const numOfChan = buffer.numberOfChannels;
        const length = buffer.length * numOfChan * 2 + 44;
        const outBuffer = new ArrayBuffer(length);
        const view = new DataView(outBuffer);
        const channels = [];
        let sample;
        let offset = 0;
        let pos = 0;

        // write WAVE header
        setUint32(0x46464952);                         // "RIFF"
        setUint32(length - 8);                         // file length - 8
        setUint32(0x45564157);                         // "WAVE"

        setUint32(0x20746d66);                         // "fmt " chunk
        setUint32(16);                                 // length = 16
        setUint16(1);                                  // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
        setUint16(numOfChan * 2);                      // block-align
        setUint16(16);                                 // 16-bit (hardcoded in this loop)

        setUint32(0x61746164);                         // "data" - chunk
        setUint32(length - pos - 4);                   // chunk length

        // write interleaved data
        for (let i = 0; i < buffer.numberOfChannels; i++)
            channels.push(buffer.getChannelData(i));

        while (pos < buffer.length) {
            for (let i = 0; i < numOfChan; i++) {   // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(44 + offset, sample, true); // write 16-bit sample
                offset += 2;
            }
            pos++;
        }

        return outBuffer;

        function setUint16(data: any) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data: any) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    }
}

export const speechService = new SpeechService();
