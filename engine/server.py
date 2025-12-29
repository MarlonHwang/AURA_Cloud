"""
AURA Cloud Studio - Backend Engine
Project Trinity v1.0

Socket.IO Server with Audio Engine
"""

# 오디오 처리 엔진
import pedalboard
from pedalboard import Reverb, Compressor, Gain, LowpassFilter

# 프론트엔드 통신
import socketio

# 비동기 서버
import eventlet
eventlet.monkey_patch()

# 데이터 연산
import numpy as np

# 오디오 출력 드라이버
import sounddevice as sd

# MIDI 입력
import rtmidi
import ollama

import os
from dotenv import load_dotenv
from openai import OpenAI

# Load .env
# Load .env from Project Root
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# DeepSeek Client
deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")
ds_client = None
if deepseek_api_key:
    try:
        ds_client = OpenAI(api_key=deepseek_api_key, base_url="https://api.deepseek.com")
        print(f"[OK] DeepSeek API Client Initialized")
    except Exception as e:
        print(f"[ERROR] DeepSeek Client Init Failed: {e}")
else:
    print("[WARNING] DEEPSEEK_API_KEY not found in .env")


# ============================================
# Socket.IO Server Setup
# ============================================

# CORS 허용하여 Socket.IO 서버 생성
sio = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(sio)

# Chat History Storage (per session, split by model)
chat_histories = {}

def get_history(sid, source):
    if sid not in chat_histories:
        chat_histories[sid] = {'local': [], 'cloud': []}
    return chat_histories[sid][source]

def process_local_chat(sid, messages):
    """Background task for Local Ollama (Qwen 2.5)"""
    try:
        response = ollama.chat(model='qwen2.5:3b', messages=messages)
        ai_text = response['message']['content']
        
        # Add to local history
        get_history(sid, 'local').append({'role': 'assistant', 'content': ai_text})

        sio.emit('chat_response', {
            'source': 'local',
            'status': 'success',
            'message': ai_text
        }, to=sid)
        print(f"[AURA-LOCAL] Sent response to {sid}")
        
    except Exception as e:
        print(f"[AURA-LOCAL] Error: {e}")
        sio.emit('chat_response', {
            'source': 'local',
            'status': 'error',
            'message': f"Local Error: {str(e)}"
        }, to=sid)

def process_cloud_chat(sid, messages):
    """Background task for Cloud DeepSeek"""
    try:
        if not ds_client:
            raise Exception("DeepSeek API Key missing")

        response = ds_client.chat.completions.create(
            model="deepseek-chat",
            messages=messages,
            stream=False
        )
        ai_text = response.choices[0].message.content
        
        # Add to cloud history
        get_history(sid, 'cloud').append({'role': 'assistant', 'content': ai_text})

        sio.emit('chat_response', {
            'source': 'cloud',
            'status': 'success',
            'message': ai_text
        }, to=sid)
        print(f"[AURA-CLOUD] Sent response to {sid}")

    except Exception as e:
        print(f"[AURA-CLOUD] Error: {e}")
        sio.emit('chat_response', {
            'source': 'cloud',
            'status': 'error',
            'message': f"Cloud Error: {str(e)}"
        }, to=sid)

@sio.event
def chat_local(sid, data):
    """Event for Local Model"""
    user_text = data.get('message', '').strip()
    if not user_text: return

    history = get_history(sid, 'local')
    history.append({'role': 'user', 'content': user_text})

    # Prepare Context (System + Recent History)
    system_prompt = (
        "You are 'AURA Local', an intelligent AI assistant inside a DAW. "
        "IMPORTANT: You MUST answer in **Korean (한국어)** only. "
        "Do NOT speak Japanese or English. "
        "Be professional, concise, and helpful for music production. "
        "If asked about your identity, say you are AURA Local."
    )
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-5:]) # Limit context

    sio.start_background_task(process_local_chat, sid, messages)

@sio.event
def chat_cloud(sid, data):
    """Event for Cloud Model"""
    print(f"[AURA] Cloud Chat Request from {sid}")
    user_text = data.get('message', '').strip()
    if not user_text: return

    history = get_history(sid, 'cloud')
    history.append({'role': 'user', 'content': user_text})

    # Prepare Context
    messages = [{"role": "system", "content": "You are AURA, a world-class music theorist. Answer in Korean."}]
    messages.extend(history[-5:])

    sio.start_background_task(process_cloud_chat, sid, messages)


# ============================================
# Audio Functions
# ============================================

def generate_sine_wave(frequency=440, duration=2.0, sample_rate=44100):
    """
    Sine Wave 생성 함수

    Args:
        frequency: 주파수 (Hz) - 기본값 440Hz (A4)
        duration: 길이 (초)
        sample_rate: 샘플레이트

    Returns:
        numpy array of audio samples
    """
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    # Sine wave 생성
    audio = np.sin(2 * np.pi * frequency * t)

    # Fade in/out 적용 (클릭음 방지)
    fade_samples = int(sample_rate * 0.05)  # 50ms fade
    fade_in = np.linspace(0, 1, fade_samples)
    fade_out = np.linspace(1, 0, fade_samples)

    audio[:fade_samples] *= fade_in
    audio[-fade_samples:] *= fade_out

    # 볼륨 조절 (0.5 = -6dB)
    audio *= 0.5

    return audio.astype(np.float32)


def generate_kick_drum(sample_rate=44100):
    """
    Kick Drum 합성 함수

    낮은 주파수의 Sine Wave가 빠르게 떨어지는 소리 (Pitch Envelope)
    + Pedalboard 이펙트로 펀치감 추가

    Returns:
        numpy array of kick drum audio samples
    """
    duration = 0.3  # 300ms
    num_samples = int(sample_rate * duration)
    t = np.linspace(0, duration, num_samples, False)

    # ============================================
    # 1. Pitch Envelope (주파수가 빠르게 떨어짐)
    # ============================================
    # 시작: 150Hz → 끝: 40Hz (지수적 감소)
    start_freq = 150
    end_freq = 40
    pitch_decay = 0.05  # 50ms 동안 급격히 떨어짐

    # 지수적 감소 커브
    freq_envelope = end_freq + (start_freq - end_freq) * np.exp(-t / pitch_decay)

    # 순간 위상 계산 (주파수 적분)
    phase = 2 * np.pi * np.cumsum(freq_envelope) / sample_rate

    # Sine wave with pitch envelope
    audio = np.sin(phase)

    # ============================================
    # 2. Amplitude Envelope (볼륨 감소)
    # ============================================
    # Attack: 즉시, Decay: 200ms
    amp_decay = 0.15
    amplitude = np.exp(-t / amp_decay)

    # 초반 트랜지언트 (클릭감)
    click_duration = 0.005  # 5ms
    click_samples = int(sample_rate * click_duration)
    click = np.zeros(num_samples)
    click[:click_samples] = np.linspace(1, 0, click_samples) ** 2

    # 클릭과 바디 합성
    audio = audio * amplitude + click * 0.3

    # ============================================
    # 3. Pedalboard 이펙트 적용
    # ============================================
    # 32비트 float으로 변환 (Pedalboard 요구사항)
    audio = audio.astype(np.float32)

    # 이펙트 체인: 컴프레서 + 로우패스 + 게인
    board = pedalboard.Pedalboard([
        Compressor(threshold_db=-10, ratio=4.0, attack_ms=1, release_ms=50),
        LowpassFilter(cutoff_frequency_hz=200),  # 저음만 남김
        Gain(gain_db=6)  # 볼륨 부스트
    ])

    # 이펙트 적용 (2D 배열로 변환 필요)
    audio_2d = audio.reshape(1, -1)  # (1, samples) 형태
    processed = board(audio_2d, sample_rate)
    audio = processed.flatten()

    # ============================================
    # 4. 최종 정규화 및 출력
    # ============================================
    # 클리핑 방지
    max_val = np.max(np.abs(audio))
    if max_val > 0:
        audio = audio / max_val

    # 최종 볼륨 (0.7 = -3dB)
    audio *= 0.7

    return audio.astype(np.float32)


def play_kick():
    """Kick Drum 즉시 재생"""
    print("[AURA] Generating Kick Drum...")
    audio = generate_kick_drum()

    print("[AURA] Playing Kick...")
    sd.play(audio, samplerate=44100)
    # 비동기 재생 - wait() 호출 안 함 (즉시 반응)

def play_test_sound():
    """440Hz Sine Wave 재생"""
    print("[AURA] Generating 440Hz sine wave...")
    audio = generate_sine_wave(frequency=440, duration=2.0)

    print("[AURA] Playing sound...")
    sd.play(audio, samplerate=44100)
    sd.wait()  # 재생 완료까지 대기
    print("[AURA] Sound playback complete!")

# ============================================
# Socket.IO Event Handlers
# ============================================

@sio.event
def connect(sid, environ):
    """클라이언트 연결"""
    print(f"[AURA] Client connected: {sid}")
    chat_histories[sid] = {'local': [], 'cloud': []}  # Initialize split history
    sio.emit('engine_status', {'status': 'ready', 'message': 'AURA Engine Ready'}, to=sid)

@sio.event
def disconnect(sid):
    """클라이언트 연결 해제"""
    print(f"[AURA] Client disconnected: {sid}")
    if sid in chat_histories:
        del chat_histories[sid]  # Clean up history

@sio.event
def test_sound(sid, data=None):
    """엔진 테스트 - 440Hz Sine Wave 재생"""
    print(f"[AURA] Received test_sound request from {sid}")

    try:
        # 비동기로 사운드 재생 (메인 스레드 블로킹 방지)
        eventlet.spawn(play_test_sound)
        sio.emit('test_sound_response', {
            'success': True,
            'message': 'Playing 440Hz test tone...'
        }, to=sid)
    except Exception as e:
        print(f"[AURA] Error playing sound: {e}")
        sio.emit('test_sound_response', {
            'success': False,
            'message': str(e)
        }, to=sid)

@sio.event
def ping(sid, data=None):
    """연결 테스트"""
    print(f"[AURA] Ping from {sid}")
    sio.emit('pong', {'message': 'AURA Engine is alive!'}, to=sid)


@sio.event
def trigger_kick(sid, data=None):
    """Kick Drum 트리거 - 프론트엔드에서 호출"""
    print(f"[AURA] Kick triggered from {sid}")

    try:
        # 직접 호출 (eventlet.spawn이 sounddevice와 충돌 가능)
        play_kick()
        sio.emit('trigger_kick_response', {
            'success': True,
            'message': 'Kick!'
        }, to=sid)
    except Exception as e:
        print(f"[AURA] Error playing kick: {e}")
        sio.emit('trigger_kick_response', {
            'success': False,
            'message': str(e)
        }, to=sid)

# ============================================
# Server Startup
# ============================================

if __name__ == '__main__':
    print("=" * 50)
    print("AURA Backend Engine - Project Trinity")
    print("=" * 50)
    print(f"[OK] pedalboard:      {pedalboard.__version__}")
    print(f"[OK] python-socketio: loaded")
    print(f"[OK] eventlet:        loaded")
    print(f"[OK] numpy:           {np.__version__}")
    print(f"[OK] sounddevice:     {sd.__version__}")
    print(f"[OK] python-rtmidi:   loaded")
    print("=" * 50)
    print("[AURA] Starting Socket.IO server on port 5000...")
    print("=" * 50)

    # eventlet WSGI 서버 실행
    eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)
