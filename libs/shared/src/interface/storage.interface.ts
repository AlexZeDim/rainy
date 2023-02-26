import { Collection } from 'discord.js';
import {
  ChannelsEntity,
  GuildsEntity,
  RolesEntity,
  UserPermissionsEntity,
  UsersEntity,
} from '@app/pg';

export interface StorageInterface {
  guildStorage: Collection<string, GuildsEntity>;
  channelStorage: Collection<string, ChannelsEntity>;
  userStorage: Collection<string, UsersEntity>;
  roleStorage: Collection<string, RolesEntity>;
  userPermissionStorage: Collection<string, UserPermissionsEntity>;
}
