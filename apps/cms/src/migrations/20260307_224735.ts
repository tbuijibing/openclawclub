import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('zh', 'en', 'ja', 'ko', 'de', 'fr', 'es');
  CREATE TYPE "public"."language_preference" AS ENUM('zh', 'en', 'ja', 'ko', 'de', 'fr', 'es');
  CREATE TYPE "public"."enum_users_region" AS ENUM('apac', 'na', 'eu');
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'certified_engineer', 'individual_user');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('pending_payment', 'paid', 'dispatched', 'accepted', 'in_progress', 'completed', 'cancelled');
  CREATE TYPE "public"."enum_orders_region" AS ENUM('apac', 'na', 'eu');
  CREATE TYPE "public"."enum_orders_service_tier" AS ENUM('standard', 'professional', 'enterprise');
  CREATE TYPE "public"."enum_payments_status" AS ENUM('pending', 'succeeded', 'failed', 'refunded');
  CREATE TYPE "public"."service_tier" AS ENUM('standard', 'professional', 'enterprise');
  CREATE TYPE "public"."install_status" AS ENUM('pending_dispatch', 'accepted', 'in_progress', 'pending_acceptance', 'completed');
  CREATE TYPE "public"."enum_hardware_products_category" AS ENUM('clawbox_lite', 'clawbox_pro', 'clawbox_enterprise', 'recommended_hardware', 'accessories');
  CREATE TYPE "public"."enum_site_settings_default_language" AS ENUM('zh', 'en', 'ja', 'ko', 'de', 'fr', 'es');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"avatar_url_id" integer,
  	"language_preference" "language_preference" DEFAULT 'zh',
  	"timezone" varchar DEFAULT 'UTC',
  	"region" "enum_users_region",
  	"role" "enum_users_role" DEFAULT 'individual_user' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_number" varchar,
  	"user_id" integer NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'pending_payment' NOT NULL,
  	"total_amount" numeric NOT NULL,
  	"currency" varchar DEFAULT 'USD',
  	"region" "enum_orders_region",
  	"product_id" integer,
  	"service_tier" "enum_orders_service_tier",
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"amount" numeric NOT NULL,
  	"currency" varchar DEFAULT 'USD',
  	"status" "enum_payments_status" DEFAULT 'pending' NOT NULL,
  	"stripe_session_id" varchar,
  	"stripe_payment_intent_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "install_orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"service_tier" "service_tier" NOT NULL,
  	"ocsas_level" numeric DEFAULT 1 NOT NULL,
  	"engineer_id" integer,
  	"install_status" "install_status" DEFAULT 'pending_dispatch' NOT NULL,
  	"accepted_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "delivery_reports_screenshots" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "delivery_reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"install_order_id" integer NOT NULL,
  	"checklist" jsonb NOT NULL,
  	"config_items" jsonb NOT NULL,
  	"test_results" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "service_reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"overall_rating" numeric NOT NULL,
  	"attitude_rating" numeric,
  	"skill_rating" numeric,
  	"comment" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hardware_products" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"category" "enum_hardware_products_category" NOT NULL,
  	"price" numeric NOT NULL,
  	"stock_by_region" jsonb,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "hardware_products_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"specs" jsonb NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"action" varchar NOT NULL,
  	"resource_type" varchar NOT NULL,
  	"resource_id" varchar,
  	"details" jsonb,
  	"ip_address" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"orders_id" integer,
  	"payments_id" integer,
  	"install_orders_id" integer,
  	"delivery_reports_id" integer,
  	"service_reviews_id" integer,
  	"hardware_products_id" integer,
  	"audit_logs_id" integer,
  	"media_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_url" varchar,
  	"default_language" "enum_site_settings_default_language" DEFAULT 'zh',
  	"contact_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "site_settings_locales" (
  	"platform_name" varchar DEFAULT 'OpenClaw Club',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pricing_config" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"installation_pricing_standard" numeric DEFAULT 99,
  	"installation_pricing_professional" numeric DEFAULT 299,
  	"installation_pricing_enterprise" numeric DEFAULT 999,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ocsas_standards_levels_checklist_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"category" varchar,
  	"required" boolean DEFAULT true
  );
  
  CREATE TABLE "ocsas_standards_levels_checklist_items_locales" (
  	"item" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "ocsas_standards_levels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"level" numeric NOT NULL
  );
  
  CREATE TABLE "ocsas_standards_levels_locales" (
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "ocsas_standards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_url_id_media_id_fk" FOREIGN KEY ("avatar_url_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_hardware_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."hardware_products"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "install_orders" ADD CONSTRAINT "install_orders_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "install_orders" ADD CONSTRAINT "install_orders_engineer_id_users_id_fk" FOREIGN KEY ("engineer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "delivery_reports_screenshots" ADD CONSTRAINT "delivery_reports_screenshots_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "delivery_reports_screenshots" ADD CONSTRAINT "delivery_reports_screenshots_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."delivery_reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "delivery_reports" ADD CONSTRAINT "delivery_reports_install_order_id_install_orders_id_fk" FOREIGN KEY ("install_order_id") REFERENCES "public"."install_orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_reviews" ADD CONSTRAINT "service_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hardware_products_locales" ADD CONSTRAINT "hardware_products_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hardware_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payments_fk" FOREIGN KEY ("payments_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_install_orders_fk" FOREIGN KEY ("install_orders_id") REFERENCES "public"."install_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_delivery_reports_fk" FOREIGN KEY ("delivery_reports_id") REFERENCES "public"."delivery_reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_reviews_fk" FOREIGN KEY ("service_reviews_id") REFERENCES "public"."service_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hardware_products_fk" FOREIGN KEY ("hardware_products_id") REFERENCES "public"."hardware_products"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_locales" ADD CONSTRAINT "site_settings_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ocsas_standards_levels_checklist_items" ADD CONSTRAINT "ocsas_standards_levels_checklist_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ocsas_standards_levels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ocsas_standards_levels_checklist_items_locales" ADD CONSTRAINT "ocsas_standards_levels_checklist_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ocsas_standards_levels_checklist_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ocsas_standards_levels" ADD CONSTRAINT "ocsas_standards_levels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ocsas_standards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ocsas_standards_levels_locales" ADD CONSTRAINT "ocsas_standards_levels_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ocsas_standards_levels"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_avatar_url_idx" ON "users" USING btree ("avatar_url_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");
  CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");
  CREATE INDEX "orders_product_idx" ON "orders" USING btree ("product_id");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");
  CREATE INDEX "payments_updated_at_idx" ON "payments" USING btree ("updated_at");
  CREATE INDEX "payments_created_at_idx" ON "payments" USING btree ("created_at");
  CREATE INDEX "install_orders_order_idx" ON "install_orders" USING btree ("order_id");
  CREATE INDEX "install_orders_engineer_idx" ON "install_orders" USING btree ("engineer_id");
  CREATE INDEX "install_orders_updated_at_idx" ON "install_orders" USING btree ("updated_at");
  CREATE INDEX "install_orders_created_at_idx" ON "install_orders" USING btree ("created_at");
  CREATE INDEX "delivery_reports_screenshots_order_idx" ON "delivery_reports_screenshots" USING btree ("_order");
  CREATE INDEX "delivery_reports_screenshots_parent_id_idx" ON "delivery_reports_screenshots" USING btree ("_parent_id");
  CREATE INDEX "delivery_reports_screenshots_image_idx" ON "delivery_reports_screenshots" USING btree ("image_id");
  CREATE INDEX "delivery_reports_install_order_idx" ON "delivery_reports" USING btree ("install_order_id");
  CREATE INDEX "delivery_reports_updated_at_idx" ON "delivery_reports" USING btree ("updated_at");
  CREATE INDEX "delivery_reports_created_at_idx" ON "delivery_reports" USING btree ("created_at");
  CREATE INDEX "service_reviews_order_idx" ON "service_reviews" USING btree ("order_id");
  CREATE INDEX "service_reviews_user_idx" ON "service_reviews" USING btree ("user_id");
  CREATE INDEX "service_reviews_updated_at_idx" ON "service_reviews" USING btree ("updated_at");
  CREATE INDEX "service_reviews_created_at_idx" ON "service_reviews" USING btree ("created_at");
  CREATE INDEX "hardware_products_updated_at_idx" ON "hardware_products" USING btree ("updated_at");
  CREATE INDEX "hardware_products_created_at_idx" ON "hardware_products" USING btree ("created_at");
  CREATE UNIQUE INDEX "hardware_products_locales_locale_parent_id_unique" ON "hardware_products_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_payments_id_idx" ON "payload_locked_documents_rels" USING btree ("payments_id");
  CREATE INDEX "payload_locked_documents_rels_install_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("install_orders_id");
  CREATE INDEX "payload_locked_documents_rels_delivery_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("delivery_reports_id");
  CREATE INDEX "payload_locked_documents_rels_service_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("service_reviews_id");
  CREATE INDEX "payload_locked_documents_rels_hardware_products_id_idx" ON "payload_locked_documents_rels" USING btree ("hardware_products_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE UNIQUE INDEX "site_settings_locales_locale_parent_id_unique" ON "site_settings_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ocsas_standards_levels_checklist_items_order_idx" ON "ocsas_standards_levels_checklist_items" USING btree ("_order");
  CREATE INDEX "ocsas_standards_levels_checklist_items_parent_id_idx" ON "ocsas_standards_levels_checklist_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "ocsas_standards_levels_checklist_items_locales_locale_parent" ON "ocsas_standards_levels_checklist_items_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "ocsas_standards_levels_order_idx" ON "ocsas_standards_levels" USING btree ("_order");
  CREATE INDEX "ocsas_standards_levels_parent_id_idx" ON "ocsas_standards_levels" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "ocsas_standards_levels_locales_locale_parent_id_unique" ON "ocsas_standards_levels_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "payments" CASCADE;
  DROP TABLE "install_orders" CASCADE;
  DROP TABLE "delivery_reports_screenshots" CASCADE;
  DROP TABLE "delivery_reports" CASCADE;
  DROP TABLE "service_reviews" CASCADE;
  DROP TABLE "hardware_products" CASCADE;
  DROP TABLE "hardware_products_locales" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "site_settings_locales" CASCADE;
  DROP TABLE "pricing_config" CASCADE;
  DROP TABLE "ocsas_standards_levels_checklist_items" CASCADE;
  DROP TABLE "ocsas_standards_levels_checklist_items_locales" CASCADE;
  DROP TABLE "ocsas_standards_levels" CASCADE;
  DROP TABLE "ocsas_standards_levels_locales" CASCADE;
  DROP TABLE "ocsas_standards" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."language_preference";
  DROP TYPE "public"."enum_users_region";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_region";
  DROP TYPE "public"."enum_orders_service_tier";
  DROP TYPE "public"."enum_payments_status";
  DROP TYPE "public"."service_tier";
  DROP TYPE "public"."install_status";
  DROP TYPE "public"."enum_hardware_products_category";
  DROP TYPE "public"."enum_site_settings_default_language";`)
}
