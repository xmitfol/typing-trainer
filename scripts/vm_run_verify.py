"""
End-to-end: upload verify_playwright.py to VM, run it, download screenshots.
"""
import io
import select
import sys
import time
from pathlib import Path

import paramiko

# Force UTF-8 output on Windows console (defaults to cp1251 in RU locale)
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True)
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True)

HOST = '192.168.7.115'
USER = 'mitfol'
PASS = 'ivancme'

LOCAL_SCRIPT = Path(__file__).resolve().parent / 'verify_playwright.py'
REMOTE_SCRIPT = '/tmp/typing-trainer/scripts/verify_playwright.py'
REMOTE_SCREENS = '/tmp/typing-trainer-screens'
LOCAL_SCREENS = Path(__file__).resolve().parent.parent / 'verify-screenshots'
LOCAL_SCREENS.mkdir(exist_ok=True)

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15, look_for_keys=False, allow_agent=False)


def run_streaming(cmd, timeout=180):
    print(f'$ {cmd}')
    _, stdout, _ = client.exec_command(cmd + ' 2>&1', timeout=timeout, get_pty=False)
    ch = stdout.channel
    start = time.time()
    while True:
        if ch.exit_status_ready() and not ch.recv_ready():
            break
        if time.time() - start > timeout:
            print('[TIMEOUT]')
            break
        rl, _, _ = select.select([ch], [], [], 2)
        if rl:
            data = ch.recv(8192).decode('utf-8', errors='replace')
            if data:
                sys.stdout.write(data)
                sys.stdout.flush()
        else:
            time.sleep(0.05)
    code = ch.recv_exit_status()
    print(f'[exit {code}]')
    return code


# 1. Upload fresh verify script
print(f'Upload {LOCAL_SCRIPT.name} -> {REMOTE_SCRIPT}')
sftp = client.open_sftp()
try:
    sftp.mkdir('/tmp/typing-trainer/scripts')
except Exception:
    pass
sftp.put(str(LOCAL_SCRIPT), REMOTE_SCRIPT)
sftp.close()

# 2. Kill any leftover chromium/python that might hold the port
run_streaming('pkill -9 -f chrome 2>/dev/null; pkill -9 -f playwright 2>/dev/null; pkill -9 -f "http.server 8765" 2>/dev/null; sleep 1; echo cleanup-ok', timeout=15)

# 3. Run the script with the VM's venv python (which has playwright + chromium)
PY = '/home/mitfol/venv/bin/python'
code = run_streaming(f'rm -rf {REMOTE_SCREENS} && cd /tmp/typing-trainer && DISPLAY=:1 {PY} {REMOTE_SCRIPT}', timeout=120)

# 4. Download all screenshots
print(f'\nDownloading screenshots from {REMOTE_SCREENS} -> {LOCAL_SCREENS}')
sftp = client.open_sftp()
try:
    files = sftp.listdir(REMOTE_SCREENS)
    for f in sorted(files):
        sftp.get(f'{REMOTE_SCREENS}/{f}', str(LOCAL_SCREENS / f))
        size = (LOCAL_SCREENS / f).stat().st_size
        print(f'  {f} ({size} bytes)')
except FileNotFoundError:
    print('  screenshots directory not found on VM')
sftp.close()
client.close()
sys.exit(code)
