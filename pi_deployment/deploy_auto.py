import os
import sys
import shutil
import tempfile
import tarfile
import paramiko
import time

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PI_HOST = "192.168.1.29"
PI_USER = "insolublenitrate"
PI_PASS = "pi"
PI_DEST = "/home/insolublenitrate/fantasy_dashboard"

PROJECT_ROOT = r"d:\AntiGravity Projects\dynasty-brain"
if not os.path.exists(PROJECT_ROOT):
    PROJECT_ROOT = r"g:\My Drive\05_Software_&_AI_Development\AntiGravity Projects\Fantasy Football Dashboard"

print(f"=== Starting Automated Push to Raspberry Pi ({PI_HOST}) ===")
print(f"Project Source: {PROJECT_ROOT}")

# 1. Prepare Staging Archive
temp_dir = tempfile.mkdtemp(prefix="pi_deploy_")
tar_path = os.path.join(temp_dir, "deploy_bundle.tar.gz")

EXCLUDE_DIRS = {"node_modules", ".next", "venv", "__pycache__", ".git", "out", "dist", ".vercel", "Generation 1", "generation 1.1", "Data Dumps"}
EXCLUDE_EXTS = {".pyc", ".tar.gz", ".zip"}

def is_excluded(path):
    parts = path.replace("\\", "/").split("/")
    for p in parts:
        if p in EXCLUDE_DIRS:
            return True
    for ext in EXCLUDE_EXTS:
        if path.endswith(ext):
            return True
    return False

print("[1/4] Packaging clean application files into tar.gz bundle...")
dirs_to_copy = ["backend", "generation-2-dashboard", "frontend", "pi_deployment"]
root_files = ["main.py", "database.py", "models.py", "sleeper_ingest.py", "package.json"]

with tarfile.open(tar_path, "w:gz") as tar:
    for d in dirs_to_copy:
        src_d = os.path.join(PROJECT_ROOT, d)
        if os.path.exists(src_d):
            for root, dirs, files in os.walk(src_d):
                dirs[:] = [dir_name for dir_name in dirs if dir_name not in EXCLUDE_DIRS]
                for file in files:
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, PROJECT_ROOT)
                    if not is_excluded(full_path):
                        if file.endswith(('.sh', '.desktop', '.py', '.json', '.ts', '.tsx', '.mjs', '.css', '.html')):
                            try:
                                with open(full_path, 'rb') as f_in:
                                    content = f_in.read().replace(b'\r\n', b'\n')
                                tarinfo = tar.gettarinfo(full_path, arcname=rel_path)
                                tarinfo.size = len(content)
                                if file.endswith(('.sh', '.desktop')):
                                    tarinfo.mode = 0o755
                                import io
                                tar.addfile(tarinfo, io.BytesIO(content))
                                continue
                            except Exception as e:
                                pass
                        tar.add(full_path, arcname=rel_path)

    for f in root_files:
        src_f = os.path.join(PROJECT_ROOT, f)
        if os.path.exists(src_f):
            with open(src_f, 'rb') as f_in:
                content = f_in.read().replace(b'\r\n', b'\n')
            tarinfo = tar.gettarinfo(src_f, arcname=f)
            tarinfo.size = len(content)
            import io
            tar.addfile(tarinfo, io.BytesIO(content))

tar_size_mb = os.path.getsize(tar_path) / (1024 * 1024)
print(f"Created bundle: {tar_size_mb:.2f} MB")

# 2. Connect via SSH & SFTP
print(f"[2/4] Connecting to {PI_USER}@{PI_HOST} via SSH...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PI_HOST, username=PI_USER, password=PI_PASS, timeout=10)

# Create destination directory
stdin, stdout, stderr = ssh.exec_command(f"mkdir -p {PI_DEST}")
stdout.channel.recv_exit_status()

# 3. SFTP Upload
print("[3/4] Uploading bundle to Raspberry Pi...")
sftp = ssh.open_sftp()
remote_tar = f"{PI_DEST}/deploy_bundle.tar.gz"

def progress_callback(transferred, total):
    pct = (transferred / total) * 100
    sys.stdout.write(f"\rUploading: {pct:.1f}% ({transferred/(1024*1024):.1f}/{total/(1024*1024):.1f} MB)")
    sys.stdout.flush()

sftp.put(tar_path, remote_tar, callback=progress_callback)
print("\nUpload complete!")
sftp.close()

# Cleanup local temp
shutil.rmtree(temp_dir, ignore_errors=True)

# 4. Extract and Run Installation
print("[4/4] Unpacking files and running installation script on Pi...")
session = ssh.get_transport().open_session()
session.get_pty()
session.exec_command(f"cd {PI_DEST} && tar -xzf deploy_bundle.tar.gz && rm -f deploy_bundle.tar.gz && chmod +x pi_deployment/*.sh && bash pi_deployment/install_on_pi.sh")

# Stream output live and handle sudo password prompts if any
while True:
    if session.recv_ready():
        try:
            raw_data = session.recv(2048)
            text = raw_data.decode('utf-8', errors='replace')
            sys.stdout.write(text)
            sys.stdout.flush()
            if "[sudo] password for" in text or "Password:" in text:
                session.send(f"{PI_PASS}\n")
        except Exception:
            pass
    if session.exit_status_ready():
        break
    time.sleep(0.1)

# Drain remaining output
while session.recv_ready():
    try:
        raw_data = session.recv(2048)
        text = raw_data.decode('utf-8', errors='replace')
        sys.stdout.write(text)
        sys.stdout.flush()
    except Exception:
        pass

exit_code = session.recv_exit_status()
ssh.close()

if exit_code == 0:
    print("\n==========================================================")
    print(" SUCCESS! Fantasy Football Dashboard deployed to Pi 5!")
    print(" You can now tap the 'Fantasy Dashboard' icon on the screen.")
    print("==========================================================")
else:
    print(f"\nInstallation finished with exit code {exit_code}")
