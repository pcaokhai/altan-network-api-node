import { INotificationTemplate } from "@notification/interfaces/notification.interface";
import fs from 'fs'
import ejs from 'ejs'

class NotificationTemplate {
  public notificationMessageTemplate(templateParams: INotificationTemplate): string {
    const {username, header, message} = templateParams
    return ejs.render(fs.readFileSync(__dirname + '/notification.ejs', 'utf-8'), {
      username,
      header,
      message,
      image_url: 'https://w7.pngwing.com/pngs/120/102/png-transparent-padlock-logo-computer-icons-padlock-technic-logo-password-lock.png'
    });
  }
}

export const notificationTemplate: NotificationTemplate = new NotificationTemplate();





