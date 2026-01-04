
import React, { useEffect } from 'react';
// We will import these from main once exported. 
// @ts-ignore
import { setupStepSequencerGrid, setupStepMultiplierCycle, setupDrumPadTriggers, setupStepCountToggle, setupKitSelector, setupSwingControl, setupAddTrackButton, setupHumanizeSlider, setupSyncScroll, setupTrackSorting, setupGridDelegation } from '../../../main';

import { StepSeqLeft } from './components/StepSeqLeft';
import { StepSeqCenter } from './components/StepSeqCenter';
import { StepSeqRight } from './components/StepSeqRight';

export const StepSequencerView: React.FC = () => {

    useEffect(() => {
        // Initialize logic after render
        // Initialize logic after render
        setTimeout(() => {
            // setupStepSequencerGrid(); // REMOVED: React handles Grid
            // setupGridDelegation();    // REMOVED: React handles Clicks
            // setupStepMultiplierCycle(); // TODO: Port to React
            setupDrumPadTriggers();   // Keep: Attaches to React Headers
            // setupStepCountToggle();   // REMOVED: React handles Toggle
            setupKitSelector();
            setupSwingControl();
            setupHumanizeSlider();
            setupAddTrackButton();
            setupSyncScroll();
            setupTrackSorting();
        }, 100);
    }, []);

    return (
        <div className="flex w-full h-full p-2 gap-2 bg-[#0b0c0e]">
            <StepSeqLeft />
            <StepSeqCenter key="sequencer-center-refreshed" /> {/* Cyan Border is inside this component */}
            <StepSeqRight />
        </div>
    );
};
