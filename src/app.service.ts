import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Discord from 'discord.js';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private client: Discord.Client

  private readonly logger = new Logger(
    AppService.name, { timestamp: true },
  );


  async onApplicationBootstrap(): Promise<void> {
    this.client = new Discord.Client();
    await this.client.login(process.env.discord);
    await this.bot();
  }

  async bot(): Promise<void> {
    this.client.on('ready', async () =>
      this.logger.log(`Logged in as ${this.client.user.tag}!`)
    )
    await this.client.user.setPresence({
      status: 'online',
      activity: {
        name: `users`,
        type: 'WATCHING'
      }
    });
  }
}
