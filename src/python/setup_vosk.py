import os
import zipfile
import urllib.request
from pathlib import Path

# URL for lightweight English model
MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip"
MODEL_ZIP = "vosk-model.zip"
EXTRACT_DIR = "model"
FINAL_MODEL_DIR = "model_en"

base_path = Path(__file__).parent.resolve()
zip_path = base_path / MODEL_ZIP
extract_path = base_path / EXTRACT_DIR

print(f"[AURA] Initializing Vosk Model Download...")

if not (base_path / FINAL_MODEL_DIR).exists():
    print(f"[AURA] Downloading from {MODEL_URL}...")
    urllib.request.urlretrieve(MODEL_URL, zip_path)
    print(f"[AURA] Download complete. Extracting...")
    
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(base_path)
        
    print(f"[AURA] Extraction complete.")
    
    # Rename extracted folder (usually vosk-model-small-en-us-0.15) to 'model'
    # Find the folder name
    for item in os.listdir(base_path):
        if item.startswith("vosk-model-small"):
            os.rename(base_path / item, base_path / FINAL_MODEL_DIR)
            print(f"[AURA] Renamed {item} to {FINAL_MODEL_DIR}")
            break
            
    # Cleanup
    if zip_path.exists():
        os.remove(zip_path)
else:
    print("[AURA] Model already exists. Skipping.")

print("[AURA] Vosk Setup Finished.")
