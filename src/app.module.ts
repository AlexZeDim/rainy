import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    RedisModule.forRoot({
      config: {
        host: process.env.redis,
        port: parseInt(process.env.port, 10),
      },
    }),
  ],
  providers: [AppService],
})
export class AppModule {}
