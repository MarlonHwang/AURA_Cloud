
import React, { useState } from 'react';
import { StepSequencerView } from './StepSequencer/StepSequencerView';
import { PianoRollView } from './PianoRoll/PianoRollView';
import { MixerView } from './Mixer/MixerView';
import { AudioEditorView } from './AudioEditor/AudioEditorView';
import { SamplerView } from './Sampler/SamplerView';

export const EditDockView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'step-seq' | 'piano-roll' | 'mixer' | 'audio-editor' | 'sampler'>('step-seq');

    return (
        <div className="w-full h-full flex flex-col bg-[#0b0c0e]">
            {/* Header / Tabs */}
            <div className="h-10 border-b border-gray-800 flex items-center px-4 gap-1">
                <button
                    className={`px-3 py-1 text-xs font-bold rounded-t-md transition-colors ${activeTab === 'step-seq' ? 'bg-[#181818] text-cyan-400 border-t-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('step-seq')}
                >
                    STEP SEQ
                </button>
                <button
                    className={`px-3 py-1 text-xs font-bold rounded-t-md transition-colors ${activeTab === 'piano-roll' ? 'bg-[#181818] text-cyan-400 border-t-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('piano-roll')}
                >
                    PIANO ROLL
                </button>
                <button
                    className={`px-3 py-1 text-xs font-bold rounded-t-md transition-colors ${activeTab === 'mixer' ? 'bg-[#181818] text-cyan-400 border-t-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('mixer')}
                >
                    MIXER
                </button>
                <button
                    className={`px-3 py-1 text-xs font-bold rounded-t-md transition-colors ${activeTab === 'audio-editor' ? 'bg-[#181818] text-cyan-400 border-t-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('audio-editor')}
                >
                    AUDIO
                </button>
                <button
                    className={`px-3 py-1 text-xs font-bold rounded-t-md transition-colors ${activeTab === 'sampler' ? 'bg-[#181818] text-cyan-400 border-t-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    onClick={() => setActiveTab('sampler')}
                >
                    SAMPLER
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'step-seq' && <StepSequencerView />}
                {activeTab === 'piano-roll' && <PianoRollView />}
                {activeTab === 'mixer' && <MixerView />}
                {activeTab === 'audio-editor' && <AudioEditorView />}
                {activeTab === 'sampler' && <SamplerView />}
            </div>
        </div>
    );
};
