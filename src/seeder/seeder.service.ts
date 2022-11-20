import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GuildsEntity, UserPermissionsEntity, UsersEntity } from '@app/pg';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { Logger } from '@nestjs/common';
import { DISCORD_SERVERS_ENUM } from '@app/shared';

export class SeederService {
  private readonly logger = new Logger(SeederService.name, { timestamp: true });

  constructor(
    @InjectRedis()
    private readonly redisService: Redis,
    @InjectRepository(UsersEntity)
    private readonly usersRepository: Repository<UsersEntity>,
    @InjectRepository(GuildsEntity)
    private readonly guildsRepository: Repository<GuildsEntity>,
    @InjectRepository(UserPermissionsEntity)
    private readonly userPermissionsRepository: Repository<UserPermissionsEntity>,
  ) {}

  async init(flushAll: boolean) {
    if (flushAll) {
      await this.redisService.flushAll();
    }

    await this.initGuilds();
    this.logger.log('Test');
  }

  async initGuilds() {
    for (const guild in DISCORD_SERVERS_ENUM) {
      const guildId: DISCORD_SERVERS_ENUM =
        DISCORD_SERVERS_ENUM[guild as keyof typeof DISCORD_SERVERS_ENUM];

      const guildEntity = await this.guildsRepository.findOneBy({
        id: guildId,
      });

      /** TODO fetchGuild IF Y write ELSE skip **/

      this.logger.log(guildId, guildEntity);
      console.log(guildEntity);
    }
  }

  async initUserPermissions() {

  }
}
