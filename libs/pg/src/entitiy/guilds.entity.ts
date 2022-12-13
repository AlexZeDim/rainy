import { SUBJECT_VECTOR } from '@app/shared';
import {
  ChannelsEntity,
  RolesEntity,
  TABLE_ENTITY_ENUM,
  UserPermissionsEntity,
  UsersEntity,
} from '@app/pg';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: TABLE_ENTITY_ENUM.GUILDS })
export class GuildsEntity {
  @PrimaryColumn('bigint')
  id: string;

  @Column({
    nullable: false,
    type: 'varchar',
    length: 128,
  })
  name: string;

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    name: 'icon',
    length: 128,
  })
  icon?: string;

  @Column({
    nullable: false,
    type: 'bigint',
    name: 'owner_id',
  })
  ownerId: string;

  @ManyToOne(() => UsersEntity, (user: UsersEntity) => user.id)
  @JoinColumn({ name: 'owner_id' })
  ownerUser: UsersEntity;

  @OneToMany(() => ChannelsEntity, (channel: ChannelsEntity) => channel.guild)
  @JoinColumn({ name: 'id' })
  channels: ChannelsEntity[];

  @OneToMany(() => RolesEntity, (roles: RolesEntity) => roles.guild)
  roles: RolesEntity[];

  @OneToMany(
    () => UserPermissionsEntity,
    (userPermissions) => userPermissions.guild,
  )
  userPermissions: UserPermissionsEntity[];

  @Column({
    nullable: true,
    name: 'members_number',
    type: 'int',
  })
  membersNumber?: number;

  @Column({
    default: SUBJECT_VECTOR.UNCLASSIFIED,
    enum: SUBJECT_VECTOR,
    nullable: false,
    type: 'enum',
    name: 'vector',
  })
  vector?: string;

  @Column({
    name: 'is_watch',
    nullable: false,
    default: false,
  })
  isWatch: boolean;

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
