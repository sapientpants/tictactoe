import { Server } from 'socket.io';
import { NextResponse } from 'next/server';

let io;

export const runtime = 'nodejs';

export async function GET() {
  if (io) {
    return NextResponse.json({ success: true });
  }

  try {
    const response = new Response();
    
    io = new Server(response.socket.server, {
      path: '/api/socket/io/',
      addTrailingSlash: false,
    });

    response.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);
      
      socket.on('createGame', () => {
        const gameId = Math.random().toString(36).substring(7);
        console.log('Game created:', gameId);
        socket.join(gameId);
        socket.emit('gameCreated', { 
          gameId,
          shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/play/${gameId}`,
        });
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Socket.io server error:', error);
    return NextResponse.json({ error: 'Failed to start Socket.io server' }, { status: 500 });
  }
}