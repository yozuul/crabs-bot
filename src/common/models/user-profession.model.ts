import { ForeignKey, Column, DataType, Model, Table } from "sequelize-typescript";
import { Profession } from './profession.model';
import { User } from './user.model';

const { INTEGER, BOOLEAN } = DataType

@Table({ tableName: 'user-profession', timestamps: false })
export class UserProfession extends Model<UserProfession> {
   @ForeignKey(() => User)
   @Column({ type: INTEGER })
   userId: number;

   @ForeignKey(() => Profession)
   @Column({ type: INTEGER })
   professionId: number;

   @Column({
      type: BOOLEAN, allowNull: true, defaultValue: false
   }) active: boolean
}
