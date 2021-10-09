import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { capitalizeFirstLetter, normalizeDiacritics } from 'normalize-text';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import {
  CROSS_CLASS_CHANNELS,
  DISCORD_BANS,
  DISCORD_EMOJI,
  DISCORD_RELATIONS,
  DISCORD_SERVER_RENAME,
  DISCORD_SERVERS_ENUM,
  PALADIN_ROLES
} from '@app/shared';
import {
  Intents,
  Client,
  MessageActionRow,
  MessageButton,
  MessageEmbed,
  ButtonInteraction,
  Snowflake,
  TextChannel,
  InteractionCollector,
} from 'discord.js';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private client: Client

  private banUserID: Snowflake;

  private timeout: number = 1000 * 60 * 60 * 12;

  // private banList: Map<Snowflake, Snowflake> = new Map([]);

  private channel: TextChannel;

  private collector: InteractionCollector<ButtonInteraction>;

  private filterBan = async (interaction: ButtonInteraction): Promise<boolean> => {
    try {
      // console.log(interaction);
      // TODO array, set or something like that
      if (this.banList.has(interaction.customId) && DISCORD_RELATIONS.has(interaction.user.id)) {
        const discordClassID = DISCORD_RELATIONS.get(interaction.user.id);
        const guild = this.client.guilds.cache.get(discordClassID);
        if (guild) {
          await guild.members.ban(interaction.customId, { reason: 'Cross Ban Rainy' });
          return true;
        }
      }
      return false;
    } catch (errorOrException) {
      this.logger.error(`filterBan: ${errorOrException}`);
      return false;
    }
  };

  private readonly logger = new Logger(
    AppService.name, { timestamp: true },
  );

  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      this.client = new Client({
        partials: ['USER', 'CHANNEL', 'GUILD_MEMBER'],
        intents: [
          Intents.FLAGS.GUILD_BANS,
          Intents.FLAGS.GUILDS,
          Intents.FLAGS.GUILD_MEMBERS,
          Intents.FLAGS.GUILD_INVITES,
          Intents.FLAGS.GUILD_MESSAGES,
        ],
        presence: {
          status: 'online'
        }
      });

      // TODO set to redis

      await this.client.login(process.env.discord);
      await this.bot();
    } catch (errorOrException) {
      this.logger.error(`Application: ${errorOrException}`);
    }
  }

  async bot(): Promise<void> {
    try {
      this.client.on('ready', async () => this.logger.log(`Logged in as ${this.client.user.tag}!`))

      const channel = await this.client.channels.fetch(CROSS_CLASS_CHANNELS.BanThread);
      if (!channel || channel.type !== 'GUILD_TEXT') return;

      this.channel = channel as TextChannel;
      this.collector = this.channel.createMessageComponentCollector({ filter: this.filterBan });

      this.client.on('guildBanAdd', async (ban) => {
        try {
          const guildBan = await ban.fetch();

          /*
          const channelIDLogs = DISCORD_LOGS.get(guildBan.guild.id);
          const channel: Channel | null = await this.client.channels.fetch(channelIDLogs);
          if (channel) {
            await (channel as TextChannel).send(`\` Banned: ${guildBan.user.username}#${guildBan.user.discriminator} \``);
          }*/

          if (guildBan.reason && DISCORD_BANS.has(guildBan.reason.toLowerCase())) {
            if (!this.banList.has(guildBan.user.id)) {
              this.banUserID = guildBan.user.id;

              const buttons = new MessageActionRow()
                .addComponents(
                  new MessageButton()
                    .setCustomId(this.banUserID)
                    .setLabel(`Ban ${guildBan.user.username}#${guildBan.user.discriminator}`)
                    .setStyle('DANGER')
                  ,
                );

              const emoji = this.client.emojis.cache.get(DISCORD_EMOJI.get(guildBan.guild.id));

              const embed =
                new MessageEmbed()
                  .setDescription(`Источник: ${emoji} **${guildBan.guild.name}**\n\nЗаблокирован на:`)
                  .addFields({ name: '\u200B', value: `${emoji} - ✅`, inline: true });

              const message = await this.channel.send({ embeds: [embed], components: [buttons] });
              this.banList.set(guildBan.user.id, message.id);
              setTimeout(() => message.delete(), this.timeout);
            }
          }
        } catch (errorOrException) {
          this.logger.error(`guildBanAdd: ${errorOrException}`);
        }
      });

      this.collector.on('collect', async (i) => {
        console.log(i);
        if (i.customId === this.banUserID) {
          const discordServer: Snowflake = DISCORD_RELATIONS.get(i.user.id);


/*          if (!discordServerAction.has(discordServer)) {
            discordServerAction.add(discordServer);


          }*/

          const emojiEdit = this.client.emojis.cache.get(DISCORD_EMOJI.get(discordServer));

          const [embed] = i.message.embeds as MessageEmbed[];
          const newEmbed = embed.addField('\u200B', `${emojiEdit} - ✅`, true);

          await i.update({ embeds: [ newEmbed ] });
        }
      });

      this.client.on('guildBanRemove', async (ban) => {
        try {
          if (this.banList.has(ban.user.id)) {
            this.banList.delete(ban.user.id);
          }
        } catch (errorOrException) {
          this.logger.error(`guildBanRemove: ${errorOrException}`);
        }
      });

      this.client.on('guildMemberAdd', async (guildMember) => {
        if (!DISCORD_SERVER_RENAME.has(guildMember.guild.id)) return;
        try {
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
          this.logger.log(`Rename user from ${oldUsername} to ${username}`);
        } catch (errorOrException) {
          this.logger.error(`guildMemberAdd: ${errorOrException}`);
        }
      });
    } catch (errorOrException) {
      this.logger.error(`Rainy: ${errorOrException}`);
    }
  }
}
