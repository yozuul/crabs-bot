import { Op } from 'sequelize';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel, } from '@nestjs/sequelize';

import { Profession, UserProfession, User, NotifyOptions } from './models';

@Injectable()
export class ProfessionsService implements OnModuleInit {
   constructor(
      @InjectModel(Profession)
      private professionRepo: typeof Profession,
      @InjectModel(UserProfession)
      private userProfessionRepo: typeof UserProfession,
      @InjectModel(NotifyOptions)
      private notifyOptionsRepo: typeof NotifyOptions
   ) {}

   findByCodes(codes: string[]) {
      return this.professionRepo.findOne({
         where: { code: { [Op.in]: codes }}
      })
   }
   async selectAll(userId: number, professionId: number, isActive: boolean) {
      await this.userProfessionRepo.update(
         { active: isActive },
         { where: { userId, professionId }}
       )
   }
   async toggleProfession(userId: number, professionId: number, isActive: boolean) {
      await this.userProfessionRepo.update(
         { active: isActive },
         { where: { userId, professionId }}
       )
   }
   async toggleDefaultNotify(professionName: string, isActive: boolean) {
      await this.notifyOptionsRepo.update(
         { notify: isActive },
         { where: { name: professionName }}
       )
   }
   async findAllUsersProfessions(userId: number) {
      return this.userProfessionRepo.findAll({
         where: { userId: userId },
         raw: true
      })
   }
   async gelDefaultNotify() {
      return this.notifyOptionsRepo.findAll({
         raw: true
      })
   }
   async onModuleInit() {
      const professions = [
         { name: 'Маг', code: 'mag' },
         { name: 'Биш', code: 'bp' },
         { name: 'Лейка', code: 'ee' },
         { name: 'Овер', code: 'ol' },
         { name: 'БД', code: 'bd' },
         { name: 'СВС', code: 'sws' },
         { name: 'Спойл', code: 'spoil' },
         { name: 'Пони', code: 'pony' },
      ];
      const notify = [
         { name: 'mag', notify: false },
         { name: 'bp', notify: false },
         { name: 'ee', notify: false },
         { name: 'ol', notify: false },
         { name: 'bd', notify: false },
         { name: 'sws', notify: false },
         { name: 'spoil', notify: false },
         { name: 'pony', notify: false },
         { name: 'knights', notify: false },
         { name: 'krug', notify: false },
         { name: 'soa', notify: false },
         { name: 'all', notify: false },
         { name: 'unall', notify: false },
      ];
      const isExist = await this.professionRepo.findAll()
      if (isExist.length === 0) {
         this.professionRepo.bulkCreate(professions)
      }
      const isExistOptions = await this.notifyOptionsRepo.findAll()
      if (isExistOptions.length === 0) {
         this.notifyOptionsRepo.bulkCreate(notify)
      }
   }
}