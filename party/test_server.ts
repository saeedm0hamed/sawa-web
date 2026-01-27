
import Server from "./server";
// Mock types locally since we can't easily import from partykit/server in a standalone script without proper setup
// But since we are running this with ts-node/node, we can try to mimic the interface.

// Mocks
class MockConnection {
  public id: string;
  public sentMessages: any[] = [];

  constructor(id: string) {
    this.id = id;
  }

  send(message: string) {
    this.sentMessages.push(JSON.parse(message));
  }
}

class MockRoom {
  public id = "test-room";
  public connections: Map<string, MockConnection> = new Map();
  public broadcastedMessages: any[] = [];

  broadcast(message: string) {
    this.broadcastedMessages.push(JSON.parse(message));
  }

  getConnections() {
    return this.connections.values();
  }
}

async function runTests() {
  console.log("Starting Server Tests...");
  
  const room = new MockRoom();
  // @ts-ignore
  const server = new Server(room);

  const clientA = new MockConnection("user-A");
  const clientB = new MockConnection("user-B");
  
  // @ts-ignore
  room.connections.set(clientA.id, clientA);
  // @ts-ignore
  room.connections.set(clientB.id, clientB);

  // Test 1: Initial Connect
  // @ts-ignore
  server.onConnect(clientA, { request: { url: "http://localhost/party/test-room" } });
  
  if (clientA.sentMessages.find(m => m.type === 'sync')) {
      console.log("✅ Test 1 Passed: Client received sync on connect");
  } else {
      console.error("❌ Test 1 Failed: Client did not receive sync");
  }

  // Test 2: Play
  const playMsg = JSON.stringify({ type: 'play', payload: { currentTime: 10 } });
  // @ts-ignore
  server.onMessage(playMsg, clientA);
  
  const broadcastedPlay = room.broadcastedMessages.find(m => m.type === 'play');
  if (broadcastedPlay && broadcastedPlay.payload.currentTime === 10) {
      console.log("✅ Test 2 Passed: Play event broadcasted correctly");
  } else {
      console.error("❌ Test 2 Failed: Play event not broadcasted");
  }

  // Test 3: Valid Pause
  const pauseMsg = JSON.stringify({ type: 'pause', payload: { currentTime: 12 } });
  // @ts-ignore
  server.onMessage(pauseMsg, clientA);
  
  const broadcastedPause = room.broadcastedMessages.find(m => m.type === 'pause' && m.payload.currentTime === 12);
  if (broadcastedPause) {
      console.log("✅ Test 3 Passed: Valid pause broadcasted");
  } else {
      console.error("❌ Test 3 Failed: Valid pause not broadcasted");
  }

  // Test 4: False Pause (Already Paused)
  room.broadcastedMessages = []; // Clear history
  clientA.sentMessages = []; // Clear history

  // Current state is paused (from Test 3). Send another pause.
  const falsePauseMsg = JSON.stringify({ type: 'pause', payload: { currentTime: 15 } });
  // @ts-ignore
  server.onMessage(falsePauseMsg, clientB);

  const broadcastedFalsePause = room.broadcastedMessages.find(m => m.type === 'pause');
  const syncResponse = clientB.sentMessages.find(m => m.type === 'sync');

  if (!broadcastedFalsePause && syncResponse && syncResponse.state.isPlaying === false) {
       console.log("✅ Test 4 Passed: False pause ignored and sync sent");
  } else {
       console.error("❌ Test 4 Failed: False pause handling incorrect", {
           broadcasted: !!broadcastedFalsePause,
           syncReceived: !!syncResponse
       });
  }

  // Test 5: Play then Pause
  // Play
  // @ts-ignore
  server.onMessage(JSON.stringify({ type: 'play', payload: { currentTime: 20 } }), clientA);
  // Pause
  // @ts-ignore
  server.onMessage(JSON.stringify({ type: 'pause', payload: { currentTime: 22 } }), clientB);
  
  const lastMsg = room.broadcastedMessages[room.broadcastedMessages.length - 1];
  if (lastMsg.type === 'pause' && lastMsg.senderId === 'user-B') {
      console.log("✅ Test 5 Passed: Play then Pause sequence works");
  } else {
      console.error("❌ Test 5 Failed");
  }

  console.log("Tests Completed.");
}

runTests().catch(console.error);
