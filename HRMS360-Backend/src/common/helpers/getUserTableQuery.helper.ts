import { DB_PUBLIC_SCHEMA } from "../constants";

export function getUserTableQuery(schema: string) {
  return `ALTER TABLE ${schema}.users INHERIT ${DB_PUBLIC_SCHEMA}.tenant_users;`;
}
