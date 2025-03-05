import { NextRequest, NextResponse } from 'next/server';
import { getSocketServer, getGames } from '../../../lib/socket';

// Force this route to be dynamic and run on Node.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API route to check socket server status and game information
 */
export async function GET(req: NextRequest) {
  console.log("Socket.io API endpoint hit");
  
  const io = getSocketServer();
  const games = getGames();
  
  if (!io) {
    console.warn("Socket.io server not initialized - this is normal during initialization");
    return NextResponse.json({
      status: "initializing",
      message: "Socket.io server is being initialized. Please wait and retry your connection."
    }, { status: 200 });
  }
  
  return NextResponse.json({
    status: "running",
    message: "Socket.io server is running",
    gameCount: Object.keys(games).length
  }, { status: 200 });
}