import type * as Party from "partykit/server";

type PlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  lastUpdatedAt: number; // Timestamp when currentTime was recorded
};

export default class Server implements Party.Server {
  private state: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    lastUpdatedAt: Date.now(),
  };

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`Connected: ${conn.id} to room ${this.room.id}`);

    this.broadcastUserCount();

    // 1. Send current state to the new client IMMEDIATELY
    conn.send(JSON.stringify({
      type: 'sync',
      state: this.state,
      timestamp: Date.now()
    }));

    conn.send(JSON.stringify({
        type: 'system',
        message: 'أهلا بك في الغرفة!',
        timestamp: Date.now()
    }));
  }

  onClose(conn: Party.Connection) {
    console.log(`Closed: ${conn.id}`);
    this.broadcastUserCount();
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);
      const now = Date.now();

      switch (data.type) {
        case 'play':
          this.state.isPlaying = true;
          this.state.currentTime = data.payload.currentTime;
          this.state.lastUpdatedAt = now;
          // Broadcast to ALL clients (including sender) to ensure absolute sync
          this.room.broadcast(JSON.stringify({
            type: 'play',
            state: this.state,
            senderId: sender.id
          }));
          break;

        case 'pause':
          this.state.isPlaying = false;
          this.state.currentTime = data.payload.currentTime;
          this.state.lastUpdatedAt = now;
          // Broadcast to ALL clients
          this.room.broadcast(JSON.stringify({
            type: 'pause',
            state: this.state,
            senderId: sender.id
          }));
          break;

        case 'seek':
          this.state.currentTime = data.payload.currentTime;
          this.state.lastUpdatedAt = now;
          // If seeking while playing, we update the time anchor but keep playing
          // If seeking while paused, we just update time
          this.room.broadcast(JSON.stringify({
            type: 'seek',
            state: this.state,
            senderId: sender.id
          }));
          break;

        case 'chat':
          this.room.broadcast(JSON.stringify({
            type: 'chat',
            text: data.text,
            senderId: sender.id,
            timestamp: now
          }));
          break;
      }
    } catch (e) {
      console.error("Error parsing message", e);
    }
  }

  broadcastUserCount() {
    const count = Array.from(this.room.getConnections()).length;
    this.room.broadcast(JSON.stringify({
      type: 'update_users',
      count: count
    }));
  }
}

Server satisfies Party.Worker;
