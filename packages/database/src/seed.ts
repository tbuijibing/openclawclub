/**
 * Database seed script — creates tables and inserts initial data.
 *
 * Usage: npx ts-node src/seed.ts
 *
 * Connects to PostgreSQL, synchronizes schema from entities,
 * then inserts realistic seed data for local development.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';

// Entity imports
import { User } from './entities/user.entity';
import { EnterpriseInfo } from './entities/enterprise-info.entity';
import { Organization } from './entities/organization.entity';
import { Order } from './entities/order.entity';
import { Payment } from './entities/payment.entity';
import { InstallOrder } from './entities/install-order.entity';
import { DeliveryReport } from './entities/delivery-report.entity';
import { ServiceReview } from './entities/service-review.entity';
import { TokenAccount } from './entities/token-account.entity';
import { TokenUsageRecord } from './entities/token-usage-record.entity';
import { ConfigurationPack } from './entities/configuration-pack.entity';
import { Subscription } from './entities/subscription.entity';
import { Certificate } from './entities/certificate.entity';
import { Ticket } from './entities/ticket.entity';
import { ConversationSession } from './entities/conversation-session.entity';
import { ConversationMessage } from './entities/conversation-message.entity';
import { PartnerEarning } from './entities/partner-earning.entity';
import { HardwareProduct } from './entities/hardware-product.entity';
import { AuditLog } from './entities/audit-log.entity';

const ds = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'justin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'openclaw_club',
  synchronize: true,
  logging: false,
  entities: [
    User, EnterpriseInfo, Organization, Order, Payment,
    InstallOrder, DeliveryReport, ServiceReview,
    TokenAccount, TokenUsageRecord, ConfigurationPack, Subscription,
    Certificate, Ticket, ConversationSession, ConversationMessage,
    PartnerEarning, HardwareProduct, AuditLog,
  ],
});

async function seed() {
  console.log('🔌 Connecting to PostgreSQL...');
  await ds.initialize();
  console.log('✅ Connected. Tables synchronized.');

  const userRepo = ds.getRepository(User);
  const enterpriseInfoRepo = ds.getRepository(EnterpriseInfo);
  const orgRepo = ds.getRepository(Organization);
  const orderRepo = ds.getRepository(Order);
  const paymentRepo = ds.getRepository(Payment);
  const installOrderRepo = ds.getRepository(InstallOrder);
  const deliveryReportRepo = ds.getRepository(DeliveryReport);
  const reviewRepo = ds.getRepository(ServiceReview);
  const tokenAccountRepo = ds.getRepository(TokenAccount);
  const tokenUsageRepo = ds.getRepository(TokenUsageRecord);
  const configPackRepo = ds.getRepository(ConfigurationPack);
  const subscriptionRepo = ds.getRepository(Subscription);
  const certRepo = ds.getRepository(Certificate);
  const ticketRepo = ds.getRepository(Ticket);
  const sessionRepo = ds.getRepository(ConversationSession);
  const messageRepo = ds.getRepository(ConversationMessage);
  const partnerEarningRepo = ds.getRepository(PartnerEarning);
  const hardwareRepo = ds.getRepository(HardwareProduct);
  const auditLogRepo = ds.getRepository(AuditLog);

  // Check if already seeded
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('⚠️  Database already has data. Skipping seed.');
    await ds.destroy();
    return;
  }

  console.log('🌱 Seeding data...');

  const defaultPwd = await bcrypt.hash('123456', 10);

  // ─── Users ───────────────────────────────────────────────
  const adminUser = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-admin-001',
    accountType: 'individual', displayName: '系统管理员',
    languagePreference: 'zh', timezone: 'Asia/Shanghai', region: 'apac',
    passwordHash: defaultPwd, role: 'admin',
  });
  const engineer1 = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-eng-001',
    accountType: 'individual', displayName: '张工程师',
    languagePreference: 'zh', timezone: 'Asia/Shanghai', region: 'apac',
    passwordHash: defaultPwd, role: 'certified_engineer',
  });
  const engineer2 = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-eng-002',
    accountType: 'individual', displayName: 'Mike Engineer',
    languagePreference: 'en', timezone: 'America/New_York', region: 'na',
    passwordHash: defaultPwd, role: 'certified_engineer',
  });
  const enterpriseUser = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-ent-001',
    accountType: 'enterprise', displayName: '李企业',
    languagePreference: 'zh', timezone: 'Asia/Shanghai', region: 'apac',
    passwordHash: defaultPwd, role: 'enterprise_user',
  });
  const individualUser = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-ind-001',
    accountType: 'individual', displayName: '王用户',
    languagePreference: 'zh', timezone: 'Asia/Shanghai', region: 'apac',
    passwordHash: defaultPwd, role: 'individual_user',
  });
  const naUser = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-na-001',
    accountType: 'individual', displayName: 'Sarah Johnson',
    languagePreference: 'en', timezone: 'America/Los_Angeles', region: 'na',
    passwordHash: defaultPwd, role: 'individual_user',
  });
  const euUser = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-eu-001',
    accountType: 'enterprise', displayName: 'Hans Müller',
    languagePreference: 'de', timezone: 'Europe/Berlin', region: 'eu',
    passwordHash: defaultPwd, role: 'enterprise_user',
  });
  const supportAgent = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-agent-001',
    accountType: 'individual', displayName: '客服小陈',
    languagePreference: 'zh', timezone: 'Asia/Shanghai', region: 'apac',
    passwordHash: defaultPwd, role: 'support_agent',
  });
  const trainer = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-trainer-001',
    accountType: 'individual', displayName: '培训师刘',
    languagePreference: 'zh', timezone: 'Asia/Shanghai', region: 'apac',
    passwordHash: defaultPwd, role: 'trainer',
  });
  const partner = userRepo.create({
    id: randomUUID(), logtoUserId: 'logto-partner-001',
    accountType: 'individual', displayName: '合作伙伴赵',
    languagePreference: 'zh', timezone: 'Asia/Shanghai', region: 'apac',
    passwordHash: defaultPwd, role: 'partner',
  });

  const users = await userRepo.save([
    adminUser, engineer1, engineer2, enterpriseUser, individualUser,
    naUser, euUser, supportAgent, trainer, partner,
  ]);
  console.log(`  ✅ ${users.length} users created`);

  // ─── Enterprise Info & Organization ──────────────────────
  const entInfo = enterpriseInfoRepo.create({
    userId: enterpriseUser.id, companyName: '深圳智能科技有限公司',
    industry: 'technology', companySize: '50-200',
  });
  const euEntInfo = enterpriseInfoRepo.create({
    userId: euUser.id, companyName: 'TechCorp GmbH',
    industry: 'manufacturing', companySize: '200-1000',
  });
  await enterpriseInfoRepo.save([entInfo, euEntInfo]);

  const org1 = orgRepo.create({
    logtoOrgId: 'logto-org-001', name: '深圳智能科技', ownerUserId: enterpriseUser.id,
  });
  const org2 = orgRepo.create({
    logtoOrgId: 'logto-org-002', name: 'TechCorp GmbH', ownerUserId: euUser.id,
  });
  await orgRepo.save([org1, org2]);
  console.log('  ✅ Enterprise info & organizations created');

  // ─── Hardware Products ───────────────────────────────────
  const hwLite = hardwareRepo.create({
    category: 'clawbox_lite',
    name: { en: 'ClawBox Lite', zh: 'ClawBox 轻量版', ja: 'ClawBox ライト' },
    description: { en: 'Personal AI assistant, compact and affordable', zh: '个人AI助手，小巧实惠' },
    specs: { cpu: 'Intel N100', ram: '8GB DDR5', storage: '256GB NVMe', gpu: 'Integrated' },
    preinstalledSoftware: { items: ['OpenClaw Latest', 'Token_Hub Gateway', 'OCSAS L1'] },
    tokenHubBonusAmount: 50, price: 499,
    stockByRegion: { apac: 200, na: 100, eu: 80 },
  });
  const hwPro = hardwareRepo.create({
    category: 'clawbox_pro',
    name: { en: 'ClawBox Pro', zh: 'ClawBox 专业版', ja: 'ClawBox プロ' },
    description: { en: 'Professional AI workstation for developers', zh: '面向开发者的专业AI工作站' },
    specs: { cpu: 'Intel i5-1340P', ram: '16GB DDR5', storage: '512GB NVMe', gpu: 'Intel Iris Xe' },
    preinstalledSoftware: { items: ['OpenClaw Latest', 'Token_Hub Gateway', 'OCSAS L2', 'Dev Tools Pack'] },
    tokenHubBonusAmount: 100, price: 999,
    stockByRegion: { apac: 150, na: 80, eu: 60 },
  });
  const hwEnterprise = hardwareRepo.create({
    category: 'clawbox_enterprise',
    name: { en: 'ClawBox Enterprise', zh: 'ClawBox 企业版', ja: 'ClawBox エンタープライズ' },
    description: { en: 'Enterprise-grade AI server with full security suite', zh: '企业级AI服务器，完整安全套件' },
    specs: { cpu: 'Intel i7-1370P', ram: '32GB DDR5', storage: '1TB NVMe', gpu: 'NVIDIA T600' },
    preinstalledSoftware: { items: ['OpenClaw Latest', 'Token_Hub Gateway', 'OCSAS L3', 'Enterprise Suite'] },
    tokenHubBonusAmount: 500, price: 2499,
    stockByRegion: { apac: 50, na: 30, eu: 20 },
  });
  await hardwareRepo.save([hwLite, hwPro, hwEnterprise]);
  console.log('  ✅ 3 hardware products created');

  // ─── Configuration Packs (name is varchar, no yearlyPrice/contents) ──
  const packProductivity = configPackRepo.create({
    name: 'Productivity Boost Pack',
    category: 'productivity',
    description: { en: 'Enhance your daily workflow', zh: '提升日常工作效率' },
    monthlyPrice: 49, version: '2.1.0',
  });
  const packDeveloper = configPackRepo.create({
    name: 'Developer Tools Pack',
    category: 'developer',
    description: { en: 'Full-stack development toolkit', zh: '全栈开发工具集' },
    monthlyPrice: 79, version: '3.0.0',
  });
  const packEnterprise = configPackRepo.create({
    name: 'Enterprise Solution Pack',
    category: 'enterprise',
    description: { en: 'Complete enterprise deployment', zh: '完整企业部署方案' },
    monthlyPrice: 199, version: '1.5.0',
  });
  await configPackRepo.save([packProductivity, packDeveloper, packEnterprise]);
  console.log('  ✅ 3 configuration packs created');

  // ─── Orders & Payments ───────────────────────────────────
  const order1 = orderRepo.create({
    orderNumber: 'OC-20260301-0001', userId: individualUser.id,
    orderType: 'installation', status: 'completed', totalAmount: 299, currency: 'USD', region: 'apac',
  });
  const order2 = orderRepo.create({
    orderNumber: 'OC-20260302-0002', userId: enterpriseUser.id, orgId: org1.id,
    orderType: 'installation', status: 'paid_pending_dispatch', totalAmount: 999, currency: 'USD', region: 'apac',
  });
  const order3 = orderRepo.create({
    orderNumber: 'OC-20260303-0003', userId: naUser.id,
    orderType: 'subscription', status: 'completed', totalAmount: 79, currency: 'USD', region: 'na',
  });
  const order4 = orderRepo.create({
    orderNumber: 'OC-20260304-0004', userId: euUser.id, orgId: org2.id,
    orderType: 'hardware', status: 'shipped', totalAmount: 2499, currency: 'EUR', region: 'eu',
  });
  const order5 = orderRepo.create({
    orderNumber: 'OC-20260305-0005', userId: individualUser.id,
    orderType: 'course', status: 'completed', totalAmount: 99, currency: 'USD', region: 'apac',
  });
  const order6 = orderRepo.create({
    orderNumber: 'OC-20260306-0006', userId: naUser.id,
    orderType: 'certification', status: 'pending_payment', totalAmount: 299, currency: 'USD', region: 'na',
  });
  const orders = await orderRepo.save([order1, order2, order3, order4, order5, order6]);
  console.log(`  ✅ ${orders.length} orders created`);

  // Payments (paymentMethod, no settledAt/engineerShare/platformShare)
  const pay1 = paymentRepo.create({
    orderId: order1.id, paymentMethod: 'alipay', status: 'settled',
    amount: 299, currency: 'USD',
    escrowFrozenAt: new Date('2026-03-01'), escrowReleasedAt: new Date('2026-03-05'),
  });
  const pay2 = paymentRepo.create({
    orderId: order2.id, paymentMethod: 'alipay', status: 'frozen',
    amount: 999, currency: 'USD', escrowFrozenAt: new Date('2026-03-02'),
  });
  const pay3 = paymentRepo.create({
    orderId: order3.id, paymentMethod: 'stripe', status: 'settled',
    amount: 79, currency: 'USD', escrowReleasedAt: new Date('2026-03-03'),
  });
  const pay4 = paymentRepo.create({
    orderId: order4.id, paymentMethod: 'sepa', status: 'settled',
    amount: 2499, currency: 'EUR', escrowReleasedAt: new Date('2026-03-04'),
  });
  await paymentRepo.save([pay1, pay2, pay3, pay4]);
  console.log('  ✅ 4 payments created');

  // ─── Install Orders (no userId field) ────────────────────
  const install1 = installOrderRepo.create({
    orderId: order1.id, engineerId: engineer1.id,
    serviceTier: 'professional', ocsasLevel: 2, installStatus: 'completed',
    tokenHubConnected: true, warrantyEndDate: new Date('2026-06-01'),
    dispatchedAt: new Date('2026-03-01T08:00:00Z'),
    acceptedAt: new Date('2026-03-01T09:00:00Z'),
    completedAt: new Date('2026-03-01T15:00:00Z'),
    acceptedByUserAt: new Date('2026-03-01T16:00:00Z'),
  });
  const install2 = installOrderRepo.create({
    orderId: order2.id,
    serviceTier: 'enterprise', ocsasLevel: 3, installStatus: 'pending_dispatch',
    tokenHubConnected: true,
  });
  await installOrderRepo.save([install1, install2]);

  // Delivery report (no engineerId field)
  await deliveryReportRepo.save(deliveryReportRepo.create({
    installOrderId: install1.id,
    checklist: { coreInstalled: true, securityConfigured: true, tokenHubConnected: true },
    configItems: { ocsasLevel: 2, tokenHub: true, firewall: true },
    testResults: { allPassed: true, latency: '12ms' },
    screenshots: ['https://example.com/install-complete.png'],
  }));

  // Review (no installOrderId field)
  await reviewRepo.save(reviewRepo.create({
    orderId: order1.id, userId: individualUser.id,
    overallRating: 5, attitudeRating: 5, skillRating: 5, responseRating: 4,
    comment: '服务非常专业，安装过程顺利！',
  }));
  console.log('  ✅ Install orders, delivery report & review created');

  // ─── Token Accounts & Usage (no totalSpentUsd) ───────────
  const ta1 = tokenAccountRepo.create({
    userId: individualUser.id, billingMode: 'pay_as_you_go', balanceUsd: 42.35,
  });
  const ta2 = tokenAccountRepo.create({
    userId: enterpriseUser.id, billingMode: 'monthly_plan',
    balanceUsd: 180.00, monthlyQuotaUsd: 200,
  });
  const ta3 = tokenAccountRepo.create({
    userId: naUser.id, billingMode: 'pay_as_you_go', balanceUsd: 25.50,
  });
  await tokenAccountRepo.save([ta1, ta2, ta3]);

  // Usage records
  const usageData = [
    { accountId: ta1.id, provider: 'openai', model: 'gpt-4o', promptTokens: 1200, completionTokens: 800, totalTokens: 2000, costUsd: 0.03, priceUsd: 0.045 },
    { accountId: ta1.id, provider: 'anthropic', model: 'claude-3.5-sonnet', promptTokens: 2000, completionTokens: 1500, totalTokens: 3500, costUsd: 0.05, priceUsd: 0.075 },
    { accountId: ta1.id, provider: 'deepseek', model: 'deepseek-v3', promptTokens: 5000, completionTokens: 3000, totalTokens: 8000, costUsd: 0.01, priceUsd: 0.015 },
    { accountId: ta2.id, provider: 'openai', model: 'gpt-4o', promptTokens: 10000, completionTokens: 5000, totalTokens: 15000, costUsd: 0.20, priceUsd: 0.30 },
    { accountId: ta2.id, provider: 'google', model: 'gemini-2.0-flash', promptTokens: 8000, completionTokens: 4000, totalTokens: 12000, costUsd: 0.08, priceUsd: 0.12 },
    { accountId: ta3.id, provider: 'anthropic', model: 'claude-3.5-sonnet', promptTokens: 3000, completionTokens: 2000, totalTokens: 5000, costUsd: 0.07, priceUsd: 0.105 },
  ];
  for (const u of usageData) {
    await tokenUsageRepo.save(tokenUsageRepo.create(u));
  }
  console.log('  ✅ 3 token accounts & 6 usage records created');

  // ─── Subscriptions (packId, orderId required, no cancelledAt) ──
  const sub1 = subscriptionRepo.create({
    userId: naUser.id, packId: packDeveloper.id, orderId: order3.id,
    cycle: 'monthly', status: 'active', autoRenew: true,
    currentPeriodStart: new Date('2026-03-01'), currentPeriodEnd: new Date('2026-04-01'),
  });
  const sub2 = subscriptionRepo.create({
    userId: enterpriseUser.id, packId: packEnterprise.id, orderId: order2.id,
    cycle: 'yearly', status: 'active', autoRenew: true,
    currentPeriodStart: new Date('2026-01-01'), currentPeriodEnd: new Date('2027-01-01'),
  });
  const sub3 = subscriptionRepo.create({
    userId: individualUser.id, packId: packProductivity.id, orderId: order5.id,
    cycle: 'monthly', status: 'cancelled', autoRenew: false,
    currentPeriodStart: new Date('2026-02-01'), currentPeriodEnd: new Date('2026-03-01'),
  });
  await subscriptionRepo.save([sub1, sub2, sub3]);
  console.log('  ✅ 3 subscriptions created');

  // ─── Certificates (no price field) ───────────────────────
  const cert1 = certRepo.create({
    userId: engineer1.id, certType: 'OCP', certNumber: 'OCC-OCP-20260101-001',
    status: 'active', issuedAt: new Date('2026-01-15'), expiresAt: new Date('2027-01-15'),
    projectCount: 12,
  });
  const cert2 = certRepo.create({
    userId: engineer2.id, certType: 'OCE', certNumber: 'OCC-OCE-20260201-001',
    status: 'active', issuedAt: new Date('2026-02-01'), expiresAt: new Date('2027-02-01'),
    projectCount: 5,
  });
  const cert3 = certRepo.create({
    userId: engineer1.id, certType: 'AI_Engineer', certNumber: 'OCC-AIE-20260301-001',
    status: 'active', issuedAt: new Date('2026-03-01'), expiresAt: new Date('2027-03-01'),
    projectCount: 0,
  });
  await certRepo.save([cert1, cert2, cert3]);
  console.log('  ✅ 3 certificates created');

  // ─── Tickets ─────────────────────────────────────────────
  const ticket1 = ticketRepo.create({
    ticketNumber: 'TK-20260301-001', userId: individualUser.id,
    priority: 'standard', status: 'resolved', subject: 'OCSAS L2 配置问题',
    description: '安装完成后 OCSAS L2 审计日志未正常记录',
    assignedAgentId: supportAgent.id,
    slaResponseDeadline: new Date('2026-03-02'),
    firstRespondedAt: new Date('2026-03-01T10:00:00Z'),
    resolvedAt: new Date('2026-03-01T14:00:00Z'),
    satisfactionRating: 5,
  });
  const ticket2 = ticketRepo.create({
    ticketNumber: 'TK-20260305-002', userId: naUser.id,
    priority: 'priority', status: 'in_progress', subject: 'Token_Hub billing discrepancy',
    description: 'My usage dashboard shows different amount than invoice',
    assignedAgentId: supportAgent.id,
    slaResponseDeadline: new Date('2026-03-05T16:00:00Z'),
    firstRespondedAt: new Date('2026-03-05T12:30:00Z'),
  });
  const ticket3 = ticketRepo.create({
    ticketNumber: 'TK-20260307-003', userId: euUser.id,
    priority: 'enterprise', status: 'open', subject: 'GDPR data export request',
    description: 'Need full data export for compliance audit',
    slaResponseDeadline: new Date('2026-03-07T08:00:00Z'),
  });
  await ticketRepo.save([ticket1, ticket2, ticket3]);
  console.log('  ✅ 3 tickets created');

  // ─── Conversation Sessions & Messages (no scenario field) ─
  const session1 = sessionRepo.create({
    userId: individualUser.id, language: 'zh', status: 'completed',
  });
  await sessionRepo.save(session1);

  await messageRepo.save([
    messageRepo.create({ sessionId: session1.id, role: 'user', content: '你好，我想安装 OpenClaw 专业版' }),
    messageRepo.create({ sessionId: session1.id, role: 'assistant', content: '您好！很高兴为您服务。请问您的设备环境是什么？操作系统、内存大小？' }),
    messageRepo.create({ sessionId: session1.id, role: 'user', content: 'macOS，16GB 内存' }),
    messageRepo.create({
      sessionId: session1.id, role: 'assistant',
      content: '非常好！根据您的配置，我推荐专业安装包（$299），包含 OCSAS L2 安全配置和 90 天质保。确认下单吗？',
      richElements: { type: 'service_plan_card', data: { tier: 'professional', price: 299 } },
    }),
  ]);
  console.log('  ✅ 1 conversation session & 4 messages created');

  // ─── Partner Earnings (grossAmount/sharePercentage/netAmount/paidAt) ──
  await partnerEarningRepo.save([
    partnerEarningRepo.create({
      partnerId: partner.id, partnerType: 'certified_engineer', orderId: order1.id,
      grossAmount: 299, sharePercentage: 80, netAmount: 239.2,
      status: 'settled', settlementMonth: '2026-03', paidAt: new Date('2026-03-15'),
    }),
    partnerEarningRepo.create({
      partnerId: engineer1.id, partnerType: 'certified_engineer', orderId: order1.id,
      grossAmount: 299, sharePercentage: 80, netAmount: 239.2,
      status: 'settled', settlementMonth: '2026-03', paidAt: new Date('2026-03-15'),
    }),
  ]);
  console.log('  ✅ 2 partner earnings created');

  // ─── Audit Logs (resourceType, not resource) ─────────────
  await auditLogRepo.save([
    auditLogRepo.create({ userId: adminUser.id, action: 'user.login', resourceType: 'auth', details: { ip: '192.168.1.100', method: 'password' } }),
    auditLogRepo.create({ userId: individualUser.id, action: 'order.create', resourceType: 'orders', resourceId: order1.id, details: { orderType: 'installation', amount: 299 } }),
    auditLogRepo.create({ userId: engineer1.id, action: 'install.accept', resourceType: 'installations', resourceId: install1.id, details: { tier: 'professional' } }),
    auditLogRepo.create({ userId: individualUser.id, action: 'install.accept_delivery', resourceType: 'installations', resourceId: install1.id }),
    auditLogRepo.create({ userId: naUser.id, action: 'subscription.create', resourceType: 'subscriptions', resourceId: sub1.id, details: { pack: 'developer', cycle: 'monthly' } }),
  ]);
  console.log('  ✅ 5 audit logs created');

  console.log('\n🎉 Seed complete! Database is ready for local development.');
  console.log('   Users: 10 | Orders: 6 | Payments: 4 | Install Orders: 2');
  console.log('   Hardware: 3 | Config Packs: 3 | Subscriptions: 3');
  console.log('   Certificates: 3 | Tickets: 3 | Token Accounts: 3');

  await ds.destroy();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
