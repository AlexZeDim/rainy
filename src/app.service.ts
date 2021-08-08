import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Discord from 'discord.js';
import { capitalizeFirstLetter, normalizeDiacritics } from 'normalize-text';

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

    this.client.on('guildMemberAdd', async (guild_member) => {
      const oldUsername = guild_member.user.username;
      let username = guild_member.user.username;
      username = username.toLowerCase();
      username = username.normalize("NFD");
      username = normalizeDiacritics(username);
      username = username
        .replace('͜', '')
        .replace('1', 'i')
        .replace('$', 's')
        .replace(/\[.*?]/gi, '')
        .replace(/\(.*?\)/gi, '')
        .replace(/{.*?}/gi, '')
        .replace(/[`~!@#$%^€&*()_|̅+\-=?;:'",.<>{}\[\]\\\/]/gi, '')
        .replace(/\d/g,'')

      const C = username.replace(/[^a-zA-Z]/g, '').length;
      const L = username.replace(/[^а-яА-Я]/g, '').length;

      (L >= C)
        ? username = username.replace(/[^а-яА-Я]/g, '')
        : username = username.replace(/[^a-zA-Z]/g, '')

      username = username.length === 0 ? 'Username' : capitalizeFirstLetter(username);

      await guild_member.setNickname(username);
      this.logger.log(`Rename user from ${oldUsername} to ${username}`)
    })
  }
}
