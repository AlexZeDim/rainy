import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPermissionsEntity, UsersEntity } from '@app/pg';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Logger } from '@nestjs/common';

export class SeederService {
  private readonly logger = new Logger(SeederService.name, { timestamp: true });

  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(UserPermissionsEntity)
    private readonly userPermissionsRepository: Repository<UserPermissionsEntity>,
  ) {}

  async init(flushAll: boolean) {
    if (flushAll) {
      await this.redisService.flushAll();
    }

    console.log('Test');
  }
}
