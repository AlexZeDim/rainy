import { TABLE_ENTITY_ENUM } from '@app/pg/enum';
import { GuildsEntity, UserPermissionsEntity } from '@app/pg';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity({ name: TABLE_ENTITY_ENUM.ROLES })
export class RolesEntity {
  @PrimaryColumn('bigint')
  id: string;

  @Column({
    nullable: false,
    type: 'varchar',
    name: 'name',
    length: 128,
  })
  name: string;

  @Column({
    default: null,
    nullable: true,
    type: 'varchar',
    name: 'description',
  })
  description?: string;

  // TODO @Index()
  @Column({
    default: null,
    nullable: true,
    type: 'bigint',
    name: 'guild_id',
  })
  guildId?: string;

  @ManyToOne(() => GuildsEntity, (guild) => guild.roles)
  @JoinColumn({ name: 'guild_id' })
  guild: GuildsEntity;

  @Column({
    nullable: true,
    default: null,
    type: 'bigint',
    name: 'bitfield',
  })
  bitfield?: string;

  @Column({
    nullable: true,
    default: false,
    type: 'boolean',
    name: 'is_mentionable',
  })
  isMentionable: boolean;

  @Column({
    nullable: true,
    default: null,
    type: 'int',
    name: 'position',
  })
  position?: number;

  @OneToMany(
    () => UserPermissionsEntity,
    (userPermissions) => userPermissions.role,
  )
  userPermissions: UserPermissionsEntity[];

  @Column({
    default: null,
    nullable: true,
    type: 'varchar',
    name: 'created_by',
    length: 128,
  })
  createdBy?: string;

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
