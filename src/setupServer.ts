import { Application, json, urlencoded, Request, Response, NextFunction } from 'express';
import http from 'http';
import HTTP_STATUS from 'http-status-codes';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieSession from 'cookie-session';
import 'express-async-errors';
import compression from 'compression';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import Logger from 'bunyan';
import apiStats from 'swagger-stats';
import { config } from './config';
import { createAdapter } from '@socket.io/redis-adapter';
import applicationRoutes from './routes';
import { CustomError, IErrorResponse } from '@global/helpers/error-handler';
import { SocketIOPostHandler } from '@socket/post';
import { SocketIOImageHandler } from '@socket/image';
import { SocketIOUserHandler } from '@socket/user';
import { SocketIOFollowerHandler } from '@socket/follower';
import { SocketIOChatHandler } from '@socket/chat';
import { SocketIONotificationHandler } from '@socket/notification';

const SERVER_PORT = 5500;
const log: Logger = config.createLogger('server');

export class AtlanServer {
  private app: Application;

  constructor(app: Application) {
    this.app = app;
  }

  public start(): void {
    this.securityMiddleware(this.app);
    this.standardMiddleware(this.app);
    this.routeMiddleware(this.app);
    this.apiMonitoring(this.app);
    this.globalErrorHandler(this.app);
    this.startServer(this.app);
  }

  private securityMiddleware(app: Application): void {
    app.use(
      cookieSession({
        name: 'session',
        keys: [config.SECRET_KEY_ONE!, config.SECRET_KEY_TWO!],
        maxAge: 24 * 7 * 3600000,
        secure: config.NODE_ENV !== 'development'
      })
    );
    app.use(hpp());
    app.use(helmet());
    app.use(
      cors({
        origin: config.CLIENT_URL,
        credentials: true,
        optionsSuccessStatus: 200,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      })
    );
  }

  private standardMiddleware(app: Application): void {
    app.use(compression());

    app.use(
      json({
        limit: '50mb'
      })
    );

    app.use(
      urlencoded({
        extended: true,
        limit: '50mb'
      })
    );
  }

  private routeMiddleware(app: Application): void {
    applicationRoutes(app);
  }

  private apiMonitoring(app: Application): void {
    app.use(
      apiStats.getMiddleware({
        uriPath: '/swagger-monitoring'
      })
    );
  }

  private globalErrorHandler(app: Application): void {
    app.all('*', (req: Request, res: Response) => {
      res.status(HTTP_STATUS.NOT_FOUND).json({ message: `${req.originalUrl} not found` });
    });

    app.use((error: IErrorResponse, _req: Request, res: Response, next: NextFunction) => {
      log.error(error);
      if (error instanceof CustomError) {
        return res.status(error.statusCode).json(error.serializeErrors());
      }

      next();
    });
  }

  private async startServer(app: Application): Promise<void> {
    if (!config.JWT_TOKEN) {
      throw new Error('JWT_TOKEN must be provided');
    }
    try {
      const httpServer = new http.Server(app);
      const socketIO: Server = await this.createSocketIO(httpServer);
      this.startHttpServer(httpServer);
      this.socketIOConnections(socketIO);
    } catch (error) {
      log.error(error);
    }
  }

  private async createSocketIO(httpServer: http.Server): Promise<Server> {
    const io: Server = new Server(httpServer, {
      cors: {
        origin: config.CLIENT_URL,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      }
    });

    const pubClient = createClient({ url: config.REDIS_HOST });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    return io;
  }

  private startHttpServer(httpServer: http.Server): void {
    log.info(`Worker with process id of ${process.pid} has started...`);
    log.info(`Server has started with process ${process.pid}`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Listening on port ${SERVER_PORT}`);
    });
  }

  private socketIOConnections(io: Server): void {
    const postSocketHandler: SocketIOPostHandler = new SocketIOPostHandler(io);
    const imageSocketHandler: SocketIOImageHandler = new SocketIOImageHandler(io);
    const followerSocketHandler: SocketIOFollowerHandler = new SocketIOFollowerHandler(io);
    const userSocketHandler: SocketIOUserHandler = new SocketIOUserHandler(io);
    const chatSocketHandler: SocketIOChatHandler = new SocketIOChatHandler(io);
    const notificationSocketHandler: SocketIONotificationHandler = new SocketIONotificationHandler();

    postSocketHandler.listen();
    followerSocketHandler.listen();
    userSocketHandler.listen();
    chatSocketHandler.listen();
    notificationSocketHandler.listen(io);
    imageSocketHandler.listen();
  }
}