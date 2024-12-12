import { Injectable } from '@nestjs/common';
import { CallbackQuery } from 'telegraf/typings/core/types/typegram';
import { Command, Ctx, Hears, InjectBot, Message, On, Start, Update, Action } from 'nestjs-telegraf';
import { Telegraf, Markup } from 'telegraf';

import { Context } from './context.interface';
import { UsersService } from 'src/common/users.service';
import { ProfessionsService } from 'src/common/professions.service';
import { ButtonsBuilder } from './buttons.builder';

@Injectable()
@Update()
export class BotUpdate {
   private professionMap = {
      1: 'mag', 2: 'bp', 3: 'ee', 4: 'ol',
      5: 'bd', 6: 'sws', 7: 'spoil', 8: 'pony'
   };
   private defaultOptions = {
      mag: false, bp: false, ee: false, ol: false,
      bd: false, sws: false, spoil: false, pony: false, all: false, unall: false,
      knights: true, krug: true, soa: true,
      notify: false
   };
   constructor(
      @InjectBot()
      private readonly bot: Telegraf<Context>,
      private readonly usersService: UsersService,
      private readonly professionsService: ProfessionsService
   ) {}

   @Start()
   async startCommand(ctx: Context) {
      // console.log(ctx.message.message_thread_id)
      ctx.session.options = this.defaultOptions
      // if(ctx.message.chat.type === 'supergroup') return
      const user = this.getUserData(ctx.message)

      const groupId = process.env.GROUP_ID
      const userId = user.tgId

      try {
         const chatMember = await this.bot.telegram.getChatMember(groupId, userId);
         const status = chatMember.status
         // ctx.session.options.groupStatus = chatMember['custom_title'] || 'Листья'
         if (status === 'member' || status === 'administrator' || status === 'creator') {
            const existUser = await this.usersService.addNew(user)
            await this.usersService.updateStatus(existUser.id, chatMember['custom_title'] || existUser?.name)

            ctx.session.userId = existUser.id

            ctx.session.options.notify = existUser.notify
            ctx.session.options.knights = existUser.knights
            ctx.session.options.krug = existUser.krug
            ctx.session.options.soa = existUser.soa
            // console.log(existUser)
            await this.markActiveOptions(ctx, existUser.id)
            await ctx.reply('МОИ ПРОФЫ',
               Markup.inlineKeyboard(new ButtonsBuilder(ctx.session.options).professions)
            );
            await ctx.reply('ЛОКАЦИИ',
               Markup.inlineKeyboard(new ButtonsBuilder(ctx.session.options).locations)
            );
            await ctx.reply('УВЕДОМЛЕНИЯ',
               Markup.inlineKeyboard(new ButtonsBuilder(ctx.session.options).notify)
            );
            // console.log('Пользователь состоит в группе.')
         } else {
            await ctx.reply('🍌')
            ctx.reply('Ты не можешь пользоваться этим ботом, дружок')
            // console.log('Пользователь не состоит в группе или был удален.');
         }
      } catch (error) {
         if (error.response?.error_code === 400) {
            console.log('Группа не найдена или бот не имеет доступа.');
         } else {
            console.error('Ошибка при проверке пользователя:', error);
         }
      }
   }

   async getDefaultOptions() {
      const defaultSelectedOptions = await this.professionsService.gelDefaultNotify()
      let formatedOptions = {}
      for (let item of defaultSelectedOptions) {
         formatedOptions[item.name] = item['notify']
      }
      return formatedOptions
   }
   @Command('invite')
   async notifier(@Ctx() ctx: Context) {
      if(ctx.update['message'].from.id !== 1884297416) return
      let formatedOptions = await this.getDefaultOptions()
      ctx.session.options = formatedOptions
      await ctx.reply('НАМ НУЖНЫ',
         Markup.inlineKeyboard(new ButtonsBuilder(ctx.session.options).combine),
      );
   }
   @Action('notify_all')
   async notify(@Ctx() ctx: Context) {
      const userTgId = ctx.update['callback_query'].from.id
      const { status } = await this.usersService.findById(userTgId)
      console.log(status)
      const chatId = process.env.GROUP_ID;
      const threadId = 33471
      const currentSelected = await this.getDefaultOptions()
      const filtered = Object.values(currentSelected)
      .map((value, index) => value === 1 ? index + 1 : null)
      .filter(value => value !== null);
      const notifyData = await this.usersService.findUsersToNotify(currentSelected, filtered)
      const message = {
         location: '', professions: '', users: ''
      }
      message.location = (currentSelected['knights'] ? 'Кнайты' : '') +
      (currentSelected['krug'] ? ' Круг' : '') +
      (currentSelected['soa'] ? ' СОА' : '')

      for (let profession of notifyData.professions) {
         message.professions += profession['name'] + ' '
      }
      for (let user of notifyData.users) {
         const userLink = `tg://user?id=${user.tgId}`;
         message.users += `[${user.status}](${userLink}) `
      }
      let combninedMessage = `[${status}](tg://user?id=${userTgId}) объявляет сбор!\n`
      if(!message.users) {
         combninedMessage += 'Нам нужны: '
         for (let item in currentSelected) {
            if(currentSelected[item] === 1) {
               item === 'mag' ? combninedMessage += 'Маг ' :
               item === 'bp' ? combninedMessage += 'Биш ' :
               item === 'ee' ? combninedMessage += 'Залив ' :
               item === 'ol' ? combninedMessage += 'Овер ' :
               item === 'bd' ? combninedMessage += 'БД ' :
               item === 'sws' ? combninedMessage += 'СВС ' :
               item === 'spoil' ? combninedMessage += 'Спойл ' :
               item === 'pony' ? combninedMessage += 'Пони ' :
               item === 'knights' ? combninedMessage += '\nКнайты ' :
               item === 'krug' ? combninedMessage += '\nКруг '
               : combninedMessage += '\nСОА'
            }
         }
      } else {
         combninedMessage += `Нам нужны: ${message.professions}на ${message.location}\n${message.users}`
      }
      combninedMessage += `\n[Настройки оповещений](tg://resolve?domain=knightscrab_bot)`
      const { message_id } = await ctx.telegram.sendMessage(chatId, combninedMessage, {
         message_thread_id: threadId,
         parse_mode: 'Markdown'
      });
      await ctx.telegram.pinChatMessage(ctx.chat.id, message_id);
      await ctx.answerCbQuery('Рассылка выполнена');
   }
   @Action('toggle_mag')
   async toggleMag(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      await ctx.answerCbQuery(
         `${ctx.session.options.mag ? 'Маг выбран' : 'Маг отменён'}`
      );
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.mag = !ctx.session.options.mag;
         await this.editProfessionsBtn(ctx, ctx.session.options)
         await this.professionsService.toggleProfession(
            ctx.session.userId, 1, ctx.session.options.mag
         )
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['mag'] = !currentSelected['mag']
         await this.editProfessionsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'mag', currentSelected['mag']
         )
         await ctx.answerCbQuery(
            `${currentSelected['bp'] ? 'Маг выбран' : 'Маг отменён'}`
         );
      }
   }
   @Action('toggle_bp')
   async toggleBish(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.bp = !ctx.session.options.bp;
         await this.editProfessionsBtn(ctx, ctx.session.options)
         await this.professionsService.toggleProfession(
            ctx.session.userId, 2, ctx.session.options.bp
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.bp ? 'Биш выбран' : 'Биш отменён'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['bp'] = !currentSelected['bp']
         await this.editProfessionsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'bp', currentSelected['bp']
         )
         await ctx.answerCbQuery(
            `${currentSelected['bp'] ? 'Биш выбран' : 'Биш отменён'}`
         );
      }
   }
   @Action('toggle_ee')
   async toggleEE(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.ee = !ctx.session.options.ee;
         await this.editProfessionsBtn(ctx, ctx.session.options)
         await this.professionsService.toggleProfession(
            ctx.session.userId, 3, ctx.session.options.ee
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.ee ? 'Залив выбран' : 'Залив отменён'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['ee'] = !currentSelected['ee']
         await this.editProfessionsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'ee', currentSelected['ee']
         )
         await ctx.answerCbQuery(
            `${currentSelected['ee'] ? 'Залив выбран' : 'Залив отменён'}`
         );
      }
   }
   @Action('toggle_ol')
   async toggleOL(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.ol = !ctx.session.options.ol;
         await this.editProfessionsBtn(ctx, ctx.session.options)
         await this.professionsService.toggleProfession(
            ctx.session.userId, 4, ctx.session.options.ol
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.ol ? 'Овер выбран' : 'Овер отменён'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['ol'] = !currentSelected['ol']
         await this.editProfessionsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'ol', currentSelected['ol']
         )
         await ctx.answerCbQuery(
            `${currentSelected['ol'] ? 'Овер выбран' : 'Овер отменён'}`
         );
      }
   }
   @Action('toggle_bd')
   async toggleBD(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.bd = !ctx.session.options.bd;
         await this.editProfessionsBtn(ctx, ctx.session.options)
         await this.professionsService.toggleProfession(
            ctx.session.userId, 5, ctx.session.options.bd
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.bd ? 'БД выбран' : 'БД отменён'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['bd'] = !currentSelected['bd']
         await this.editProfessionsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'bd', currentSelected['bd']
         )
         await ctx.answerCbQuery(
            `${currentSelected['bd'] ? 'БД выбран' : 'БД отменён'}`
         );
      }
   }
   @Action('toggle_sws')
   async toggleSWS(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.sws = !ctx.session.options.sws;
         await this.editProfessionsBtn(ctx, ctx.session.options)
         await this.professionsService.toggleProfession(
            ctx.session.userId, 6, ctx.session.options.sws
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.sws ? 'СВС выбран' : 'СВС отменён'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['sws'] = !currentSelected['sws']
         await this.editProfessionsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'sws', currentSelected['sws']
         )
         await ctx.answerCbQuery(
            `${currentSelected['sws'] ? 'СВС выбран' : 'СВС отменён'}`
         );
      }
   }
   @Action('toggle_spoil')
   async toggleSpoil(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.spoil = !ctx.session.options.spoil;
         await this.editProfessionsBtn(ctx, ctx.session.options)
         await this.professionsService.toggleProfession(
            ctx.session.userId, 7, ctx.session.options.spoil
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.spoil ? 'Спойл выбран' : 'Спойл отменён'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['spoil'] = !currentSelected['spoil']
         await this.editProfessionsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'spoil', currentSelected['spoil']
         )
         await ctx.answerCbQuery(
            `${currentSelected['spoil'] ? 'Спойл выбран' : 'Спойл отменён'}`
         );
      }
   }
   @Action('toggle_pony')
   async togglePony(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.pony = !ctx.session.options.pony;
         await this.editProfessionsBtn(ctx, ctx.session.options)
         await this.professionsService.toggleProfession(
            ctx.session.userId, 8, ctx.session.options.pony
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.pony ? 'Пони выбран' : 'Пони отменён'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['pony'] = !currentSelected['pony']
         await this.editProfessionsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'pony', currentSelected['pony']
         )
         await ctx.answerCbQuery(
            `${currentSelected['pony'] ? 'Пони выбран' : 'Пони отменён'}`
         );
      }
   }
   @Action('toggle_knights')
   async toggleKnights(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.knights = !ctx.session.options.knights;
         await this.editLocationsBtn(ctx, ctx.session.options)
         await this.usersService.updateLocation(
            ctx.session.userId, 'knights', ctx.session.options.knights
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.knights ? 'Кнайты выбраны' : 'Кнайты отменёны'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['knights'] = !currentSelected['knights']
         await this.editLocationsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'knights', currentSelected['knights']
         )
         await ctx.answerCbQuery(
            `${currentSelected['knights'] ? 'Кнайты выбраны' : 'Кнайты отменёны'}`
         );
      }
   }
   @Action('toggle_krug')
   async toggleKrug(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.krug = !ctx.session.options.krug;
         await this.editLocationsBtn(ctx, ctx.session.options)
         await this.usersService.updateLocation(
            ctx.session.userId, 'krug', ctx.session.options.krug
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.krug ? 'Круг выбран' : 'Круг отменён'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['krug'] = !currentSelected['krug']
         await this.editLocationsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'krug', currentSelected['krug']
         )
         await ctx.answerCbQuery(
            `${currentSelected['krug'] ? 'Круг выбран' : 'Круг отменён'}`
         );
      }
   }
   @Action('toggle_soa')
   async toggleSoa(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
      if(this.chatType(ctx) !== 'supergroup') {
         ctx.session.options.soa = !ctx.session.options.soa;
         await this.editLocationsBtn(ctx, ctx.session.options)
         await this.usersService.updateLocation(
            ctx.session.userId, 'soa', ctx.session.options.soa
         )
         await ctx.answerCbQuery(
            `${ctx.session.options.soa ? 'СОА выбрано' : 'СОА отменёно'}`
         );
      } else {
         const currentSelected = await this.getDefaultOptions()
         currentSelected['soa'] = !currentSelected['soa']
         await this.editLocationsBtn(ctx, currentSelected)
         await this.professionsService.toggleDefaultNotify(
            'soa', currentSelected['soa']
         )
         await ctx.answerCbQuery(
            `${currentSelected['soa'] ? 'СОА выбрано' : 'СОА отменёно'}`
         );
      }
   }
   @Action('notify_on')
   async notifyOn(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
     await ctx.answerCbQuery('Вы будете получать уведомления');
     ctx.session.options.notify = !ctx.session.options.notify
     await ctx.editMessageReplyMarkup({
        inline_keyboard: new ButtonsBuilder(ctx.session.options).notify
     })
     await this.usersService.updateActivity(ctx.session.userId, true)
   }

   @Action('notify_off')
   async notifyOff(@Ctx() ctx: Context) {
      if(!ctx.session.options) {
         ctx.session.options = await this.getDefaultOptions()
      }
     await ctx.answerCbQuery('Вы не будете получать уведомления');
     ctx.session.options.notify = !ctx.session.options.notify
     await ctx.editMessageReplyMarkup({
      inline_keyboard: new ButtonsBuilder(ctx.session.options).notify
     })
     await this.usersService.updateActivity(ctx.session.userId, false)
   }
   @Action('toggle_all')
   async toggleAll(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('В работе');
   }
   @Action('untoggle_all')
   async untoggleAll(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('В работе');
   }
   async editProfessionsBtn(ctx, sessions) {
      const group = this.chatType(ctx)
      return ctx.editMessageReplyMarkup({
         inline_keyboard: group !== 'supergroup' ?
         new ButtonsBuilder(sessions).professions :
         new ButtonsBuilder(sessions).combine
      })
   }
   async editLocationsBtn(ctx, sessions) {
      const group = this.chatType(ctx)
      return ctx.editMessageReplyMarkup({
         inline_keyboard: group !== 'supergroup' ?
         new ButtonsBuilder(sessions).locations :
         new ButtonsBuilder(sessions).combine
      })
   }
   async markActiveOptions(ctx, userId) {
      const usersOptions = await this.professionsService.findAllUsersProfessions(userId)
      usersOptions.forEach(item => {
         const key = this.professionMap[item.professionId];
         if (key) {
            ctx.session.options[key] = item.active
         }
      });
   }
   chatType(ctx) {
      return (ctx.update as { callback_query: CallbackQuery })?.callback_query?.message?.chat?.type;
   }
   getUserData(msg) {
      return {
         tgId: msg.from.id,
         tgName: msg.from.username,
         name: msg.from.first_name,
      }
   }
}
