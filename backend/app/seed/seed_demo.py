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
from app.models.challenge import Challenge, ChallengeProgress
from app.models.user_interest import UserInterest
from app.models.daily_deal import DailyDeal
from app.models.shake import ShakeCredit
from app.models.collaboration import ProviderCollaboration, CollaborationItem
from app.models.card import Card
from app.models.notification import Notification


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Skip if data already exists, but always ensure a daily deal exists
        if db.query(Company).first():
            print("Demo data already exists. Checking daily deal...")
            if not db.query(DailyDeal).filter(DailyDeal.is_active == True).first():
                offer = db.query(Offer).filter(Offer.status == "active").first()
                if offer:
                    db.add(DailyDeal(
                        offer_id=offer.id,
                        deal_date=datetime.now(timezone.utc).date(),
                        deal_price=float(offer.price) * 0.75,
                        quantity_limit=30,
                        quantity_claimed=0,
                        is_active=True,
                    ))
                    db.commit()
                    print(f"  Created missing daily deal for offer: {offer.title}")
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

        # Extra colleagues
        colleagues_data = [
            {"full_name": "Erion Krasniqi", "email": "erion@tiranatech.al", "department": "Engineering"},
            {"full_name": "Mira Leka",      "email": "mira@tiranatech.al",  "department": "Design"},
            {"full_name": "Besnik Pula",    "email": "besnik@tiranatech.al","department": "Sales"},
            {"full_name": "Klea Demiri",    "email": "klea@tiranatech.al",  "department": "People"},
            {"full_name": "Driton Mehmeti", "email": "driton@tiranatech.al","department": "Engineering"},
        ]
        db.flush()
        for c_data in colleagues_data:
            u = User(
                full_name=c_data["full_name"],
                email=c_data["email"],
                hashed_password=hash_password("password123"),
                role="employee",
                company_id=company.id,
                language="sq",
                country="AL",
                currency="ALL",
            )
            db.add(u)
            db.flush()
            db.add(EmployeeProfile(
                user_id=u.id,
                department=c_data["department"],
                monthly_budget=15000,
                used_amount=0,
                pending_amount=0,
                remaining_amount=15000,
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

        print("Seeding challenge progress...")
        db.flush()
        challenges_seeded = db.query(Challenge).all()
        progress_pcts = [0.6, 0.5]  # 60%, 50% for first two challenges
        for i, ch in enumerate(challenges_seeded):
            pct = progress_pcts[i] if i < len(progress_pcts) else 0.33
            prog_val = float(ch.goal or 3) * pct
            db.add(ChallengeProgress(
                challenge_id=ch.id,
                user_id=employee.id,
                progress=prog_val,
                completed=False,
            ))

        print("Seeding interests for demo employee...")
        for cat in ["Wellness", "Food", "Travel", "Fitness", "Learning"]:
            db.add(UserInterest(user_id=employee.id, category=cat))

        print("Seeding daily deal...")
        db.flush()
        db.add(DailyDeal(
            offer_id=offers[2].id,  # Healthy Dinner Voucher
            deal_date=datetime.now(timezone.utc).date(),
            deal_price=900,
            quantity_limit=30,
            quantity_claimed=6,
            is_active=True,
        ))

        print("Seeding shake credits...")
        db.add(ShakeCredit(user_id=employee.id, credits=5))

        print("Seeding demo cards...")
        db.add(Card(user_id=employee.id, card_type="credit", brand="Visa", last_four="4242", expiry="08/27", is_primary=True))
        db.add(Card(user_id=employee.id, card_type="credit", brand="Mastercard", last_four="8821", expiry="01/26", is_primary=False))

        print("Seeding provider collaboration...")
        db.flush()
        collab = ProviderCollaboration(
            title="Gym Session + Healthy Dinner",
            description="Combine a FitZone workout with a healthy dinner — the perfect after-work combo.",
            total_price=3300,
            currency="ALL",
            city="Tirana",
            is_active=True,
        )
        db.add(collab)
        db.flush()
        db.add(CollaborationItem(
            collaboration_id=collab.id,
            offer_id=offers[1].id,  # Pilates Class
            provider_id=provider_map["FitZone Albania"].id,
            price_share=1800,
        ))
        db.add(CollaborationItem(
            collaboration_id=collab.id,
            offer_id=offers[2].id,  # Healthy Dinner Voucher
            provider_id=provider_map["Healthy Bowl Tirana"].id,
            price_share=1500,
        ))

        # Demo notifications for employee
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        demo_notifs = [
            Notification(user_id=employee.id, title="New AI Pick for you", message="Reset & Recover bundle matches your stress pattern this week.", type="ai_pick", read=False, created_at=now - timedelta(minutes=2)),
            Notification(user_id=employee.id, title="Deal of the Day", message="Chef's Tasting at Mullixhiu — 28% off, 8h left.", type="deal", read=False, created_at=now - timedelta(hours=1)),
            Notification(user_id=employee.id, title="Request approved", message="Your Deep-Tissue Massage is ready to redeem.", type="request_approved", read=True, created_at=now - timedelta(hours=3)),
            Notification(user_id=employee.id, title="Shake reward unlocked", message="+1 benefit credit added to your wallet.", type="shake_reward", read=True, created_at=now - timedelta(days=1)),
            Notification(user_id=employee.id, title="Wallet 70% used", message="4,200 ALL remaining this month.", type="wallet_alert", read=True, created_at=now - timedelta(days=2)),
        ]
        for n in demo_notifs:
            db.add(n)

        db.commit()
        print("\nDemo data seeded successfully!")
        print("\nLogin credentials:")
        print("  Employee : arta@tiranatech.al / password123")
        print("  Employer : admin@tiranatech.al / password123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
