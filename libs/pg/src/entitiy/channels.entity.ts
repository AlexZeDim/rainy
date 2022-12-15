import {
  GuildsEntity,
  TABLE_ENTITY_ENUM,
  UserPermissionsEntity,
} from '@app/pg';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: TABLE_ENTITY_ENUM.CHANNELS })
export class ChannelsEntity {
  @PrimaryColumn('bigint')
  id: string;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 128,
  })
  name: string;

  @Index()
  @Column({
    default: null,
    nullable: true,
    type: 'varchar',
    name: 'guild_id',
  })
  guildId?: string;

  @ManyToOne(() => GuildsEntity, (guild: GuildsEntity) => guild.id)
  @JoinColumn({ name: 'guild_id' })
  guild: GuildsEntity;

  @OneToMany(
    () => UserPermissionsEntity,
    (userPermissions) => userPermissions.channel,
  )
  userPermissions: UserPermissionsEntity[];

  @Column({
    default: null,
    nullable: true,
    type: 'varchar',
    name: 'parent_id',
    length: 128,
  })
  parentId?: string;

  @Column({
    default: 'UNKNOWN',
    nullable: true,
    type: 'varchar',
    name: 'channel_type',
    length: 128,
  })
  channelType?: string;

  @Column({
    name: 'is_watch',
    nullable: false,
    default: false,
  })
  isWatch: boolean;

  @Column({
    name: 'is_deleted',
    nullable: false,
    default: false,
  })
  isDeleted?: boolean;

  @Column({
    name: 'is_redacted',
    nullable: false,
    default: false,
  })
  isRedacted: boolean;

  @Column({
    default: null,
    nullable: true,
    type: 'varchar',
    name: 'scanned_by',
    length: 128,
  })
  scannedBy?: string;

  @Column('timestamp with time zone', {
    name: 'scanned_at',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  scannedAt?: Date;

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
