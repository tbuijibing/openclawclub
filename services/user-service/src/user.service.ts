import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, EnterpriseInfo, Organization } from '@openclaw-club/database';
import { RoleType } from '@openclaw-club/shared';
import { LogtoService } from './logto/logto.service';
import { CompleteProfileDto, SelectAccountTypeDto, UpdateEnterpriseInfoDto } from './dto/profile.dto';
import { LogtoWebhookPayload } from './dto/webhook.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(EnterpriseInfo)
    private readonly enterpriseInfoRepo: Repository<EnterpriseInfo>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    private readonly logtoService: LogtoService,
  ) {}

  /** Handle Logto webhook: create platform user record on registration */
  async handleWebhook(payload: LogtoWebhookPayload): Promise<User | null> {
    if (payload.event !== 'User.Created' || !payload.data) {
      return null;
    }

    const { id, name, avatar, primaryEmail } = payload.data;

    const existing = await this.userRepo.findOne({ where: { logtoUserId: id } });
    if (existing) return existing;

    const user = this.userRepo.create({
      id: require('crypto').randomUUID(),
      logtoUserId: id,
      accountType: 'individual', // default, user selects later
      displayName: name || primaryEmail || undefined,
      avatarUrl: avatar || undefined,
    });

    const saved = await this.userRepo.save(user);
    this.logger.log(`Created platform user for Logto user ${id}`);
    return saved;
  }

  /** Complete user profile after first login */
  async completeProfile(logtoUserId: string, dto: CompleteProfileDto): Promise<User> {
    const user = await this.findByLogtoId(logtoUserId);
    user.displayName = dto.displayName;
    if (dto.avatarUrl) user.avatarUrl = dto.avatarUrl;
    if (dto.languagePreference) user.languagePreference = dto.languagePreference;
    if (dto.timezone) user.timezone = dto.timezone;
    if (dto.region) user.region = dto.region;
    return this.userRepo.save(user);
  }

  /** Select account type (individual or enterprise) */
  async selectAccountType(logtoUserId: string, dto: SelectAccountTypeDto): Promise<User> {
    const user = await this.findByLogtoId(logtoUserId);
    user.accountType = dto.accountType;
    const saved = await this.userRepo.save(user);

    // Assign default role in Logto
    const roleName: RoleType = dto.accountType === 'enterprise'
      ? 'enterprise_user'
      : 'individual_user';
    await this.assignRole(logtoUserId, roleName);

    return saved;
  }

  /** Update enterprise info for enterprise users */
  async updateEnterpriseInfo(logtoUserId: string, dto: UpdateEnterpriseInfoDto): Promise<EnterpriseInfo> {
    const user = await this.findByLogtoId(logtoUserId);
    if (user.accountType !== 'enterprise') {
      throw new BadRequestException('Only enterprise users can update enterprise info');
    }

    let info = await this.enterpriseInfoRepo.findOne({ where: { userId: user.id } });
    if (info) {
      info.companyName = dto.companyName;
      if (dto.industry) info.industry = dto.industry;
      if (dto.companySize) info.companySize = dto.companySize;
    } else {
      info = this.enterpriseInfoRepo.create({
        userId: user.id,
        companyName: dto.companyName,
        industry: dto.industry,
        companySize: dto.companySize,
      });
    }
    return this.enterpriseInfoRepo.save(info);
  }

  /** Get user with roles from Logto */
  async getUserWithRoles(logtoUserId: string): Promise<User & { roles: string[] }> {
    const user = await this.findByLogtoId(logtoUserId);
    const logtoRoles = await this.logtoService.getUserRoles(logtoUserId);
    return { ...user, roles: logtoRoles.map((r) => r.name) };
  }

  /** Assign a role to user via Logto Management API */
  async assignRole(logtoUserId: string, role: RoleType): Promise<void> {
    const roles = await this.logtoService.getRoles();
    const targetRole = roles.find((r) => r.name === role);
    if (!targetRole) {
      this.logger.warn(`Role "${role}" not found in Logto, skipping assignment`);
      return;
    }
    await this.logtoService.assignRoleToUser(logtoUserId, targetRole.id);
    this.logger.log(`Assigned role "${role}" to user ${logtoUserId}`);
  }

  /** Create organization for enterprise user */
  async createOrganization(
    logtoUserId: string,
    name: string,
    description?: string,
  ): Promise<Organization> {
    const user = await this.findByLogtoId(logtoUserId);
    if (user.accountType !== 'enterprise') {
      throw new BadRequestException('Only enterprise users can create organizations');
    }

    const logtoOrg = await this.logtoService.createOrganization(name, description);
    await this.logtoService.addUserToOrganization(logtoOrg.id, logtoUserId);

    const org = this.orgRepo.create({
      logtoOrgId: logtoOrg.id,
      name,
      ownerUserId: user.id,
    });
    const saved = await this.orgRepo.save(org);

    // Link enterprise info to org
    const info = await this.enterpriseInfoRepo.findOne({ where: { userId: user.id } });
    if (info) {
      info.orgId = saved.id;
      await this.enterpriseInfoRepo.save(info);
    }

    return saved;
  }

  /** Invite member to organization */
  async inviteMember(
    logtoUserId: string,
    orgId: string,
    email: string,
    role?: RoleType,
  ): Promise<{ invited: true; email: string }> {
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) throw new NotFoundException('Organization not found');

    // Verify caller is org owner
    const user = await this.findByLogtoId(logtoUserId);
    if (org.ownerUserId !== user.id) {
      throw new BadRequestException('Only organization owner can invite members');
    }

    // In a real implementation, this would send an invitation email
    // and create a pending invitation record. For now, we log the intent.
    this.logger.log(`Invitation sent to ${email} for org ${org.name}`);

    return { invited: true, email };
  }

  /** Find user by Logto ID */
  private async findByLogtoId(logtoUserId: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { logtoUserId } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Find user by platform ID */
  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
