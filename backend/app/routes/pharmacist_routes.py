from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Medicine, Pharmacy, PharmacyInventory


router = APIRouter(prefix="/pharmacies", tags=["Pharmacies"])


class PharmacyIn(BaseModel):
    pharmacist_name: str
    store_name: str
    degree: str = ""
    license_number: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    city: str = ""
    state: str = ""
    pincode: str = ""
    opening_hours: str = ""
    verified: bool = False
    user_id: Optional[int] = None


class PharmacyOut(PharmacyIn):
    id: int

    class Config:
        from_attributes = True


class PharmacyAvailabilityOut(BaseModel):
    pharmacy_id: int
    store_name: str
    pharmacist_name: str
    phone: str
    address: str
    city: str
    state: str
    pincode: str
    opening_hours: str
    verified: bool
    medicine_id: int
    medicine_name: str
    quantity_available: int


@router.get("/availability", response_model=list[PharmacyAvailabilityOut])
def get_pharmacy_availability(
    medicine_id: int = Query(...),
    db: Session = Depends(get_db),
):
    target_medicine = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not target_medicine:
        return []

    # Match by normalized medicine name only (no brand/company matching).
    normalized_name = (target_medicine.name or "").strip().lower()
    if not normalized_name:
        return []

    name_col = func.lower(func.trim(Medicine.name))

    if len(normalized_name) >= 3:
        name_filter = (name_col == normalized_name) | (name_col.ilike(f"%{normalized_name}%"))
    else:
        name_filter = name_col == normalized_name

    rows = (
        db.query(
            Pharmacy.id.label("pharmacy_id"),
            Pharmacy.store_name,
            Pharmacy.pharmacist_name,
            Pharmacy.phone,
            Pharmacy.address,
            Pharmacy.city,
            Pharmacy.state,
            Pharmacy.pincode,
            Pharmacy.opening_hours,
            Pharmacy.verified,
            func.sum(PharmacyInventory.quantity_available).label("quantity_available"),
        )
        .join(PharmacyInventory, PharmacyInventory.pharmacy_id == Pharmacy.id)
        .join(Medicine, PharmacyInventory.medicine_id == Medicine.id)
        .filter(name_filter)
        .filter(PharmacyInventory.quantity_available > 0)
        .group_by(
            Pharmacy.id,
            Pharmacy.store_name,
            Pharmacy.pharmacist_name,
            Pharmacy.phone,
            Pharmacy.address,
            Pharmacy.city,
            Pharmacy.state,
            Pharmacy.pincode,
            Pharmacy.opening_hours,
            Pharmacy.verified,
        )
        .order_by(func.sum(PharmacyInventory.quantity_available).desc(), Pharmacy.store_name.asc())
        .all()
    )

    return [
        PharmacyAvailabilityOut(
            pharmacy_id=row.pharmacy_id,
            store_name=row.store_name,
            pharmacist_name=row.pharmacist_name,
            phone=row.phone,
            address=row.address,
            city=row.city,
            state=row.state,
            pincode=row.pincode,
            opening_hours=row.opening_hours,
            verified=row.verified,
            medicine_id=medicine_id,
            medicine_name=target_medicine.name,
            quantity_available=int(row.quantity_available or 0),
        )
        for row in rows
    ]


class PharmacyInventoryOut(BaseModel):
    id: int
    pharmacy_id: int
    medicine_id: int
    quantity_available: int
    medicine: dict  # Include basic medicine details

@router.get("/{pharmacy_id}/inventory", response_model=list[PharmacyInventoryOut])
def get_pharmacy_inventory(pharmacy_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(PharmacyInventory, Medicine)
        .join(Medicine, PharmacyInventory.medicine_id == Medicine.id)
        .filter(PharmacyInventory.pharmacy_id == pharmacy_id)
        .all()
    )
    
    return [
        {
            "id": inv.id,
            "pharmacy_id": inv.pharmacy_id,
            "medicine_id": inv.medicine_id,
            "quantity_available": inv.quantity_available,
            "medicine": {
                "id": med.id,
                "name": med.name,
                "brand": med.brand,
                "category": med.category,
                "dose": med.dose,
                "form": med.form,
                "price": med.price,
                "min_stock": med.min_stock,
            }
        }
        for inv, med in rows
    ]


class InventoryUpdateIn(BaseModel):
    medicine_id: int
    quantity_added: int  # can be positive or negative to update stock

@router.post("/{pharmacy_id}/inventory")
def update_pharmacy_inventory(pharmacy_id: int, data: InventoryUpdateIn, db: Session = Depends(get_db)):
    inv = db.query(PharmacyInventory).filter(
        PharmacyInventory.pharmacy_id == pharmacy_id,
        PharmacyInventory.medicine_id == data.medicine_id
    ).first()
    
    if inv:
        inv.quantity_available += data.quantity_added
        if inv.quantity_available < 0:
            inv.quantity_available = 0
    else:
        inv = PharmacyInventory(
            pharmacy_id=pharmacy_id,
            medicine_id=data.medicine_id,
            quantity_available=data.quantity_added if data.quantity_added > 0 else 0
        )
        db.add(inv)
        
    db.commit()
    db.refresh(inv)
    return {"status": "success", "quantity_available": inv.quantity_available}


class InventorySetIn(BaseModel):
    quantity_available: int

@router.put("/{pharmacy_id}/inventory/{medicine_id}")
def set_pharmacy_inventory(pharmacy_id: int, medicine_id: int, data: InventorySetIn, db: Session = Depends(get_db)):
    inv = db.query(PharmacyInventory).filter(
        PharmacyInventory.pharmacy_id == pharmacy_id,
        PharmacyInventory.medicine_id == medicine_id
    ).first()
    
    if inv:
        inv.quantity_available = data.quantity_available
    else:
        inv = PharmacyInventory(
            pharmacy_id=pharmacy_id,
            medicine_id=medicine_id,
            quantity_available=data.quantity_available
        )
        db.add(inv)
        
    db.commit()
    db.refresh(inv)
    return {"status": "success", "quantity_available": inv.quantity_available}


@router.delete("/{pharmacy_id}/inventory/{medicine_id}", status_code=204)
def remove_pharmacy_inventory(pharmacy_id: int, medicine_id: int, db: Session = Depends(get_db)):
    inv = db.query(PharmacyInventory).filter(
        PharmacyInventory.pharmacy_id == pharmacy_id,
        PharmacyInventory.medicine_id == medicine_id
    ).first()
    
    if inv:
        db.delete(inv)
        db.commit()


@router.get("/", response_model=list[PharmacyOut])
def list_pharmacies(user_id: Optional[int] = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Pharmacy)
    if user_id is not None:
        query = query.filter(Pharmacy.user_id == user_id)
    return query.all()


@router.post("/", response_model=PharmacyOut, status_code=201)
def create_pharmacy(data: PharmacyIn, db: Session = Depends(get_db)):
    pharmacy = Pharmacy(**data.model_dump())
    db.add(pharmacy)
    db.commit()
    db.refresh(pharmacy)
    return pharmacy


@router.get("/{pharmacy_id}", response_model=PharmacyOut)
def get_pharmacy(pharmacy_id: int, db: Session = Depends(get_db)):
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    return pharmacy


@router.put("/{pharmacy_id}", response_model=PharmacyOut)
def update_pharmacy(pharmacy_id: int, data: PharmacyIn, db: Session = Depends(get_db)):
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    for key, value in data.model_dump().items():
        setattr(pharmacy, key, value)
    db.commit()
    db.refresh(pharmacy)
    return pharmacy


@router.delete("/{pharmacy_id}", status_code=204)
def delete_pharmacy(pharmacy_id: int, db: Session = Depends(get_db)):
    pharmacy = db.query(Pharmacy).filter(Pharmacy.id == pharmacy_id).first()
    if not pharmacy:
        raise HTTPException(status_code=404, detail="Pharmacy not found")
    db.delete(pharmacy)
    db.commit()