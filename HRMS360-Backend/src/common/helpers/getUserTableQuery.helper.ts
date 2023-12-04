import { DB_PUBLIC_SCHEMA } from "../constants";

export function getUserTableQuery(schema: string) {
  //   return `alter table ${schema}.users INHERIT ${DB_PUBLIC_SCHEMA}.tenant_users`;
  return `CREATE TABLE ${schema}.users (
	  id varchar(255) NOT NULL,
	  "name" varchar(255) NOT NULL,
	  region varchar(255) NULL,
	  email varchar(255) NOT NULL,
	  contact varchar(255) NULL,
	  "password" varchar(255) NULL,
	  is_active bool NULL DEFAULT true,
	  is_lm_approval_required bool NULL DEFAULT true,
	  line_manager_id varchar(255) NULL,
	  secondary_line_manager_id varchar(255) NULL,
	  department_id varchar(255) NOT NULL,
	  designation_id varchar(255) NOT NULL,
	  "createdAt" timestamptz NOT NULL,
	  "updatedAt" timestamptz NOT NULL,
	  "deletedAt" TIMESTAMP WITH TIME ZONE, 
	  CONSTRAINT users_email_key UNIQUE (email),
	  CONSTRAINT users_pkey PRIMARY KEY (id),
	  CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES ${schema}.departments(id) ON DELETE CASCADE ON UPDATE CASCADE,
	  CONSTRAINT users_designation_id_fkey FOREIGN KEY (designation_id) REFERENCES ${schema}.designations(id) ON DELETE CASCADE ON UPDATE CASCADE,
	  CONSTRAINT users_line_manager_id_fkey FOREIGN KEY (line_manager_id) REFERENCES ${schema}.users(id) ON DELETE CASCADE ON UPDATE CASCADE
	) INHERITS(${DB_PUBLIC_SCHEMA}.tenant_users);`;
}
