"""
AURA Cloud Studio - Backend Engine
Project Trinity v1.0

Socket.IO Server with Audio Engine
"""

import sys
import os
import json
import time
import socket
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

# [Windows Fix] Force UTF-8 for Console Output to prevent 'cp949' errors
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Get the path to the 'engine' folder
base_path = Path(__file__).resolve().parent
# Get the path to the Root folder (one level up)
root_path = base_path.parent.parent

# 1. Try loading from Root first (Priority)
root_env = root_path / '.env'
if root_env.exists():
    print(f"[AURA] Loading .env from Root: {root_env}")
    load_dotenv(dotenv_path=root_env)
else:
    # 2. Fallback to local engine folder
    print("[AURA] Root .env not found, checking local...")
    load_dotenv()

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

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

# Vosk (Offline STT)
import vosk
import wave
import json
import base64
import io

# Faster-Whisper (Local, High Quality, Multilingual)
from faster_whisper import WhisperModel
import tempfile
import eventlet.tpool # Thread pool for blocking AI tasks

# Initialize Whisper Model (CPU Optimized)
# Uses "base" model (~140MB). 
# Good balance for i3 CPU. (tiny is faster but dumber, small is slower)
WHISPER_MODEL_SIZE = "base"
whisper_model = None

try:
    print(f"[AURA] Loading Faster-Whisper Model ('{WHISPER_MODEL_SIZE}')...")
    # compute_type="int8" is standard for CPU
    whisper_model = WhisperModel(WHISPER_MODEL_SIZE, device="cpu", compute_type="int8")
    print("[AURA] Faster-Whisper Loaded Successfully.")
except Exception as e:
    print(f"[CRITICAL] Failed to load Faster-Whisper: {e}")

# Project Root Calculation (pathlib)
from pathlib import Path

# Project Root Calculation (pathlib)
# server.py is in ROOT/engine, so parent -> parent is ROOT
ENV_PATH = Path(__file__).resolve().parent.parent / '.env'

# Force Load .env
# DeepSeek Client
deepseek_api_key = os.getenv("DEEPSEEK_API_KEY")

if deepseek_api_key:
    # Key loaded
    pass
else:
    print("[CRITICAL] DEEPSEEK_API_KEY not found in .env")

ds_client = None
if deepseek_api_key:
    try:
        ds_client = OpenAI(api_key=deepseek_api_key, base_url="https://api.deepseek.com")
        print(f"[OK] DeepSeek API Client Initialized")
    except Exception as e:
        print(f"[ERROR] DeepSeek Client Init Failed: {e}")


# ============================================
# Socket.IO Server Setup
# ============================================

# CORS 허용하여 Socket.IO 서버 생성 (10MB Buffer for Audio)
sio = socketio.Server(cors_allowed_origins='*', max_http_buffer_size=1e7)
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

# [Data Harvest] Logger for Future Qwen Fine-tuning
def log_training_data(user_input, ai_response):
    try:
        # [Fix] Use Root Path (AURA_Cloud/logs) not src/python/logs
        log_dir = root_path / "logs" / "training_data"
        log_dir.mkdir(parents=True, exist_ok=True)
        log_file = log_dir / "aura_interaction_log.jsonl"
        
        # [DEBUG] Print Path to Console
        print(f"[AURA-LOG] Saving Data to: {log_file}")
        
        entry = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "user_input": user_input,
            "ai_response": ai_response
        }
        
        # JSONL Append (UTF-8, No ASCII Escaping)
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
            
    except Exception as e:
        print(f"[LOG ERROR] Failed to save training data: {e}")

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
        
        # [Harvest] Save Data for Future Independence
        # Extract last user message
        user_text = next((m['content'] for m in reversed(messages) if m['role'] == 'user'), "Unknown")
        log_training_data(user_text, ai_text)

        # Add to cloud history
        get_history(sid, 'cloud').append({'role': 'assistant', 'content': ai_text})

        sio.emit('chat_response', {
            'source': 'cloud',
            'status': 'success',
            'message': ai_text
        }, to=sid)
        print(f"[AURA-CLOUD] Sent response to {sid}")

    except Exception as e:
        print(f"[CRITICAL API ERROR] Cloud Chat Failed: {e}")
        import traceback
        traceback.print_exc()
        sio.emit('chat_response', {
            'source': 'cloud',
            'status': 'error',
            'message': f"Server Error: {str(e)}"
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

def transcribe_audio_file(file_path):
    """Blocking function to run in thread pool"""
    # [Magic Fix] initial_prompt guides Whisper to expect Korean/English commands.
    # This prevents hallucinations (Arabic/Urdu) on short audio.
    segments, info = whisper_model.transcribe(
        file_path, 
        beam_size=5,
        initial_prompt="AURA 음성 명령입니다. 한국어와 영어를 섞어서 사용합니다. 재생, 멈춰, Play, Stop, 드럼, 비트."
    )
    text = " ".join([segment.text for segment in segments]).strip()

    # [CTO Fix] Hallucination Filter (Known Whisper Bugs)
    HALLUCINATIONS = [
        "Selamat tinggal", "Amara.org", "MBC", "SUBTITLE", "수고하셨습니다", 
        "시청해 주셔서 감사합니다"
    ]
    for h in HALLUCINATIONS:
        if h.lower() in text.lower():
            print(f"[AURA-WHISPER] Ignored Hallucination: '{text}'")
            return "", info.language

    return text, info.language

@sio.event
def recognize_audio(sid, data):
    """
    STT with Faster-Whisper (Multilingual)
    Data: { 'audio': 'base64_encoded_wav_string' }
    """
    print(f"[AURA] Audio recognition request from {sid}")
    
    if not whisper_model:
        sio.emit('recognition_result', {
            'success': False,
            'error': 'model_missing',
            'message': 'Whisper Model not loaded.'
        }, to=sid)
        return

    try:
        audio_b64 = data.get('audio')
        if not audio_b64:
            raise ValueError("No audio data provided")

        audio_bytes = base64.b64decode(audio_b64)
        
        # Save to Temp File (Whisper prefers file paths or reliable byte streams)
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_wav:
            temp_wav.write(audio_bytes)
            temp_path = temp_wav.name

        try:
            # Run Inference in Thread Pool (Avoid blocking Eventlet Loop)
            # This is crucial for performance stability
            start_time = time.time()
            text, lang = eventlet.tpool.execute(transcribe_audio_file, temp_path)
            duration = time.time() - start_time
            
            print(f"[AURA-WHISPER] Recognized ({lang}, {duration:.2f}s): '{text}'")
            
            if text:
                sio.emit('recognition_result', {
                    'success': True,
                    'text': text.strip()
                }, to=sid)
            else:
                sio.emit('recognition_result', {
                    'success': False,
                    'error': 'no_speech',
                    'message': '음성이 감지되지 않았습니다.'
                }, to=sid)

        finally:
            # Cleanup Temp File
            if os.path.exists(temp_path):
                os.unlink(temp_path)
        
    except Exception as e:
        print(f"[AURA-WHISPER] Error: {e}")
        import traceback
        traceback.print_exc()
        sio.emit('recognition_result', {
            'success': False,
            'error': 'server_error',
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

    if is_port_in_use(5000):
        print("\n[CRITICAL ERROR] Port 5000 is already in use!")
        print("Please close any other 'python.exe' or 'node.exe' windows consuming this port.")
        print("Server cannot start.")
        sys.exit(1)

    try:
        # eventlet WSGI 서버 실행
        eventlet.wsgi.server(eventlet.listen(('0.0.0.0', 5000)), app)
    except Exception as e:
        print(f"\n[CRITICAL] Server crashed: {e}")
        sys.exit(1)
