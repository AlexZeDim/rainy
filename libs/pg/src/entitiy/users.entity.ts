import { GuildsEntity, TABLE_ENTITY_ENUM } from '@app/pg';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: TABLE_ENTITY_ENUM.USERS })
export class UsersEntity {
  @PrimaryColumn('bigint')
  id: string;

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    name: 'name',
    length: 128,
  })
  name?: string;

  @Column({
    type: 'integer',
    nullable: true,
    default: null,
  })
  discriminator?: number;

  @Column({
    nullable: true,
    default: 'Unknown#0000',
    type: 'varchar',
    name: 'username',
    length: 128,
  })
  username?: string;

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    name: 'token',
    length: 128,
  })
  token?: string;

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    name: 'secret',
    length: 128,
  })
  secret?: string;

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    name: 'avatar',
    length: 128,
  })
  avatar?: string;

  @Column({
    array: true,
    nullable: true,
    type: 'character varying',
  })
  roles: string[];

  @OneToMany(() => GuildsEntity, (guild: GuildsEntity) => guild.ownerUser)
  @JoinColumn({ name: 'id' })
  ownerGuilds: GuildsEntity[];

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
