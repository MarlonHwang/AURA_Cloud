import psutil
import os
import sys
import subprocess
import time

def kill_process_using_pid(pid):
    """
    Kills a process by PID.
    Tries psutil first (graceful -> force), then falls back to Windows taskkill.
    """
    try:
        proc = psutil.Process(pid)
        print(f"[ProcessManager] Attempting to terminate PID {pid} ({proc.name()})...")
        
        # 1. Try graceful termination
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except psutil.TimeoutExpired:
            # 2. Try force kill (psutil)
            print(f"[ProcessManager] PID {pid} did not terminate. Forcing kill...")
            proc.kill()
            try:
                proc.wait(timeout=2)
            except psutil.TimeoutExpired:
                pass # Move to fallback

    except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
        pass # Process already gone or inaccessible
    except Exception as e:
        print(f"[ProcessManager] Error using psutil on PID {pid}: {e}")

    # 3. Fallback: Windows taskkill (The "Double Tap")
    # Even if psutil thinks it's gone, ensure it's dead on Windows.
    if os.name == 'nt':
        try:
            # /F = Force, /T = Tree (kill child processes), /PID = Process ID
            # redirected to NUL to hide output if process is already dead
            subprocess.run(f"taskkill /PID {pid} /F /T", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"[ProcessManager] Executed taskkill fallback for PID {pid}.")
        except Exception as e:
            print(f"[ProcessManager] Taskkill fallback failed for PID {pid}: {e}")

def clear_port(port):
    """
    Finds any process listening on the specified port and kills it.
    Returns True if port was cleared (or was empty), False if failed.
    """
    print(f"[ProcessManager] Scanning for zombies on port {port}...")
    killed_any = False
    
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            for conn in proc.connections(kind='inet'):
                if conn.laddr.port == port:
                    print(f"[ProcessManager] Found zombie process: {proc.info['name']} (PID: {proc.info['pid']}) on port {port}")
                    kill_process_using_pid(proc.info['pid'])
                    killed_any = True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
            
    if killed_any:
        # Give OS a moment to release the file handle
        time.sleep(1)
        print(f"[ProcessManager] Port {port} cleanup complete.")
    else:
        print(f"[ProcessManager] Port {port} is clean.")
    
    return True

if __name__ == "__main__":
    # 1. Clean Port 5000 (Zombie Hunter)
    TARGET_PORT = 5000
    try:
        clear_port(TARGET_PORT)
    except Exception as e:
        print(f"[ProcessManager] Warning: Port cleanup failed: {e}")

    # 2. Launch Server (server.py)
    print("[ProcessManager] Starting AURA Brain (server.py)...")
    
    # Determine absolute path to server.py
    # Assuming this script is in src/python (or same dir as server.py)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    server_script = os.path.join(script_dir, "server.py")
    
    if not os.path.exists(server_script):
        # Fallback: maybe we are in root and calling src/python/process_manager.py
        server_script = os.path.abspath("src/python/server.py")

    if not os.path.exists(server_script):
        # Fallback: maybe we are in backend/ (prod)
        server_script = os.path.abspath("server.py")
        
    print(f"[ProcessManager] Server Script Path: {server_script}")

    # Propagate exit code
    exit_code = 0
    
    try:
        # Use subprocess to run server.py and wait for it
        # This keeps process_manager alive as the parent
        proc = subprocess.Popen([sys.executable, server_script], cwd=os.path.dirname(server_script))
        print(f"[ProcessManager] Server started with PID {proc.pid}")
        proc.wait()
        exit_code = proc.returncode
    except KeyboardInterrupt:
        print("[ProcessManager] Interrupted. Terminating server...")
        proc.terminate()
        proc.wait()
    except Exception as e:
        print(f"[ProcessManager] Failed to start server: {e}")
        exit_code = 1
        
    sys.exit(exit_code)
