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

   @Hears('knight')
   async knights(@Ctx() ctx: Context) {
      this.generateKeyboard(ctx);
   }

   @Action(/all_(.+)/)
   async allQuery(@Ctx() ctx: Context) {
      let data = ctx.callbackQuery['data'];
      if (data) {
         // Получаем все кнопки в строке, связанной с данным действием
         this.setTimersForAllButtons(data, ctx);
         await ctx.answerCbQuery('Таймеры запущены');
      }
   }

   @Action(/only_(.+)/)
   async onlyQuery(@Ctx() ctx: Context) {
      let data = ctx.callbackQuery['data'];
      if (data) {
         this.startTimerForButton(data, ctx);
         await ctx.answerCbQuery('Таймер запущен');
      }
   }

   @Action('null')
   async nullClick(@Ctx() ctx: Context) {
      await ctx.answerCbQuery('Выбери таймер');
   }

   // Функция для сброса таймеров для всех кнопок в строке
   setTimersForAllButtons(buttonId: string, @Ctx() ctx: Context) {
      const rowButtons = this.keyboardText.flat().filter(button => button.callback_data.startsWith('only_' + buttonId.split('_')[1]));
      rowButtons.forEach(button => {
         this.startTimerForButton(button.callback_data, ctx);  // Таймеры для всех кнопок в строке
      });
   }

   async startTimerForButton(buttonId: string, @Ctx() ctx: Context | null) {
      // Если для кнопки уже есть таймер, останавливаем его
      if (this.timers.has(buttonId)) {
         clearInterval(this.timers.get(buttonId));
         this.timers.delete(buttonId);
         this.buttonState.delete(buttonId);
      }

      // Начинаем отсчёт от 10:00 (600 секунд)
      let currentTime = 600; // 10 минут
      this.buttonState.set(buttonId, currentTime);

      const interval = setInterval(async () => {
         currentTime -= 10; // уменьшаем на 10 секунд
         this.buttonState.set(buttonId, currentTime);

         // Если время дошло до 0, сбрасываем таймер
         if (currentTime <= 0) {
            this.buttonState.set(buttonId, 600); // Сбрасываем на 10 минут
            clearInterval(interval);
            this.timers.delete(buttonId);
         }

         // Обновляем клавиатуру каждые 10 секунд
         if (ctx) await this.updateKeyboard(ctx);
      }, 10000);

      // Добавляем новый таймер в Map
      this.timers.set(buttonId, interval);

      // Запускаем основной таймер для обновления клавиатуры, если он ещё не работает
      if (!this.keyboardUpdateRunning) {
         this.keyboardUpdateRunning = true;
         this.keyboardUpdateInterval = setInterval(async () => {
            if (this.timers.size === 0) {
               this.keyboardUpdateRunning = false;
               if (this.keyboardUpdateInterval) {
                  clearInterval(this.keyboardUpdateInterval); // Останавливаем общий таймер
               }
            }
         }, 10000);
      }
   }

   async updateKeyboard(@Ctx() ctx: Context) {
      const updatedKeyboard = this.keyboardText.map(row => row.map(button => {
         if (this.buttonState.has(button.callback_data)) {
            // Если для кнопки есть таймер, обновляем её текст
            const currentTime = this.buttonState.get(button.callback_data) || 0;
            const minutes = Math.floor(currentTime / 60).toString().padStart(2, '0');
            const seconds = (currentTime % 60).toString().padStart(2, '0');
            button.text = `${minutes}:${seconds}`;
         } else if (button.text === '10:00') {
            // Оставляем кнопки с '10:00' без изменений
            button.text = '10:00';
         }
         return button;
      }));

      await ctx.editMessageReplyMarkup({
         inline_keyboard: updatedKeyboard,
      });
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
            { text: 'МОСТ', callback_data: 'null' }
         ],
         [
            { text: '🔄', callback_data: 'all_bridge' },
            { text: '10:00', callback_data: 'only_bridge_one' },
            { text: "10:00", callback_data: 'only_bridge_two' },
            { text: "10:00", callback_data: 'only_bridge_three' },
         ],
         [
            { text: 'ДВОЙКА', callback_data: 'null' }
         ],
         [
            { text: '🔄', callback_data: 'all_two' },
            { text: '10:00', callback_data: 'only_two_one' },
            { text: "10:00", callback_data: 'only_two_two' },
            { text: "10:00", callback_data: 'only_two_three' },
         ],
         [
            { text: 'КАМЕНЬ', callback_data: 'null' },
            // { text: '🔄', callback_data: 'all_kamen' },
            { text: '10:00', callback_data: 'only_kamen_one' },
         ],
         [
            { text: 'ЧЕТВЁРКА', callback_data: 'null' }
         ],
         [
            { text: '🔄', callback_data: 'all_four' },
            { text: '10:00', callback_data: 'only_four_one' },
            { text: "10:00", callback_data: 'only_four_two' },
            { text: "10:00", callback_data: 'only_four_three' },
         ],
         [
            { text: 'ПЯТЁРКА', callback_data: 'null' }
         ],
         [
            { text: '🔄', callback_data: 'all_five' },
            { text: '10:00', callback_data: 'only_five_one' },
            { text: "10:00", callback_data: 'only_five_two' },
            { text: "10:00", callback_data: 'only_five_three' },
         ]
      ]
   }
}
