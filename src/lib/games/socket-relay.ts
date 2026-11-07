const PHOTON_HOST = /(^|\.)(exitgames\.com|photonengine\.(io|com))$/i;

export function photonSocketTarget(value: string): URL | null {
  try {
    const target = new URL(value);
    if (target.protocol !== "wss:" || !PHOTON_HOST.test(target.hostname) || target.username || target.password) return null;
    return target;
  } catch { return null; }
}

/** Worker sockets otherwise deliver Blob messages, which send() turns into text. */
export function prepareBinaryRelay(...sockets: { binaryType: string }[]) {
  for (const socket of sockets) socket.binaryType = "arraybuffer";
}