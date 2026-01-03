# AURA NEXUS (The Shared Brain)
*> This file is the Single Source of Truth for Project AURA.*
*> Synced between: CEO (User), Strategist (Gemini), and Developer (Antigravity).*

## 📡 Communication Protocol: Project LIGHTHOUSE
**Status**: ACTIVE
**Gist URL**: `https://gist.github.com/MarlonHwang/0a8e7897456df5e6302830dab5390c06`
**Action**: Run `npm run lighthouse` after major steps.

---

## 🦄 Grand Plan: Project UNICORN
**Objective**: Create a flawless voice interaction system by controlling the environment (Ducking) and simplifying the trigger (Wake Word).

**Core Directives**:
1.  **The Trigger (IndexedDB + Wake Word)**
    *   VoiceEngine learns **ONLY** the Wake Word ("AURA").
    *   Storage: **IndexedDB** (Kill `fs`).
    *   Status: Always-On listening for "AURA".
2.  **The Environment (Audio Ducking)**
    *   **Action**: Upon "AURA" detection, IMMEDIATELY lower app master volume to **20% (-15dB)**.
    *   **Purpose**: Create a quiet environment for STT (Speech-to-Text).
3.  **The Interaction (Chat Injection)**
    *   **Action**: Activate `Web Speech API` (Google STT).
    *   **Flow**: Listen -> Convert to Text -> Inject into `ChatInput` -> Submit.
    *   **Cleanup**: Once command is submitted, **Fade-in** volume back to 100%.

---

## 🚩 Current Task (Active Mission)
**Mission**: Implement Project UNICORN

1.  [x] **Refactor `VoiceEngine.ts`**:
    *   Simplified logic: Only detect "AURA" (Wake Word).
    *   Implemented IndexedDB storage (`indexeddb://aura-voice-id-unicorn`).
    *   Implemented `triggerWakeWordAction()` calling Ducking & Speech.
2.  [x] **Implement `SpeechService.ts`**:
    *   Web Speech API (STT) Integrated.
    *   Auto-Ducking Restoration (Fade-in).
    *   Event Dispatch: `aura-voice-command`.
3.  [x] **Audio Engine Update**:
    *   Implemented `setDucking(active)` with smooth ramps.
4.  [ ] **UI Integration**:
    *   Update `VoiceCalibration.tsx` to train only "AURA".
    *   Update `Copilot/index.tsx` to listen for `aura-voice-command`.

---

## 📝 Dev Logs (Antigravity)
- **[2026-01-03]**: **Project UNICORN Core Implemented**
    - `VoiceEngine` rebuilt from scratch (Clean Architecture).
    - `AudioEngine` now supports Ducking (-20dB).
    - `SpeechService` created for Chat Injection.
    - **Next Step**: Connect UI components (Calibration & Chat Input).
