import { NextRequest, NextResponse } from "next/server";

type Client = {
  id: string;
  room: string;
  send: (data: any) => void;
};

const rooms = new Map<string, Set<Client>>();

function broadcast(room: string, data: any) {
  const clients = rooms.get(room);
  if (!clients) return;
  for (const client of clients) {
    client.send(data);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { room: string } }
) {
  const room = params.room;
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  const id = crypto.randomUUID();

  const send = (data: any) => {
    writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const client: Client = { id, room, send };
  const clients = rooms.get(room) || new Set<Client>();
  clients.add(client);
  rooms.set(room, clients);

  send({ type: "system", message: "connected", id });

  const close = () => {
    const set = rooms.get(room);
    if (!set) return;
    set.delete(client);
    if (!set.size) rooms.delete(room);
    writer.close();
  };

  req.signal.addEventListener("abort", close);

  return new NextResponse(readable, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { room: string } }
) {
  const room = params.room;
  const body = await req.json();
  const payload = {
    ...body,
    room,
    timestamp: Date.now(),
  };
  broadcast(room, payload);
  return NextResponse.json({ ok: true });
}

