import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { capitalizeFirstLetter, normalizeDiacritics } from 'normalize-text';
import { Intents, Client } from 'discord.js';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private client: Client

  private readonly logger = new Logger(
    AppService.name, { timestamp: true },
  );


  async onApplicationBootstrap(): Promise<void> {
    this.client = new Client({
      partials: ['USER', 'CHANNEL', 'GUILD_MEMBER'],
      intents: [
        Intents.FLAGS.GUILD_BANS,
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.GUILD_INVITES,
        // Intents.FLAGS.GUILD_MESSAGES,
      ],
      presence: {
        status: 'online',
        activities: [{
          name: 'users',
          type: 3,
        }]
      }
    });
    await this.client.login(process.env.discord);
    await this.bot();
  }

  async bot(): Promise<void> {
    this.client.on('ready', async () =>
      this.logger.log(`Logged in as ${this.client.user.tag}!`)
    )


    /*
    this.client.on('messageCreate', async (message) => {
      if (message.guildId === DISCORD_SERVERS_ENUM.SanctumOfLight) {

        const guildMember = message.guild.members.cache.get(message.author.id);
        if (!guildMember.roles.cache.has(PALADIN_ROLES.PaladinMember)) {
          await guildMember.roles.add(PALADIN_ROLES.PaladinMember);
        }
      }
    });*/

    /*
    this.client.on('guildBanAdd', async (ban) => {
      const guildBan = await ban.fetch();
      console.log(guildBan);
    });*/

    this.client.on('guildMemberAdd', async (guildMember) => {
      const oldUsername = guildMember.user.username;
      let username = guildMember.user.username;
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

      await guildMember.setNickname(username);
      this.logger.log(`Rename user from ${oldUsername} to ${username}`)
    });
  }
}
