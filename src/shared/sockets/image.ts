import { config } from '@root/config';
import Logger from 'bunyan';
import { Server, Socket } from 'socket.io';

let socketIOImageObject: Server;
const log: Logger = config.createLogger('SocketIOPostHandler');

export class SocketIOImageHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIOImageObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      log.info('Post socketio handler');
    });
  }
}

export { socketIOImageObject };
