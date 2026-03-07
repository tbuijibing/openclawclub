import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LogtoService } from '../logto/logto.service';

/** Must match the key used in the Roles decorator */
const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logtoService: LogtoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.sub) {
      throw new ForbiddenException('User not authenticated');
    }

    // Fetch fresh roles from Logto for real-time permission enforcement
    const logtoRoles = await this.logtoService.getUserRoles(user.sub);
    const userRoleNames = logtoRoles.map((r) => r.name);

    const hasRole = requiredRoles.some((role) => userRoleNames.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Update request user with fresh roles
    request.user.roles = userRoleNames;
    return true;
  }
}
