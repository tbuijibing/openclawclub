import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

/**
 * NestJS interceptor that automatically records user operations to the
 * audit_logs table. Attach to controllers or globally to capture all
 * mutating requests (POST, PUT, PATCH, DELETE).
 *
 * Requirement 13.3: Record all user operations, retain 12 months, partitioned by month.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method;

    // Only audit mutating operations
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.recordAudit(request, context, Date.now() - startTime);
        },
        error: () => {
          this.recordAudit(request, context, Date.now() - startTime, true);
        },
      }),
    );
  }

  private recordAudit(
    request: Record<string, unknown>,
    context: ExecutionContext,
    durationMs: number,
    isError = false,
  ): void {
    const controller = context.getClass().name;
    const handler = context.getHandler().name;
    const method = request.method as string;
    const url = request.url as string;
    const user = request.user as { id?: string } | undefined;
    const headers = (request.headers ?? {}) as Record<string, string>;
    const ip = (request.ip ?? headers['x-forwarded-for']) as string | undefined;
    const userAgent = headers['user-agent'];

    // Extract resource info from URL path (e.g., /orders/123 → resourceType=orders, resourceId=123)
    const pathParts = (url ?? '').split('?')[0].split('/').filter(Boolean);
    const resourceType = pathParts[0] ?? controller;
    const resourceId = pathParts[1];

    void this.auditService.log({
      userId: user?.id,
      action: `${method} ${handler}`,
      resourceType,
      resourceId,
      details: {
        url,
        method,
        controller,
        handler,
        durationMs,
        isError,
      },
      ipAddress: ip,
      userAgent,
    });
  }
}
