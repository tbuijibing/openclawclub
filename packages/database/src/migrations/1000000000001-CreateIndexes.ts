import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateIndexes1000000000001 implements MigrationInterface {
  name = 'CreateIndexes1000000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Orders indexes
    await queryRunner.query(`CREATE INDEX idx_orders_user_id ON orders(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_orders_status ON orders(status)`);
    await queryRunner.query(`CREATE INDEX idx_orders_created_at ON orders(created_at)`);

    // Install orders indexes
    await queryRunner.query(`CREATE INDEX idx_install_orders_engineer_id ON install_orders(engineer_id)`);
    await queryRunner.query(`CREATE INDEX idx_install_orders_status ON install_orders(install_status)`);

    // Token usage records composite index
    await queryRunner.query(`CREATE INDEX idx_token_usage_account_created ON token_usage_records(account_id, created_at)`);

    // Tickets indexes
    await queryRunner.query(`CREATE INDEX idx_tickets_user_id ON tickets(user_id)`);
    await queryRunner.query(`CREATE INDEX idx_tickets_status_priority ON tickets(status, priority)`);

    // Audit logs composite index
    await queryRunner.query(`CREATE INDEX idx_audit_logs_user_created ON audit_logs(user_id, created_at)`);

    // Subscriptions composite index
    await queryRunner.query(`CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status)`);

    // Certificates index
    await queryRunner.query(`CREATE INDEX idx_certificates_cert_number ON certificates(cert_number)`);

    // Partner earnings composite index
    await queryRunner.query(`CREATE INDEX idx_partner_earnings_partner_month ON partner_earnings(partner_id, settlement_month)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_partner_earnings_partner_month`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_certificates_cert_number`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_subscriptions_user_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_audit_logs_user_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tickets_status_priority`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_tickets_user_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_token_usage_account_created`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_install_orders_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_install_orders_engineer_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_created_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_user_id`);
  }
}
