import express, { Express } from 'express';
import { AtlanServer } from './setupServer';
import { config } from './config';
import databaseConnection from './setupDatabase';
import Logger from 'bunyan';

const log: Logger = config.createLogger('app');

class Application {
  public initialize(): void {
    this.loadConfig();
    databaseConnection();
    const app: Express = express();
    const server: AtlanServer = new AtlanServer(app);
    server.start();
    Application.handleExit();
  }

  private loadConfig(): void {
    config.validateConfig();
    config.cloudinaryConfig();
  }

  private static handleExit(): void {
    process.on('uncaughtException', (error: Error) => {
      log.error(`There was an uncaught error: ${error}`);
      Application.shutdownProperly(1);
    });

    process.on('unhandleRejection', (error: Error) => {
      log.error(`Unhandle rejection at promise: ${error}`);
      Application.shutdownProperly(2);
    });

    process.on('SIGTERM', (error: Error) => {
      log.error('Caught SIGNTERM');
      Application.shutdownProperly(2);
    });

    process.on('SIGINT', (error: Error) => {
      log.error('Caught SIGINT');
      Application.shutdownProperly(2);
    });

    process.on('exit', (error: Error) => {
      log.error('Exiting');
    });
  }

  private static shutdownProperly(exitCode: number): void {
    Promise.resolve()
      .then(() => {
        log.info('Shutdown Complete');
        process.exit(exitCode);
      })
      .catch((error) => {
        log.info(`Error during shutdown: ${error}`);
        process.exit(1);
      });
  }
}

const application: Application = new Application();
application.initialize();
