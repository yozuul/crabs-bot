import { Injectable } from '@nestjs/common';
import { Context } from './context.interface';
import { Ctx, Hears, Update, Action } from 'nestjs-telegraf';

@Injectable()
@Update()
export class KnightsBotService {
   private timers = new Map<string, NodeJS.Timeout>();
   private buttonState = new Map<string, number>();
   private keyboardUpdateRunning = false;
   private keyboardUpdateInterval: NodeJS.Timeout | null = null;
   private initUsers = [];

   @Hears('knights_timer')
   async knights(@Ctx() ctx: Context) {
      await this.generateKeyboard(ctx);
   }

   async sendNotify(ctx: Context, buttonId: string) {
      let messageText = ''

      if(buttonId.includes('bridge')) {
         messageText = 'Мост скоро респ'
      }
      if(buttonId.includes('only_second')) {
         messageText = 'Двойка скоро респ'
      }
      if(buttonId.includes('only_kamen')) {
         messageText = 'Камень скоро респ'
      }
      if(buttonId.includes('only_four')) {
         messageText = 'Четвёрка скоро респ'
      }
      if(buttonId.includes('only_five')) {
         messageText = 'Пятёрка скоро респ'
      }
      if(buttonId.includes('_one')) {
         messageText += ' / 1 пачка'
      }
      if(buttonId.includes('_two')) {
         messageText += ' / 2 пачка'
      }
      if(buttonId.includes('_three')) {
         messageText += ' / 3 пачка'
      }

      for (let userId of this.initUsers) {
         try {
            await ctx.telegram.sendMessage(userId, messageText);
         } catch (error) {
            console.log('error')
         }
      }
   }

   @Action(/all_(.+)/)
   async allQuery(@Ctx() ctx: Context) {
      let data = ctx.callbackQuery['data'];
      if (data) {
         this.setTimersForAllButtons(data, ctx);
         await ctx.answerCbQuery('Таймеры запущены');
      }
      if (!this.initUsers.includes(ctx.from.id)) {
         this.initUsers.push(ctx.from.id);
      }
   }

   @Action(/only_(.+)/)
   async onlyQuery(@Ctx() ctx: Context) {
      let data = ctx.callbackQuery['data'];
      if (data) {
         this.startTimerForButton(data, ctx);
         await ctx.answerCbQuery('Таймер запущен');
      }
      if (!this.initUsers.includes(ctx.from.id)) {
         this.initUsers.push(ctx.from.id);
      }
   }

   setTimersForAllButtons(buttonId: string, @Ctx() ctx: Context) {
      const rowButtons = this.keyboardText.flat().filter(button => button.callback_data.startsWith('only_' + buttonId.split('_')[1]));
      rowButtons.forEach(button => {
         this.startTimerForButton(button.callback_data, ctx);
      });
   }

   async startTimerForButton(buttonId: string, @Ctx() ctx: Context | null) {
      if (this.timers.has(buttonId)) {
         clearInterval(this.timers.get(buttonId));
         this.timers.delete(buttonId);
         this.buttonState.delete(buttonId);
      }

      let currentTime = 600;
      this.buttonState.set(buttonId, currentTime);

      const interval = setInterval(async () => {
         currentTime -= 10;
         this.buttonState.set(buttonId, currentTime);

         if (currentTime === 60 && ctx) {
            await this.sendNotify(ctx, buttonId);
         }

         if (currentTime <= 0) {
            this.buttonState.set(buttonId, 600);
            clearInterval(interval);
            this.timers.delete(buttonId);
         }

      }, 10000);

      this.timers.set(buttonId, interval);

      if (!this.keyboardUpdateRunning) {
         this.keyboardUpdateRunning = true;
         this.keyboardUpdateInterval = setInterval(async () => {
            await this.updateKeyboard(ctx);
            if (this.timers.size === 0) {
               this.keyboardUpdateRunning = false;
               if (this.keyboardUpdateInterval) {
                  this.initUsers = [];
                  clearInterval(this.keyboardUpdateInterval);
               }
            }
         }, 10000);
      }
   }

   async updateKeyboard(@Ctx() ctx: Context) {
      const updatedKeyboard = this.keyboardText.map(row => row.map(button => {
         if (this.buttonState.has(button.callback_data)) {
            const currentTime = this.buttonState.get(button.callback_data) || 0;
            const minutes = Math.floor(currentTime / 60).toString().padStart(2, '0');
            const seconds = (currentTime % 60).toString().padStart(2, '0');
            button.text = `${minutes}:${seconds}`;
         } else if (button.text === '10:00') {
            button.text = '10:00';
         }
         return button;
      }));

      try {
         await ctx.editMessageReplyMarkup({
            inline_keyboard: updatedKeyboard,
         });
      } catch (error) {
         console.log('error');
         console.log(error)
      }
   }

   async generateKeyboard(ctx) {
      await ctx.reply('Тайминги кнайтов', {
         reply_markup: {
            inline_keyboard: this.keyboardText,
         },
      });
   }

   get keyboardText() {
      return [
         [
            { text: '🔄 МОСТ', callback_data: 'all_bridge' }
         ],
         [
            { text: '10:00', callback_data: 'only_bridge_one' },
            { text: "10:00", callback_data: 'only_bridge_two' },
            { text: "10:00", callback_data: 'only_bridge_three' },
         ],
         [
            { text: '🔄 ДВОЙКА', callback_data: 'all_second' }
         ],
         [
            { text: '10:00', callback_data: 'only_second_one' },
            { text: "10:00", callback_data: 'only_second_two' },
            { text: "10:00", callback_data: 'only_second_three' },
         ],
         [
            { text: '🔄 КАМЕНЬ', callback_data: 'all_kamen' },
         ],
         [
            { text: '10:00', callback_data: 'only_kamen_one' },
         ],
         [
            { text: '🔄 ЧЕТВЁРКА', callback_data: 'all_four' }
         ],
         [
            { text: '10:00', callback_data: 'only_four_one' },
            { text: "10:00", callback_data: 'only_four_two' },
            { text: "10:00", callback_data: 'only_four_three' },
         ],
         [
            { text: '🔄 ПЯТЁРКА', callback_data: 'all_five' }
         ],
         [
            { text: '10:00', callback_data: 'only_five_one' },
            { text: "10:00", callback_data: 'only_five_two' },
         ]
      ];
   }

   @Action('null')
   async nullClick(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Выбери таймер');
   }
}
