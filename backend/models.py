from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Numeric, ForeignKey,
    DateTime, UniqueConstraint, Computed, text
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="accountant", nullable=False) # 'admin', 'accountant'
    is_active = Column(Integer, default=1, server_default=text("1")) # 1 = active, 0 = disabled

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = Column(String(50), nullable=False) # CREATE, UPDATE, DELETE, LOGIN
    table_name = Column(String(50), nullable=False) # e.g. 'subscribers', 'invoices'
    record_id = Column(Integer, nullable=True)
    details = Column(String, nullable=True) # JSON or text description
    timestamp = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"))
    
    user = relationship("User")

class Station(Base):
    __tablename__ = 'stations'
    
    station_id = Column(Integer, primary_key=True, index=True)
    station_name = Column(String(255), nullable=False)
    
    subscribers = relationship("Subscriber", back_populates="station")

class Subscriber(Base):
    __tablename__ = 'subscribers'
    
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey('stations.station_id', ondelete='RESTRICT'), nullable=False)
    name = Column(String(255), nullable=False)
    unit_number = Column(String(100))
    amperes_count = Column(Numeric(10, 2), nullable=False)
    initial_debt = Column(Numeric(15, 2), default=0.00, server_default=text("0.00"))
    
    station = relationship("Station", back_populates="subscribers")
    invoices = relationship("Invoice", back_populates="subscriber")

class MonthlyPricing(Base):
    __tablename__ = 'monthly_pricing'
    
    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    price_per_ampere = Column(Numeric(15, 2), nullable=False)
    
    __table_args__ = (UniqueConstraint('month', 'year', name='uq_month_year'),)
    
    invoices = relationship("Invoice", back_populates="pricing")

class Invoice(Base):
    __tablename__ = 'invoices'
    
    id = Column(Integer, primary_key=True, index=True)
    subscriber_id = Column(Integer, ForeignKey('subscribers.id', ondelete='RESTRICT'), nullable=False)
    pricing_id = Column(Integer, ForeignKey('monthly_pricing.id', ondelete='RESTRICT'), nullable=False)
    total_required = Column(Numeric(15, 2), nullable=False)
    paid_amount = Column(Numeric(15, 2), default=0.00, server_default=text("0.00"))
    
    # remaining_debt automatically calculated in PostgreSQL
    remaining_debt = Column(Numeric(15, 2), Computed('total_required - paid_amount'))
    
    __table_args__ = (UniqueConstraint('subscriber_id', 'pricing_id', name='uq_sub_pricing'),)
    
    subscriber = relationship("Subscriber", back_populates="invoices")
    pricing = relationship("MonthlyPricing", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")

class Payment(Base):
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey('invoices.id', ondelete='RESTRICT'), nullable=False)
    payment_amount = Column(Numeric(15, 2), nullable=False)
    payment_date = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"))
    receipt_number = Column(String(100), unique=True)
    
    invoice = relationship("Invoice", back_populates="payments")

class Expense(Base):
    __tablename__ = 'expenses'
    
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String, nullable=False)
    amount = Column(Numeric(15, 2), nullable=False)
    expense_date = Column(DateTime, default=datetime.utcnow, server_default=text("CURRENT_TIMESTAMP"))
