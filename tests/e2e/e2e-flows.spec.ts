/**
 * End-to-End Integration Tests — 6 Core Business Flows
 *
 * Tests the happy path for each major business flow by instantiating
 * actual service classes and calling methods in sequence.
 *
 * Requirements: 2.1-2.21, 3.1-3.7, 9.1-9.12, 14.1-14.9, 15.1-15.12, 16.1-16.10
 */

import 'reflect-metadata';

// ─── Service imports ───
import { OrderService } from '../../services/order-service/src/order.service';
import { PaymentService } from '../../services/order-service/src/payment/payment.service';
import { EarningsService } from '../../services/order-service/src/billing/earnings.service';
import { InstallService } from '../../services/install-service/src/install.service';
import { DispatchService } from '../../services/install-service/src/dispatch.service';
import { SubscriptionService } from '../../services/subscription-service/src/subscription.service';
import { BillingService } from '../../services/token-hub-service/src/billing.service';
import { HardwareService } from '../../services/hardware-service/src/hardware.service';
import { CertificationService } from '../../services/cert-service/src/certification.service';
import { TicketService } from '../../services/ticket-service/src/ticket.service';

// ─── Helpers ───
const USER_ID = 'user-e2e-001';
const ENGINEER_ID = 'eng-e2e-001';
const AGENT_ID = 'agent-e2e-001';

describe('E2E Flow 1: User Registration → AI Conversation → Install Order → Payment → Dispatch → Service → Acceptance → Settlement', () => {
  let orderService: OrderService;
  let paymentService: PaymentService;
  let installService: InstallService;
  let dispatchService: DispatchService;

  beforeEach(() => {
    orderService = new OrderService();
    paymentService = new PaymentService(orderService);
    installService = new InstallService();
    dispatchService = new DispatchService(installService);
  });

  it('should complete the full installation service flow', async () => {
    // Step 1: Create install order (simulates AI_Concierge → user confirms plan)
    const installOrder = installService.createInstallOrder({
      userId: USER_ID,
      tier: 'professional',
      conversationId: 'conv-e2e-001',
      deviceEnvironment: { os: 'macOS', ram: '16GB' },
    });
    expect(installOrder.installStatus).toBe('pending_dispatch');
    expect(installOrder.serviceTier).toBe('professional');
    expect(installOrder.ocsasLevel).toBe(2);
    expect(installOrder.tokenHubConnected).toBe(true);

    // Step 2: Create corresponding order and process payment (escrow freeze)
    const order = orderService.createOrder({
      userId: USER_ID,
      orderType: 'installation',
      totalAmount: 299,
      currency: 'USD',
    });
    expect(order.status).toBe('pending_payment');
    expect(order.orderNumber).toMatch(/^OC-/);

    const payment = await paymentService.processPayment(order.id, 'credit_card');
    expect(payment.status).toBe('frozen');
    expect(payment.escrowFrozenAt).toBeDefined();

    const updatedOrder = orderService.getOrder(order.id);
    expect(updatedOrder.status).toBe('paid_pending_dispatch');

    // Step 3: Dispatch — register engineer and match
    dispatchService.registerEngineer({
      id: ENGINEER_ID,
      skillLevel: 4,
      currentLoad: 1,
      timezone: 'Asia/Shanghai',
      avgRating: 4.8,
      avgResponseMinutes: 15,
      region: 'apac',
      available: true,
    });

    const dispatch = dispatchService.dispatchOrder(installOrder.id, 'Asia/Shanghai');
    expect(dispatch.matches.length).toBeGreaterThan(0);
    expect(dispatch.matches[0].engineerId).toBe(ENGINEER_ID);
    expect(dispatch.status).toBe('dispatched');

    // Step 4: Engineer accepts order
    const accepted = installService.acceptOrder(installOrder.id, ENGINEER_ID);
    expect(accepted.installStatus).toBe('accepted');
    expect(accepted.engineerId).toBe(ENGINEER_ID);

    // Step 5: Progress through service stages
    installService.updateProgress(installOrder.id, 'assessing');
    installService.updateProgress(installOrder.id, 'installing');
    installService.updateProgress(installOrder.id, 'configuring');
    installService.updateProgress(installOrder.id, 'testing');

    const inTesting = installService.getInstallOrder(installOrder.id);
    expect(inTesting.installStatus).toBe('testing');

    // Step 6: Submit delivery report
    const report = installService.submitDeliveryReport(installOrder.id, ENGINEER_ID, {
      checklist: { coreInstalled: true, securityConfigured: true },
      configItems: { ocsasLevel: 2, tokenHub: true },
      testResults: { allPassed: true },
      screenshots: ['https://example.com/screenshot1.png'],
    });
    expect(report.installOrderId).toBe(installOrder.id);

    // After report submission, status should be pending_acceptance
    const pendingAcceptance = installService.getInstallOrder(installOrder.id);
    expect(pendingAcceptance.installStatus).toBe('pending_acceptance');

    // Step 7: User confirms acceptance → triggers settlement
    const { order: completedInstall, settlement } = installService.confirmAcceptance(
      installOrder.id,
      USER_ID,
    );
    expect(completedInstall.installStatus).toBe('completed');
    expect(completedInstall.warrantyEndDate).toBeDefined();
    expect(settlement.engineerShare).toBeGreaterThan(0);
    expect(settlement.platformShare).toBeGreaterThan(0);
    // Engineer 80% + Platform 20% = total
    expect(settlement.engineerShare + settlement.platformShare).toBeCloseTo(
      settlement.totalAmount,
      1,
    );

    // Step 8: User submits review
    const review = installService.submitReview(installOrder.id, USER_ID, {
      overallRating: 5,
      attitudeRating: 5,
      skillRating: 5,
      responseRating: 4,
      comment: 'Excellent service!',
    });
    expect(review.overallRating).toBe(5);
  });
});

describe('E2E Flow 2: Configuration Pack Subscribe → Deploy → Auto-Renew → Cancel', () => {
  let subscriptionService: SubscriptionService;

  beforeEach(() => {
    subscriptionService = new SubscriptionService();
  });

  it('should complete the full subscription lifecycle', () => {
    // Step 1: Get available packs and subscribe
    const packs = subscriptionService.getConfigurationPacks();
    expect(packs.length).toBe(3);

    const devPack = packs.find((p) => p.category === 'developer');
    expect(devPack).toBeDefined();
    expect(devPack!.monthlyPrice).toBe(79);

    const subscription = subscriptionService.subscribe(USER_ID, devPack!.id, 'monthly');
    expect(subscription.status).toBe('active');
    expect(subscription.autoRenew).toBe(true);
    expect(subscription.cycle).toBe('monthly');

    // Step 2: Deploy configuration pack
    const deployResult = subscriptionService.deployPack(subscription.id);
    expect(deployResult.status).toBe('success');
    expect(deployResult.deployedAt).toBeDefined();

    // Step 3: Process auto-renewal
    const renewalResult = subscriptionService.processAutoRenewal(subscription.id);
    expect(renewalResult.renewed).toBe(true);
    expect(renewalResult.amountCharged).toBe(79);
    expect(renewalResult.newPeriodStart).toBeDefined();
    expect(renewalResult.newPeriodEnd).toBeDefined();

    // Step 4: Cancel subscription
    subscriptionService.cancelSubscription(subscription.id);
    const cancelled = subscriptionService.getSubscription(subscription.id);
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.autoRenew).toBe(false);
    expect(cancelled.cancelledAt).toBeDefined();
    expect(cancelled.dataRetentionUntil).toBeDefined();
  });
});

describe('E2E Flow 3: Token_Hub Recharge → AI Call → Metering → Billing', () => {
  let billingService: BillingService;

  beforeEach(() => {
    billingService = new BillingService();
  });

  it('should complete the full token hub billing flow', () => {
    // Step 1: Purchase quota (top-up balance)
    const account = billingService.purchaseQuota(USER_ID, {
      billingMode: 'pay_as_you_go',
      amountUsd: 50.0,
    });
    expect(account.balanceUsd).toBe(50.0);
    expect(account.billingMode).toBe('pay_as_you_go');

    // Step 2: Simulate AI call → meter usage
    const usage1 = billingService.meterUsage(USER_ID, {
      provider: 'openai',
      model: 'gpt-4o',
      promptTokens: 500,
      completionTokens: 200,
      totalTokens: 700,
      costUsd: 0.01,
      priceUsd: 0.015,
    });
    expect(usage1.totalTokens).toBe(700);
    expect(usage1.priceUsd).toBe(0.015);

    // Step 3: Another AI call
    const usage2 = billingService.meterUsage(USER_ID, {
      provider: 'anthropic',
      model: 'claude-3.5-sonnet',
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      costUsd: 0.02,
      priceUsd: 0.03,
    });
    expect(usage2.totalTokens).toBe(1500);

    // Step 4: Check balance deducted
    const updatedAccount = billingService.getOrCreateAccount(USER_ID);
    expect(updatedAccount.balanceUsd).toBeCloseTo(50.0 - 0.015 - 0.03, 4);

    // Step 5: Get usage dashboard
    const today = new Date().toISOString().slice(0, 10);
    const dashboard = billingService.getUsageDashboard(USER_ID, today, today);
    expect(dashboard.totalTokens).toBe(2200);
    expect(dashboard.totalPriceUsd).toBeCloseTo(0.045, 4);
    expect(dashboard.modelDistribution.length).toBe(2);
    expect(dashboard.balance).toBeCloseTo(50.0 - 0.045, 4);
  });
});

describe('E2E Flow 4: Hardware Store Order → Payment → Shipping → After-Sales', () => {
  let hardwareService: HardwareService;

  beforeEach(() => {
    hardwareService = new HardwareService();
  });

  it('should complete the full hardware purchase flow', () => {
    // Step 1: List products
    const products = hardwareService.listProducts({ region: 'apac' });
    expect(products.length).toBeGreaterThan(0);

    // Find a ClawBox product
    const clawboxPro = hardwareService.getProductByCategory('clawbox_pro');
    expect(clawboxPro).toBeDefined();

    // Step 2: Create hardware order
    const order = hardwareService.createHardwareOrder({
      userId: USER_ID,
      items: [{ productId: clawboxPro!.id, quantity: 1, includeInstallation: true }],
      region: 'apac',
    });
    expect(order.status).toBe('pending_payment');
    expect(order.items.length).toBe(1);
    expect(order.bundleDiscount).toBeGreaterThan(0); // bundle discount applied
    expect(order.tokenHubAccountsCreated.length).toBe(1); // Token_Hub account auto-created
    expect(order.tokenHubAccountsCreated[0].bonusAmount).toBeGreaterThan(0);

    // Step 3: Simulate payment → update status to paid → processing → shipped
    hardwareService.updateOrderStatus(order.id, 'paid');
    hardwareService.updateOrderStatus(order.id, 'processing');
    hardwareService.updateOrderStatus(order.id, 'shipped');

    // Step 4: Check shipping status
    const shipping = hardwareService.getShippingStatus({ orderId: order.id });
    expect(shipping.orderId).toBe(order.id);
    expect(shipping.stage).toBe('in_transit');
    expect(shipping.carrier.name).toBeTruthy();
    expect(shipping.region).toBe('apac');

    // Step 5: Mark as delivered
    hardwareService.updateOrderStatus(order.id, 'delivered');

    // Step 6: Request after-sales (tech support)
    const afterSales = hardwareService.requestAfterSales({
      orderId: order.id,
      type: 'tech_support',
      reason: 'Need help with initial setup',
    });
    expect(afterSales.type).toBe('tech_support');
    expect(afterSales.status).toBe('open');
    expect(afterSales.isWithinWarranty).toBe(true);
  });
});

describe('E2E Flow 5: Training Enrollment → Study → Exam → Certification → Renewal', () => {
  let certService: CertificationService;

  beforeEach(() => {
    certService = new CertificationService();
    // Set scoring function to always pass (score 90)
    certService.setScoringFunction(() => 90);
  });

  it('should complete the full training and certification flow', () => {
    // Step 1: Enroll in a course
    const courses = certService.getCourses();
    expect(courses.length).toBeGreaterThan(0);

    const advancedCourse = certService.getCourse('advanced_skills');
    expect(advancedCourse.price).toBe(99);

    const enrollment = certService.enrollCourse(USER_ID, 'advanced_skills');
    expect(enrollment.status).toBe('active');

    // Step 2: Start and submit exam (pass with score >= 80)
    const exam = certService.startExam(USER_ID, 'advanced_skills');
    expect(exam.status).toBe('in_progress');

    const examResult = certService.submitExam(USER_ID, exam.id, {
      q1: 'Answer 1',
      q2: 'Answer 2',
      q3: 'Answer 3',
    });
    expect(examResult.passed).toBe(true);
    expect(examResult.score).toBe(90);

    // Step 3: Issue certificate
    const cert = certService.issueCertificate(USER_ID, 'OCP');
    expect(cert.status).toBe('active');
    expect(cert.certNumber).toMatch(/^OCC-OCP-/);
    expect(cert.expiresAt).toBeDefined();

    // Step 4: Verify certificate
    const verification = certService.verifyCertificate(cert.certNumber);
    expect(verification.valid).toBe(true);
    expect(verification.certType).toBe('OCP');

    // Step 5: Prepare for renewal (complete training + 5 projects)
    certService.completeAnnualTraining(cert.id);
    certService.updateProjectCount(cert.id, 5);

    const originalExpiry = new Date(cert.expiresAt);
    const renewed = certService.renewCertificate(cert.id);
    expect(renewed.status).toBe('active');
    // Renewed cert should have expiry >= original (extended from current expiry)
    expect(renewed.expiresAt.getTime()).toBeGreaterThanOrEqual(originalExpiry.getTime());
    // After renewal, project count and training flag reset
    expect(renewed.projectCount).toBe(0);
    expect(renewed.annualTrainingCompleted).toBe(false);
  });
});

describe('E2E Flow 6: Ticket Submit → Assign → Process → Rate', () => {
  let ticketService: TicketService;

  beforeEach(() => {
    ticketService = new TicketService();
  });

  it('should complete the full support ticket flow', () => {
    // Step 1: Create ticket
    const ticket = ticketService.createTicket({
      userId: USER_ID,
      subject: 'OpenClaw installation issue',
      description: 'Getting error during OCSAS Level 2 configuration',
      priority: 'priority',
    });
    expect(ticket.status).toBe('open');
    expect(ticket.priority).toBe('priority');
    expect(ticket.ticketNumber).toMatch(/^TK/);
    expect(ticket.slaResponseDeadline).toBeDefined();

    // Step 2: Assign to support agent
    const assigned = ticketService.assignTicket({
      ticketId: ticket.id,
      agentId: AGENT_ID,
    });
    expect(assigned.assignedAgentId).toBe(AGENT_ID);

    // Step 3: Agent starts working (status → in_progress)
    const inProgress = ticketService.updateTicketStatus({
      ticketId: ticket.id,
      status: 'in_progress',
    });
    expect(inProgress.status).toBe('in_progress');
    expect(inProgress.firstRespondedAt).toBeDefined();

    // Step 4: Resolve ticket
    const resolved = ticketService.resolveTicket(ticket.id);
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedAt).toBeDefined();

    // Step 5: User rates the ticket
    const rated = ticketService.rateTicket({
      ticketId: ticket.id,
      rating: 4,
    });
    expect(rated.satisfactionRating).toBe(4);

    // Verify notifications were emitted
    const notifications = ticketService.getNotifications();
    expect(notifications.length).toBeGreaterThanOrEqual(3); // assignment + status_change + rating_request
    const types = notifications.map((n) => n.type);
    expect(types).toContain('assignment');
    expect(types).toContain('status_change');
    expect(types).toContain('rating_request');
  });
});
