import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, EnterpriseInfo, Organization } from '@openclaw-club/database';
import { LogtoModule } from './logto/logto.module';
import { UserServiceController } from './user-service.controller';
import { WebhookController } from './webhook.controller';
import { UserService } from './user.service';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { OrgGuard } from './guards/org.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([User, EnterpriseInfo, Organization]),
    LogtoModule,
  ],
  controllers: [UserServiceController, WebhookController],
  providers: [UserService, AuthGuard, RolesGuard, OrgGuard],
  exports: [UserService, LogtoModule],
})
export class UserServiceModule {}
