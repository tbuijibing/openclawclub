--
-- PostgreSQL database dump
--

\restrict 9OXD3mrkCgTnsLxG39u8uMWyh8tye5Ogpn7ZJ1rDcxQsVEgqcofSVn49zngt2gz

-- Dumped from database version 18.3 (Homebrew)
-- Dumped by pg_dump version 18.3 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _locales; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public._locales AS ENUM (
    'zh',
    'en',
    'ja',
    'ko',
    'de',
    'fr',
    'es'
);


ALTER TYPE public._locales OWNER TO justin;

--
-- Name: enum_hardware_products_category; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.enum_hardware_products_category AS ENUM (
    'clawbox_lite',
    'clawbox_pro',
    'clawbox_enterprise',
    'recommended_hardware',
    'accessories'
);


ALTER TYPE public.enum_hardware_products_category OWNER TO justin;

--
-- Name: enum_orders_region; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.enum_orders_region AS ENUM (
    'apac',
    'na',
    'eu'
);


ALTER TYPE public.enum_orders_region OWNER TO justin;

--
-- Name: enum_orders_service_tier; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.enum_orders_service_tier AS ENUM (
    'standard',
    'professional',
    'enterprise'
);


ALTER TYPE public.enum_orders_service_tier OWNER TO justin;

--
-- Name: enum_orders_status; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.enum_orders_status AS ENUM (
    'pending_payment',
    'paid',
    'dispatched',
    'accepted',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE public.enum_orders_status OWNER TO justin;

--
-- Name: enum_payments_status; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.enum_payments_status AS ENUM (
    'pending',
    'succeeded',
    'failed',
    'refunded'
);


ALTER TYPE public.enum_payments_status OWNER TO justin;

--
-- Name: enum_site_settings_default_language; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.enum_site_settings_default_language AS ENUM (
    'zh',
    'en',
    'ja',
    'ko',
    'de',
    'fr',
    'es'
);


ALTER TYPE public.enum_site_settings_default_language OWNER TO justin;

--
-- Name: enum_users_region; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.enum_users_region AS ENUM (
    'apac',
    'na',
    'eu'
);


ALTER TYPE public.enum_users_region OWNER TO justin;

--
-- Name: enum_users_role; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.enum_users_role AS ENUM (
    'admin',
    'certified_engineer',
    'individual_user'
);


ALTER TYPE public.enum_users_role OWNER TO justin;

--
-- Name: install_status; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.install_status AS ENUM (
    'pending_dispatch',
    'accepted',
    'in_progress',
    'pending_acceptance',
    'completed'
);


ALTER TYPE public.install_status OWNER TO justin;

--
-- Name: language_preference; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.language_preference AS ENUM (
    'zh',
    'en',
    'ja',
    'ko',
    'de',
    'fr',
    'es'
);


ALTER TYPE public.language_preference OWNER TO justin;

--
-- Name: service_tier; Type: TYPE; Schema: public; Owner: justin
--

CREATE TYPE public.service_tier AS ENUM (
    'standard',
    'professional',
    'enterprise'
);


ALTER TYPE public.service_tier OWNER TO justin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    action character varying NOT NULL,
    resource_type character varying NOT NULL,
    resource_id character varying,
    details jsonb,
    ip_address character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO justin;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO justin;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: delivery_reports; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.delivery_reports (
    id integer NOT NULL,
    install_order_id integer NOT NULL,
    checklist jsonb NOT NULL,
    config_items jsonb NOT NULL,
    test_results jsonb NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.delivery_reports OWNER TO justin;

--
-- Name: delivery_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.delivery_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.delivery_reports_id_seq OWNER TO justin;

--
-- Name: delivery_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.delivery_reports_id_seq OWNED BY public.delivery_reports.id;


--
-- Name: delivery_reports_screenshots; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.delivery_reports_screenshots (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    image_id integer
);


ALTER TABLE public.delivery_reports_screenshots OWNER TO justin;

--
-- Name: hardware_products; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.hardware_products (
    id integer NOT NULL,
    category public.enum_hardware_products_category NOT NULL,
    price numeric NOT NULL,
    stock_by_region jsonb,
    is_active boolean DEFAULT true,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hardware_products OWNER TO justin;

--
-- Name: hardware_products_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.hardware_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hardware_products_id_seq OWNER TO justin;

--
-- Name: hardware_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.hardware_products_id_seq OWNED BY public.hardware_products.id;


--
-- Name: hardware_products_locales; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.hardware_products_locales (
    name character varying NOT NULL,
    description character varying NOT NULL,
    specs jsonb NOT NULL,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.hardware_products_locales OWNER TO justin;

--
-- Name: hardware_products_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.hardware_products_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hardware_products_locales_id_seq OWNER TO justin;

--
-- Name: hardware_products_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.hardware_products_locales_id_seq OWNED BY public.hardware_products_locales.id;


--
-- Name: install_orders; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.install_orders (
    id integer NOT NULL,
    order_id integer NOT NULL,
    service_tier public.service_tier NOT NULL,
    ocsas_level numeric DEFAULT 1 NOT NULL,
    engineer_id integer,
    install_status public.install_status DEFAULT 'pending_dispatch'::public.install_status NOT NULL,
    accepted_at timestamp(3) with time zone,
    completed_at timestamp(3) with time zone,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.install_orders OWNER TO justin;

--
-- Name: install_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.install_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.install_orders_id_seq OWNER TO justin;

--
-- Name: install_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.install_orders_id_seq OWNED BY public.install_orders.id;


--
-- Name: media; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.media (
    id integer NOT NULL,
    alt character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    url character varying,
    thumbnail_u_r_l character varying,
    filename character varying,
    mime_type character varying,
    filesize numeric,
    width numeric,
    height numeric,
    focal_x numeric,
    focal_y numeric,
    sizes_thumbnail_url character varying,
    sizes_thumbnail_width numeric,
    sizes_thumbnail_height numeric,
    sizes_thumbnail_mime_type character varying,
    sizes_thumbnail_filesize numeric,
    sizes_thumbnail_filename character varying,
    sizes_card_url character varying,
    sizes_card_width numeric,
    sizes_card_height numeric,
    sizes_card_mime_type character varying,
    sizes_card_filesize numeric,
    sizes_card_filename character varying
);


ALTER TABLE public.media OWNER TO justin;

--
-- Name: media_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.media_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.media_id_seq OWNER TO justin;

--
-- Name: media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.media_id_seq OWNED BY public.media.id;


--
-- Name: ocsas_standards; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.ocsas_standards (
    id integer NOT NULL,
    updated_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone
);


ALTER TABLE public.ocsas_standards OWNER TO justin;

--
-- Name: ocsas_standards_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.ocsas_standards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ocsas_standards_id_seq OWNER TO justin;

--
-- Name: ocsas_standards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.ocsas_standards_id_seq OWNED BY public.ocsas_standards.id;


--
-- Name: ocsas_standards_levels; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.ocsas_standards_levels (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    level numeric NOT NULL
);


ALTER TABLE public.ocsas_standards_levels OWNER TO justin;

--
-- Name: ocsas_standards_levels_checklist_items; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.ocsas_standards_levels_checklist_items (
    _order integer NOT NULL,
    _parent_id character varying NOT NULL,
    id character varying NOT NULL,
    category character varying,
    required boolean DEFAULT true
);


ALTER TABLE public.ocsas_standards_levels_checklist_items OWNER TO justin;

--
-- Name: ocsas_standards_levels_checklist_items_locales; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.ocsas_standards_levels_checklist_items_locales (
    item character varying NOT NULL,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying CONSTRAINT ocsas_standards_levels_checklist_items_loca__parent_id_not_null NOT NULL
);


ALTER TABLE public.ocsas_standards_levels_checklist_items_locales OWNER TO justin;

--
-- Name: ocsas_standards_levels_checklist_items_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.ocsas_standards_levels_checklist_items_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ocsas_standards_levels_checklist_items_locales_id_seq OWNER TO justin;

--
-- Name: ocsas_standards_levels_checklist_items_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.ocsas_standards_levels_checklist_items_locales_id_seq OWNED BY public.ocsas_standards_levels_checklist_items_locales.id;


--
-- Name: ocsas_standards_levels_locales; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.ocsas_standards_levels_locales (
    name character varying NOT NULL,
    description character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id character varying NOT NULL
);


ALTER TABLE public.ocsas_standards_levels_locales OWNER TO justin;

--
-- Name: ocsas_standards_levels_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.ocsas_standards_levels_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ocsas_standards_levels_locales_id_seq OWNER TO justin;

--
-- Name: ocsas_standards_levels_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.ocsas_standards_levels_locales_id_seq OWNED BY public.ocsas_standards_levels_locales.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    order_number character varying,
    user_id integer NOT NULL,
    status public.enum_orders_status DEFAULT 'pending_payment'::public.enum_orders_status NOT NULL,
    total_amount numeric NOT NULL,
    currency character varying DEFAULT 'USD'::character varying,
    region public.enum_orders_region,
    product_id integer,
    service_tier public.enum_orders_service_tier,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.orders OWNER TO justin;

--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_id_seq OWNER TO justin;

--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: payload_kv; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.payload_kv (
    id integer NOT NULL,
    key character varying NOT NULL,
    data jsonb NOT NULL
);


ALTER TABLE public.payload_kv OWNER TO justin;

--
-- Name: payload_kv_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.payload_kv_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_kv_id_seq OWNER TO justin;

--
-- Name: payload_kv_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.payload_kv_id_seq OWNED BY public.payload_kv.id;


--
-- Name: payload_locked_documents; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.payload_locked_documents (
    id integer NOT NULL,
    global_slug character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payload_locked_documents OWNER TO justin;

--
-- Name: payload_locked_documents_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.payload_locked_documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_locked_documents_id_seq OWNER TO justin;

--
-- Name: payload_locked_documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.payload_locked_documents_id_seq OWNED BY public.payload_locked_documents.id;


--
-- Name: payload_locked_documents_rels; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.payload_locked_documents_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer,
    orders_id integer,
    payments_id integer,
    install_orders_id integer,
    delivery_reports_id integer,
    service_reviews_id integer,
    hardware_products_id integer,
    audit_logs_id integer,
    media_id integer
);


ALTER TABLE public.payload_locked_documents_rels OWNER TO justin;

--
-- Name: payload_locked_documents_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.payload_locked_documents_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_locked_documents_rels_id_seq OWNER TO justin;

--
-- Name: payload_locked_documents_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.payload_locked_documents_rels_id_seq OWNED BY public.payload_locked_documents_rels.id;


--
-- Name: payload_migrations; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.payload_migrations (
    id integer NOT NULL,
    name character varying,
    batch numeric,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payload_migrations OWNER TO justin;

--
-- Name: payload_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.payload_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_migrations_id_seq OWNER TO justin;

--
-- Name: payload_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.payload_migrations_id_seq OWNED BY public.payload_migrations.id;


--
-- Name: payload_preferences; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.payload_preferences (
    id integer NOT NULL,
    key character varying,
    value jsonb,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payload_preferences OWNER TO justin;

--
-- Name: payload_preferences_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.payload_preferences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_preferences_id_seq OWNER TO justin;

--
-- Name: payload_preferences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.payload_preferences_id_seq OWNED BY public.payload_preferences.id;


--
-- Name: payload_preferences_rels; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.payload_preferences_rels (
    id integer NOT NULL,
    "order" integer,
    parent_id integer NOT NULL,
    path character varying NOT NULL,
    users_id integer
);


ALTER TABLE public.payload_preferences_rels OWNER TO justin;

--
-- Name: payload_preferences_rels_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.payload_preferences_rels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payload_preferences_rels_id_seq OWNER TO justin;

--
-- Name: payload_preferences_rels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.payload_preferences_rels_id_seq OWNED BY public.payload_preferences_rels.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    order_id integer NOT NULL,
    amount numeric NOT NULL,
    currency character varying DEFAULT 'USD'::character varying,
    status public.enum_payments_status DEFAULT 'pending'::public.enum_payments_status NOT NULL,
    stripe_session_id character varying,
    stripe_payment_intent_id character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.payments OWNER TO justin;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO justin;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: pricing_config; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.pricing_config (
    id integer NOT NULL,
    installation_pricing_standard numeric DEFAULT 99,
    installation_pricing_professional numeric DEFAULT 299,
    installation_pricing_enterprise numeric DEFAULT 999,
    updated_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone
);


ALTER TABLE public.pricing_config OWNER TO justin;

--
-- Name: pricing_config_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.pricing_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pricing_config_id_seq OWNER TO justin;

--
-- Name: pricing_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.pricing_config_id_seq OWNED BY public.pricing_config.id;


--
-- Name: service_reviews; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.service_reviews (
    id integer NOT NULL,
    order_id integer NOT NULL,
    user_id integer NOT NULL,
    overall_rating numeric NOT NULL,
    attitude_rating numeric,
    skill_rating numeric,
    comment character varying,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.service_reviews OWNER TO justin;

--
-- Name: service_reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.service_reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_reviews_id_seq OWNER TO justin;

--
-- Name: service_reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.service_reviews_id_seq OWNED BY public.service_reviews.id;


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.site_settings (
    id integer NOT NULL,
    logo_url character varying,
    default_language public.enum_site_settings_default_language DEFAULT 'zh'::public.enum_site_settings_default_language,
    contact_email character varying,
    updated_at timestamp(3) with time zone,
    created_at timestamp(3) with time zone
);


ALTER TABLE public.site_settings OWNER TO justin;

--
-- Name: site_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.site_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_settings_id_seq OWNER TO justin;

--
-- Name: site_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.site_settings_id_seq OWNED BY public.site_settings.id;


--
-- Name: site_settings_locales; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.site_settings_locales (
    platform_name character varying DEFAULT 'OpenClaw Club'::character varying,
    id integer NOT NULL,
    _locale public._locales NOT NULL,
    _parent_id integer NOT NULL
);


ALTER TABLE public.site_settings_locales OWNER TO justin;

--
-- Name: site_settings_locales_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.site_settings_locales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.site_settings_locales_id_seq OWNER TO justin;

--
-- Name: site_settings_locales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.site_settings_locales_id_seq OWNED BY public.site_settings_locales.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    display_name character varying,
    avatar_url_id integer,
    language_preference public.language_preference DEFAULT 'zh'::public.language_preference,
    timezone character varying DEFAULT 'UTC'::character varying,
    region public.enum_users_region,
    role public.enum_users_role DEFAULT 'individual_user'::public.enum_users_role NOT NULL,
    updated_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    created_at timestamp(3) with time zone DEFAULT now() NOT NULL,
    email character varying NOT NULL,
    reset_password_token character varying,
    reset_password_expiration timestamp(3) with time zone,
    salt character varying,
    hash character varying,
    login_attempts numeric DEFAULT 0,
    lock_until timestamp(3) with time zone
);


ALTER TABLE public.users OWNER TO justin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: justin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO justin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: justin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users_sessions; Type: TABLE; Schema: public; Owner: justin
--

CREATE TABLE public.users_sessions (
    _order integer NOT NULL,
    _parent_id integer NOT NULL,
    id character varying NOT NULL,
    created_at timestamp(3) with time zone,
    expires_at timestamp(3) with time zone NOT NULL
);


ALTER TABLE public.users_sessions OWNER TO justin;

--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: delivery_reports id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.delivery_reports ALTER COLUMN id SET DEFAULT nextval('public.delivery_reports_id_seq'::regclass);


--
-- Name: hardware_products id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.hardware_products ALTER COLUMN id SET DEFAULT nextval('public.hardware_products_id_seq'::regclass);


--
-- Name: hardware_products_locales id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.hardware_products_locales ALTER COLUMN id SET DEFAULT nextval('public.hardware_products_locales_id_seq'::regclass);


--
-- Name: install_orders id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.install_orders ALTER COLUMN id SET DEFAULT nextval('public.install_orders_id_seq'::regclass);


--
-- Name: media id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.media ALTER COLUMN id SET DEFAULT nextval('public.media_id_seq'::regclass);


--
-- Name: ocsas_standards id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards ALTER COLUMN id SET DEFAULT nextval('public.ocsas_standards_id_seq'::regclass);


--
-- Name: ocsas_standards_levels_checklist_items_locales id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels_checklist_items_locales ALTER COLUMN id SET DEFAULT nextval('public.ocsas_standards_levels_checklist_items_locales_id_seq'::regclass);


--
-- Name: ocsas_standards_levels_locales id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels_locales ALTER COLUMN id SET DEFAULT nextval('public.ocsas_standards_levels_locales_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payload_kv id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_kv ALTER COLUMN id SET DEFAULT nextval('public.payload_kv_id_seq'::regclass);


--
-- Name: payload_locked_documents id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents ALTER COLUMN id SET DEFAULT nextval('public.payload_locked_documents_id_seq'::regclass);


--
-- Name: payload_locked_documents_rels id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels ALTER COLUMN id SET DEFAULT nextval('public.payload_locked_documents_rels_id_seq'::regclass);


--
-- Name: payload_migrations id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_migrations ALTER COLUMN id SET DEFAULT nextval('public.payload_migrations_id_seq'::regclass);


--
-- Name: payload_preferences id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_preferences ALTER COLUMN id SET DEFAULT nextval('public.payload_preferences_id_seq'::regclass);


--
-- Name: payload_preferences_rels id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_preferences_rels ALTER COLUMN id SET DEFAULT nextval('public.payload_preferences_rels_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: pricing_config id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.pricing_config ALTER COLUMN id SET DEFAULT nextval('public.pricing_config_id_seq'::regclass);


--
-- Name: service_reviews id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.service_reviews ALTER COLUMN id SET DEFAULT nextval('public.service_reviews_id_seq'::regclass);


--
-- Name: site_settings id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.site_settings ALTER COLUMN id SET DEFAULT nextval('public.site_settings_id_seq'::regclass);


--
-- Name: site_settings_locales id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.site_settings_locales ALTER COLUMN id SET DEFAULT nextval('public.site_settings_locales_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, updated_at, created_at) FROM stdin;
1	\N	users.create	users	1	{}	::1	2026-03-08 06:54:46.522+08	2026-03-08 06:54:46.522+08
4	1	users.create	users	2	{}	::1	2026-03-08 10:08:15.654+08	2026-03-08 10:08:15.654+08
\.


--
-- Data for Name: delivery_reports; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.delivery_reports (id, install_order_id, checklist, config_items, test_results, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: delivery_reports_screenshots; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.delivery_reports_screenshots (_order, _parent_id, id, image_id) FROM stdin;
\.


--
-- Data for Name: hardware_products; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.hardware_products (id, category, price, stock_by_region, is_active, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: hardware_products_locales; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.hardware_products_locales (name, description, specs, id, _locale, _parent_id) FROM stdin;
\.


--
-- Data for Name: install_orders; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.install_orders (id, order_id, service_tier, ocsas_level, engineer_id, install_status, accepted_at, completed_at, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: media; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.media (id, alt, updated_at, created_at, url, thumbnail_u_r_l, filename, mime_type, filesize, width, height, focal_x, focal_y, sizes_thumbnail_url, sizes_thumbnail_width, sizes_thumbnail_height, sizes_thumbnail_mime_type, sizes_thumbnail_filesize, sizes_thumbnail_filename, sizes_card_url, sizes_card_width, sizes_card_height, sizes_card_mime_type, sizes_card_filesize, sizes_card_filename) FROM stdin;
\.


--
-- Data for Name: ocsas_standards; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.ocsas_standards (id, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: ocsas_standards_levels; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.ocsas_standards_levels (_order, _parent_id, id, level) FROM stdin;
\.


--
-- Data for Name: ocsas_standards_levels_checklist_items; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.ocsas_standards_levels_checklist_items (_order, _parent_id, id, category, required) FROM stdin;
\.


--
-- Data for Name: ocsas_standards_levels_checklist_items_locales; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.ocsas_standards_levels_checklist_items_locales (item, id, _locale, _parent_id) FROM stdin;
\.


--
-- Data for Name: ocsas_standards_levels_locales; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.ocsas_standards_levels_locales (name, description, id, _locale, _parent_id) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.orders (id, order_number, user_id, status, total_amount, currency, region, product_id, service_tier, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: payload_kv; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.payload_kv (id, key, data) FROM stdin;
\.


--
-- Data for Name: payload_locked_documents; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.payload_locked_documents (id, global_slug, updated_at, created_at) FROM stdin;
1	ocsas-standards	2026-03-08 07:00:05.057+08	2026-03-08 07:00:05.057+08
3	\N	2026-03-08 07:25:20.208+08	2026-03-08 07:25:20.208+08
\.


--
-- Data for Name: payload_locked_documents_rels; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.payload_locked_documents_rels (id, "order", parent_id, path, users_id, orders_id, payments_id, install_orders_id, delivery_reports_id, service_reviews_id, hardware_products_id, audit_logs_id, media_id) FROM stdin;
1	\N	1	user	1	\N	\N	\N	\N	\N	\N	\N	\N
4	\N	3	document	1	\N	\N	\N	\N	\N	\N	\N	\N
5	\N	3	user	1	\N	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: payload_migrations; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.payload_migrations (id, name, batch, updated_at, created_at) FROM stdin;
1	20260307_224735	1	2026-03-08 06:48:22.857+08	2026-03-08 06:48:22.857+08
\.


--
-- Data for Name: payload_preferences; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.payload_preferences (id, key, value, updated_at, created_at) FROM stdin;
2	collection-media	{}	2026-03-08 06:55:09.048+08	2026-03-08 06:55:09.048+08
3	collection-orders	{}	2026-03-08 06:55:12.09+08	2026-03-08 06:55:12.09+08
4	collection-payments	{}	2026-03-08 06:55:13.446+08	2026-03-08 06:55:13.446+08
7	collection-audit-logs	{}	2026-03-08 06:55:21.426+08	2026-03-08 06:55:21.426+08
8	collection-users	{"editViewType": "default"}	2026-03-08 06:59:50.878+08	2026-03-08 06:59:48.41+08
9	collection-hardware-products	{}	2026-03-08 06:59:55.652+08	2026-03-08 06:59:55.652+08
10	global-site-settings	{"editViewType": "default"}	2026-03-08 06:59:57.47+08	2026-03-08 06:59:57.472+08
11	global-pricing-config	{"editViewType": "default"}	2026-03-08 07:00:00.427+08	2026-03-08 07:00:00.428+08
12	global-ocsas-standards	{"editViewType": "default"}	2026-03-08 07:00:03.301+08	2026-03-08 07:00:03.303+08
6	collection-install-orders	{"editViewType": "default"}	2026-03-08 07:25:06.117+08	2026-03-08 06:55:17.413+08
5	collection-delivery-reports	{"editViewType": "default"}	2026-03-08 07:25:09.352+08	2026-03-08 06:55:16.854+08
1	locale	"zh"	2026-03-08 07:25:14.022+08	2026-03-08 06:54:51.026+08
\.


--
-- Data for Name: payload_preferences_rels; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.payload_preferences_rels (id, "order", parent_id, path, users_id) FROM stdin;
6	\N	2	user	1
7	\N	3	user	1
8	\N	4	user	1
11	\N	7	user	1
14	\N	8	user	1
15	\N	9	user	1
16	\N	10	user	1
17	\N	11	user	1
18	\N	12	user	1
23	\N	6	user	1
24	\N	5	user	1
25	\N	1	user	1
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.payments (id, order_id, amount, currency, status, stripe_session_id, stripe_payment_intent_id, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: pricing_config; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.pricing_config (id, installation_pricing_standard, installation_pricing_professional, installation_pricing_enterprise, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: service_reviews; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.service_reviews (id, order_id, user_id, overall_rating, attitude_rating, skill_rating, comment, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.site_settings (id, logo_url, default_language, contact_email, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: site_settings_locales; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.site_settings_locales (platform_name, id, _locale, _parent_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.users (id, display_name, avatar_url_id, language_preference, timezone, region, role, updated_at, created_at, email, reset_password_token, reset_password_expiration, salt, hash, login_attempts, lock_until) FROM stdin;
1	Translate	\N	zh	UTC	apac	admin	2026-03-08 06:54:46.503+08	2026-03-08 06:54:46.501+08	beibojustin@gmail.com	\N	\N	cae9ed100deb2f159857842f38875c4de92d44d716d0e658224226d781f1d97f	d70497d1f87664cfa8d719fa7c2a4f8cb1ea1786ed786e83379025982d6911bd097ec744e72dcf7975deb57ec7a571ba2ee70d8fa85dca2f8ea49d15a7c0917ace9817e1aedd7624276e6667dfeba5516fcc95bd19d5853126b74eff28cb3cf97b128f99e0d6d47ece30962c545a604cc6c9c4310705d5e17e86a668b04ba387e506ceb8301c2b804b8b7c746846a3009f1ad90199117e8fefaae7a669c5e044220a08d0334537988e357cf1df0c163bf2ca3a155ba20c8907f6d8f0dc2ff82cb50b60275159e7b29ce6e21d6fc464bd1064bc606f612c1cc058b3fc3acafb24db7848107de6f3fdfcdf3e2f44e1ba2c4c2d96d3bf366bd73b0693cf495fe88e4cee400fc68ac519029b94386180364ec0ad19ff49cb8a90b60898f1ad168b0af5887bf3b0337dda0eea742d0820ace50ef41f74f10d591144cdfd72cc49037e2f8feeb62ed70691cfd55d1e14afba5b6bb670801988e3fbba2923f186cca9e89cabb7c61a810f1e4833ba89268f19a8e508a1037790dacd3475c37bbc40559b6a81f0e216f79b1d8c7f8caf32d1bd7b4e3fe09012d874a6ed3f14c274e90e22f81be407eaff5324ee870a02f617f6b0111b436f545907013d638539db1611536a6f07d65bba7b03bf70500705481fcf5ba83b1ac0be295aaf3dd9bdb939da395a03434d1ae6e869575a5f44d34ebf9578852fd3a4741685864aed43a1d2d047	0	\N
2	Translate	\N	zh	UTC	\N	individual_user	2026-03-08 10:08:15.645+08	2026-03-08 10:08:15.645+08	beibojustin1@gmail.com	\N	\N	f8f2ed6f9e4b2fff2835c8b5eb30bf7ed2c2865674e48adbb88c3e18d657088c	6ba554294662106dc96ba6987548eba5e8dd5dec4fc14674d74427463592c1dae891e44d0c36ee20510b43bc00cceb78025c59422fc05e39a66159e529d504bd06e483efaf776541ada6f2f0e9cf8594dd7e0ba821a6aa37d41affee1cef4b43860d656ca8a717134fb2f5fd096e9b7dd541bb1937ee7abc67da40546685da87504ed443f03dc363a3f3b5bfe50b2ed680e69b2a97c4936ca384d01431658883bd1b36cadc834f2587f8fc658ddcc8b5c3a1b4b31ec6394866f8a6cf05a5ebde936d180cfe662606ba6f16264e9980fa4c10b962f075e01728f277a4db489e71d3e3b7759c20c7cd79c5197db8f73f407badc96af2ea4dca845d9c372b8f3a0c224823d280f513378af5cb115966de1eacf03368d2e6753e109e40028bcecb79d09bacfe42169efad8d2225b41f8724a1afe10f5fde85a8c519b97cc34b2e9e7dfdd02533d247337612ed9242c9116229cca8585911f266107e732b151cb7eede5e8f2848a841180714b4ca027c8c0c55219eee38978aee834fe1b868ca51ee8f9b605f706ed34a744ea7d318b9b1c8baba7e85625be7df329712f9c67f505ea61ac4e3fdfa38fdb8a66ffe78a56ac1acfa808311920a6e133252fea7e919c6fef1466d9e6be66a65cf0f5b74e35325676cd582095e70476dd61e4aab6020820f63eea0c1e173ccee004c56f78054410c8fa6fb0b15c4391749a64022a670cfb	0	\N
\.


--
-- Data for Name: users_sessions; Type: TABLE DATA; Schema: public; Owner: justin
--

COPY public.users_sessions (_order, _parent_id, id, created_at, expires_at) FROM stdin;
1	1	d1fa57cb-5e05-4e48-acdc-628e41f64822	2026-03-08 06:54:46.573+08	2026-03-09 06:54:46.573+08
1	2	5ec96c87-2694-406c-aa07-a2c24f74332c	2026-03-08 10:08:15.722+08	2026-03-09 10:08:15.722+08
2	2	134de354-d2fc-4a7e-8c31-9599b956e58d	2026-03-08 10:08:23.257+08	2026-03-09 10:08:23.257+08
3	2	99053f09-38b5-4001-b6d1-be586c396cb9	2026-03-08 10:08:25.353+08	2026-03-09 10:08:25.353+08
4	2	f93055dc-546c-4c50-845b-b616d05124fa	2026-03-08 10:08:26.181+08	2026-03-09 10:08:26.181+08
5	2	7416bc46-4cf7-459d-9ed4-2e6a3d37320a	2026-03-08 10:08:29.152+08	2026-03-09 10:08:29.152+08
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 4, true);


--
-- Name: delivery_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.delivery_reports_id_seq', 1, false);


--
-- Name: hardware_products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.hardware_products_id_seq', 1, false);


--
-- Name: hardware_products_locales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.hardware_products_locales_id_seq', 1, false);


--
-- Name: install_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.install_orders_id_seq', 1, false);


--
-- Name: media_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.media_id_seq', 1, false);


--
-- Name: ocsas_standards_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.ocsas_standards_id_seq', 1, false);


--
-- Name: ocsas_standards_levels_checklist_items_locales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.ocsas_standards_levels_checklist_items_locales_id_seq', 1, false);


--
-- Name: ocsas_standards_levels_locales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.ocsas_standards_levels_locales_id_seq', 1, false);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.orders_id_seq', 1, false);


--
-- Name: payload_kv_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.payload_kv_id_seq', 1, false);


--
-- Name: payload_locked_documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.payload_locked_documents_id_seq', 3, true);


--
-- Name: payload_locked_documents_rels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.payload_locked_documents_rels_id_seq', 5, true);


--
-- Name: payload_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.payload_migrations_id_seq', 1, true);


--
-- Name: payload_preferences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.payload_preferences_id_seq', 12, true);


--
-- Name: payload_preferences_rels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.payload_preferences_rels_id_seq', 25, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.payments_id_seq', 1, false);


--
-- Name: pricing_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.pricing_config_id_seq', 1, false);


--
-- Name: service_reviews_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.service_reviews_id_seq', 1, false);


--
-- Name: site_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.site_settings_id_seq', 1, false);


--
-- Name: site_settings_locales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.site_settings_locales_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: justin
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: delivery_reports delivery_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.delivery_reports
    ADD CONSTRAINT delivery_reports_pkey PRIMARY KEY (id);


--
-- Name: delivery_reports_screenshots delivery_reports_screenshots_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.delivery_reports_screenshots
    ADD CONSTRAINT delivery_reports_screenshots_pkey PRIMARY KEY (id);


--
-- Name: hardware_products_locales hardware_products_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.hardware_products_locales
    ADD CONSTRAINT hardware_products_locales_pkey PRIMARY KEY (id);


--
-- Name: hardware_products hardware_products_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.hardware_products
    ADD CONSTRAINT hardware_products_pkey PRIMARY KEY (id);


--
-- Name: install_orders install_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.install_orders
    ADD CONSTRAINT install_orders_pkey PRIMARY KEY (id);


--
-- Name: media media_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.media
    ADD CONSTRAINT media_pkey PRIMARY KEY (id);


--
-- Name: ocsas_standards_levels_checklist_items_locales ocsas_standards_levels_checklist_items_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels_checklist_items_locales
    ADD CONSTRAINT ocsas_standards_levels_checklist_items_locales_pkey PRIMARY KEY (id);


--
-- Name: ocsas_standards_levels_checklist_items ocsas_standards_levels_checklist_items_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels_checklist_items
    ADD CONSTRAINT ocsas_standards_levels_checklist_items_pkey PRIMARY KEY (id);


--
-- Name: ocsas_standards_levels_locales ocsas_standards_levels_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels_locales
    ADD CONSTRAINT ocsas_standards_levels_locales_pkey PRIMARY KEY (id);


--
-- Name: ocsas_standards_levels ocsas_standards_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels
    ADD CONSTRAINT ocsas_standards_levels_pkey PRIMARY KEY (id);


--
-- Name: ocsas_standards ocsas_standards_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards
    ADD CONSTRAINT ocsas_standards_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: payload_kv payload_kv_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_kv
    ADD CONSTRAINT payload_kv_pkey PRIMARY KEY (id);


--
-- Name: payload_locked_documents payload_locked_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents
    ADD CONSTRAINT payload_locked_documents_pkey PRIMARY KEY (id);


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_pkey PRIMARY KEY (id);


--
-- Name: payload_migrations payload_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_migrations
    ADD CONSTRAINT payload_migrations_pkey PRIMARY KEY (id);


--
-- Name: payload_preferences payload_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_preferences
    ADD CONSTRAINT payload_preferences_pkey PRIMARY KEY (id);


--
-- Name: payload_preferences_rels payload_preferences_rels_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: pricing_config pricing_config_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.pricing_config
    ADD CONSTRAINT pricing_config_pkey PRIMARY KEY (id);


--
-- Name: service_reviews service_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.service_reviews
    ADD CONSTRAINT service_reviews_pkey PRIMARY KEY (id);


--
-- Name: site_settings_locales site_settings_locales_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.site_settings_locales
    ADD CONSTRAINT site_settings_locales_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_sessions users_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.users_sessions
    ADD CONSTRAINT users_sessions_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX audit_logs_updated_at_idx ON public.audit_logs USING btree (updated_at);


--
-- Name: audit_logs_user_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX audit_logs_user_idx ON public.audit_logs USING btree (user_id);


--
-- Name: delivery_reports_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX delivery_reports_created_at_idx ON public.delivery_reports USING btree (created_at);


--
-- Name: delivery_reports_install_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX delivery_reports_install_order_idx ON public.delivery_reports USING btree (install_order_id);


--
-- Name: delivery_reports_screenshots_image_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX delivery_reports_screenshots_image_idx ON public.delivery_reports_screenshots USING btree (image_id);


--
-- Name: delivery_reports_screenshots_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX delivery_reports_screenshots_order_idx ON public.delivery_reports_screenshots USING btree (_order);


--
-- Name: delivery_reports_screenshots_parent_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX delivery_reports_screenshots_parent_id_idx ON public.delivery_reports_screenshots USING btree (_parent_id);


--
-- Name: delivery_reports_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX delivery_reports_updated_at_idx ON public.delivery_reports USING btree (updated_at);


--
-- Name: hardware_products_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX hardware_products_created_at_idx ON public.hardware_products USING btree (created_at);


--
-- Name: hardware_products_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: justin
--

CREATE UNIQUE INDEX hardware_products_locales_locale_parent_id_unique ON public.hardware_products_locales USING btree (_locale, _parent_id);


--
-- Name: hardware_products_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX hardware_products_updated_at_idx ON public.hardware_products USING btree (updated_at);


--
-- Name: install_orders_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX install_orders_created_at_idx ON public.install_orders USING btree (created_at);


--
-- Name: install_orders_engineer_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX install_orders_engineer_idx ON public.install_orders USING btree (engineer_id);


--
-- Name: install_orders_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX install_orders_order_idx ON public.install_orders USING btree (order_id);


--
-- Name: install_orders_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX install_orders_updated_at_idx ON public.install_orders USING btree (updated_at);


--
-- Name: media_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX media_created_at_idx ON public.media USING btree (created_at);


--
-- Name: media_filename_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE UNIQUE INDEX media_filename_idx ON public.media USING btree (filename);


--
-- Name: media_sizes_card_sizes_card_filename_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX media_sizes_card_sizes_card_filename_idx ON public.media USING btree (sizes_card_filename);


--
-- Name: media_sizes_thumbnail_sizes_thumbnail_filename_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX media_sizes_thumbnail_sizes_thumbnail_filename_idx ON public.media USING btree (sizes_thumbnail_filename);


--
-- Name: media_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX media_updated_at_idx ON public.media USING btree (updated_at);


--
-- Name: ocsas_standards_levels_checklist_items_locales_locale_parent; Type: INDEX; Schema: public; Owner: justin
--

CREATE UNIQUE INDEX ocsas_standards_levels_checklist_items_locales_locale_parent ON public.ocsas_standards_levels_checklist_items_locales USING btree (_locale, _parent_id);


--
-- Name: ocsas_standards_levels_checklist_items_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX ocsas_standards_levels_checklist_items_order_idx ON public.ocsas_standards_levels_checklist_items USING btree (_order);


--
-- Name: ocsas_standards_levels_checklist_items_parent_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX ocsas_standards_levels_checklist_items_parent_id_idx ON public.ocsas_standards_levels_checklist_items USING btree (_parent_id);


--
-- Name: ocsas_standards_levels_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: justin
--

CREATE UNIQUE INDEX ocsas_standards_levels_locales_locale_parent_id_unique ON public.ocsas_standards_levels_locales USING btree (_locale, _parent_id);


--
-- Name: ocsas_standards_levels_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX ocsas_standards_levels_order_idx ON public.ocsas_standards_levels USING btree (_order);


--
-- Name: ocsas_standards_levels_parent_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX ocsas_standards_levels_parent_id_idx ON public.ocsas_standards_levels USING btree (_parent_id);


--
-- Name: orders_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX orders_created_at_idx ON public.orders USING btree (created_at);


--
-- Name: orders_order_number_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE UNIQUE INDEX orders_order_number_idx ON public.orders USING btree (order_number);


--
-- Name: orders_product_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX orders_product_idx ON public.orders USING btree (product_id);


--
-- Name: orders_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX orders_updated_at_idx ON public.orders USING btree (updated_at);


--
-- Name: orders_user_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX orders_user_idx ON public.orders USING btree (user_id);


--
-- Name: payload_kv_key_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE UNIQUE INDEX payload_kv_key_idx ON public.payload_kv USING btree (key);


--
-- Name: payload_locked_documents_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_created_at_idx ON public.payload_locked_documents USING btree (created_at);


--
-- Name: payload_locked_documents_global_slug_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_global_slug_idx ON public.payload_locked_documents USING btree (global_slug);


--
-- Name: payload_locked_documents_rels_audit_logs_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_audit_logs_id_idx ON public.payload_locked_documents_rels USING btree (audit_logs_id);


--
-- Name: payload_locked_documents_rels_delivery_reports_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_delivery_reports_id_idx ON public.payload_locked_documents_rels USING btree (delivery_reports_id);


--
-- Name: payload_locked_documents_rels_hardware_products_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_hardware_products_id_idx ON public.payload_locked_documents_rels USING btree (hardware_products_id);


--
-- Name: payload_locked_documents_rels_install_orders_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_install_orders_id_idx ON public.payload_locked_documents_rels USING btree (install_orders_id);


--
-- Name: payload_locked_documents_rels_media_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_media_id_idx ON public.payload_locked_documents_rels USING btree (media_id);


--
-- Name: payload_locked_documents_rels_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_order_idx ON public.payload_locked_documents_rels USING btree ("order");


--
-- Name: payload_locked_documents_rels_orders_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_orders_id_idx ON public.payload_locked_documents_rels USING btree (orders_id);


--
-- Name: payload_locked_documents_rels_parent_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_parent_idx ON public.payload_locked_documents_rels USING btree (parent_id);


--
-- Name: payload_locked_documents_rels_path_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_path_idx ON public.payload_locked_documents_rels USING btree (path);


--
-- Name: payload_locked_documents_rels_payments_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_payments_id_idx ON public.payload_locked_documents_rels USING btree (payments_id);


--
-- Name: payload_locked_documents_rels_service_reviews_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_service_reviews_id_idx ON public.payload_locked_documents_rels USING btree (service_reviews_id);


--
-- Name: payload_locked_documents_rels_users_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_rels_users_id_idx ON public.payload_locked_documents_rels USING btree (users_id);


--
-- Name: payload_locked_documents_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_locked_documents_updated_at_idx ON public.payload_locked_documents USING btree (updated_at);


--
-- Name: payload_migrations_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_migrations_created_at_idx ON public.payload_migrations USING btree (created_at);


--
-- Name: payload_migrations_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_migrations_updated_at_idx ON public.payload_migrations USING btree (updated_at);


--
-- Name: payload_preferences_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_preferences_created_at_idx ON public.payload_preferences USING btree (created_at);


--
-- Name: payload_preferences_key_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_preferences_key_idx ON public.payload_preferences USING btree (key);


--
-- Name: payload_preferences_rels_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_preferences_rels_order_idx ON public.payload_preferences_rels USING btree ("order");


--
-- Name: payload_preferences_rels_parent_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_preferences_rels_parent_idx ON public.payload_preferences_rels USING btree (parent_id);


--
-- Name: payload_preferences_rels_path_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_preferences_rels_path_idx ON public.payload_preferences_rels USING btree (path);


--
-- Name: payload_preferences_rels_users_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_preferences_rels_users_id_idx ON public.payload_preferences_rels USING btree (users_id);


--
-- Name: payload_preferences_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payload_preferences_updated_at_idx ON public.payload_preferences USING btree (updated_at);


--
-- Name: payments_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payments_created_at_idx ON public.payments USING btree (created_at);


--
-- Name: payments_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payments_order_idx ON public.payments USING btree (order_id);


--
-- Name: payments_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX payments_updated_at_idx ON public.payments USING btree (updated_at);


--
-- Name: service_reviews_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX service_reviews_created_at_idx ON public.service_reviews USING btree (created_at);


--
-- Name: service_reviews_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX service_reviews_order_idx ON public.service_reviews USING btree (order_id);


--
-- Name: service_reviews_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX service_reviews_updated_at_idx ON public.service_reviews USING btree (updated_at);


--
-- Name: service_reviews_user_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX service_reviews_user_idx ON public.service_reviews USING btree (user_id);


--
-- Name: site_settings_locales_locale_parent_id_unique; Type: INDEX; Schema: public; Owner: justin
--

CREATE UNIQUE INDEX site_settings_locales_locale_parent_id_unique ON public.site_settings_locales USING btree (_locale, _parent_id);


--
-- Name: users_avatar_url_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX users_avatar_url_idx ON public.users USING btree (avatar_url_id);


--
-- Name: users_created_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX users_created_at_idx ON public.users USING btree (created_at);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE UNIQUE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_sessions_order_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX users_sessions_order_idx ON public.users_sessions USING btree (_order);


--
-- Name: users_sessions_parent_id_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX users_sessions_parent_id_idx ON public.users_sessions USING btree (_parent_id);


--
-- Name: users_updated_at_idx; Type: INDEX; Schema: public; Owner: justin
--

CREATE INDEX users_updated_at_idx ON public.users USING btree (updated_at);


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: delivery_reports delivery_reports_install_order_id_install_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.delivery_reports
    ADD CONSTRAINT delivery_reports_install_order_id_install_orders_id_fk FOREIGN KEY (install_order_id) REFERENCES public.install_orders(id) ON DELETE SET NULL;


--
-- Name: delivery_reports_screenshots delivery_reports_screenshots_image_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.delivery_reports_screenshots
    ADD CONSTRAINT delivery_reports_screenshots_image_id_media_id_fk FOREIGN KEY (image_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: delivery_reports_screenshots delivery_reports_screenshots_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.delivery_reports_screenshots
    ADD CONSTRAINT delivery_reports_screenshots_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.delivery_reports(id) ON DELETE CASCADE;


--
-- Name: hardware_products_locales hardware_products_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.hardware_products_locales
    ADD CONSTRAINT hardware_products_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.hardware_products(id) ON DELETE CASCADE;


--
-- Name: install_orders install_orders_engineer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.install_orders
    ADD CONSTRAINT install_orders_engineer_id_users_id_fk FOREIGN KEY (engineer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: install_orders install_orders_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.install_orders
    ADD CONSTRAINT install_orders_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: ocsas_standards_levels_checklist_items_locales ocsas_standards_levels_checklist_items_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels_checklist_items_locales
    ADD CONSTRAINT ocsas_standards_levels_checklist_items_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.ocsas_standards_levels_checklist_items(id) ON DELETE CASCADE;


--
-- Name: ocsas_standards_levels_checklist_items ocsas_standards_levels_checklist_items_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels_checklist_items
    ADD CONSTRAINT ocsas_standards_levels_checklist_items_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.ocsas_standards_levels(id) ON DELETE CASCADE;


--
-- Name: ocsas_standards_levels_locales ocsas_standards_levels_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels_locales
    ADD CONSTRAINT ocsas_standards_levels_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.ocsas_standards_levels(id) ON DELETE CASCADE;


--
-- Name: ocsas_standards_levels ocsas_standards_levels_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.ocsas_standards_levels
    ADD CONSTRAINT ocsas_standards_levels_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.ocsas_standards(id) ON DELETE CASCADE;


--
-- Name: orders orders_product_id_hardware_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_product_id_hardware_products_id_fk FOREIGN KEY (product_id) REFERENCES public.hardware_products(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_audit_logs_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_audit_logs_fk FOREIGN KEY (audit_logs_id) REFERENCES public.audit_logs(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_delivery_reports_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_delivery_reports_fk FOREIGN KEY (delivery_reports_id) REFERENCES public.delivery_reports(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_hardware_products_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_hardware_products_fk FOREIGN KEY (hardware_products_id) REFERENCES public.hardware_products(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_install_orders_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_install_orders_fk FOREIGN KEY (install_orders_id) REFERENCES public.install_orders(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_media_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_media_fk FOREIGN KEY (media_id) REFERENCES public.media(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_orders_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_orders_fk FOREIGN KEY (orders_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.payload_locked_documents(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_payments_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_payments_fk FOREIGN KEY (payments_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_service_reviews_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_service_reviews_fk FOREIGN KEY (service_reviews_id) REFERENCES public.service_reviews(id) ON DELETE CASCADE;


--
-- Name: payload_locked_documents_rels payload_locked_documents_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_locked_documents_rels
    ADD CONSTRAINT payload_locked_documents_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payload_preferences_rels payload_preferences_rels_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_parent_fk FOREIGN KEY (parent_id) REFERENCES public.payload_preferences(id) ON DELETE CASCADE;


--
-- Name: payload_preferences_rels payload_preferences_rels_users_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payload_preferences_rels
    ADD CONSTRAINT payload_preferences_rels_users_fk FOREIGN KEY (users_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: payments payments_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: service_reviews service_reviews_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.service_reviews
    ADD CONSTRAINT service_reviews_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: service_reviews service_reviews_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.service_reviews
    ADD CONSTRAINT service_reviews_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: site_settings_locales site_settings_locales_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.site_settings_locales
    ADD CONSTRAINT site_settings_locales_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.site_settings(id) ON DELETE CASCADE;


--
-- Name: users users_avatar_url_id_media_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_avatar_url_id_media_id_fk FOREIGN KEY (avatar_url_id) REFERENCES public.media(id) ON DELETE SET NULL;


--
-- Name: users_sessions users_sessions_parent_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: justin
--

ALTER TABLE ONLY public.users_sessions
    ADD CONSTRAINT users_sessions_parent_id_fk FOREIGN KEY (_parent_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 9OXD3mrkCgTnsLxG39u8uMWyh8tye5Ogpn7ZJ1rDcxQsVEgqcofSVn49zngt2gz

