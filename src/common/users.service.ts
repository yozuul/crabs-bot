import { Op } from 'sequelize';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

import { User, AddUserDto, UserProfession, Profession } from './models';

@Injectable()
export class UsersService {
   constructor(
      @InjectModel(User)
      private userRepo: typeof User,
      @InjectModel(Profession)
      private professionRepo: typeof Profession,
      @InjectModel(UserProfession)
      private userProfesionRepo: typeof UserProfession
   ) {}

   async findUsersToNotify(currentSelected, filtered) {
      const conditions = []
      for (let item in currentSelected) {
         if(item === 'knights' || item === 'krug' || item === 'soa') {
            if(currentSelected[item] === 1) {
               conditions.push({ [item]: true })
            }
         }
      }
      const usersWithNotify = await this.userRepo.findAll({
         where: {
            [Op.and]: [
              { notify: true },
              {
                [Op.or]: conditions
              }
            ]
          },
          raw: true
      });
      const userIds = usersWithNotify.map(user => user.id)
      const usersWithProfession = await this.userProfesionRepo.findAll({
         where: {
            userId: {
               [Op.in]: userIds
            }
         }, raw: true
      });

      const result = usersWithProfession.filter(item => filtered.includes(
         item.professionId) && item.active
      )
      const usersToNotify = await this.userRepo.findAll({
         where: {
            id: [...new Set(result.map(item => item.userId))]
          }, raw: true
      })
      const professionsToNotify = await this.professionRepo.findAll({
         where: {
            id: [...new Set(result.map(item => item.professionId))]
          }, raw: true
      })
      return {
         users: usersToNotify, professions: professionsToNotify
      }
   }
   async addNew(dto: AddUserDto) {
      const existingUser = await this.userRepo.findOne({
         where: { tgId: dto.tgId },
      });
      if (!existingUser) {
         const newUser = await this.userRepo.create(dto);
         await this.userProfesionRepo.bulkCreate([
            { userId: newUser.id, professionId: 1 },
            { userId: newUser.id, professionId: 2 },
            { userId: newUser.id, professionId: 3 },
            { userId: newUser.id, professionId: 4 },
            { userId: newUser.id, professionId: 5 },
            { userId: newUser.id, professionId: 6 },
            { userId: newUser.id, professionId: 7 },
            { userId: newUser.id, professionId: 8 },
         ])
         return newUser
      }
      return existingUser
   }
   async deleteById(tgId: string): Promise<number> {
      try {
         const existUser = await this.userRepo.findOne({
            where: { tgId: tgId }
         })
         const deletedCount = await this.userRepo.destroy({
            where: { tgId: tgId },
          });
          await this.userProfesionRepo.destroy({
            where: { userId: existUser.id }
          })
          return deletedCount;
      } catch (error) {
         console.log('Ошибка удаления пользователя')
      }
    }
   async findById(tgId) {
      return this.userRepo.findOne({
         where: { tgId: tgId }
      })
   }
   async findAll() {
      return this.userRepo.findAll()
   }
   async updateLocation(userId, location, isActive) {
      await this.userRepo.update(
         { [location]: isActive },
         { where: { id: userId }}
       )
   }
   async updateActivity(userId, isActive) {
      await this.userRepo.update(
         { notify: isActive },
         { where: { id: userId }}
       )
   }
   async updateStatus(userId, usesrStatus) {
      await this.userRepo.update(
         { status: usesrStatus },
         { where: { id: userId }}
       )
   }
}
