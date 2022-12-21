import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';

import { capitalizeFirstLetter, normalizeDiacritics } from 'normalize-text';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { REST } from '@discordjs/rest';
import { InjectRepository } from '@nestjs/typeorm';
import { ChannelsEntity, CoreUsersEntity, GuildsEntity, UsersEntity } from '@app/pg';
import { Repository } from 'typeorm';
import { ButtonStyle, GatewayIntentBits, Routes } from 'discord-api-types/v10';
import { MessageActionRowComponentBuilder } from '@discordjs/builders';
import { SeederService } from './seeder/seeder.service';
import { TestService } from './test/test.service';

import {
  DISCORD_CHANNELS_ENUM,
  DISCORD_EMOJI,
  DISCORD_MONK_ROLES,
  DISCORD_MONK_ROLES_BOOST_TITLES,
  DISCORD_RAINON_HOME,
  DISCORD_REASON_BANS,
  DISCORD_ROLES,
  DISCORD_SERVER_RENAME,
  DISCORD_SERVERS_ENUM,
  ISlashCommand,
  Ban, Whoami, Clearance,
  StorageInterface,
} from '@app/shared';

import {
  Client,
  TextChannel,
  Collection,
  GuildMember,
  PartialGuildMember,
  ButtonBuilder,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  Events, Partials,
} from 'discord.js';


@Injectable()
export class AppService implements OnApplicationBootstrap {
  private client: Client;

  private rainyUser: CoreUsersEntity;

  private logsChannel: TextChannel;

  private coreChannel: TextChannel;

  private localStorage: StorageInterface;

  private commandsMessage: Collection<string, ISlashCommand> = new Collection();

  private commandSlash = [];

  private readonly rest = new REST({ version: '10' });

  private readonly logger = new Logger(AppService.name, { timestamp: true });

  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
    @Inject(SeederService)
    private readonly seederService: SeederService,
    @Inject(TestService)
    private readonly testService: TestService,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(GuildsEntity)
    private readonly guildsRepository: Repository<GuildsEntity>,
    @InjectRepository(ChannelsEntity)
    private readonly channelsRepository: Repository<ChannelsEntity>,
    @InjectRepository(CoreUsersEntity)
    private readonly coreUsersRepository: Repository<CoreUsersEntity>,
  ) {}
  async onApplicationBootstrap(): Promise<void> {
    try {
      this.client = new Client({
        partials: [Partials.User, Partials.Channel, Partials.GuildMember],
        intents: [
          GatewayIntentBits.GuildBans,
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildInvites,
        ],
        presence: {
          status: 'online',
        },
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

      if (!rainyUserEntity) throw new NotFoundException(-'Rainy not found!');

      if (!rainyUserEntity.token)
        throw new NotFoundException('Rainy token not found!');

      this.rainyUser = rainyUserEntity;

      await this.client.login(this.rainyUser.token);

      this.rest.setToken(this.rainyUser.token);

      await this.seederService.init(this.client, false);

      this.localStorage = this.seederService.extract();
    } catch (errorOrException) {
      this.logger.error(`loadRainy: ${errorOrException}`);
    }
  }

  private async loadCommands(): Promise<void> {
    this.commandsMessage.set(Ban.name, Ban);
    this.commandSlash.push(Ban.slashCommand.toJSON());
    this.commandsMessage.set(Whoami.name, Whoami);
    this.commandSlash.push(Whoami.slashCommand.toJSON());
    this.commandsMessage.set(Clearance.name, Clearance);
    this.commandSlash.push(Clearance.slashCommand.toJSON());

    await this.rest.put(Routes.applicationCommands(this.client.user.id), {
      body: this.commandSlash,
    });
  }

  async bot(): Promise<void> {
    try {
      this.client.on(Events.ClientReady, async () =>
        this.logger.log(`Logged in as ${this.client.user.tag}!`),
      );

      const channelCoreEntity = this.localStorage.channelStorage.get(DISCORD_CHANNELS_ENUM.Core);
      this.coreChannel = await this.client.channels.fetch(channelCoreEntity.id) as TextChannel;

      const rainyHome = await this.client.guilds.fetch(DISCORD_RAINON_HOME);

      if (!this.coreChannel || this.coreChannel.type !== ChannelType.GuildText) return;

      const channelLogsEntity = this.localStorage.channelStorage.get(DISCORD_CHANNELS_ENUM.Logs);
      this.logsChannel = await this.client.channels.fetch(channelLogsEntity.id) as TextChannel;

      if (!this.coreChannel || this.coreChannel.type !== ChannelType.GuildText) return;

      this.client.on(
        Events.InteractionCreate,
        async (interaction): Promise<void> => {
          /**
           * @description IF button is pressed
           */
          if (interaction.isButton()) {
            if (!this.localStorage.userPermissionStorage.has(interaction.user.id)) {
              await interaction.reply({ ephemeral: true, content: `У вас нет доступа к использованию команд` });
              return;
            }

            const userPermissionsEntity = this.localStorage.userPermissionStorage.get(interaction.user.id);

            const isBanExists = !!await this.redisService.get(interaction.customId);
            if (isBanExists) {
              /**
               * @description Receive state of button clicked
               * @description By each discord representative
               */
              const buttonClicked = await this.redisService.smembers(
                `${interaction.customId}:button`,
              );

              if (!buttonClicked.includes(userPermissionsEntity.guildId)) {
                await this.redisService.sadd(
                  `${interaction.customId}:button`,
                  userPermissionsEntity.guildId,
                );

                const emojiEdit = this.client.emojis.cache.get(
                  DISCORD_EMOJI.get(userPermissionsEntity.guildId),
                );

                const [embed] = interaction.message.embeds;
                const newEmbed = new EmbedBuilder(embed).addFields({
                  name: '\u200B',
                  value: `${emojiEdit} - ✅`,
                  inline: true,
                });

                await interaction.update({ embeds: [newEmbed] });

                const guildCacheExists = this.client.guilds.cache.has(userPermissionsEntity.guildId);
                if (!guildCacheExists) {
                  this.logger.log(`Permissions for user ${interaction.user.id} is exists, but guild ${userPermissionsEntity.guildId} doesn't provided in cache`);
                  this.logger.log(`Trying to fetch guild ${userPermissionsEntity.guildId}...`);

                  try {
                    const guild = await this.client.guilds.fetch(userPermissionsEntity.guildId);
                    await guild.members.ban(interaction.customId, { deleteMessageSeconds: 1000 * 60 * 60 * 24 });
                    await interaction.reply({ ephemeral: true, content: `Как представитель дискорда с ID ${userPermissionsEntity.guildId} вы забанили пользователя с ID ${interaction.customId}` });
                  } catch (errorOrException) {
                    this.logger.error(`Unable to fetch guild ${userPermissionsEntity.guildId} on ban stage, seems it's Missing Access or out of our reach`);
                    console.error(errorOrException);
                  } finally {
                    await interaction.reply({ ephemeral: true, content: `Представитель дискорда с ID ${userPermissionsEntity.guildId} забанил пользователя с ID ${interaction.customId}` });
                  }
                } else {
                  const guild = this.client.guilds.cache.get(userPermissionsEntity.guildId);
                  try {
                    await guild.members.ban(interaction.customId, { deleteMessageSeconds: 1000 * 60 * 60 * 24 });
                    await interaction.reply({ ephemeral: true, content: `Как представитель дискорда с ID ${userPermissionsEntity.guildId} вы забанили пользователя с ID ${interaction.customId}` });
                  } catch (errorOrException) {
                    this.logger.error(`Unable to ban user ${interaction.customId} at guild ${userPermissionsEntity.guildId} on ban stage, seems it's Missing Access or out of our reach`);
                    console.error(errorOrException);
                  }
                }
              } else {
                await interaction.reply({ ephemeral: true, content: `Как представитель дискорда с ID ${userPermissionsEntity.guildId} вы уже забанили пользователя с ID ${interaction.customId}` });
              }
            }
          }

          if (interaction.isCommand()) {
            try {
              if (this.localStorage.userPermissionStorage.has(interaction.user.id)) {
                await interaction.reply({ ephemeral: true, content: `У вас нет доступа к использованию команд` });
                return;
              }

              const command = this.commandsMessage.get(interaction.commandName);
              if (!command) return;

              await command.executeInteraction({
                interaction,
                localStorage: this.localStorage,
                redis: this.redisService,
                logger: this.logger,
              });
            } catch (errorException) {
              this.logger.error(errorException);
              await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true,
              });
            }
          }
        },
      );

      this.client.on(
        Events.GuildMemberUpdate,
        async (
          oldMember: GuildMember | PartialGuildMember,
          newMember: GuildMember,
        ) => {
          if (
            newMember &&
            newMember.guild.id === DISCORD_SERVERS_ENUM.TempleOfFiveDawns
          ) {
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
                await newMember.fetch();
                await newMember.roles.add(DISCORD_MONK_ROLES.BoostMeta);
              }
            }

            // TODO Role has been removed
          }

          if (!rainyHome) return;

          if (
            newMember &&
            newMember.guild.id === DISCORD_SERVERS_ENUM.SanctumOfLight
          ) {
            // Role has been added
            if (oldMember.roles.cache.size < newMember.roles.cache.size) {
              if (newMember.roles.cache.has(DISCORD_ROLES.MoteOfLight)) {
                const rainyGuildMember = await rainyHome.members.fetch(
                  newMember.user.id,
                );
                if (
                  rainyGuildMember &&
                  rainyHome.members.me.permissions.has(
                    PermissionsBitField.Flags.ManageRoles,
                    false,
                  )
                ) {
                  await rainyGuildMember.fetch();
                  await rainyGuildMember.roles.add(DISCORD_ROLES.Supported);
                }
              }
            }

            // Role has been removed
            if (oldMember.roles.cache.size > newMember.roles.cache.size) {
              if (!oldMember.roles.cache.has(DISCORD_ROLES.MoteOfLight)) {
                const rainyGuildMember = await rainyHome.members.fetch(
                  newMember.user.id,
                );
                if (
                  rainyGuildMember &&
                  rainyHome.members.me.permissions.has(
                    PermissionsBitField.Flags.ManageRoles,
                    false,
                  )
                ) {
                  await rainyGuildMember.fetch();
                  await rainyGuildMember.roles.remove(DISCORD_ROLES.Supported);
                }
              }
            }
          }
        },
      );

      this.client.on(Events.GuildBanAdd, async (ban) => {
        try {
          const guildBan = await ban.fetch();

          if (
            guildBan.reason &&
            DISCORD_REASON_BANS.has(guildBan.reason.toLowerCase())
          ) {
            const banOnGuildIcon = this.client.emojis.cache.get(
              DISCORD_EMOJI.get(guildBan.guild.id),
            );

            const { id } = this.localStorage.channelStorage.get(DISCORD_CHANNELS_ENUM.Logs);
            const channelBanLogs = await this.client.channels.fetch(id);
            if (channelBanLogs && channelBanLogs.isTextBased) {
              await (channelBanLogs as TextChannel).send(
                `${guildBan.user.id} - ${banOnGuildIcon} ${guildBan.guild.name}`,
              );
            }

            const userBanExists = await this.redisService.get(guildBan.user.id);
            if (!userBanExists) {
              const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId(guildBan.user.id)
                  .setLabel('Ban')
                  .setStyle(ButtonStyle.Danger),
              ) as ActionRowBuilder<MessageActionRowComponentBuilder>;

              const emoji = this.client.emojis.cache.get(
                DISCORD_EMOJI.get(guildBan.guild.id),
              );

              const embed = new EmbedBuilder()
                .setDescription(
                  `**${guildBan.user.username}#${guildBan.user.discriminator}** заблокирован на:`,
                )
                .addFields({
                  name: '\u200B',
                  value: `${emoji} - ✅`,
                  inline: true,
                });

              const message = await this.coreChannel.send({
                content: `!ban ${guildBan.user.id} CrossBan`,
                embeds: [embed],
                components: [buttons],
              });

              await this.redisService.set(guildBan.user.id, message.id);
            } else {
              const message = await this.coreChannel.messages.fetch(userBanExists);
              if (message && message.embeds) {
                const [embed] = message.embeds;

                const emoji = this.client.emojis.cache.get(
                  DISCORD_EMOJI.get(guildBan.guild.id),
                );

                const newEmbed = new EmbedBuilder(embed).addFields({
                  name: '\u200B',
                  value: `${emoji} - ✅`,
                  inline: true,
                });

                await message.edit({ embeds: [newEmbed] });

                await this.redisService.sadd(
                  `${guildBan.user.id}:button`,
                  guildBan.guild.id,
                );
              }
            }
          }
        } catch (errorOrException) {
          this.logger.error(`${Events.GuildBanAdd}: ${errorOrException}`);
        }
      });

      this.client.on(Events.GuildBanRemove, async (ban) => {
        try {
          if (!!(await this.redisService.get(ban.user.id))) {
            await this.redisService.del(ban.user.id);
            await this.redisService.del(`${ban.user.id}:button`);
          }
        } catch (errorOrException) {
          this.logger.error(`${Events.GuildBanRemove}: ${errorOrException}`);
        }
      });

      this.client.on(Events.GuildMemberAdd, async (guildMember) => {
        try {
          if (DISCORD_SERVER_RENAME.has(guildMember.guild.id)) {
            const oldUsername = guildMember.user.username;
            let username = guildMember.user.username;
            username = username.toLowerCase();
            username = username.normalize('NFD');
            username = normalizeDiacritics(username);
            username = username
              .replace('͜', '')
              .replace('1', 'i')
              .replace('$', 's')
              .replace(/\[.*?]/gi, '')
              .replace(/\(.*?\)/gi, '')
              .replace(/{.*?}/gi, '')
              .replace(/[`~!@#$%^€&*()_|̅+\-=?;:'",.<>{}\[\]\\\/]/gi, '')
              .replace(/\d/g, '');

            const C = username.replace(/[^a-zA-Z]/g, '').length;
            const L = username.replace(/[^а-яА-Я]/g, '').length;

            L >= C
              ? (username = username.replace(/[^а-яА-Я]/g, ''))
              : (username = username.replace(/[^a-zA-Z]/g, ''));

            username =
              username.length === 0
                ? 'Username'
                : capitalizeFirstLetter(username);

            await guildMember.setNickname(username);
            this.logger.log(`Rename user from ${oldUsername} to ${username}`);
          }
        } catch (errorOrException) {
          this.logger.error(`${Events.GuildMemberAdd}: ${errorOrException}`);
        }
      });
    } catch (errorOrException) {
      this.logger.error(`Rainy: ${errorOrException}`);
    }
  }
}
