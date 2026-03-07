import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LogtoService } from '../logto/logto.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly logtoService: LogtoService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const tokenInfo = await this.logtoService.verifyToken(token);
    if (!tokenInfo) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Attach user info to request
    request.user = {
      sub: tokenInfo.sub as string,
      roles: ((tokenInfo as any).roles as string[]) || [],
      orgId: (tokenInfo as any).organization_id,
    };

    return true;
  }
}
