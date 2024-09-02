import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { NotifyOptions, Profession, User, UserProfession } from './models';
import { UsersService } from './users.service';
import { ProfessionsService } from './professions.service';

@Module({
   imports: [
      SequelizeModule.forFeature([User, Profession, UserProfession, NotifyOptions])
   ],
   providers: [UsersService, ProfessionsService],
   exports: [
      UsersService, ProfessionsService
   ]
})
export class CommonModule {}