import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AlternativeRespondentDTO {
  @IsString()
  @IsNotEmpty()
  alternative_suggestion_id: string;

  @IsString()
  @IsOptional()
  comments: string;

  @IsString()
  @IsNotEmpty()
  suggested_by: string;
}

export class AlternativeExternalRespondentDTO {
  @IsString()
  @IsNotEmpty()
  alternative_name: string;

  @IsString()
  @IsNotEmpty()
  alternative_email: string;

  @IsString()
  @IsNotEmpty()
  comments: string;

  @IsString()
  @IsNotEmpty()
  suggested_by: string;
}

export class SendSuggestionDTO {
  @IsString()
  @IsNotEmpty()
  status: string;
}
