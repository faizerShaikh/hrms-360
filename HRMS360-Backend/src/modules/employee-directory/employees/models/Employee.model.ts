import { Model, Table } from "sequelize-typescript";

@Table({
  tableName: "employee",
  modelName: "Employee",

  defaultScope: {
    where: {
      is_copy: false,
    },
    order: [["createdAt", "DESC"]],
  },
})
export class Employee extends Model {
  name: string;
  fathers_name: string;
  mothers_name: string;
  email: string;
}
