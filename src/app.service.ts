import { Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { capitalizeFirstLetter, normalizeDiacritics } from 'normalize-text';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { InjectRepository } from '@nestjs/typeorm';
import ms from 'ms';
import { CoreUsersEntity, UsersEntity } from '@app/pg';
import { Repository } from 'typeorm';
import { ButtonStyle } from "discord-api-types/v10";
import { MessageActionRowComponentBuilder } from '@discordjs/builders';

import {
  DISCORD_BAN_REASON_ENUM,
  DISCORD_BANS, DISCORD_CHANNELS,
  DISCORD_CHANNELS_PROTECT,
  DISCORD_CROSS_CHAT_BOT,
  DISCORD_EMOJI,
  DISCORD_LOGS,
  DISCORD_MONK_ROLES,
  DISCORD_MONK_ROLES_BOOST_TITLES,
  DISCORD_RAINON_HOME,
  DISCORD_RELATIONS,
  DISCORD_ROLES,
  DISCORD_SERVER_PROTECT,
  DISCORD_SERVER_RENAME,
  DISCORD_SERVERS_ENUM,
  ISlashCommand,
  Massban,
  Shield,
} from '@app/shared';

import {
  Client,
  Snowflake,
  TextChannel,
  InteractionCollector,
  Channel,
  Collection,
  Interaction,
  GuildMember,
  PartialGuildMember,
  ButtonBuilder,
  Partials,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  MappedInteractionTypes,
  MessageComponentType,
  ActionRowBuilder,
  GuildTextBasedChannel,
} from 'discord.js';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private client: Client;

  private rainyUser: CoreUsersEntity;

  private timeout: number = 1000 * 60 * 60 * 12;

  private channel: GuildTextBasedChannel;

  private collector: InteractionCollector<MappedInteractionTypes[MessageComponentType]>;

  private commandsMessage: Collection<string, ISlashCommand> = new Collection();

  private commandSlash = [];

  private readonly rest = new REST({ version: '9' });

  private readonly logger = new Logger(
    AppService.name, { timestamp: true },
  );

  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(CoreUsersEntity)
    private readonly coreUsersRepository: Repository<CoreUsersEntity>,
  ) {}

  private filterBan = async (interaction): Promise<boolean> => {
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
      // FIXME await this.redisService.flushall();
      this.client = new Client({
        partials: [
          Partials.User,
          Partials.Channel,
          Partials.GuildMember,
        ],
        intents: [
          GatewayIntentBits.GuildBans,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildInvites,
          GatewayIntentBits.GuildMessages,
        ],
        presence: {
          status: 'online'
        }
      });

      await this.loadRainy();

      await this.loadCommands();

      await this.bot();
    } catch (errorOrException) {
      this.logger.error(`Application: ${errorOrException}`);
    }
  }

  private async loadRainy(): Promise<void> {
    try {
      const rainyUserEntity = await this.coreUsersRepository.findOneBy({
        name: 'Rainy',
      });

      if (!rainyUserEntity)
        throw new NotFoundException('Rainy not found!');

      if (!rainyUserEntity.token)
        throw new NotFoundException('Rainy token not found!');

      this.rainyUser = rainyUserEntity;

      await this.client.login(this.rainyUser.token);

      this.rest.setToken(this.rainyUser.token)
    } catch (errorOrException) {
      this.logger.error(`loadOraculum: ${errorOrException}`);
    }
  }

  private async loadCommands(): Promise<void> {
    this.commandsMessage.set(Shield.name, Shield);
    this.commandSlash.push(Shield.slashCommand.toJSON());
    this.commandsMessage.set(Massban.name, Massban);
    this.commandSlash.push(Massban.slashCommand.toJSON());

    await this.rest.put(
        Routes.applicationCommands(this.client.user.id),
        { body: this.commandSlash },
    );
  }

  async bot(): Promise<void> {
    try {
      this.client.on('ready', async () => this.logger.log(`Logged in as ${this.client.user.tag}!`))

      const channel = await this.client.channels.fetch(DISCORD_CHANNELS.CrossChat_BanThread);
      const rainyHome = await this.client.guilds.fetch(DISCORD_RAINON_HOME);

      if (!channel || channel.type !== ChannelType.GuildText) return;

      this.channel = channel as GuildTextBasedChannel;
      this.collector = this.channel.createMessageComponentCollector({ filter: this.filterBan, time: 0 });

      this.client.on('interactionCreate', async (interaction: Interaction): Promise<void> => {
        if (!interaction.isCommand()) return;

        if (!DISCORD_RELATIONS.has(interaction.user.id)) return;

        const guildId = DISCORD_RELATIONS.get(interaction.user.id);
        if (guildId !== interaction.guild.id) return;

        const command = this.commandsMessage.get(interaction.commandName);
        if (!command) return;

        try {
          await command.executeInteraction({ interaction, redis: this.redisService, logger: this.logger });
        } catch (errorException) {
          this.logger.error(errorException);
          await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
      });

      this.client.on('messageCreate', async(message) => {
        try {
          if (
            DISCORD_SERVER_PROTECT.has(message.guildId)
            && DISCORD_CHANNELS_PROTECT.has(message.channelId)
            && message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageMessages, false)
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

      this.client.on('guildMemberUpdate', async (
          oldMember: GuildMember | PartialGuildMember,
          newMember: GuildMember
      ) => {
        if (newMember && newMember.guild.id === DISCORD_SERVERS_ENUM.TempleOfFiveDawns) {
          let flag = false;
          // Role has been added
          if (oldMember.roles.cache.size < newMember.roles.cache.size) {
            for (const roleId of Array.from(newMember.roles.cache.keys())) {
              if (DISCORD_MONK_ROLES_BOOST_TITLES.has(roleId)) {
                flag = true;
                break;
              }
            }

            if (flag) {
              await newMember.roles.add(DISCORD_MONK_ROLES.BoostMeta);
            }
          }

          // TODO Role has been removed
        }

        if (!rainyHome) return;

        if (newMember && newMember.guild.id === DISCORD_SERVERS_ENUM.SanctumOfLight) {
          // Role has been added
          if (oldMember.roles.cache.size < newMember.roles.cache.size) {
            if (newMember.roles.cache.has(DISCORD_ROLES.MoteOfLight)) {
              const rainyGuildMember = await rainyHome.members.fetch(newMember.user.id);
              if (rainyGuildMember && rainyHome.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles, false)) {
                  await rainyGuildMember.roles.add(DISCORD_ROLES.Supported);
              }
            }
          }

          // Role has been removed
          if (oldMember.roles.cache.size > newMember.roles.cache.size) {
            if (!oldMember.roles.cache.has(DISCORD_ROLES.MoteOfLight)) {

              const rainyGuildMember = await rainyHome.members.fetch(newMember.user.id);
              if (rainyGuildMember && rainyHome.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles, false)) {
                await rainyGuildMember.roles.remove(DISCORD_ROLES.Supported);
              }
            }
          }
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

              const buttons = new ActionRowBuilder()
                .addComponents(
                  new ButtonBuilder()
                    .setCustomId(guildBan.user.id)
                    .setLabel('Ban')
                    .setStyle(ButtonStyle.Danger)
                ) as ActionRowBuilder<MessageActionRowComponentBuilder>;

              const emoji = this.client.emojis.cache.get(DISCORD_EMOJI.get(guildBan.guild.id));

              const embed =
                new EmbedBuilder()
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

            const [embed] = interaction.message.embeds as unknown as EmbedBuilder[];
            const newEmbed = embed.addFields({ name: '\u200B', value: `${emojiEdit} - ✅`, inline: true });

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

          if (!guildMember.guild.members.me.permissions.has(PermissionsBitField.Flags.BanMembers, false)) return;

          const shield: Record<string, string> = await this.redisService.hgetall(`shield:${guildMember.guild.id}`);

          if (shield.status === 'true') {
            await this.redisService.set(
              `s:${guildMember.guild.id}:${guildMember.user.id}`,
              guildMember.user.id,
              'EX',
              ms(shield.time)
            );

            this.logger.log(`guildMemberAdd: key s:${guildMember.guild.id}:${guildMember.user.id} added for ${ms(shield.time)}`);

            const groupKeys = await this.redisService.keys(`s:${guildMember.guild.id}:*`);
            const joins: number = parseInt(shield.joins);
            const groupLength: number = groupKeys.length;

            this.logger.log(`Server threshold joins: ${joins} Total group keys: ${groupLength}`);

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
