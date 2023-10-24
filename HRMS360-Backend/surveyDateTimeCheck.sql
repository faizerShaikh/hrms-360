create or replace
procedure survey_datetime_check()
language plpgsql
as $$
declare
    schema_name varchar(255);

begin
-- Declare a cursor to fetch rows from the tenants table
-- containing the schema names
    for schema_name in
select
	tenants.schema_name as schema_name
from
	public.tenants as tenants
where
	is_channel_partner = false
	and is_active = true loop
-- Check for end date and close surveys 
        execute format('
            UPDATE %I.survey_descriptions
            SET status = ''On Hold'', previous_status = status
            WHERE status  in (''Ongoing'') AND end_date::timestamp <= current_timestamp;
        ',
schema_name);
execute format('
            UPDATE %I.surveys
            SET status = ''On Hold'', previous_status = status
            WHERE status = ''Ongoing''and status != ''Completed'' and survey_id IN (
                SELECT id
                FROM %I.survey_descriptions
                WHERE status = ''On Hold''
            ) ;
        ',
schema_name,
schema_name);
end loop;
end;

$$;