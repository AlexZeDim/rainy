import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client, Collection } from 'discord.js';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

import {
  DISCORD_CHANNELS_ENUM,
  DISCORD_GUILDS_ENUM,
  DISCORD_MONK_ROLES_BOOST_TITLES,
  DISCORD_RELATIONS,
  DISCORD_SERVERS_ENUM,
  StorageInterface,
  SUBJECT_VECTOR
} from '@app/shared';

import {
  ChannelsEntity,
  GuildsEntity,
  PermissionsEntity,
  RolesEntity,
  UserPermissionsEntity,
  UsersEntity
} from '@app/pg';


@Injectable()
export class SeederService {
  private readonly logger = new Logger(SeederService.name, { timestamp: true });
  private client: Client;
  private guildStorage: Collection<string, GuildsEntity> = new Collection<string, GuildsEntity>();
  private userStorage: Collection<string, UsersEntity> = new Collection<string, UsersEntity>();
  private roleStorage: Collection<string, RolesEntity> = new Collection<string, RolesEntity>();
  private channelStorage: Collection<string, ChannelsEntity> = new Collection<string, ChannelsEntity>();
  private localStorage: StorageInterface;
  private userPermissionStorage: Collection<string, UserPermissionsEntity> = new Collection<string, UserPermissionsEntity>();
  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(ChannelsEntity)
    private readonly channelsRepository: Repository<ChannelsEntity>,
    @InjectRepository(RolesEntity)
    private readonly rolesRepository: Repository<RolesEntity>,
    @InjectRepository(GuildsEntity)
    private readonly guildsRepository: Repository<GuildsEntity>,
    @InjectRepository(PermissionsEntity)
    private readonly permissionsRepository: Repository<PermissionsEntity>,
    @InjectRepository(UserPermissionsEntity)
    private readonly userPermissionsRepository: Repository<UserPermissionsEntity>,
  ) {}

  async init(client: Client, flushAll: boolean) {
    this.logger.log('seeder started!');

    if (!client) {
      throw new ServiceUnavailableException('Rainy client has not been initiated!');
    }

    if (flushAll) {
      await this.redisService.flushall();
    }

    this.client = client;

    await this.initGuilds();
    await this.initDiscordRoles();
    await this.initUserPermissions();
    await this.initChannels();

    this.logger.log('seeder ended!');
  }

  /**
   * @description Extract in-memory storage after init
   */
  public extract(): StorageInterface {
    this.localStorage.guildStorage = this.guildStorage;
    this.localStorage.userStorage = this.userStorage;
    this.localStorage.roleStorage = this.roleStorage;
    this.localStorage.channelStorage = this.channelStorage;
    this.localStorage.userPermissionStorage = this.userPermissionStorage;

    return this.localStorage;
  }

  async initGuilds() {
    for (const guild in DISCORD_SERVERS_ENUM) {
      const guildId: DISCORD_SERVERS_ENUM =
        DISCORD_SERVERS_ENUM[guild as keyof typeof DISCORD_SERVERS_ENUM];

      let guildEntity = await this.guildsRepository.findOneBy({
        id: guildId,
      });

      if (!guildEntity) {
        let discordGuild;
        try {
          discordGuild = await this.client.guilds.fetch(guildId);
        } catch (errorOrException) {
          this.logger.error(errorOrException);
        }

        if (!discordGuild) {
          this.logger.log(`Guild: ${guildId}:${guild} is out of our reach index, skipping...`);
          continue;
        }

        guildEntity = this.guildsRepository.create({
          id: discordGuild.id,
          name: discordGuild.name,
          icon: discordGuild.icon,
          ownerId: discordGuild.ownerId,
          membersNumber: discordGuild.memberCount,
          vector: SUBJECT_VECTOR.CLASS_HALL,
          isWatch: false,
          scannedBy: this.client.user.id,
        });

        guildEntity = await this.guildsRepository.save(guildEntity);
      }

      this.guildStorage.set(guildEntity.id, guildEntity);
    }
  }

  async initChannels() {
    const guildModeration = await this.guildsRepository.findOneBy({ name: DISCORD_GUILDS_ENUM.ModerChat });

    this.guildStorage.set(guildModeration.id, guildModeration);

    const channelBanThread = await this.channelsRepository.findOneBy({ name: DISCORD_CHANNELS_ENUM.Core, guildId: guildModeration.id });
    const channelCrossBanLog = await this.channelsRepository.findOneBy({ name: DISCORD_CHANNELS_ENUM.Logs, guildId: guildModeration.id });

    this.channelStorage.set(channelBanThread.id, channelBanThread);
    this.channelStorage.set(channelCrossBanLog.id, channelCrossBanLog);
  }

  async initDiscordRoles() {
    const guildEntityMonk = await this.guildsRepository.findOneBy({ name: DISCORD_GUILDS_ENUM.TempleOfFiveDawns });
    if (!guildEntityMonk) {
      this.logger.log(`Monk Discord not found!`);
      return;
    }

    const discordGuildMonk = await this.client.guilds.fetch(guildEntityMonk.id);
    if (!discordGuildMonk) {
      this.logger.log(`Discord ${guildEntityMonk.name} not found!`);
      return;
    }

    for (const roleId of DISCORD_MONK_ROLES_BOOST_TITLES.values()) {
      let roleEntity = await this.rolesRepository.findOneBy({
        id: roleId,
      });

      if (!roleEntity) {
        const discordRole = await discordGuildMonk.roles.fetch(roleId);
        if (!discordRole) {
          this.logger.log(`Role: ${roleId} is out of our reach index, skipping...`);
          continue;
        }

        roleEntity = this.rolesRepository.create({
          id: discordRole.id,
          name: discordRole.name,
          guildId: guildEntityMonk.id,
          bitfield: discordRole.permissions.bitfield.toString(),
          isMentionable: true,
          position: discordRole.position,
        });

        roleEntity = await this.rolesRepository.save(roleEntity);
      }

      this.roleStorage.set(roleId, roleEntity);
    }
  }

  async initUserPermissions() {
    for (const [userId, guildId] of DISCORD_RELATIONS.entries()) {
      let userEntity = await this.usersRepository.findOneBy({ id: userId });

      if (!userEntity) {
        const discordUser = await this.client.users.fetch(userId);
        if (!discordUser) {
          this.logger.log(`User: ${userId} is out of our reach index, skipping...`);
          continue;
        }

        userEntity = this.usersRepository.create({
          id: discordUser.id,
          name: discordUser.username,
          discriminator: Number(discordUser.discriminator),
          username: `${discordUser.username}#${discordUser.discriminator}`,
          avatar: discordUser.avatar,
          scannedBy: this.client.user.id,
        });

        userEntity = await this.usersRepository.save(userEntity);
      }

      this.userStorage.set(userEntity.id, userEntity);

      const commandPermissionEntity = await this.permissionsRepository.findOneBy({ name: 'COMMAND' });

      const isGuildExists = this.guildStorage.has(guildId);
      if (!isGuildExists) {
        this.logger.log(`User ${userId} with guild ${guildId} not found!`);
        continue;
      }

      const guildEntity = this.guildStorage.get(guildId);
      /**
       * @description Create user-guild-permission
       */
      let userPermissionEntity = await this.userPermissionsRepository.findOneBy({
        userId: userEntity.id,
        permissionUuid: commandPermissionEntity.uuid,
        guildId: guildEntity.id,
        subjectUserId: this.client.user.id,
      });

      if (!userPermissionEntity) {
        userPermissionEntity = this.userPermissionsRepository.create({
          userId: userEntity.id,
          permissionUuid: commandPermissionEntity.uuid,
          guildId: guildEntity.id,
          subjectUserId: this.client.user.id,
          isApplied: true,
        });

        await this.userPermissionsRepository.save(userPermissionEntity);
      }

      this.userPermissionStorage.set(userPermissionEntity.userId, userPermissionEntity);
    }
  }
}
