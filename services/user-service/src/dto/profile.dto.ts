import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { AccountType, SupportedLanguage, Region } from '@openclaw-club/shared';

export class CompleteProfileDto {
  @IsString()
  @MaxLength(100)
  displayName!: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsIn(['zh', 'en', 'ja', 'ko', 'de', 'fr', 'es'])
  languagePreference?: SupportedLanguage;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsIn(['apac', 'na', 'eu'])
  region?: Region;
}

export class SelectAccountTypeDto {
  @IsIn(['individual', 'enterprise'])
  accountType!: AccountType;
}

export class UpdateEnterpriseInfoDto {
  @IsString()
  @MaxLength(200)
  companyName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  industry?: string;

  @IsOptional()
  @IsIn(['small', 'medium', 'large', 'enterprise'])
  companySize?: string;
}
