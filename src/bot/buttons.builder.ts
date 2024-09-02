import { Markup } from 'telegraf';

export class ButtonsBuilder {
  constructor(private options: any) {}
  get professions() {
    return [
      [
        Markup.button.callback(`${this.options.mag ? '✅' : '⬜️'} Маг`, 'toggle_mag'),
        Markup.button.callback(`${this.options.bp ? '✅' : '⬜️'} Биш`, 'toggle_bp'),
        Markup.button.callback(`${this.options.ee ? '✅' : '⬜️'} Залив`, 'toggle_ee'),
        Markup.button.callback(`${this.options.bd ? '✅' : '⬜️'} БД`, 'toggle_bd')
      ],
      [
        Markup.button.callback(`${this.options.sws ? '✅' : '⬜️'} СВС`, 'toggle_sws'),
        Markup.button.callback(`${this.options.ol ? '✅' : '⬜️'} Овер`, 'toggle_ol'),
        Markup.button.callback(`${this.options.spoil ? '✅' : '⬜️'} Спойл`, 'toggle_spoil'),
        Markup.button.callback(`${this.options.pony ? '✅' : '⬜️'} Пони`, 'toggle_pony')
      ],
      // [
      //   Markup.button.callback(`${this.options.all ? '🟢' : '⚪️'} ВЫБРАТЬ ВСЁ`, 'toggle_all'),
      //   Markup.button.callback(`${this.options.unall ? '🟢' : '⚪️'} ОЧИСТИТЬ`, 'untoggle_all')
      // ],
    ];
  }
  get locations() {
    return [[
      Markup.button.callback(`${this.options.knights ? '✅' : '⬜️'} Кнайты`, 'toggle_knights'),
      Markup.button.callback(`${this.options.krug ? '✅' : '⬜️'} Круг`, 'toggle_krug'),
      Markup.button.callback(`${this.options.soa ? '✅' : '⬜️'} СОА`, 'toggle_soa')
    ]];
  }

  get notify() {
    return [[
      Markup.button.callback(
        `${this.options.notify ? '💪🏼 Получать 🟢' : 'Получать ⚪️ '}`, 'notify_on'
      ),
      Markup.button.callback(
        `${!this.options.notify ? '💩 Не получать 🟢' : 'Не получать ⚪️'}`, 'notify_off'
      )
    ]];
  }
  get combine() {
    console.log(this.options)
    return [
      ...this.professions, ...this.locations,
      [Markup.button.callback('🔔 ВЫПОЛНИТЬ РАССЫЛКУ', 'notify_all')]
    ]
  }
  get combin2e() {
    console.log(this.options)
    return [
      ...this.professions, ...this.locations,
      [Markup.button.callback('🔔 ВЫПОЛНИТЬ РАССЫЛКУ', 'test')]
    ]
  }
}
