import {
  ChannelsEntity,
  GuildsEntity,
  PermissionsEntity,
  RolesEntity,
  TABLE_ENTITY_ENUM,
  UsersEntity,
} from '@app/pg';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: TABLE_ENTITY_ENUM.USER_PERMISSIONS })
export class UserPermissionsEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly uuid: string;

  @Column({
    default: null,
    nullable: true,
    type: 'bigint',
    name: 'user_id',
  })
  userId?: string;

  @ManyToOne(() => UsersEntity, (user) => user.userPermissions)
  @JoinColumn({ name: 'user_id' })
  user?: UsersEntity;

  @Column({
    default: null,
    nullable: true,
    type: 'bigint',
    name: 'subject_user_id',
  })
  subjectUserId?: string;

  @ManyToOne(() => UsersEntity, (user) => user.userPermissions)
  @JoinColumn({ name: 'subject_user_id' })
  subjectUser?: UsersEntity;

  @Column({
    default: null,
    nullable: true,
    type: 'uuid',
    name: 'role_uuid',
  })
  roleUuid?: string;

  @Column({
    default: null,
    nullable: true,
    type: 'bigint',
    name: 'role_id',
  })
  roleId?: string;

  @ManyToOne(() => RolesEntity, (roleEntity) => roleEntity.userPermissions)
  @JoinColumn({ name: 'role_id' })
  role?: RolesEntity;

  @Column({
    nullable: false,
    type: 'uuid',
    name: 'permission_uuid',
  })
  permissionUuid: string;

  @ManyToOne(
    () => PermissionsEntity,
    (permissionEntity) => permissionEntity.userPermissions,
  )
  @JoinColumn({ name: 'permission_uuid' })
  permission: PermissionsEntity;

  @Column({
    default: null,
    nullable: true,
    type: 'bigint',
    name: 'channel_id',
  })
  channelId?: string;

  @ManyToOne(
    () => ChannelsEntity,
    (channelsEntity) => channelsEntity.userPermissions,
  )
  @JoinColumn({ name: 'channel_id' })
  channel?: ChannelsEntity;

  @Column({
    default: null,
    nullable: true,
    type: 'uuid',
    name: 'channel_uuid',
  })
  channelUuid?: string;

  @Column({
    default: null,
    nullable: true,
    type: 'bigint',
    name: 'guild_id',
  })
  guildId?: string;

  @ManyToOne(() => GuildsEntity, (guildsEntity) => guildsEntity.userPermissions)
  @JoinColumn({ name: 'guild_id' })
  guild?: GuildsEntity;

  @Column({
    default: null,
    nullable: true,
    type: 'bigint',
    name: 'guild_uuid',
  })
  guildUuid?: string;

  @Column({
    default: false,
    nullable: false,
    type: 'boolean',
    name: 'is_applied',
  })
  isApplied: boolean;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'created_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt?: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    name: 'updated_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt?: Date;
}
