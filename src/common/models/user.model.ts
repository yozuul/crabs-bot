import { BelongsToMany, Column, DataType, Model, Table } from "sequelize-typescript";

import { Profession } from './profession.model';
import { UserProfession } from './user-profession.model';

const { INTEGER, STRING, BOOLEAN } = DataType

interface UserCreationAttrs {
   tgId: number
   tgName: string
   name: string
   status: string
   knights: boolean
   krug: boolean
   soa: boolean
   notify: boolean
}

@Table({ tableName: 'users' })
export class User extends Model<User, UserCreationAttrs> {
   @Column({
      type: INTEGER,
      unique: true, autoIncrement: true, primaryKey: true
   }) id: number

   @Column({
      type: INTEGER, allowNull: false
   }) tgId: number

   @Column({
      type: STRING, allowNull: true
   }) tgName: string

   @Column({
      type: STRING, allowNull: true
   }) name: string

   @Column({
      type: STRING, allowNull: true
   }) status: string

   @Column({
      type: BOOLEAN, allowNull: true, defaultValue: true
   }) knights: boolean

   @Column({
      type: BOOLEAN, allowNull: true, defaultValue: true
   }) krug: boolean

   @Column({
      type: BOOLEAN, allowNull: true, defaultValue: true
   }) soa: boolean

   @Column({
      type: BOOLEAN, allowNull: true, defaultValue: true
   }) notify: boolean

   @BelongsToMany(() => Profession, () => UserProfession)
   professions: Profession[];
}