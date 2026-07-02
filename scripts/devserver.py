"""Локальный дев-сервер статики с отключённым кэшем.

`python -m http.server` не шлёт Cache-Control → браузер кэширует JS/JSON и при
итерациях подсовывает старые файлы (ловили на task.js). Этот сервер добавляет
`Cache-Control: no-store` ко всем ответам — каждый refresh отдаёт свежее.

Запуск:  python scripts/devserver.py [port]   (по умолчанию 8000)
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(NoCacheHandler, directory='.')
    httpd = ThreadingHTTPServer(('0.0.0.0', port), handler)
    print(f'no-cache dev server on http://localhost:{port}/ (Ctrl+C to stop)')
    httpd.serve_forever()


if __name__ == '__main__':
    main()
