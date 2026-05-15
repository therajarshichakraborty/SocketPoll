import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io("https://socketpoll.onrender.com", {
      auth: { token: localStorage.getItem("token") },
      autoConnect: true,
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function joinPollRoom(pollId: string) {
  getSocket().emit("join_poll", pollId);
}

export function leavePollRoom(pollId: string) {
  getSocket().emit("leave_poll", pollId);
}
