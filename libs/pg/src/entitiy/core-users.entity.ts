import { TABLE_ENTITY_ENUM, UsersEntity } from '@app/pg';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Index('ix__core_users__name', ['name'], {})
@Entity({ name: TABLE_ENTITY_ENUM.CORE_USERS })
export class CoreUsersEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly uuid: string;

  @Column({
    nullable: false,
    type: 'bigint',
    name: 'user_id',
  })
  userId: string;

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    name: 'name',
    length: 128,
  })
  name?: string;

  @OneToOne(() => UsersEntity, (user) => user.coreUser)
  @JoinColumn({ name: 'user_id' })
  user: UsersEntity;

  @Column({
    nullable: true,
    default: null,
    type: 'varchar',
    name: 'token',
    length: 256,
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
    type: 'bigint',
    name: 'control_channel_id',
  })
  controlChannelId?: string;

  @Column({
    name: 'is_ora_taken',
    nullable: true,
    default: false,
  })
  isOraculumTaken?: boolean;

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
