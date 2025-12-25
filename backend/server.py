"""
AURA Cloud Studio - Backend Engine
Project Trinity v1.0

핵심 라이브러리 검증 스크립트
"""

# 오디오 처리 엔진
import pedalboard
from pedalboard import Reverb, Compressor, Gain, LowpassFilter

# 프론트엔드 통신
import socketio

# 비동기 서버
import eventlet

# 데이터 연산
import numpy as np

# 오디오 출력 드라이버
import sounddevice as sd

# MIDI 입력
import rtmidi

print("=" * 50)
print("AURA Backend Engine - Import Verification")
print("=" * 50)
print(f"[OK] pedalboard:      {pedalboard.__version__}")
print(f"[OK] python-socketio: loaded")
print(f"[OK] eventlet:        loaded")
print(f"[OK] numpy:           {np.__version__}")
print(f"[OK] sounddevice:     {sd.__version__}")
print(f"[OK] python-rtmidi:   loaded")
print("=" * 50)
print("All engines loaded successfully!")
print("=" * 50)
