import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreTables1000000000000 implements MigrationInterface {
  name = 'CreateCoreTables1000000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Users
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        logto_user_id VARCHAR(64) UNIQUE NOT NULL,
        account_type VARCHAR(20) NOT NULL,
        display_name VARCHAR(100),
        avatar_url TEXT,
        language_preference VARCHAR(5) DEFAULT 'en',
        timezone VARCHAR(50) DEFAULT 'UTC',
        region VARCHAR(10),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Organizations
    await queryRunner.query(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        logto_org_id VARCHAR(64) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        owner_user_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Enterprise Info
    await queryRunner.query(`
      CREATE TABLE enterprise_info (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        org_id UUID REFERENCES organizations(id),
        company_name VARCHAR(200) NOT NULL,
        industry VARCHAR(50),
        company_size VARCHAR(20),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Orders
    await queryRunner.query(`
      CREATE TABLE orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_number VARCHAR(32) UNIQUE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id),
        org_id UUID REFERENCES organizations(id),
        order_type VARCHAR(20) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'pending_payment',
        total_amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        region VARCHAR(10),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Payments
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        payment_method VARCHAR(20) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        escrow_frozen_at TIMESTAMPTZ,
        escrow_released_at TIMESTAMPTZ,
        external_payment_id VARCHAR(128),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Install Orders
    await queryRunner.query(`
      CREATE TABLE install_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        service_tier VARCHAR(20) NOT NULL,
        ocsas_level INTEGER NOT NULL DEFAULT 1,
        engineer_id UUID REFERENCES users(id),
        conversation_id UUID,
        device_environment JSONB,
        install_status VARCHAR(30) NOT NULL DEFAULT 'pending_dispatch',
        token_hub_connected BOOLEAN DEFAULT TRUE,
        warranty_end_date DATE,
        warranty_repair_count INTEGER DEFAULT 0,
        dispatched_at TIMESTAMPTZ,
        accepted_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        accepted_by_user_at TIMESTAMPTZ
      )
    `);

    // Delivery Reports
    await queryRunner.query(`
      CREATE TABLE delivery_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        install_order_id UUID NOT NULL REFERENCES install_orders(id),
        checklist JSONB NOT NULL,
        config_items JSONB NOT NULL,
        test_results JSONB NOT NULL,
        screenshots TEXT[],
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Service Reviews
    await queryRunner.query(`
      CREATE TABLE service_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL REFERENCES orders(id),
        user_id UUID NOT NULL REFERENCES users(id),
        overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
        attitude_rating INTEGER CHECK (attitude_rating BETWEEN 1 AND 5),
        skill_rating INTEGER CHECK (skill_rating BETWEEN 1 AND 5),
        response_rating INTEGER CHECK (response_rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Token Accounts
    await queryRunner.query(`
      CREATE TABLE token_accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        balance_usd DECIMAL(12,4) NOT NULL DEFAULT 0,
        billing_mode VARCHAR(20) NOT NULL DEFAULT 'pay_as_you_go',
        monthly_quota_usd DECIMAL(12,2),
        budget_alert_threshold DECIMAL(12,2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Token Usage Records
    await queryRunner.query(`
      CREATE TABLE token_usage_records (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        account_id UUID NOT NULL REFERENCES token_accounts(id),
        provider VARCHAR(30) NOT NULL,
        model VARCHAR(50) NOT NULL,
        prompt_tokens INTEGER NOT NULL,
        completion_tokens INTEGER NOT NULL,
        total_tokens INTEGER NOT NULL,
        cost_usd DECIMAL(10,6) NOT NULL,
        price_usd DECIMAL(10,6) NOT NULL,
        request_id VARCHAR(64),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Configuration Packs
    await queryRunner.query(`
      CREATE TABLE configuration_packs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        category VARCHAR(30) NOT NULL,
        monthly_price DECIMAL(8,2) NOT NULL,
        description JSONB NOT NULL,
        version VARCHAR(20) NOT NULL,
        contributor_id UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Subscriptions
    await queryRunner.query(`
      CREATE TABLE subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        pack_id UUID NOT NULL REFERENCES configuration_packs(id),
        order_id UUID NOT NULL REFERENCES orders(id),
        cycle VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        current_period_start TIMESTAMPTZ NOT NULL,
        current_period_end TIMESTAMPTZ NOT NULL,
        auto_renew BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Certificates
    await queryRunner.query(`
      CREATE TABLE certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        cert_type VARCHAR(30) NOT NULL,
        cert_number VARCHAR(32) UNIQUE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        issued_at TIMESTAMPTZ NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        project_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Tickets
    await queryRunner.query(`
      CREATE TABLE tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ticket_number VARCHAR(32) UNIQUE NOT NULL,
        user_id UUID NOT NULL REFERENCES users(id),
        priority VARCHAR(10) NOT NULL DEFAULT 'standard',
        status VARCHAR(20) NOT NULL DEFAULT 'open',
        subject VARCHAR(200) NOT NULL,
        description TEXT,
        assigned_agent_id UUID REFERENCES users(id),
        sla_response_deadline TIMESTAMPTZ,
        first_responded_at TIMESTAMPTZ,
        resolved_at TIMESTAMPTZ,
        satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Conversation Sessions
    await queryRunner.query(`
      CREATE TABLE conversation_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        language VARCHAR(5) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        escalated_to_agent_id UUID REFERENCES users(id),
        collected_requirements JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Conversation Messages
    await queryRunner.query(`
      CREATE TABLE conversation_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID NOT NULL REFERENCES conversation_sessions(id),
        role VARCHAR(10) NOT NULL,
        content TEXT NOT NULL,
        rich_elements JSONB,
        token_usage JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Partner Earnings
    await queryRunner.query(`
      CREATE TABLE partner_earnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        partner_id UUID NOT NULL REFERENCES users(id),
        partner_type VARCHAR(20) NOT NULL,
        order_id UUID REFERENCES orders(id),
        gross_amount DECIMAL(12,2) NOT NULL,
        share_percentage DECIMAL(5,2) NOT NULL,
        net_amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        settlement_month VARCHAR(7),
        paid_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Hardware Products
    await queryRunner.query(`
      CREATE TABLE hardware_products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category VARCHAR(30) NOT NULL,
        name JSONB NOT NULL,
        description JSONB NOT NULL,
        specs JSONB NOT NULL,
        preinstalled_software JSONB,
        token_hub_bonus_amount DECIMAL(8,2),
        price DECIMAL(10,2) NOT NULL,
        stock_by_region JSONB,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Audit Logs
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id VARCHAR(64),
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'audit_logs',
      'hardware_products',
      'partner_earnings',
      'conversation_messages',
      'conversation_sessions',
      'tickets',
      'certificates',
      'subscriptions',
      'configuration_packs',
      'token_usage_records',
      'token_accounts',
      'service_reviews',
      'delivery_reports',
      'install_orders',
      'payments',
      'orders',
      'enterprise_info',
      'organizations',
      'users',
    ];
    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
    }
  }
}
