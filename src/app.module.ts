import { resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { TelegrafModule } from 'nestjs-telegraf';
import * as LocalSession from 'telegraf-session-local';

import { CommonModule } from './common/common.module';
import { BotModule } from './bot/bot.module';

import { NotifyOptions, Profession, User, UserProfession } from './common/models';

const sessions = new LocalSession({ database: 'session_db.json' });

@Module({
  imports: [
    ConfigModule.forRoot({
       isGlobal: true,
       envFilePath: '.env',
    }),
    SequelizeModule.forRoot({
       dialect: 'sqlite',
       storage: resolve('crabs.db'),
       models: [User, Profession, UserProfession, NotifyOptions],
       autoLoadModels: true,
       logging: false
    }),
    TelegrafModule.forRoot({
       middlewares: [sessions.middleware()],
       token: process.env.BOT_TOKEN,
    }),
    CommonModule, BotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
