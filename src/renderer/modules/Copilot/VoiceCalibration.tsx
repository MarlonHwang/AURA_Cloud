
import React, { useState, useEffect } from 'react';
import { voiceEngine } from '../../services/VoiceEngine';

/**
 * 🦄 Project UNICORN Calibration UI
 * "One Button to Rule Them All"
 */
export const VoiceCalibration: React.FC<{ onClose: () => void; onComplete?: () => void }> = ({ onClose, onComplete }) => {
    const [status, setStatus] = useState('Initializing Project UNICORN...');
    const [step, setStep] = useState<'IDLE' | 'NOISE' | 'AURA' | 'TRAINING' | 'DONE'>('IDLE');
    const [auraCount, setAuraCount] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0);

    useEffect(() => {
        // Init Engine
        voiceEngine.setCallbacks(
            (msg) => setStatus(msg),
            () => { } // No action during training
        );
        voiceEngine.initialize().then(() => {
            voiceEngine.getMicStream();
            setStatus('Ready. Press Start.');
        });

        // Volume Meter
        const interval = setInterval(() => {
            setAudioLevel(voiceEngine.getAudioLevel());
        }, 60);

        return () => clearInterval(interval);
    }, []);

    const startCalibration = async () => {
        // Step 1: Background Noise (Auto)
        setStep('NOISE');
        setStatus('🤫 Shhh... Learning Room Tone... (Keep Silent)');

        // Wait 1s then capture
        setTimeout(async () => {
            for (let i = 0; i < 3; i++) {
                await voiceEngine.collectExample('_background_noise_');
                await new Promise(r => setTimeout(r, 600)); // Delay between captures
            }

            // Step 2: Wake Word
            setStep('AURA');
            setStatus('🎤 Ready! Press & Say "AURA"');
        }, 1000);
    };

    const captureAura = async () => {
        if (step !== 'AURA') return;

        await voiceEngine.collectExample('aura');
        const count = voiceEngine.getExampleCount('aura');
        setAuraCount(count);
        setStatus(`Captured: ${count}/5`);

        if (count >= 5) {
            setStep('TRAINING');
            handleTrain();
        }
    };

    const handleTrain = async () => {
        setStatus('🦄 Training Unicorn Brain...');
        await voiceEngine.train();

        setStep('DONE');
        setStatus('System Online! Say "AURA!" anytime.');

        if (onComplete) onComplete();
        setTimeout(onClose, 2000);
    };

    const renderVis = () => {
        const height = Math.min(Math.max(audioLevel, 0) * 200, 100);
        return (
            <div className="w-full h-1 bg-gray-800 mt-4 rounded overflow-hidden">
                <div
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${height}%` }}
                />
            </div>
        );
    };

    return (
        <div className="absolute inset-0 bg-black/95 z-[999] flex flex-col items-center justify-center p-8 backdrop-blur-xl">
            <div className="absolute top-8 right-8 cursor-pointer text-gray-500 hover:text-white" onClick={onClose}>✕</div>

            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-2 filter drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    PROJECT UNICORN
                </h1>
                <p className="text-gray-400 font-mono text-sm">Adaptive Voice Command System</p>
            </div>

            {/* Status Monitor */}
            <div className="mb-8 font-mono text-cyan-300 text-lg animate-pulse">
                {status}
            </div>

            {/* Main IDLE View */}
            {step === 'IDLE' && (
                <button
                    onClick={startCalibration}
                    className="group relative px-12 py-6 bg-gray-900 border border-cyan-500/30 rounded-2xl hover:bg-cyan-900/20 hover:border-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.1)] hover:shadow-[0_0_50px_rgba(6,182,212,0.3)]"
                >
                    <div className="text-2xl font-bold text-white mb-2">Start Calibration</div>
                    <div className="text-gray-500 text-sm group-hover:text-cyan-200">2-Minute Setup</div>
                </button>
            )}

            {/* Noise Collection View */}
            {step === 'NOISE' && (
                <div className="flex flex-col items-center">
                    <div className="text-6xl mb-4">🤫</div>
                    <div className="text-xl text-gray-300">Collecting Silence...</div>
                    <div className="w-64 h-2 bg-gray-800 rounded mt-4 overflow-hidden">
                        <div className="h-full bg-purple-500 animate-[width_3s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
                    </div>
                </div>
            )}

            {/* AURA Capture View */}
            {step === 'AURA' && (
                <div className="flex flex-col items-center gap-6">
                    <button
                        onMouseDown={captureAura}
                        className="w-48 h-48 rounded-full border-4 border-cyan-500 flex flex-col items-center justify-center bg-cyan-900/10 hover:bg-cyan-500/20 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(6,182,212,0.2)]"
                    >
                        <span className="text-5xl mb-2">🎤</span>
                        <span className="font-bold text-cyan-300">TAP & SAY</span>
                        <span className="text-2xl font-black text-white">"AURA"</span>
                    </button>

                    <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-4 h-4 rounded-full transition-all ${i < auraCount ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-gray-800'}`} />
                        ))}
                    </div>
                    {renderVis()}
                </div>
            )}

            {/* Training View */}
            {step === 'TRAINING' && (
                <div className="text-center">
                    <div className="animate-spin text-5xl mb-4">🧠</div>
                    <div className="text-xl">Optimizing Neural Network...</div>
                </div>
            )}

            {/* Done View */}
            {step === 'DONE' && (
                <div className="text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <div className="text-2xl font-bold text-green-400">Calibration Complete</div>
                </div>
            )}

            <div className="absolute bottom-8 flex gap-4 text-xs font-mono">
                <span className="text-gray-700">Audio Ducking Enabled • IndexedDB Secure</span>
                <button
                    onClick={async () => {
                        if (confirm('Are you sure you want to Wipe All Voice Data?')) {
                            try {
                                await voiceEngine.clearData();
                                alert('✅ Reset Complete! The app will now reload.');
                                window.location.reload(); // Auto-reload
                            } catch (e) {
                                alert('Error: ' + e);
                            }
                        }
                    }}
                    className="px-3 py-1 bg-red-900/50 hover:bg-red-600 text-red-200 rounded border border-red-800 transition-colors"
                >
                    Hard Reset
                </button>
            </div>
        </div>
    );
};

export default VoiceCalibration;
