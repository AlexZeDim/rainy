import { TABLE_ENTITY_ENUM, UserPermissionsEntity } from '@app/pg';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: TABLE_ENTITY_ENUM.PERMISSIONS })
export class PermissionsEntity {
  @PrimaryGeneratedColumn('uuid')
  readonly uuid: string;

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

  @Column({
    name: 'is_discord',
    nullable: false,
    default: false,
  })
  isDiscord: boolean;

  @Column({
    nullable: true,
    default: null,
    type: 'bigint',
    name: 'bitfield',
  })
  bitfield?: string;

  @OneToMany(
    () => UserPermissionsEntity,
    (userPermissions) => userPermissions.permission,
  )
  userPermissions: UserPermissionsEntity[];

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
