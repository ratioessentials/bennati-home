from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str


class UserCreate(UserBase):
    password: str
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None


class UserInvite(BaseModel):
    email: EmailStr
    name: str
    role: str


class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    token: str
    user: User


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Property Schemas
class PropertyBase(BaseModel):
    name: str
    address: str
    description: Optional[str] = None
    active: bool = True


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None


class Property(PropertyBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Apartment Schemas
class ApartmentBase(BaseModel):
    name: str
    property_id: int
    floor: Optional[str] = None
    number: Optional[str] = None
    beds: Optional[int] = None
    bathrooms: Optional[int] = None
    notes: Optional[str] = None
    active: bool = True


class ApartmentCreate(ApartmentBase):
    pass


class ApartmentUpdate(BaseModel):
    name: Optional[str] = None
    property_id: Optional[int] = None
    floor: Optional[str] = None
    number: Optional[str] = None
    beds: Optional[int] = None
    bathrooms: Optional[int] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


class Apartment(ApartmentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Room Schemas
class RoomBase(BaseModel):
    name: str
    apartment_id: int


class RoomCreate(RoomBase):
    pass


class Room(RoomBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ChecklistItem Schemas (Globali)
class ChecklistItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    room_name: Optional[str] = None
    is_mandatory: bool = False
    order: int = 0


class ChecklistItemCreate(ChecklistItemBase):
    pass


class ChecklistItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    room_name: Optional[str] = None
    is_mandatory: Optional[bool] = None
    order: Optional[int] = None


class ChecklistItem(ChecklistItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ApartmentChecklistItem Schemas (Collegamento Appartamento-Checklist)
class ApartmentChecklistItemBase(BaseModel):
    apartment_id: int
    checklist_item_id: int


class ApartmentChecklistItemCreate(ApartmentChecklistItemBase):
    pass


class ApartmentChecklistItemUpdate(BaseModel):
    pass  # Per ora non ci sono campi modificabili


class ApartmentChecklistItem(ApartmentChecklistItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Schema esteso con dettagli della checklist globale
class ApartmentChecklistItemWithDetails(ApartmentChecklistItem):
    checklist_item: ChecklistItem


# WorkSession Schemas
class WorkSessionBase(BaseModel):
    user_id: int
    apartment_id: int
    notes: Optional[str] = None


class WorkSessionCreate(BaseModel):
    apartment_id: int
    notes: Optional[str] = None


class WorkSessionUpdate(BaseModel):
    notes: Optional[str] = None
    end_time: Optional[datetime] = None


class WorkSession(WorkSessionBase):
    id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ChecklistCompletion Schemas
class ChecklistCompletionBase(BaseModel):
    checklist_item_id: int
    user_id: int
    work_session_id: Optional[int] = None
    notes: Optional[str] = None


class ChecklistCompletionCreate(ChecklistCompletionBase):
    pass


class ChecklistCompletion(ChecklistCompletionBase):
    id: int
    completed_at: datetime
    apartment_id: Optional[int] = None  # Viene popolato dal router tramite join
    checklist_item_title: Optional[str] = None  # Titolo della checklist item

    class Config:
        from_attributes = True


# Supply Schemas (Scorte Globali)
class SupplyBase(BaseModel):
    name: str
    total_quantity: int = 0
    unit: Optional[str] = None
    category: Optional[str] = None
    room: Optional[str] = None
    amazon_link: Optional[str] = None
    notes: Optional[str] = None


class SupplyCreate(SupplyBase):
    pass


class SupplyUpdate(BaseModel):
    name: Optional[str] = None
    total_quantity: Optional[int] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    room: Optional[str] = None
    amazon_link: Optional[str] = None
    notes: Optional[str] = None


class Supply(SupplyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ApartmentSupply Schemas (Collegamento Appartamento-Scorte)
class ApartmentSupplyBase(BaseModel):
    apartment_id: int
    supply_id: int
    required_quantity: int = 0
    min_quantity: int = 1


class ApartmentSupplyCreate(ApartmentSupplyBase):
    pass


class ApartmentSupplyUpdate(BaseModel):
    required_quantity: Optional[int] = None
    min_quantity: Optional[int] = None


class ApartmentSupply(ApartmentSupplyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Schema esteso con dettagli della scorta globale
class ApartmentSupplyWithDetails(ApartmentSupply):
    supply: Supply


# SupplyAlert Schemas
class SupplyAlertBase(BaseModel):
    supply_id: int
    message: str
    reported_by: Optional[int] = None


class SupplyAlertCreate(SupplyAlertBase):
    pass


class SupplyAlert(SupplyAlertBase):
    id: int
    is_resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Email Schema
class EmailSend(BaseModel):
    to: str
    subject: str
    body: str

