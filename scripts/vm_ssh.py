"""
SSH-обёртка для VM cme-server (192.168.7.115, mitfol/ivancme).
Использование: python scripts/vm_ssh.py "команда"
"""
import sys
import paramiko

HOST = '192.168.7.115'
USER = 'mitfol'
PASS = 'ivancme'


def run(cmd, timeout=60):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASS, timeout=15, look_for_keys=False, allow_agent=False)
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout, get_pty=False)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    client.close()
    return code, out, err


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'uname -a'
    timeout = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    code, out, err = run(cmd, timeout=timeout)
    if out:
        sys.stdout.write(out)
    if err:
        sys.stderr.write(err)
    sys.exit(code)
