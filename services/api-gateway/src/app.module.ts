import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';

// Entity imports from database package
import { User } from '../../../packages/database/src/entities/user.entity';
import { EnterpriseInfo } from '../../../packages/database/src/entities/enterprise-info.entity';
import { Organization } from '../../../packages/database/src/entities/organization.entity';
import { Order } from '../../../packages/database/src/entities/order.entity';
import { Payment } from '../../../packages/database/src/entities/payment.entity';
import { InstallOrder } from '../../../packages/database/src/entities/install-order.entity';
import { DeliveryReport } from '../../../packages/database/src/entities/delivery-report.entity';
import { ServiceReview } from '../../../packages/database/src/entities/service-review.entity';
import { TokenAccount } from '../../../packages/database/src/entities/token-account.entity';
import { TokenUsageRecord } from '../../../packages/database/src/entities/token-usage-record.entity';
import { ConfigurationPack } from '../../../packages/database/src/entities/configuration-pack.entity';
import { Subscription } from '../../../packages/database/src/entities/subscription.entity';
import { Certificate } from '../../../packages/database/src/entities/certificate.entity';
import { Ticket } from '../../../packages/database/src/entities/ticket.entity';
import { ConversationSession } from '../../../packages/database/src/entities/conversation-session.entity';
import { ConversationMessage } from '../../../packages/database/src/entities/conversation-message.entity';
import { PartnerEarning } from '../../../packages/database/src/entities/partner-earning.entity';
import { HardwareProduct } from '../../../packages/database/src/entities/hardware-product.entity';
import { AuditLog } from '../../../packages/database/src/entities/audit-log.entity';

// DB-driven controllers
import { DbUserController } from './db-controllers/user.controller';
import { DbOrderController } from './db-controllers/order.controller';
import { DbHardwareController } from './db-controllers/hardware.controller';
import { DbSubscriptionController } from './db-controllers/subscription.controller';
import { DbTicketController } from './db-controllers/ticket.controller';
import { DbInstallController } from './db-controllers/install.controller';
import { DbTokenHubController } from './db-controllers/token-hub.controller';
import { DbCertController } from './db-controllers/cert.controller';
import { DbAnalyticsController } from './db-controllers/analytics.controller';
import { DbConciergeController } from './db-controllers/concierge.controller';
import { DbPartnerController } from './db-controllers/partner.controller';
import { DbAuthController } from './db-controllers/auth.controller';

const allEntities = [
  User, EnterpriseInfo, Organization, Order, Payment,
  InstallOrder, DeliveryReport, ServiceReview,
  TokenAccount, TokenUsageRecord, ConfigurationPack, Subscription,
  Certificate, Ticket, ConversationSession, ConversationMessage,
  PartnerEarning, HardwareProduct, AuditLog,
];

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'justin',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'openclaw_club',
      entities: allEntities,
      synchronize: false,
      logging: false,
    }),
    TypeOrmModule.forFeature(allEntities),
  ],
  controllers: [
    AppController,
    DbUserController, DbOrderController, DbHardwareController,
    DbSubscriptionController, DbTicketController, DbInstallController,
    DbTokenHubController, DbCertController, DbAnalyticsController,
    DbConciergeController, DbPartnerController, DbAuthController,
  ],
})
export class AppModule {}
