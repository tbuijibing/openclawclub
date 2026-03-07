import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OrgGuard } from './guards/org.guard';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';
import { CurrentUser, RequestUser } from './decorators/current-user.decorator';
import { CompleteProfileDto, SelectAccountTypeDto, UpdateEnterpriseInfoDto } from './dto/profile.dto';
import { AssignRoleDto } from './dto/role.dto';
import { CreateOrganizationDto, InviteMemberDto } from './dto/organization.dto';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UserServiceController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'user-service' };
  }

  // ---- Profile Management (Task 3.2) ----

  /** Complete user profile after first login */
  @Put('me/profile')
  async completeProfile(
    @CurrentUser() user: RequestUser,
    @Body() dto: CompleteProfileDto,
  ) {
    return this.userService.completeProfile(user.sub, dto);
  }

  /** Select account type (individual or enterprise) */
  @Put('me/account-type')
  async selectAccountType(
    @CurrentUser() user: RequestUser,
    @Body() dto: SelectAccountTypeDto,
  ) {
    return this.userService.selectAccountType(user.sub, dto);
  }

  /** Update enterprise info */
  @Put('me/enterprise-info')
  async updateEnterpriseInfo(
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateEnterpriseInfoDto,
  ) {
    return this.userService.updateEnterpriseInfo(user.sub, dto);
  }

  /** Get current user profile with roles */
  @Get('me')
  async getMe(@CurrentUser() user: RequestUser) {
    return this.userService.getUserWithRoles(user.sub);
  }

  // ---- Role Management (Task 3.3) ----

  /** Assign role to a user (Admin only) */
  @Post('roles/assign')
  @Roles('admin')
  async assignRole(@Body() dto: AssignRoleDto) {
    await this.userService.assignRole(dto.userId, dto.role);
    return { success: true };
  }

  // ---- Organization Management (Task 3.4) ----

  /** Create organization for enterprise user */
  @Post('organizations')
  @Roles('enterprise_user')
  async createOrganization(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.userService.createOrganization(user.sub, dto.name, dto.description);
  }

  /** Invite member to organization */
  @Post('organizations/:orgId/invite')
  @Roles('enterprise_user')
  @UseGuards(OrgGuard)
  async inviteMember(
    @CurrentUser() user: RequestUser,
    @Param('orgId') orgId: string,
    @Body() dto: InviteMemberDto,
  ) {
    return this.userService.inviteMember(user.sub, orgId, dto.email, dto.role);
  }
}
