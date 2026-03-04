-- Schema for Generator Electricity Billing and Accounting System (GEBAS)

CREATE TABLE stations (
    station_id SERIAL PRIMARY KEY,
    station_name VARCHAR(255) NOT NULL
);

CREATE TABLE subscribers (
    id SERIAL PRIMARY KEY,
    station_id INTEGER NOT NULL REFERENCES stations(station_id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    unit_number VARCHAR(100),
    amperes_count DECIMAL(10, 2) NOT NULL,
    initial_debt DECIMAL(15, 2) DEFAULT 0.00
);

CREATE TABLE monthly_pricing (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL,
    price_per_ampere DECIMAL(15, 2) NOT NULL,
    CONSTRAINT uq_month_year UNIQUE(month, year)
);

CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES subscribers(id) ON DELETE RESTRICT,
    pricing_id INTEGER NOT NULL REFERENCES monthly_pricing(id) ON DELETE RESTRICT,
    total_required DECIMAL(15, 2) NOT NULL,
    paid_amount DECIMAL(15, 2) DEFAULT 0.00,
    remaining_debt DECIMAL(15, 2) GENERATED ALWAYS AS (total_required - paid_amount) STORED,
    CONSTRAINT uq_sub_pricing UNIQUE(subscriber_id, pricing_id)
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    payment_amount DECIMAL(15, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receipt_number VARCHAR(100) UNIQUE
);

CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    expense_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to dynamically update paid_amount in invoices when payments are inserted, updated, or deleted
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE invoices
        SET paid_amount = (
            SELECT COALESCE(SUM(payment_amount), 0.00)
            FROM payments
            WHERE invoice_id = OLD.invoice_id
        )
        WHERE id = OLD.invoice_id;
        RETURN OLD;
    ELSE
        UPDATE invoices
        SET paid_amount = (
            SELECT COALESCE(SUM(payment_amount), 0.00)
            FROM payments
            WHERE invoice_id = NEW.invoice_id
        )
        WHERE id = NEW.invoice_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_paid_amount
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION update_invoice_paid_amount();
