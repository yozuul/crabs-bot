import { Column, DataType, Model, Table } from "sequelize-typescript";

const { INTEGER, STRING, BOOLEAN } = DataType

interface NotifyCreationAttrs {
   name: string
   notify: boolean
}

@Table({ tableName: 'notify-options', timestamps: false })
export class NotifyOptions extends Model<NotifyOptions, NotifyCreationAttrs> {
   @Column({
      type: INTEGER,
      unique: true, autoIncrement: true, primaryKey: true
   }) id: number

   @Column({
      type: STRING, allowNull: false
   }) name: string

   @Column({
      type: BOOLEAN, allowNull: true, defaultValue: true
   }) notify: boolean
}