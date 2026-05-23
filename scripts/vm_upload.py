"""Upload local tarball to VM and extract."""
import sys
import paramiko

HOST = '192.168.7.115'
USER = 'mitfol'
PASS = 'ivancme'

LOCAL = sys.argv[1] if len(sys.argv) > 1 else '/tmp/typing-trainer-sync.tar.gz'
REMOTE_PATH = '/tmp/typing-trainer-sync.tar.gz'
REMOTE_DIR = '/tmp/typing-trainer'

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=PASS, timeout=15, look_for_keys=False, allow_agent=False)

sftp = client.open_sftp()
print(f'Uploading {LOCAL} -> {REMOTE_PATH}')
sftp.put(LOCAL, REMOTE_PATH)
sftp.close()
print('Upload OK')

cmd = f'rm -rf {REMOTE_DIR} && mkdir -p {REMOTE_DIR} && tar -xzf {REMOTE_PATH} -C {REMOTE_DIR} && ls {REMOTE_DIR} | head -10 && echo --- && du -sh {REMOTE_DIR}'
_, stdout, stderr = client.exec_command(cmd)
print(stdout.read().decode())
e = stderr.read().decode()
if e: print('STDERR:', e)
client.close()
