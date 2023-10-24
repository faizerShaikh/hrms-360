export interface IDatabaseConfigAttributes {
  username?: string;
  password?: string;
  database?: string;
  host?: string;
  port?: number | string;
  dialect?: string;
  urlDatabase?: string;
  logging?: any;
}

export interface IDatabaseConfig {
  development: IDatabaseConfigAttributes;
  uat: IDatabaseConfigAttributes;
  production: IDatabaseConfigAttributes;
}
