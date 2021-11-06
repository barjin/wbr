import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import LZUTF8 from 'lzutf8';
import cors from 'cors';
import logger, { Level } from './Logger';
import Performer from './performer';

const port = 8000;

(async () => {
  const app = express();
  app.use(cors());

  const httpServer = createServer(app);
  const io = new Server(httpServer,
    {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

  // app.use(express.static(path.join(__dirname, '/frontend')));

  io.on('connection', async (socket: Socket) => {
    logger('New connection!', Level.LOG);
    const performer = new Performer();
    const controller = await performer.tapInto((message: { scope: string, content: any }) => {
      if (message.scope === 'page') {
        socket.emit('LoadPage', LZUTF8.compress(message.content, { outputEncoding: 'ByteArray' }));
      } else if (message.scope === 'mutation') {
        socket.emit('Mutation', message.content);
      }
    });
    controller.newTab('https://wikipedia.com');

    socket.on('control', (command) => {
      switch (command.type) {
        case 'goto': {
          controller.goto(command.data.url);
          break;
        }
        case 'click': {
          controller.click(command.data.selector);
          break;
        }
        case 'goBack': {
          controller.goBack();
          break;
        }
        case 'goForward': {
          controller.goForward();
          break;
        }
        default:
          break;
      }
    });

    socket.on('disconnect', async () => {
      performer.release();
    });
  });

  httpServer.listen(port);
  logger(`Remote Browser Server starting at localhost:${port}`, Level.LOG);
})();
