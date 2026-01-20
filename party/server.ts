import type * as Party from "partykit/server";

type PlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  lastUpdatedAt: number;
  playbackRate: number;
};

export default class Server implements Party.Server {
  // In-memory state for the room
  // Note: This resets if the server restarts (which happens on deploy or cold boot)
  // For persistence, use this.room.storage
  private state: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    lastUpdatedAt: Date.now(),
    playbackRate: 1,
  };

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(
      `Connected:
  id: ${conn.id}
  room: ${this.room.id}
  url: ${new URL(ctx.request.url).pathname}`
    );

    this.broadcastUserCount();

    // Send current state to new client
    conn.send(JSON.stringify({
      type: 'sync',
      state: this.state,
      timestamp: Date.now()
    }));

    conn.send(JSON.stringify({
        type: 'system',
        message: 'Welcome to the party!',
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
      
      // Update server state based on events
      if (data.type === 'play') {
        this.state.isPlaying = true;
        this.state.currentTime = data.payload.currentTime;
        this.state.lastUpdatedAt = Date.now();
        this.room.broadcast(message); // Broadcast to others
      } else if (data.type === 'pause') {
        this.state.isPlaying = false;
        this.state.currentTime = data.payload.currentTime;
        this.state.lastUpdatedAt = Date.now();
        this.room.broadcast(message);
      } else if (data.type === 'seek') {
        this.state.currentTime = data.payload.currentTime;
        this.state.lastUpdatedAt = Date.now();
        this.room.broadcast(message);
      } else if (data.type === 'chat') {
        this.room.broadcast(message);
      } else if (data.type === 'ping') {
        sender.send(JSON.stringify({
            type: 'pong',
            id: data.id,
            timestamp: Date.now()
        }));
      }
    } catch (e) {
      console.error("Error parsing message", e);
    }
  }

  broadcastUserCount() {
    const count =  Array.from(this.room.getConnections()).length;
    this.room.broadcast(JSON.stringify({
        type: 'update_users',
        count: count,
        timestamp: Date.now()
    }));
  }
}

Server satisfies Party.Worker;
