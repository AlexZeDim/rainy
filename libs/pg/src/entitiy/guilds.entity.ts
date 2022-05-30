import { SUBJECT_VECTOR } from '@app/shared';
import { ChannelsEntity, EntitiesEnum } from '@app/pg';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: EntitiesEnum.GUILDS })
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

  // TODO join user
  @Column({
    nullable: false,
    type: 'bigint',
  })
  ownerId: string;

  @OneToMany(() => ChannelsEntity, (channel: ChannelsEntity) => channel.guild)
  @JoinColumn({ name: 'id' })
  channels: ChannelsEntity[];

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
