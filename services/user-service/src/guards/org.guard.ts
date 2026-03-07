import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '@openclaw-club/database';

/**
 * Organization data isolation guard.
 * Ensures users can only access resources belonging to their organization.
 * Reads orgId from route params or query and verifies membership.
 */
@Injectable()
export class OrgGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.sub) return false;

    // Get orgId from route params, query, or body
    const orgId =
      request.params?.orgId ||
      request.query?.orgId ||
      request.body?.orgId;

    if (!orgId) return true; // No org context, skip check

    // Verify user belongs to this organization via token claim or DB
    if (user.orgId && user.orgId === orgId) return true;

    // Fallback: check if user is org owner
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new ForbiddenException('Organization not found');
    }

    // Check via user's platform ID (need to resolve logto ID to platform ID)
    // For simplicity, we check the owner relationship
    const userRepo = this.orgRepo.manager.getRepository('users');
    const platformUser = await userRepo.findOne({ where: { logtoUserId: user.sub } });
    if (platformUser && org.ownerUserId === (platformUser as any).id) {
      return true;
    }

    throw new ForbiddenException('Access denied: organization data isolation');
  }
}
