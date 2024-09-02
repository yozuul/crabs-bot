import { Injectable } from '@nestjs/common';
import { Ctx, Hears, InjectBot, Message, On, Start, Update, Command } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';

import { Context } from './context.interface';
import { UsersService } from 'src/common/users.service';

@Injectable()
@Update()
export class UserFunctions {
   constructor(
      @InjectBot()
      private readonly bot: Telegraf<Context>,
      private readonly usersService: UsersService
   ) {}

   @On('new_chat_members')
   async userAddChannel(@Ctx() ctx: Context) {
      const groupId = ctx.message['chat'].id.toString()
      if(groupId !== process.env.GROUP_ID) {
         await ctx.reply('🍌')
         ctx.reply('Куда ручонки тянешь свои не мытые')
         await ctx.leaveChat()
         return
      }
      if(ctx.message['new_chat_members'][0].is_bot) return
      const user = this.getUserData(ctx.message)
      const chatMember = ctx.message['new_chat_member']
      ctx.reply('Приветсвую, путник 🎉\nДабы не слушать болтовню, рекомендуем замутать группу, и настроить персональные уведомления о сборах в нашем боте @knightscrab_bot')

      this.usersService.addNew({
         tgId: user.tgId.toString(),
         tgName: chatMember.username,
         name: chatMember.first_name,
      })
   }

   @On('left_chat_member')
   async userLeftChannel(@Ctx() ctx: Context) {
      if(ctx.message['left_chat_participant'].is_bot) return
      ctx.reply('Пока, друг...\nМы будем скучать (нет) 😂')
      const user = this.getUserData(ctx.message)
      this.usersService.deleteById(user.tgId)
   }

   getUserData(msg) {
      return {
         tgId: msg['new_chat_member']?.id || msg['left_chat_member']?.id,
         tgName: msg.from.username,
         name: msg.from.first_name,
      }
   }
}