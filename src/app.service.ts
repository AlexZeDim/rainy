import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import * as Discord from 'discord.js';
import { normalizeGreek, replaceDiacritics } from '@app/core/utils';
import { diacriticsJson } from '@app/core';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private client: Discord.Client

  private diacritics: Record<string, string>

  private readonly logger = new Logger(
    AppService.name, { timestamp: true },
  );


  async onApplicationBootstrap(): Promise<void> {
    this.client = new Discord.Client();
    this.diacritics = diacriticsJson;
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
      let username = guild_member.user.username;
      username = username.toLowerCase();
      username = username.normalize("NFD");
      username = normalizeGreek(username);
      username = username.replace('͜', '');
      username = username.replace('1', 'i');
      username = username.replace('$', 's');
      username = username.replace(/\[.*?]/gi, '');
      username = username.replace(/\(.*?\)/gi, '');
      username = username.replace(/\{.*?}/gi, '');
      username = username.replace(/[`~!@#$%^€&*()_|̅+\-=?;:'",.<>{}\[\]\\\/]/gi, '');
      username = username.replace(/\d/g,'');
      username = replaceDiacritics(this.diacritics, username);
      username = username.replace(/[^a-яA-Я]/g, '');
      const C = username.replace(/[^a-zA-Z]/g, '').length;
      const L = username.replace(/[^а-яА-Я]/g, '').length;

      (L >= C)
        ? username = username.replace(/[^а-яА-Я]/g, "")
        : username = username.replace(/[^a-zA-Z]/g, "")

      username = username[0].toUpperCase() + username.slice(1);

      await guild_member.setNickname(username);
    })
  }
}
