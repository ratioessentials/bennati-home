from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'admin' o 'operator'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relazioni
    completions = relationship("ChecklistCompletion", back_populates="user")
    supply_alerts = relationship("SupplyAlert", back_populates="reported_by_user")
    work_sessions = relationship("WorkSession", back_populates="user")


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    address = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relazioni
    apartments = relationship("Apartment", back_populates="property", cascade="all, delete-orphan")


class Apartment(Base):
    __tablename__ = "apartments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    floor = Column(String, nullable=True)
    number = Column(String, nullable=True)
    beds = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relazioni
    property = relationship("Property", back_populates="apartments")
    rooms = relationship("Room", back_populates="apartment", cascade="all, delete-orphan")
    checklist_items = relationship("ChecklistItem", back_populates="apartment", cascade="all, delete-orphan")
    supplies = relationship("Supply", back_populates="apartment", cascade="all, delete-orphan")
    work_sessions = relationship("WorkSession", back_populates="apartment")


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relazioni
    apartment = relationship("Apartment", back_populates="rooms")
    checklist_items = relationship("ChecklistItem", back_populates="room", cascade="all, delete-orphan")


class ChecklistItem(Base):
    __tablename__ = "checklist_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id"), nullable=True)
    is_mandatory = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relazioni
    apartment = relationship("Apartment", back_populates="checklist_items")
    room = relationship("Room", back_populates="checklist_items")
    completions = relationship("ChecklistCompletion", back_populates="checklist_item", cascade="all, delete-orphan")


class WorkSession(Base):
    __tablename__ = "work_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_time = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relazioni
    user = relationship("User", back_populates="work_sessions")
    apartment = relationship("Apartment", back_populates="work_sessions")
    completions = relationship("ChecklistCompletion", back_populates="work_session", cascade="all, delete-orphan")


class ChecklistCompletion(Base):
    __tablename__ = "checklist_completions"

    id = Column(Integer, primary_key=True, index=True)
    checklist_item_id = Column(Integer, ForeignKey("checklist_items.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    work_session_id = Column(Integer, ForeignKey("work_sessions.id"), nullable=True)
    completed_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    # Relazioni
    checklist_item = relationship("ChecklistItem", back_populates="completions")
    user = relationship("User", back_populates="completions")
    work_session = relationship("WorkSession", back_populates="completions")


class Supply(Base):
    __tablename__ = "supplies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    apartment_id = Column(Integer, ForeignKey("apartments.id"), nullable=False)
    quantity = Column(Integer, default=0)
    min_quantity = Column(Integer, default=5)
    unit = Column(String, nullable=True)  # 'pz', 'kg', 'lt', ecc.
    category = Column(String, nullable=True)  # 'cleaning', 'bathroom', 'kitchen', ecc.
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relazioni
    apartment = relationship("Apartment", back_populates="supplies")
    alerts = relationship("SupplyAlert", back_populates="supply", cascade="all, delete-orphan")


class SupplyAlert(Base):
    __tablename__ = "supply_alerts"

    id = Column(Integer, primary_key=True, index=True)
    supply_id = Column(Integer, ForeignKey("supplies.id"), nullable=False)
    message = Column(Text, nullable=False)
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relazioni
    supply = relationship("Supply", back_populates="alerts")
    reported_by_user = relationship("User", back_populates="supply_alerts")

