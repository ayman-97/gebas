import os
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Import models
import models

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gebas")

try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        pass
except Exception as e:
    print(f"Warning: Could not connect to Postgres, falling back to SQLite: {e}")
    DATABASE_URL = "sqlite:///./gebas_fallback.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
models.Base.metadata.create_all(bind=engine)


app = FastAPI(title="GEBAS API - نظام جباية المولدات")

# Allow CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Health Check ---
@app.get("/")
def read_root():
    return {"message": "نظام جباية المولدات يعمل بنجاح (GEBAS API is running)"}

# --- Pydantic Schemas ---
class PaymentCreate(BaseModel):
    subscriber_id: int
    amount: float
    receipt_number: Optional[str] = None

class StationCreate(BaseModel):
    station_name: str

class StationResponse(StationCreate):
    station_id: int
    
    class Config:
        from_attributes = True

class SubscriberBase(BaseModel):
    station_id: int
    name: str
    unit_number: Optional[str] = None
    amperes_count: float
    initial_debt: float = 0.0

class SubscriberCreate(SubscriberBase):
    pass

class SubscriberResponse(SubscriberBase):
    id: int
    station_name: Optional[str] = None
    
    class Config:
        from_attributes = True

# --- Stations API ---
@app.get("/api/stations", response_model=List[StationResponse])
def read_stations(db: Session = Depends(get_db)):
    return db.query(models.Station).all()

@app.post("/api/stations", response_model=StationResponse)
def create_station(station: StationCreate, db: Session = Depends(get_db)):
    db_station = models.Station(**station.model_dump())
    db.add(db_station)
    db.commit()
    db.refresh(db_station)
    return db_station

@app.put("/api/stations/{station_id}", response_model=StationResponse)
def update_station(station_id: int, station: StationCreate, db: Session = Depends(get_db)):
    db_station = db.query(models.Station).filter(models.Station.station_id == station_id).first()
    if not db_station:
        raise HTTPException(status_code=404, detail="المحطة غير موجودة")
    db_station.station_name = station.station_name
    db.commit()
    db.refresh(db_station)
    return db_station

@app.delete("/api/stations/{station_id}")
def delete_station(station_id: int, db: Session = Depends(get_db)):
    db_station = db.query(models.Station).filter(models.Station.station_id == station_id).first()
    if not db_station:
        raise HTTPException(status_code=404, detail="المحطة غير موجودة")
    try:
        db.delete(db_station)
        db.commit()
        return {"status": "success", "message": "تم حذف المحطة بنجاح"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="لا يمكن حذف المحطة لأنها تحتوي على مشتركين")

# --- Subscribers API ---
@app.get("/api/subscribers")
def read_subscribers(station_id: Optional[int] = None, skip: int = 0, limit: int = 500, db: Session = Depends(get_db)):
    query = db.query(models.Subscriber)
    if station_id:
        query = query.filter(models.Subscriber.station_id == station_id)
    subs = query.offset(skip).limit(limit).all()
    result = []
    for s in subs:
        result.append({
            "id": s.id,
            "station_id": s.station_id,
            "station_name": s.station.station_name if s.station else "",
            "name": s.name,
            "unit_number": s.unit_number,
            "amperes_count": float(s.amperes_count),
            "initial_debt": float(s.initial_debt)
        })
    return result

@app.post("/api/subscribers")
def create_subscriber(subscriber: SubscriberCreate, db: Session = Depends(get_db)):
    db_subscriber = models.Subscriber(**subscriber.model_dump())
    db.add(db_subscriber)
    db.commit()
    db.refresh(db_subscriber)
    return {
        "id": db_subscriber.id,
        "station_id": db_subscriber.station_id,
        "station_name": db_subscriber.station.station_name if db_subscriber.station else "",
        "name": db_subscriber.name,
        "unit_number": db_subscriber.unit_number,
        "amperes_count": float(db_subscriber.amperes_count),
        "initial_debt": float(db_subscriber.initial_debt)
    }

@app.put("/api/subscribers/{subscriber_id}")
def update_subscriber(subscriber_id: int, subscriber: SubscriberCreate, db: Session = Depends(get_db)):
    db_sub = db.query(models.Subscriber).filter(models.Subscriber.id == subscriber_id).first()
    if not db_sub:
        raise HTTPException(status_code=404, detail="المشترك غير موجود")
    db_sub.station_id = subscriber.station_id
    db_sub.name = subscriber.name
    db_sub.unit_number = subscriber.unit_number
    db_sub.amperes_count = subscriber.amperes_count
    db_sub.initial_debt = subscriber.initial_debt
    db.commit()
    db.refresh(db_sub)
    return {"status": "success", "message": "تم تحديث بيانات المشترك بنجاح"}

@app.delete("/api/subscribers/{subscriber_id}")
def delete_subscriber(subscriber_id: int, db: Session = Depends(get_db)):
    db_sub = db.query(models.Subscriber).filter(models.Subscriber.id == subscriber_id).first()
    if not db_sub:
        raise HTTPException(status_code=404, detail="المشترك غير موجود")
    try:
        db.delete(db_sub)
        db.commit()
        return {"status": "success", "message": "تم حذف المشترك بنجاح"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="لا يمكن حذف المشترك لأنه مرتبط بفواتير")

class MonthlyPricingCreate(BaseModel):
    month: int
    year: int
    price_per_ampere: float

class MonthlyPricingResponse(MonthlyPricingCreate):
    id: int
    
    class Config:
        from_attributes = True

@app.get("/api/pricing", response_model=List[MonthlyPricingResponse])
def read_all_pricing(db: Session = Depends(get_db)):
    return db.query(models.MonthlyPricing).order_by(models.MonthlyPricing.year.desc(), models.MonthlyPricing.month.desc()).all()

@app.post("/api/pricing", status_code=201)
def create_monthly_pricing(pricing: MonthlyPricingCreate, db: Session = Depends(get_db)):
    db_pricing = models.MonthlyPricing(**pricing.model_dump())
    try:
        db.add(db_pricing)
        db.commit()
        db.refresh(db_pricing)
        return {"status": "success", "message": "تمت إضافة التسعيرة بنجاح", "data": db_pricing}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="قد تكون التسعيرة لهذا الشهر موجودة مسبقاً")

@app.put("/api/pricing/{pricing_id}")
def update_pricing(pricing_id: int, pricing: MonthlyPricingCreate, db: Session = Depends(get_db)):
    db_pricing = db.query(models.MonthlyPricing).filter(models.MonthlyPricing.id == pricing_id).first()
    if not db_pricing:
        raise HTTPException(status_code=404, detail="التسعيرة غير موجودة")
    db_pricing.month = pricing.month
    db_pricing.year = pricing.year
    db_pricing.price_per_ampere = pricing.price_per_ampere
    try:
        db.commit()
        db.refresh(db_pricing)
        return {"status": "success", "message": "تم تحديث التسعيرة بنجاح", "data": db_pricing}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="حدث خطأ أثناء تحديث التسعيرة")

@app.delete("/api/pricing/{pricing_id}")
def delete_pricing(pricing_id: int, db: Session = Depends(get_db)):
    db_pricing = db.query(models.MonthlyPricing).filter(models.MonthlyPricing.id == pricing_id).first()
    if not db_pricing:
        raise HTTPException(status_code=404, detail="التسعيرة غير موجودة")
    try:
        db.delete(db_pricing)
        db.commit()
        return {"status": "success", "message": "تم حذف التسعيرة بنجاح"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="لا يمكن حذف التسعيرة لأنها مرتبطة بفواتير")

@app.post("/api/invoices/generate/{pricing_id}")
def generate_invoices_for_month(pricing_id: int, db: Session = Depends(get_db)):
    pricing = db.query(models.MonthlyPricing).filter(models.MonthlyPricing.id == pricing_id).first()
    if not pricing:
        raise HTTPException(status_code=404, detail="التسعيرة غير موجودة")
        
    subscribers = db.query(models.Subscriber).all()
    count = 0
    
    for sub in subscribers:
        # Check if invoice already exists
        existing = db.query(models.Invoice).filter(
            models.Invoice.subscriber_id == sub.id,
            models.Invoice.pricing_id == pricing_id
        ).first()
        
        if not existing:
            # (Amperes * Monthly Price) + Previous Month's Debt
            # For simplicity, using initial_debt here. In a real scenario, you'd fetch the previous Invoice's remaining_debt.
            total_required = float(sub.amperes_count) * float(pricing.price_per_ampere)
            # If it's their first invoice, add initial_debt
            total_required += float(sub.initial_debt)
            
            new_invoice = models.Invoice(
                subscriber_id=sub.id,
                pricing_id=pricing_id,
                total_required=total_required,
                paid_amount=0.00
            )
            db.add(new_invoice)
            count += 1
            
    try:
        db.commit()
        return {"status": "success", "message": f"تم توليد {count} فاتورة بنجاح"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class ExpenseCreate(BaseModel):
    description: str
    amount: float

class ExpenseResponse(ExpenseCreate):
    id: int
    expense_date: datetime
    
    class Config:
        orm_mode = True

@app.get("/api/expenses", response_model=List[ExpenseResponse])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).order_by(models.Expense.expense_date.desc()).offset(skip).limit(limit).all()
    return expenses

@app.post("/api/expenses", response_model=ExpenseResponse)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@app.get("/api/invoices")
def list_invoices(db: Session = Depends(get_db)):
    invoices = db.query(models.Invoice).join(models.Subscriber).join(models.MonthlyPricing).order_by(models.Invoice.id.desc()).all()
    result = []
    for inv in invoices:
        total_req = float(inv.total_required or 0)
        paid = float(inv.paid_amount or 0)
        result.append({
            "id": inv.id,
            "subscriber_id": inv.subscriber_id,
            "subscriber_name": inv.subscriber.name,
            "station_name": inv.subscriber.station.station_name if inv.subscriber.station else "",
            "unit_number": inv.subscriber.unit_number,
            "pricing_id": inv.pricing_id,
            "month": inv.pricing.month,
            "year": inv.pricing.year,
            "month_year": f"{inv.pricing.month}/{inv.pricing.year}",
            "total_required": total_req,
            "paid_amount": paid,
            "remaining_debt": total_req - paid
        })
    return result

class InvoiceUpdate(BaseModel):
    total_required: float
    paid_amount: float

@app.put("/api/invoices/{invoice_id}")
def update_invoice(invoice_id: int, data: InvoiceUpdate, db: Session = Depends(get_db)):
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="الفاتورة غير موجودة")
    inv.total_required = data.total_required
    inv.paid_amount = data.paid_amount
    db.commit()
    return {"status": "success", "message": "تم تحديث الفاتورة بنجاح"}

@app.delete("/api/invoices/{invoice_id}")
def delete_invoice(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="الفاتورة غير موجودة")
    # Delete related payments first
    db.query(models.Payment).filter(models.Payment.invoice_id == invoice_id).delete()
    db.delete(inv)
    db.commit()
    return {"status": "success", "message": "تم حذف الفاتورة بنجاح"}

@app.get("/api/reports/invoices")
def get_invoices_report(db: Session = Depends(get_db)):
    invoices = db.query(models.Invoice).join(models.Subscriber).join(models.MonthlyPricing).all()
    report_data = []
    for inv in invoices:
        total_req = float(inv.total_required or 0)
        paid = float(inv.paid_amount or 0)
        report_data.append({
            "id": inv.id,
            "subscriber_name": inv.subscriber.name,
            "unit_number": inv.subscriber.unit_number,
            "month_year": f"{inv.pricing.month}/{inv.pricing.year}",
            "total_required": total_req,
            "paid_amount": paid,
            "remaining_debt": total_req - paid
        })
    return report_data

@app.get("/api/metrics")
def get_metrics(db: Session = Depends(get_db)):
    from sqlalchemy import func
    
    active_subscribers = db.query(func.count(models.Subscriber.id)).scalar() or 0
    
    expected_revenue = db.query(func.coalesce(func.sum(models.Invoice.total_required), 0)).scalar()
    collected = db.query(func.coalesce(func.sum(models.Invoice.paid_amount), 0)).scalar()
    unpaid_debt = float(expected_revenue) - float(collected)
    
    total_expenses = db.query(func.coalesce(func.sum(models.Expense.amount), 0)).scalar()
    
    return {
        "expectedRevenue": float(expected_revenue),
        "collected": float(collected),
        "unpaidDebt": float(unpaid_debt),
        "activeSubscribers": active_subscribers,
        "totalExpenses": float(total_expenses)
    }

@app.post("/api/payments")
def create_payment(payment: PaymentCreate, db: Session = Depends(get_db)):
    # Find the latest unpaid invoice for this subscriber
    invoice = db.query(models.Invoice).filter(
        models.Invoice.subscriber_id == payment.subscriber_id
    ).order_by(models.Invoice.id.desc()).first()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="لا توجد فاتورة لهذا المشترك. يرجى توليد الفواتير أولاً من تبويب الفوترة")
    
    # Generate receipt number if not provided
    receipt_num = payment.receipt_number
    if not receipt_num:
        import random
        receipt_num = f"R-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000,9999)}"
    
    db_payment = models.Payment(
        invoice_id=invoice.id,
        payment_amount=payment.amount,
        receipt_number=receipt_num
    )
    db.add(db_payment)
    
    # Manually update the invoice's paid_amount (since SQLite has no trigger)
    from decimal import Decimal
    invoice.paid_amount = float(Decimal(str(invoice.paid_amount or 0)) + Decimal(str(payment.amount)))
    
    db.commit()
    db.refresh(db_payment)
    
    # Get subscriber info for receipt
    subscriber = db.query(models.Subscriber).filter(models.Subscriber.id == payment.subscriber_id).first()
    
    return {
        "status": "success",
        "message": "تم تسجيل الدفعة بنجاح",
        "receipt": {
            "receipt_number": receipt_num,
            "subscriber_name": subscriber.name if subscriber else "",
            "station_name": subscriber.station.station_name if subscriber and subscriber.station else "",
            "unit_number": subscriber.unit_number if subscriber else "",
            "amount": float(payment.amount),
            "date": db_payment.payment_date.strftime("%Y-%m-%d %H:%M") if db_payment.payment_date else datetime.now().strftime("%Y-%m-%d %H:%M"),
            "invoice_total": float(invoice.total_required),
            "total_paid": float(invoice.paid_amount),
            "remaining": float(invoice.total_required) - float(invoice.paid_amount)
        }
    }

@app.get("/api/subscribers/{subscriber_id}/history")
def get_subscriber_history(subscriber_id: int, db: Session = Depends(get_db)):
    subscriber = db.query(models.Subscriber).filter(models.Subscriber.id == subscriber_id).first()
    if not subscriber:
        raise HTTPException(status_code=404, detail="المشترك غير موجود")
    
    invoices = db.query(models.Invoice).filter(
        models.Invoice.subscriber_id == subscriber_id
    ).order_by(models.Invoice.id.desc()).all()
    
    history = []
    for inv in invoices:
        total_req = float(inv.total_required or 0)
        paid = float(inv.paid_amount or 0)
        
        payments_list = []
        for p in inv.payments:
            payments_list.append({
                "id": p.id,
                "amount": float(p.payment_amount),
                "date": p.payment_date.strftime("%Y-%m-%d %H:%M") if p.payment_date else "",
                "receipt_number": p.receipt_number or ""
            })
        
        history.append({
            "invoice_id": inv.id,
            "month_year": f"{inv.pricing.month}/{inv.pricing.year}" if inv.pricing else "",
            "total_required": total_req,
            "paid_amount": paid,
            "remaining": total_req - paid,
            "payments": payments_list
        })
    
    return {
        "subscriber": {
            "id": subscriber.id,
            "name": subscriber.name,
            "station_name": subscriber.station.station_name if subscriber.station else "",
            "unit_number": subscriber.unit_number,
            "amperes_count": float(subscriber.amperes_count)
        },
        "history": history
    }

# To run: uvicorn main:app --reload
