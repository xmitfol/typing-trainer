/**
 * pow-worker.js — Web Worker для proof-of-work капчи (ADR-006).
 *
 * Перебирает nonce, пока sha256(`${salt}:${nonce}`) не получит >= difficulty
 * ведущих нулевых бит (совпадает с backend app/core/captcha.py). Считается в
 * воркере, чтобы не морозить UI-поток. Синхронный SHA-256 (Web Crypto async —
 * слишком медленный для перебора).
 *
 * Протокол:
 *   postMessage({ salt, difficulty })  → воркер начинает перебор
 *   ← { type: 'progress', tried }       (периодически)
 *   ← { type: 'solved', nonce, tried }  (готово)
 */

'use strict';

// ─── Компактный синхронный SHA-256 → Uint8Array(32) ───────────────────
// Стандартный FIPS 180-4. Вход — UTF-8 строка.
const _K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function _rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

function sha256Bytes(bytes) {
    const h = new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
    ]);

    const l = bytes.length;
    const bitLen = l * 8;
    // padding: 0x80, нули, 64-битная длина (big-endian)
    const withPad = ((l + 8) >> 6) + 1; // число 64-байтовых блоков
    const total = withPad * 64;
    const msg = new Uint8Array(total);
    msg.set(bytes);
    msg[l] = 0x80;
    // длина в битах в последние 8 байт (big-endian); bitLen < 2^53 → хватает 32 младших
    const dv = new DataView(msg.buffer);
    dv.setUint32(total - 4, bitLen >>> 0, false);
    dv.setUint32(total - 8, Math.floor(bitLen / 0x100000000), false);

    const w = new Uint32Array(64);
    for (let off = 0; off < total; off += 64) {
        for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4, false);
        for (let i = 16; i < 64; i++) {
            const s0 = _rotr(w[i - 15], 7) ^ _rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
            const s1 = _rotr(w[i - 2], 17) ^ _rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
            w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
        for (let i = 0; i < 64; i++) {
            const S1 = _rotr(e, 6) ^ _rotr(e, 11) ^ _rotr(e, 25);
            const ch = (e & f) ^ (~e & g);
            const t1 = (hh + S1 + ch + _K[i] + w[i]) | 0;
            const S0 = _rotr(a, 2) ^ _rotr(a, 13) ^ _rotr(a, 22);
            const maj = (a & b) ^ (a & c) ^ (b & c);
            const t2 = (S0 + maj) | 0;
            hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
        }
        h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
        h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
    }

    const out = new Uint8Array(32);
    const odv = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) odv.setUint32(i * 4, h[i] >>> 0, false);
    return out;
}

function leadingZeroBits(digest) {
    let bits = 0;
    for (let i = 0; i < digest.length; i++) {
        const byte = digest[i];
        if (byte === 0) { bits += 8; continue; }
        // старший ненулевой байт — досчитываем нули в нём
        let n = 7;
        let b = byte;
        while (b > 1) { b >>= 1; n--; }
        bits += n;
        break;
    }
    return bits;
}

// UTF-8 кодирование строки → Uint8Array
const _encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
function utf8(str) {
    if (_encoder) return _encoder.encode(str);
    // fallback (старые движки)
    const arr = [];
    for (let i = 0; i < str.length; i++) {
        let c = str.charCodeAt(i);
        if (c < 0x80) arr.push(c);
        else if (c < 0x800) { arr.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
        else { arr.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
    }
    return new Uint8Array(arr);
}

function solve(salt, difficulty) {
    let nonce = 0;
    while (true) {
        const digest = sha256Bytes(utf8(salt + ':' + nonce));
        if (leadingZeroBits(digest) >= difficulty) return nonce;
        nonce++;
        if ((nonce & 0x3fff) === 0) {
            // каждые ~16k итераций — прогресс (не блокируем навсегда без вестей)
            self.postMessage({ type: 'progress', tried: nonce });
        }
    }
}

// В Worker-контексте `self` определён; в Node (unit-тест) — нет.
if (typeof self !== 'undefined') {
    self.onmessage = function (e) {
        const { salt, difficulty } = e.data || {};
        if (typeof salt !== 'string' || typeof difficulty !== 'number') {
            self.postMessage({ type: 'error', message: 'bad input' });
            return;
        }
        const nonce = solve(salt, difficulty);
        self.postMessage({ type: 'solved', nonce: String(nonce) });
    };
}

// Экспорт для unit-теста под Node (в воркере self.module отсутствует).
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { sha256Bytes, leadingZeroBits, utf8, solve };
}
