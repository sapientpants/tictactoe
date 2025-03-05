import { Server as NetServer } from 'http';
import { NextRequest, NextResponse } from 'next/server';
import { initSocketServer } from './socketio';

// Set runtime to nodejs to ensure the API route can use the underlying server
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    // Check if we have a server instance
    const httpServer = res?.socket?.server;
    
    if (!httpServer) {
      console.error("HTTP server not available from response object");
      return NextResponse.json({ error: "HTTP server not available" }, { status: 500 });
    }
    
    // If already initialized
    if (httpServer.io) {
      return NextResponse.json({ 
        success: true, 
        message: "Socket.io server already running"
      });
    }
    
    // Initialize the socket server
    const io = initSocketServer(httpServer);
    
    // Store the io instance on the server object
    httpServer.io = io;
    
    console.log("Socket.io server initialized successfully");
    
    return NextResponse.json({ success: true, message: "Socket.io server running" });
  } catch (error) {
    console.error('Socket.io server error:', error);
    return NextResponse.json({ error: 'Failed to start Socket.io server: ' + (error as Error).message }, { status: 500 });
  }
}