"""
Run with: python -m app.seed.seed_demo
Creates demo companies, users, providers, offers, and packages for Tirana.
"""
import sys
import os

# Allow running from backend/ directory
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, engine
from app.core.database import Base
from app.core.security import hash_password

# Import all models so Base knows about them
import app.models  # noqa: F401

from app.models.company import Company
from app.models.user import User
from app.models.employee_profile import EmployeeProfile
from app.models.provider import Provider
from app.models.offer import Offer
from app.models.package import Package, PackageItem
from app.models.challenge import Challenge


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Skip if data already exists
        if db.query(Company).first():
            print("Demo data already exists. Skipping.")
            return

        print("Seeding companies...")
        company = Company(
            name="TiranaTech",
            country="AL",
            currency="ALL",
            monthly_budget_per_employee=15000,
            approval_required_above=10000,
        )
        db.add(company)
        db.flush()

        print("Seeding providers...")
        providers_data = [
            {"name": "Tirana Wellness Club", "category": "wellness", "description": "Premium spa and wellness center in the heart of Tirana."},
            {"name": "Healthy Bowl Tirana", "category": "food", "description": "Organic and nutritious meals delivered or dine-in."},
            {"name": "Bovilla Trips", "category": "travel", "description": "Day trips and adventures around Tirana and Albania."},
            {"name": "AI Skills Academy", "category": "learning", "description": "Online and in-person courses in AI, data, and tech."},
            {"name": "DentalCare Tirana", "category": "health", "description": "Modern dental clinic with full dental care services."},
            {"name": "FitZone Albania", "category": "fitness", "description": "State-of-the-art gym with classes and personal training."},
        ]
        providers = []
        for p in providers_data:
            provider = Provider(
                name=p["name"],
                category=p["category"],
                city="Tirana",
                country="AL",
                description=p["description"],
                rating=4.5,
                status="active",
            )
            db.add(provider)
            providers.append(provider)
        db.flush()

        provider_map = {p.name: p for p in providers}

        print("Seeding offers...")
        offers_data = [
            {
                "provider": "Tirana Wellness Club",
                "title": "Spa Access Pass",
                "description": "Full day access to spa facilities including sauna, pool, and relaxation areas.",
                "category": "wellness",
                "price": 3500,
            },
            {
                "provider": "FitZone Albania",
                "title": "Pilates Class",
                "description": "60-minute guided pilates session for all levels.",
                "category": "fitness",
                "price": 2500,
            },
            {
                "provider": "Healthy Bowl Tirana",
                "title": "Healthy Dinner Voucher",
                "description": "Voucher for a healthy dinner for two at Healthy Bowl.",
                "category": "food",
                "price": 1200,
            },
            {
                "provider": "Bovilla Trips",
                "title": "Bovilla Day Trip",
                "description": "Full day guided trip to Bovilla Lake including transport and lunch.",
                "category": "travel",
                "price": 5000,
            },
            {
                "provider": "AI Skills Academy",
                "title": "AI Tools Workshop",
                "description": "Half-day hands-on workshop covering the latest AI productivity tools.",
                "category": "learning",
                "price": 8000,
            },
            {
                "provider": "DentalCare Tirana",
                "title": "Dental Checkup",
                "description": "Full dental examination with X-ray and cleaning.",
                "category": "health",
                "price": 3000,
            },
        ]

        offers = []
        for o in offers_data:
            offer = Offer(
                provider_id=provider_map[o["provider"]].id,
                title=o["title"],
                description=o["description"],
                category=o["category"],
                price=o["price"],
                currency="ALL",
                city="Tirana",
                country="AL",
                discount_percent=0,
                is_limited_drop=False,
                status="active",
                valid_until=datetime.now(timezone.utc) + timedelta(days=90),
            )
            db.add(offer)
            offers.append(offer)
        db.flush()

        offer_map = {o.title: o for o in offers}

        print("Seeding packages...")
        pkg1 = Package(
            title="After Work Reset",
            description="Unwind after a long week with spa, pilates, and a healthy dinner.",
            total_price=7200,
            currency="ALL",
            city="Tirana",
            country="AL",
            ai_reason="Recommended for employees interested in wellness, relaxation, and healthy food.",
        )
        db.add(pkg1)
        db.flush()

        for offer_title, price_share in [
            ("Spa Access Pass", 3500),
            ("Pilates Class", 2500),
            ("Healthy Dinner Voucher", 1200),
        ]:
            o = offer_map[offer_title]
            db.add(PackageItem(package_id=pkg1.id, offer_id=o.id, provider_id=o.provider_id, price_share=price_share))

        pkg2 = Package(
            title="Weekend Explorer",
            description="Explore the nature around Tirana and enjoy a healthy meal.",
            total_price=6200,
            currency="ALL",
            city="Tirana",
            country="AL",
            ai_reason="Recommended for employees who want a weekend experience near Tirana.",
        )
        db.add(pkg2)
        db.flush()

        for offer_title, price_share in [
            ("Bovilla Day Trip", 5000),
            ("Healthy Dinner Voucher", 1200),
        ]:
            o = offer_map[offer_title]
            db.add(PackageItem(package_id=pkg2.id, offer_id=o.id, provider_id=o.provider_id, price_share=price_share))

        print("Seeding users...")
        # Employee
        employee = User(
            full_name="Arta Hoxha",
            email="arta@tiranatech.al",
            hashed_password=hash_password("password123"),
            role="employee",
            company_id=company.id,
            language="sq",
            country="AL",
            currency="ALL",
        )
        db.add(employee)
        db.flush()

        db.add(EmployeeProfile(
            user_id=employee.id,
            department="Engineering",
            monthly_budget=15000,
            used_amount=0,
            pending_amount=0,
            remaining_amount=15000,
            interests=["wellness", "food", "travel"],
            benefit_style="Explorer",
            level=2,
            xp=150,
            streak_count=3,
        ))

        # Employer admin
        employer = User(
            full_name="Elira Admin",
            email="admin@tiranatech.al",
            hashed_password=hash_password("password123"),
            role="employer_admin",
            company_id=company.id,
            language="sq",
            country="AL",
            currency="ALL",
        )
        db.add(employer)

        # Provider admin — linked to Tirana Wellness Club
        db.add(User(
            full_name="Wellness Admin",
            email="admin@wellnessclub.al",
            hashed_password=hash_password("password123"),
            role="provider_admin",
            provider_id=provider_map["Tirana Wellness Club"].id,
            language="sq",
            country="AL",
            currency="ALL",
        ))

        print("Seeding challenges...")
        db.add(Challenge(
            title="Wellness Week",
            description="Complete 3 wellness benefits this month.",
            type="category",
            category="wellness",
            goal=3,
            reward=200,
            starts_at=datetime.now(timezone.utc),
            ends_at=datetime.now(timezone.utc) + timedelta(days=30),
        ))
        db.add(Challenge(
            title="Explorer Streak",
            description="Redeem any 3 benefits to keep your streak alive.",
            type="streak",
            category=None,
            goal=3,
            reward=300,
            starts_at=datetime.now(timezone.utc),
            ends_at=datetime.now(timezone.utc) + timedelta(days=60),
        ))

        db.commit()
        print("\nDemo data seeded successfully!")
        print("\nLogin credentials:")
        print("  Employee : arta@tiranatech.al / password123")
        print("  Employer : admin@tiranatech.al / password123")
        print("  Provider : admin@wellnessclub.al / password123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
