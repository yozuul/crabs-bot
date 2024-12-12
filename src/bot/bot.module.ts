import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { BotUpdate } from './bot.update';
import { GroupFunctions } from './group.function';
import { UserFunctions } from './users.function';
import { KnightsBotService } from './knight-timer';

@Module({
   imports: [
      CommonModule
   ],
   providers: [
      BotUpdate, GroupFunctions, UserFunctions, KnightsBotService
   ],
})
export class BotModule {}
