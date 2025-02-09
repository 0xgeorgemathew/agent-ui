/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";

// Store messages in memory
const messages: Array<{ message: string; timestamp: number }> = [];

// Keep track of connected clients
const clients = new Set<ReadableStreamDefaultController<string>>();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    messages.push(data);

    // Notify all connected clients with proper SSE format
    clients.forEach(controller => {
      controller.enqueue(`data: ${JSON.stringify(messages)}\n\n`);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to process message" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const stream = new ReadableStream({
      start(controller: ReadableStreamDefaultController<string>) {
        clients.add(controller);

        // Send initial messages with proper SSE format
        controller.enqueue(`data: ${JSON.stringify(messages)}\n\n`);

        return () => {
          clients.delete(controller);
        };
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to establish stream" },
      { status: 500 },
    );
  }
}
