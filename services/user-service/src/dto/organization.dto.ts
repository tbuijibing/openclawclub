import { IsString, IsEmail, IsOptional, MaxLength, IsIn } from 'class-validator';
import { RoleType } from '@openclaw-club/shared';

export class CreateOrganizationDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsIn([
    'admin', 'support_agent', 'trainer', 'certified_engineer',
    'partner_community', 'partner_regional', 'enterprise_user', 'individual_user',
  ])
  role?: RoleType;
}
