import { Controller, Get, Post, Body, Param } from '@nestjs/common';

/**
 * Mock user controller — provides stub user endpoints for local dev
 * without requiring PostgreSQL + TypeORM + Logto.
 *
 * Replace with real UserServiceModule when DB is configured.
 */
@Controller('users')
export class MockUserController {
  private readonly mockUser = {
    id: 'user-dev-001',
    logtoId: 'logto-dev-001',
    email: 'dev@openclaw.club',
    displayName: 'Dev User',
    accountType: 'Individual_User' as const,
    roles: ['Individual_User'],
    locale: 'zh',
    timezone: 'Asia/Shanghai',
    createdAt: new Date().toISOString(),
  };

  @Get('me')
  getCurrentUser() {
    return this.mockUser;
  }

  @Get(':id')
  getUser(@Param('id') id: string) {
    return { ...this.mockUser, id };
  }

  @Post('profile')
  completeProfile(@Body() body: Record<string, unknown>) {
    return { ...this.mockUser, ...body, profileCompleted: true };
  }

  @Post('account-type')
  selectAccountType(@Body() body: { accountType: string }) {
    return { ...this.mockUser, accountType: body.accountType };
  }
}
