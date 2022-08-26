import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from '@nestjs-modules/ioredis';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsEntity, CoreUsersEntity, GuildsEntity, UsersEntity } from '@app/pg';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT, 10),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      logging: true,
      entities: [
        ChannelsEntity,
        GuildsEntity,
        UsersEntity,
        CoreUsersEntity,
      ],
      synchronize: false,
      keepConnectionAlive: true,
      ssl: null,
    }),
    TypeOrmModule.forFeature([
      ChannelsEntity,
      GuildsEntity,
      UsersEntity,
      CoreUsersEntity,
    ]),
    ScheduleModule.forRoot(),
    RedisModule.forRoot({
      config: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT, 10),
        password: process.env.REDIS_PASSWORD,
      },
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
