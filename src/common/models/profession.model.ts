import { Column, DataType, Model, Table, BelongsToMany } from "sequelize-typescript";

import { User } from './user.model';
import { UserProfession } from './user-profession.model';

const { INTEGER, STRING } = DataType

interface ProfCreationAttrs {
   name: string
   code: string
}

@Table({ tableName: 'professions' })
export class Profession extends Model<Profession, ProfCreationAttrs> {
   @Column({
      type: INTEGER,
      unique: true, autoIncrement: true, primaryKey: true
   }) id: number

   @Column({
      type: STRING, allowNull: false
   }) name: string

   @Column({
      type: STRING, allowNull: false
   }) code: string

   @BelongsToMany(() => User, () => UserProfession)
   users: User[];
}