import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import initSocketServer from './socket';

// Setup Next.js app
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Initialize HTTP server
const server = createServer(async (req, res) => {
  try {
    // Use the Next.js request handler to serve pages
    const parsedUrl = parse(req.url!, true);
    await handle(req, res, parsedUrl);
  } catch (err) {
    console.error('Error occurred handling request:', err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

// Initialize Socket.io with our HTTP server
initSocketServer(server);

// Start the server
const PORT = parseInt(process.env.PORT || '3000', 10);
server.listen(PORT, () => {
  console.log(`> Server listening on http://localhost:${PORT}`);
});

// Export the server and app for Next.js to use
export { server, app };