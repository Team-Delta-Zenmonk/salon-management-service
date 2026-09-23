const { Server } = require("socket.io");

class SocketManager {
  constructor() {
    this.io = null;
  }

  init(server) {
    this.io = new Server(server, {
      cors: {
        origin: true,
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 25000,
    });

    this.io.on("connection", (socket) => {
      const salonId = socket.handshake.auth?.salonId || socket.handshake.query?.salonId;

      if (!salonId) {
        console.warn("[SocketManager] Connection rejected: salonId not provided");
        socket.disconnect(true);
        return;
      }

      const room = `salon_${salonId}`;
      socket.join(room);

      console.log(`[SocketManager] Salon #${salonId} connected (socket: ${socket.id}, room: ${room})`);

      socket.emit("CONNECTED", {
        salonId,
        message: "Connected to real-time notification stream",
      });

      socket.on("disconnect", (reason) => {
        console.log(`[SocketManager] Salon #${salonId} disconnected (reason: ${reason})`);
      });
    });

    console.log("[SocketManager] Socket.IO server initialized");
  }

  sendToSalon(salonId, payload) {
    if (!this.io) {
      console.warn("[SocketManager] Cannot emit: Socket.IO not initialized");
      return false;
    }

    const room = `salon_${salonId}`;
    const socketsInRoom = this.io.sockets.adapter.rooms.get(room);
    const count = socketsInRoom ? socketsInRoom.size : 0;

    const eventName = payload.event || "NOTIFICATION_RECEIVED";
    const dataToSend = payload.data !== undefined ? payload.data : payload;

    this.io.to(room).emit(eventName, dataToSend);

    return count > 0;
  }

  close() {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
  }
}

const socketManager = new SocketManager();
module.exports = socketManager;
