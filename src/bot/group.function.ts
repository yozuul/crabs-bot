import { Injectable } from '@nestjs/common';
import { Ctx, Hears, InjectBot, Message, On, Start, Update, Command } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';

import { Context } from './context.interface';
import { UsersService } from 'src/common/users.service';

@Injectable()
@Update()
export class GroupFunctions {
   constructor(
      @InjectBot()
      private readonly bot: Telegraf<Context>,
      private readonly usersService: UsersService
   ) {}

   @Command('pve')
   async pvePoll(@Message('text') msg: string, @Ctx() ctx: Context) {
      await this.pushPoll(ctx, msg, 'pve')
   }

   @Command('pvp')
   async pvpPoll(@Message('text') msg: string, @Ctx() ctx: Context) {
      await this.pushPoll(ctx, msg, 'pvp')
   }

   @Command('pin')
   async pin(@Message('text') msg: string, @Ctx() ctx: Context) {
      const text = msg.split(' ').slice(1).join(' ');

      try {
        const inviteMessage = await ctx.reply(`❗️ ` + text);
        await ctx.telegram.pinChatMessage(ctx.chat.id, inviteMessage.message_id);
      } catch (error) {
        console.error('Ошибка при отправке сообщения:', error);
        ctx.reply('Не удалось отправить сообщение.');
      }
   }

   @Command('getgroupid')
   async getGroupid (@Ctx() ctx: Context) {
      console.log(ctx.update['message'].chat.id)
   }
   @Command('thread')
   async getThread (@Ctx() ctx: Context) {
      console.log(ctx.message.message_thread_id)
   }
   @Command('botinfo')
   async getBotInfo (@Ctx() ctx: Context) {
      console.log(this.bot)
   }

   async pushPoll(ctx, msg, type) {
      const text = msg.split(' ').slice(1).join(' ');
      const pollOptions = [
        'Маг', 'Маг', 'ОЛ', 'Биш', 'Залив', 'БД', 'СВС', 'Спойл', 'Конь'
      ];

      try {
        const pollMessage = await ctx.replyWithPoll(
         type === 'pve' ? '🦀 Покрабить ' + text : '⚔️ Подраться ' + text,
         pollOptions, {
          is_anonymous: false, allows_multiple_answers: true
       })
        await ctx.telegram.pinChatMessage(ctx.chat.id, pollMessage.message_id);
      } catch (error) {
        console.error('Ошибка при создании опроса:', error);
        ctx.reply('Не удалось создать опрос.');
      }
   }
}