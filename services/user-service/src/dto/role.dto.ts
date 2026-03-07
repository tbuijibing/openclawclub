import { IsString, IsIn } from 'class-validator';
import { RoleType } from '@openclaw-club/shared';

export class AssignRoleDto {
  @IsString()
  userId!: string;

  @IsIn([
    'admin', 'support_agent', 'trainer', 'certified_engineer',
    'partner_community', 'partner_regional', 'enterprise_user', 'individual_user',
  ])
  role!: RoleType;
}
