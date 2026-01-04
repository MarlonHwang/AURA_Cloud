import os

# 1. 절대 읽으면 안 되는 '쓰레기/기계어' 폴더
IGNORED_DIRS = {
    'node_modules', 'venv', '.git', '.idea', '.vscode', '__pycache__', 
    'dist', 'build', 'coverage', '.vite', '.cache', 'logs', 'training_data',
    'tmp', 'temp', 'assets'
}

# 2. 텍스트로 된 파일은 확장자 불문하고 가져오기
ALLOWED_EXTENSIONS = {
    # 언어 소스
    '.ts', '.tsx', '.js', '.jsx', '.py', '.pyw',
    # 웹/스타일
    '.html', '.css', '.scss', '.sass', '.less',
    # 설정/데이터
    '.json', '.yaml', '.yml', '.toml', '.ini', '.env.example',
    # 문서
    '.md', '.txt', '.csv',
    # 스크립트
    '.bat', '.sh', '.ps1'
}

# 3. 특정 파일명은 확장자와 상관없이 포함
INCLUDE_FILENAMES = {
    'Dockerfile', 'docker-compose.yml', '.gitignore', '.env.example', 
    'requirements.txt', 'package.json', 'tsconfig.json', 'vite.config.ts'
}

OUTPUT_FILE = 'AURA_FULL_CODE.txt'

def is_ignored(path):
    parts = path.split(os.sep)
    for part in parts:
        if part in IGNORED_DIRS:
            return True
    return False

def main():
    print("Code extraction started...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        for root, dirs, files in os.walk('.'):
            # 무시할 폴더 제거
            dirs[:] = [d for d in dirs if d not in IGNORED_DIRS]
            
            for file in files:
                _, ext = os.path.splitext(file)
                
                if (ext.lower() not in ALLOWED_EXTENSIONS) and (file not in INCLUDE_FILENAMES):
                    continue

                file_path = os.path.join(root, file)
                
                if is_ignored(file_path):
                    continue

                try:
                    with open(file_path, 'r', encoding='utf-8') as infile:
                        content = infile.read()
                        
                        outfile.write(f"\n{'='*50}\n")
                        outfile.write(f"FILE PATH: {file_path}\n")
                        outfile.write(f"{'='*50}\n\n")
                        outfile.write(content)
                        outfile.write("\n")
                        print(f"Added: {file_path}")
                except Exception as e:
                    print(f"Skipping {file_path}: {e}")

    print(f"\nDone! Saved to: {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
