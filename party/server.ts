import type * as Party from "partykit/server";

type PlaybackState = {
  isPlaying: boolean;
  currentTime: number;
  lastUpdatedAt: number;
  playbackRate: number;
  version: number; // For synchronization
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
    version: 0,
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
      const timestamp = Date.now();
      
      switch (data.type) {
        case 'play':
            this.handlePlay(sender, data.payload, timestamp);
            break;
        case 'pause':
            this.handlePause(sender, data.payload, timestamp);
            break;
        case 'seek':
            this.handleSeek(sender, data.payload, timestamp);
            break;
        case 'chat':
            // Broadcast chat messages
            // Ensure senderId is set correctly by the server
            const chatMessage = { 
                ...data, 
                senderId: sender.id, // Enforce sender ID from connection
                timestamp 
            };
            this.room.broadcast(JSON.stringify(chatMessage));
            break;
        case 'ping':
            sender.send(JSON.stringify({
                type: 'pong',
                id: data.id,
                timestamp
            }));
            break;
        case 'sync_req':
            sender.send(JSON.stringify({
                type: 'sync',
                state: this.state,
                timestamp
            }));
            break;
        default:
            console.warn(`Unknown message type: ${data.type} from ${sender.id}`);
      }
    } catch (e) {
      console.error("Error parsing message", e);
    }
  }

  handlePlay(sender: Party.Connection, payload: any, timestamp: number) {
      this.state.isPlaying = true;
      this.state.currentTime = payload.currentTime;
      this.state.lastUpdatedAt = timestamp;
      this.state.version++;

      this.broadcastState('play', sender.id);
  }

  handlePause(sender: Party.Connection, payload: any, timestamp: number) {
      // 1. State Validation: If already paused, ignore to prevent false positives
      if (!this.state.isPlaying) {
          console.log(`[Pause] Ignored false pause from ${sender.id}. Server already paused.`);
          
          // 2. Synchronization: Send correct state back to the sender so they get in sync
          // This acts as a NACK (Negative Acknowledgment) + State Correction
          sender.send(JSON.stringify({
              type: 'sync',
              state: this.state,
              timestamp
          }));
          return;
      }

      this.state.isPlaying = false;
      this.state.currentTime = payload.currentTime;
      this.state.lastUpdatedAt = timestamp;
      this.state.version++;

      this.broadcastState('pause', sender.id);
  }

  handleSeek(sender: Party.Connection, payload: any, timestamp: number) {
      this.state.currentTime = payload.currentTime;
      this.state.lastUpdatedAt = timestamp;
      this.state.version++;
      
      this.broadcastState('seek', sender.id);
  }

  broadcastState(type: string, senderId: string) {
      this.room.broadcast(JSON.stringify({
          type,
          payload: {
              currentTime: this.state.currentTime,
              version: this.state.version
          },
          senderId,
          timestamp: Date.now()
      }));
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
