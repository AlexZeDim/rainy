import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { capitalizeFirstLetter, normalizeDiacritics } from 'normalize-text';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import ms from 'ms';
import path from 'path';
import * as fs from 'fs';
import {
  DISCORD_BAN_REASON_ENUM,
  DISCORD_BANS, DISCORD_CHANNELS,
  DISCORD_CHANNELS_PROTECT,
  DISCORD_CROSS_CHAT_BOT,
  DISCORD_EMOJI,
  DISCORD_LOGS,
  DISCORD_RELATIONS,
  DISCORD_SERVER_PROTECT,
  DISCORD_SERVER_RENAME,
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
  Channel,
  Permissions,
  Collection,
} from 'discord.js';


@Injectable()
export class AppService implements OnApplicationBootstrap {
  private client: Client

  private timeout: number = 1000 * 60 * 60 * 12;

  private channel: TextChannel;

  private collector: InteractionCollector<ButtonInteraction>;

  private commandsMessage: Collection<string, any> = new Collection();

  private commandSlash = [];

  private readonly rest = new REST({ version: '9' }).setToken(process.env.discord);

  private readonly logger = new Logger(
    AppService.name, { timestamp: true },
  );

  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
  ) {}

  private filterBan = async (interaction: ButtonInteraction): Promise<boolean> => {
    try {
      if (!!await this.redisService.get(interaction.customId) && DISCORD_RELATIONS.has(interaction.user.id)) {
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

  async onApplicationBootstrap(): Promise<void> {
    try {
      this.loadCommands();

      // FIXME await this.redisService.flushall();
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

      await this.client.login(process.env.discord);

      await this.rest.put(
        Routes.applicationCommands(this.client.user.id), // TODO user ID probably fix
        { body: this.commandSlash },
      );

      await this.bot();
    } catch (errorOrException) {
      this.logger.error(`Application: ${errorOrException}`);
    }
  }

  private loadCommands(): void {
    const commandFiles = fs
      .readdirSync(path.join(`${__dirname}`, '..', '..', '..', 'apps/discord/libs/shared/commands/'))
      .filter(file => file.endsWith('.ts'));

    for (const file of commandFiles) {
      const command = require(`./commands/${file}`); // Command interface
      this.commandsMessage.set(command.name, command);
      this.commandSlash.push(command.slashCommand.toJSON());
    }
  }

  async bot(): Promise<void> {
    try {
      this.client.on('ready', async () => this.logger.log(`Logged in as ${this.client.user.tag}!`))

      const channel = await this.client.channels.fetch(DISCORD_CHANNELS.CrossChat_BanThread);
      if (!channel || channel.type !== 'GUILD_TEXT') return;

      this.channel = channel as TextChannel;
      this.collector = this.channel.createMessageComponentCollector({ filter: this.filterBan });

      this.client.on('messageCreate', async(message) => {
        try {

          if (
            DISCORD_SERVER_PROTECT.has(message.guildId)
            && DISCORD_CHANNELS_PROTECT.has(message.channelId)
            && message.guild.me.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES, false)
          ) {

            if (
              message.author.id === DISCORD_CROSS_CHAT_BOT
              && message.embeds.length
            ) {
              const [embedMessage] = message.embeds;

              if (
                embedMessage.description.includes('@here')
                || embedMessage.description.includes('@everyone')
                || embedMessage.description.includes('бесплатно')
                || embedMessage.description.includes('нитро')
              ) {
                await message.delete();
              }
            } else if (message.mentions.everyone) {
              await message.delete();
            } else if (message.content.includes('нитро')) {
              await message.delete();
            }
          }
        } catch (errorOrException) {
          this.logger.error(`messageCreate: ${errorOrException}`);
        }
      });

      this.client.on('guildBanAdd', async (ban) => {
        try {
          const guildBan = await ban.fetch();

          if (guildBan.reason && DISCORD_BANS.has(guildBan.reason.toLowerCase())) {

            const emojiEdit = this.client.emojis.cache.get(DISCORD_EMOJI.get(guildBan.guild.id));
            const channel: Channel | null = await this.client.channels.fetch(DISCORD_LOGS);
            if (channel) {
              await (channel as TextChannel).send(`${guildBan.user.id} - ${emojiEdit} ${guildBan.guild.name}`);
            }

            if (!await this.redisService.get(guildBan.user.id)) {

              const buttons = new MessageActionRow()
                .addComponents(
                  new MessageButton()
                    .setCustomId(guildBan.user.id)
                    .setLabel('Ban')
                    .setStyle('DANGER')
                  ,
                );

              const emoji = this.client.emojis.cache.get(DISCORD_EMOJI.get(guildBan.guild.id));

              const embed =
                new MessageEmbed()
                  .setDescription(`**${guildBan.user.username}#${guildBan.user.discriminator}** заблокирован на:`)
                  .addFields({ name: '\u200B', value: `${emoji} - ✅`, inline: true });

              const message = await this.channel.send({ content: `!ban ${guildBan.user.id} CrossBan`, embeds: [embed], components: [buttons] });
              await this.redisService.set(guildBan.user.id, message.id);
              setTimeout(() => message.delete(), this.timeout);
            }
          }
        } catch (errorOrException) {
          this.logger.error(`guildBanAdd: ${errorOrException}`);
        }
      });

      this.collector.on('collect', async (interaction) => {

        if (!!await this.redisService.get(interaction.customId)) {
          const discordServer: Snowflake = DISCORD_RELATIONS.get(interaction.user.id);

          const pressed = await this.redisService.smembers(`${interaction.customId}:button`);

          if (!pressed.includes(discordServer)) {
            await this.redisService.sadd(`${interaction.customId}:button`, discordServer);

            const emojiEdit = this.client.emojis.cache.get(DISCORD_EMOJI.get(discordServer));

            const [embed] = interaction.message.embeds as MessageEmbed[];
            const newEmbed = embed.addField('\u200B', `${emojiEdit} - ✅`, true);

            await interaction.update({ embeds: [ newEmbed ] });
          }
        }
      });

      this.client.on('guildBanRemove', async (ban) => {
        try {
          if (!!await this.redisService.get(ban.user.id)) {
            await this.redisService.del(ban.user.id);
            await this.redisService.del(`${ban.user.id}:button`);
          }
        } catch (errorOrException) {
          this.logger.error(`guildBanRemove: ${errorOrException}`);
        }
      });

      this.client.on('guildMemberAdd', async (guildMember) => {
        try {

          if (!guildMember.guild.me.permissions.has(Permissions.FLAGS.BAN_MEMBERS, false)) return;

          const shield: Record<string, string> = await this.redisService.hgetall(`shield:${guildMember.guild.id}`);

          if (shield.status === 'true') {
            await this.redisService.set(
              `s:${guildMember.guild.id}:${guildMember.user.id}`,
              guildMember.user.id,
              'EX',
              ms(shield.time)
            )

            const groupKeys = await this.redisService.keys(`s:${guildMember.guild.id}:*`);
            const joins: number = parseInt(shield.joins);
            const groupLength: number = groupKeys.length;

            if (groupLength === joins) {
              for (const key of groupKeys) {
                const id = await this.redisService.get(key);
                if (!id) continue;

                await guildMember.guild.members.ban(id, { reason: DISCORD_BAN_REASON_ENUM.shield_en });
              }
            }

            if (groupLength > joins) {
              const id = await this.redisService.get(groupKeys[groupLength - 1]);
              if (id) await guildMember.guild.members.ban(id, { reason: DISCORD_BAN_REASON_ENUM.shield_en });
            }
          }

          if (DISCORD_SERVER_RENAME.has(guildMember.guild.id)) {
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
          }

        } catch (errorOrException) {
          this.logger.error(`guildMemberAdd: ${errorOrException}`);
        }
      });
    } catch (errorOrException) {
      this.logger.error(`Rainy: ${errorOrException}`);
    }
  }
}
