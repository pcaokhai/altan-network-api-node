import { userWorker } from '@worker/user.worker';
import { BaseQueue } from './base.queue';
import { IUserJob } from '@user/interfaces/user.interface';

class UserQueue extends BaseQueue {
  constructor() {
    super('userQueue');
    this.processJob('addUserToDB', 5, userWorker.addUserToDB);
    this.processJob('updateSocialLinksInDB', 5, userWorker.updateSocialLinks);
    this.processJob('updateBasicInfoInDB', 5, userWorker.updateUserInfo);
    this.processJob('updateNotificationSettings', 5, userWorker.updateNotificationSettings);
  }

  public addUserJob(name: string, data: IUserJob): void {
    this.addJob(name, data);
  }
}

export const userQueue: UserQueue = new UserQueue();
