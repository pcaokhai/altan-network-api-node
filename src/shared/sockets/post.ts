import { config } from '@root/config';
import Logger from 'bunyan';
import { Server, Socket } from 'socket.io';

export let socketIOPostObject: Server;

const log: Logger = config.createLogger('SocketIOPostHandler');
export class SocketIOPostHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    socketIOPostObject = io;
  }

  public listen(): void {
    this.io.on('connection', (socket: Socket) => {
      log.info('Post socketio handler');
    });
  }
}
