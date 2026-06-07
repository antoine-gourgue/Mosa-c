import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Returns the shared realtime socket, connecting it on first use. The URL comes
 * from `NEXT_PUBLIC_REALTIME_URL` (e.g. `http://localhost:4001` in dev);
 * otherwise it connects to the current origin, where `/socket.io` is proxied to
 * the realtime service. The session cookie is sent on the handshake.
 *
 * @returns The shared socket.io client.
 */
export function getRealtimeSocket(): Socket {
  if (socket === null) {
    const url = process.env.NEXT_PUBLIC_REALTIME_URL;
    const options = { path: "/socket.io", withCredentials: true } as const;
    socket = url === undefined || url === "" ? io(options) : io(url, options);
  }
  return socket;
}
