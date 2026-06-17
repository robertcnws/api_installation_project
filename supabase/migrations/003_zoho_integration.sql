-- ============================================================
-- Migration 003: Zoho Integration Tables
-- Created before projects/services so they can FK to them
-- Source: api_integration/models.py
-- ============================================================

-- ============================================================
-- TABLE: zoho_customers
-- Source: ZohoCustomer
-- ============================================================
CREATE TABLE public.zoho_customers (
  id                                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id                           TEXT        NOT NULL UNIQUE,
  contact_name                         TEXT        NOT NULL,
  customer_name                        TEXT        NOT NULL,
  company_name                         TEXT,
  status                               TEXT        NOT NULL,
  first_name                           TEXT        NOT NULL,
  last_name                            TEXT        NOT NULL,
  email                                TEXT        NOT NULL,
  phone                                TEXT        NOT NULL,
  mobile                               TEXT,
  contact_type                         TEXT        NOT NULL,
  has_transaction                      BOOLEAN,
  is_linked_with_zohocrm               BOOLEAN,
  website                              TEXT,
  primary_contact_id                   TEXT,
  payment_terms                        INTEGER,
  payment_terms_label                  TEXT,
  currency_id                          INTEGER,
  currency_code                        TEXT,
  currency_symbol                      TEXT,
  outstanding_receivable_amount        NUMERIC(14,4),
  outstanding_receivable_amount_bcy    NUMERIC(14,4),
  unused_credits_receivable_amount     NUMERIC(14,4),
  unused_credits_receivable_amount_bcy NUMERIC(14,4),
  facebook                             TEXT,
  twitter                              TEXT,
  payment_remainder_enabled            BOOLEAN,
  notes                                TEXT,
  is_taxable                           BOOLEAN,
  tax_id                               TEXT,
  tax_name                             TEXT,
  tax_percentage                       NUMERIC(6,4),
  tax_authority_id                     TEXT,
  tax_exemption_id                     TEXT,
  tax_authority_name                   TEXT,
  tax_exemption_code                   TEXT,
  place_of_contact                     TEXT,
  gst_no                               TEXT,
  tax_treatment                        TEXT,
  tax_regime                           TEXT,
  legal_name                           TEXT,
  is_tds_applicable                    BOOLEAN,
  vst_treatment                        TEXT,
  gst_treatment                        TEXT,
  -- Complex nested objects stored as JSONB
  custom_fields                        JSONB        DEFAULT '[]',
  billing_address                      JSONB,
  shipping_address                     JSONB,
  contact_persons                      JSONB        DEFAULT '[]',
  default_templates                    JSONB,
  qb_list_id                           TEXT,
  created_time                         TIMESTAMPTZ,
  created_time_formatted               TEXT,
  last_modified_time                   TIMESTAMPTZ,
  last_modified_time_formatted         TEXT,
  created_at                           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zoho_customers_contact_id ON public.zoho_customers (contact_id);
CREATE INDEX idx_zoho_customers_email      ON public.zoho_customers (email);
CREATE INDEX idx_zoho_customers_status     ON public.zoho_customers (status);

CREATE TRIGGER set_zoho_customers_updated_at
  BEFORE UPDATE ON public.zoho_customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE: zoho_sales_orders
-- Source: ZohoSalesOrder
-- ============================================================
CREATE TABLE public.zoho_sales_orders (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  salesorder_id           TEXT        UNIQUE,
  salesorder_number       TEXT,
  date                    TIMESTAMPTZ,
  status                  TEXT,
  customer_id             TEXT,
  customer_name           TEXT,
  is_taxable              BOOLEAN,
  tax_id                  TEXT,
  tax_name                TEXT,
  tax_percentage          NUMERIC(6,4),
  currency_id             TEXT,
  currency_code           TEXT,
  currency_symbol         TEXT,
  exchange_rate           NUMERIC(14,6),
  delivery_method         TEXT,
  total_quantity          NUMERIC(14,4),
  sub_total               NUMERIC(14,4),
  tax_total               NUMERIC(14,4),
  total                   NUMERIC(14,4),
  created_by_email        TEXT,
  created_by_name         TEXT,
  salesperson_id          TEXT,
  salesperson_name        TEXT,
  is_test_order           BOOLEAN,
  notes                   TEXT,
  payment_terms           INTEGER,
  payment_terms_label     TEXT,
  reference_number        TEXT,
  -- Arrays stored as JSONB
  line_items              JSONB        DEFAULT '[]',
  shipping_address        JSONB,
  billing_address         JSONB,
  warehouses              JSONB        DEFAULT '[]',
  custom_fields           JSONB        DEFAULT '[]',
  order_sub_statuses      JSONB        DEFAULT '[]',
  shipment_sub_statuses   JSONB        DEFAULT '[]',
  -- zoho_customer FK (optional — customer may not exist locally)
  zoho_customer_id        UUID         REFERENCES public.zoho_customers (id) ON DELETE SET NULL,
  created_time            TIMESTAMPTZ,
  last_modified_time      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zoho_sales_orders_salesorder_id  ON public.zoho_sales_orders (salesorder_id);
CREATE INDEX idx_zoho_sales_orders_customer_id    ON public.zoho_sales_orders (customer_id);
CREATE INDEX idx_zoho_sales_orders_status         ON public.zoho_sales_orders (status);
CREATE INDEX idx_zoho_sales_orders_reference      ON public.zoho_sales_orders (reference_number);

CREATE TRIGGER set_zoho_sales_orders_updated_at
  BEFORE UPDATE ON public.zoho_sales_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
