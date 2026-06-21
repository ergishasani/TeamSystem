"""
Run with:
  python -m app.seed.seed_demo            # seed (skips if data exists)
  python -m app.seed.seed_demo --force    # wipe all data and reseed
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, engine
from app.core.database import Base
from app.core.security import hash_password

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
from app.models.shake import ShakeCredit, ShakeAttempt
from app.models.collaboration import ProviderCollaboration, CollaborationItem
from app.models.card import Card
from app.models.notification import Notification
from app.models.charity import Charity, CharitySuggestion
from app.models.request import BenefitRequest
from app.models.redemption import Redemption
from app.models.saved_offer import SavedOffer
from app.models.swipe import SwipeInteraction
from app.models.interaction import UserInteraction
from app.models.payment import Payment
from sqlalchemy import text


def wipe(db):
    print("Wiping existing data...")
    # CASCADE handles all FK dependencies in one shot
    db.execute(text(
        "TRUNCATE TABLE companies, providers, offers, packages, package_items, "
        "users, employee_profiles, user_interests, challenges, challenge_progress, "
        "daily_deals, shake_credits, shake_attempts, provider_collaborations, "
        "collaboration_items, benefit_requests, redemptions, saved_offers, "
        "swipe_interactions, user_interactions, payments, cards, notifications, "
        "charities, charity_suggestions "
        "RESTART IDENTITY CASCADE"
    ))
    db.commit()
    print("  Done.")


def seed():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)

    force = '--force' in sys.argv
    db = SessionLocal()
    try:
        if db.query(Company).first():
            if not force:
                print("Demo data already exists. Use --force to reseed.")
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
                return
            wipe(db)

        now = datetime.now(timezone.utc)

        # ── Companies ──────────────────────────────────────────────────────────
        print("Seeding companies...")
        tirantech = Company(
            name="TiranaTech",
            country="AL",
            currency="ALL",
            monthly_budget_per_employee=15000,
            approval_required_above=10000,
            allow_charity_donations=True,
            donation_match_percent=50,
            donation_approval_required_above=5000,
            allow_employee_charity_suggestions=True,
        )
        banka_besa = Company(
            name="Banka Besa",
            country="AL",
            currency="ALL",
            monthly_budget_per_employee=20000,
            approval_required_above=12000,
            allow_charity_donations=True,
            donation_match_percent=25,
            donation_approval_required_above=None,
            allow_employee_charity_suggestions=True,
        )
        db.add_all([tirantech, banka_besa])
        db.flush()

        # ── Charities ──────────────────────────────────────────────────────────
        print("Seeding charities...")
        platform_charities = [
            {"name": "Tirana Food Bank",          "category": "community",   "description": "Provides meals to families in need across Tirana."},
            {"name": "Albania Green Future",      "category": "environment", "description": "Reforestation and clean-up projects throughout Albania."},
            {"name": "Books for Every Child",     "category": "education",   "description": "Supplies books and school kits to rural schools."},
            {"name": "Tirana Animal Rescue",      "category": "animals",     "description": "Shelter and medical care for stray animals."},
            {"name": "Children's Hospital Fund",  "category": "children",    "description": "Equipment and care for the paediatric hospital in Tirana."},
            {"name": "Mind & Wellbeing Albania",  "category": "health",      "description": "Free mental-health support and counselling services."},
        ]
        for c in platform_charities:
            db.add(Charity(
                name=c["name"], category=c["category"], description=c["description"],
                company_id=None, is_platform_wide=True, is_active=True,
            ))
        # One company-specific charity for TiranaTech.
        db.add(Charity(
            name="TiranaTech Community Fund",
            category="community",
            description="TiranaTech's own fund supporting local tech education for youth.",
            company_id=tirantech.id, is_platform_wide=False, is_active=True,
        ))
        db.flush()

        # ── Providers ──────────────────────────────────────────────────────────
        print("Seeding providers...")
        providers_data = [
            {"name": "Tirana Wellness Club",   "category": "wellness",  "rating": 4.8, "description": "Premium spa and wellness centre in the heart of Tirana."},
            {"name": "Healthy Bowl Tirana",    "category": "food",      "rating": 4.6, "description": "Organic, nutritious meals — dine-in or delivered."},
            {"name": "Bovilla Trips",          "category": "travel",    "rating": 4.7, "description": "Day trips and adventures around Tirana and Albania."},
            {"name": "AI Skills Academy",      "category": "learning",  "rating": 4.9, "description": "Online and in-person courses in AI, data, and tech."},
            {"name": "DentalCare Tirana",      "category": "health",    "rating": 4.5, "description": "Modern dental clinic offering full dental care services."},
            {"name": "FitZone Albania",        "category": "fitness",   "rating": 4.7, "description": "State-of-the-art gym with classes and personal training."},
            {"name": "Kafja Tradita",          "category": "food",      "rating": 4.4, "description": "Traditional Albanian coffee house with monthly passes."},
            {"name": "Albania Outdoors",       "category": "travel",    "rating": 4.8, "description": "Hiking, kayaking, and outdoor adventures across Albania."},
            {"name": "Mental Clarity Center",  "category": "health",    "rating": 4.9, "description": "Licensed therapists for mental wellness and stress relief."},
            {"name": "Glow Studio Tirana",     "category": "wellness",  "rating": 4.6, "description": "Beauty and hair treatments in a relaxing studio setting."},
            {"name": "Barleti Languages",      "category": "learning",  "rating": 4.5, "description": "Language courses — Italian, English, French, and more."},
            {"name": "Panorama Restaurant",    "category": "food",      "rating": 4.7, "description": "Rooftop fine dining with views over Tirana city."},
        ]
        providers = []
        for p in providers_data:
            pr = Provider(
                name=p["name"],
                category=p["category"],
                city="Tirana",
                country="AL",
                description=p["description"],
                rating=p["rating"],
                status="active",
            )
            db.add(pr)
            providers.append(pr)
        db.flush()
        pm = {p.name: p for p in providers}

        # ── Offers ─────────────────────────────────────────────────────────────
        print("Seeding offers...")
        offers_data = [
            # Tirana Wellness Club
            {"provider": "Tirana Wellness Club", "title": "Spa Access Pass",       "category": "wellness", "price": 3500, "desc": "Full day access to spa facilities including sauna, pool, and relaxation areas."},
            {"provider": "Tirana Wellness Club", "title": "Group Yoga Class",       "category": "wellness", "price": 1800, "desc": "60-minute group yoga session led by a certified instructor."},
            {"provider": "Tirana Wellness Club", "title": "Hot Stone Massage",      "category": "wellness", "price": 5500, "desc": "90-minute therapeutic hot stone massage for deep muscle relaxation."},
            # FitZone Albania
            {"provider": "FitZone Albania",      "title": "Pilates Class",           "category": "fitness",  "price": 2500, "desc": "60-minute guided pilates session for all levels."},
            {"provider": "FitZone Albania",      "title": "Personal Training",       "category": "fitness",  "price": 3200, "desc": "1-hour one-on-one personal training session with a certified coach."},
            {"provider": "FitZone Albania",      "title": "Rock Climbing Session",   "category": "fitness",  "price": 2800, "desc": "Indoor bouldering session with all equipment included."},
            # Healthy Bowl Tirana
            {"provider": "Healthy Bowl Tirana",  "title": "Healthy Dinner Voucher", "category": "food",     "price": 1200, "desc": "Voucher for a healthy dinner for two at Healthy Bowl."},
            {"provider": "Healthy Bowl Tirana",  "title": "Smoothie Bowl Set",      "category": "food",     "price":  900, "desc": "Three premium smoothie bowls — acai, mango, and green boost."},
            {"provider": "Healthy Bowl Tirana",  "title": "Nutrition Consultation", "category": "health",   "price": 2800, "desc": "45-minute consultation with a registered nutritionist."},
            # Kafja Tradita
            {"provider": "Kafja Tradita",        "title": "Monthly Coffee Pass",    "category": "food",     "price": 1500, "desc": "Unlimited espresso and filter coffee for one month."},
            {"provider": "Kafja Tradita",        "title": "Kafja Morning Bundle",   "category": "food",     "price":  600, "desc": "Coffee + burek breakfast combo for two visits."},
            # Panorama Restaurant
            {"provider": "Panorama Restaurant",  "title": "Chef's Tasting Menu",   "category": "food",     "price": 4200, "desc": "5-course chef's tasting menu for two with rooftop views."},
            {"provider": "Panorama Restaurant",  "title": "Business Lunch",        "category": "food",     "price": 1800, "desc": "Three-course business lunch for one, Monday–Friday."},
            # Bovilla Trips
            {"provider": "Bovilla Trips",        "title": "Bovilla Day Trip",       "category": "travel",   "price": 5000, "desc": "Full day guided trip to Bovilla Lake including transport and lunch."},
            {"provider": "Bovilla Trips",        "title": "Ohrid Weekend",          "category": "travel",   "price":12000, "desc": "Two-day trip to Ohrid, North Macedonia, with hotel and guided tour."},
            # Albania Outdoors
            {"provider": "Albania Outdoors",     "title": "Dajti Mountain Hike",    "category": "travel",   "price": 3500, "desc": "Half-day guided hike on Mount Dajti with cable car included."},
            {"provider": "Albania Outdoors",     "title": "Skadar Kayaking",        "category": "travel",   "price": 6500, "desc": "Full day kayaking experience on Lake Skadar with picnic."},
            # AI Skills Academy
            {"provider": "AI Skills Academy",    "title": "AI Tools Workshop",      "category": "learning", "price": 8000, "desc": "Half-day hands-on workshop covering the latest AI productivity tools."},
            {"provider": "AI Skills Academy",    "title": "Python for Data Science","category": "learning", "price":12000, "desc": "Weekend intensive: data analysis, visualisation, and ML basics."},
            # Barleti Languages
            {"provider": "Barleti Languages",    "title": "Italian Starter Course", "category": "learning", "price": 9000, "desc": "8-week evening Italian language course, beginner to A2."},
            {"provider": "Barleti Languages",    "title": "English Business Skills","category": "learning", "price": 7500, "desc": "6-session business English workshop — presentations and emails."},
            # DentalCare Tirana
            {"provider": "DentalCare Tirana",    "title": "Dental Checkup",         "category": "health",   "price": 3000, "desc": "Full dental examination with X-ray and professional cleaning."},
            {"provider": "DentalCare Tirana",    "title": "Eye Examination",        "category": "health",   "price": 2200, "desc": "Comprehensive eye exam with vision test and prescription."},
            # Mental Clarity Center
            {"provider": "Mental Clarity Center","title": "Therapy Session",        "category": "health",   "price": 4500, "desc": "50-minute individual therapy session with a licensed psychologist."},
            {"provider": "Mental Clarity Center","title": "Mindfulness Workshop",   "category": "health",   "price": 2500, "desc": "Group mindfulness and stress management workshop, 2 hours."},
            # Glow Studio Tirana
            {"provider": "Glow Studio Tirana",   "title": "Hair & Glow Treatment",  "category": "wellness", "price": 3800, "desc": "Full hair treatment: wash, colour consultation, style, and blow dry."},
            {"provider": "Glow Studio Tirana",   "title": "Facial & Skin Care",     "category": "wellness", "price": 2900, "desc": "60-minute deep-cleansing facial with hyaluronic serum."},
        ]

        offers = []
        for o in offers_data:
            offer = Offer(
                provider_id=pm[o["provider"]].id,
                title=o["title"],
                description=o["desc"],
                category=o["category"],
                price=o["price"],
                currency="ALL",
                city="Tirana",
                country="AL",
                discount_percent=0,
                is_limited_drop=False,
                status="active",
                valid_until=now + timedelta(days=120),
            )
            db.add(offer)
            offers.append(offer)
        db.flush()
        om = {o.title: o for o in offers}

        # ── Packages ───────────────────────────────────────────────────────────
        print("Seeding packages...")
        packages_data = [
            {
                "title": "After Work Reset",
                "description": "Unwind after a long week with spa access, pilates, and a healthy dinner.",
                "total_price": 7200,
                "ai_reason": "Recommended for employees interested in wellness, relaxation, and healthy food.",
                "items": [("Spa Access Pass", 3500), ("Pilates Class", 2500), ("Healthy Dinner Voucher", 1200)],
            },
            {
                "title": "Weekend Explorer",
                "description": "Explore nature around Tirana and enjoy a healthy meal.",
                "total_price": 6200,
                "ai_reason": "Recommended for employees who want a weekend experience near Tirana.",
                "items": [("Bovilla Day Trip", 5000), ("Healthy Dinner Voucher", 1200)],
            },
            {
                "title": "Weekend Escape",
                "description": "A full weekend away — Bovilla lake trip, yoga to reset, and a wholesome dinner.",
                "total_price": 8300,
                "ai_reason": "Perfect for employees who love travel combined with food and wellness.",
                "items": [("Bovilla Day Trip", 5000), ("Group Yoga Class", 1800), ("Healthy Dinner Voucher", 1200)],
            },
            {
                "title": "Brain & Body Boost",
                "description": "Level up your skills and your fitness in one week.",
                "total_price": 12700,
                "ai_reason": "Recommended for ambitious employees who want to invest in both learning and physical health.",
                "items": [("AI Tools Workshop", 8000), ("Personal Training", 3200), ("Monthly Coffee Pass", 1500)],
            },
            {
                "title": "Full Recharge",
                "description": "Deep recovery for mind and body — massage, therapy, and nourishment.",
                "total_price": 9200,
                "ai_reason": "Ideal for employees showing high stress signals or long work streaks.",
                "items": [("Hot Stone Massage", 5500), ("Therapy Session", 4500), ("Smoothie Bowl Set", 900)],
            },
            {
                "title": "Active Weekend",
                "description": "Hit the trails, climb the wall, and fuel up with a proper dinner.",
                "total_price": 8700,
                "ai_reason": "Recommended for fitness-focused employees who love outdoor activities.",
                "items": [("Dajti Mountain Hike", 3500), ("Rock Climbing Session", 2800), ("Chef's Tasting Menu", 4200)],
            },
        ]

        for pkg_data in packages_data:
            pkg = Package(
                title=pkg_data["title"],
                description=pkg_data["description"],
                total_price=pkg_data["total_price"],
                currency="ALL",
                city="Tirana",
                country="AL",
                ai_reason=pkg_data["ai_reason"],
            )
            db.add(pkg)
            db.flush()
            for offer_title, price_share in pkg_data["items"]:
                o = om[offer_title]
                db.add(PackageItem(package_id=pkg.id, offer_id=o.id, provider_id=o.provider_id, price_share=price_share))

        # ── Users: TiranaTech ──────────────────────────────────────────────────
        print("Seeding users...")

        def make_employee(full_name, email, company, department, interests, budget_used=0, level=1, xp=0, streak=0):
            u = User(
                full_name=full_name, email=email,
                hashed_password=hash_password("password123"),
                role="employee", company_id=company.id,
                language="sq", country="AL", currency="ALL",
            )
            db.add(u)
            db.flush()
            remaining = 15000 - budget_used if company == tirantech else 20000 - budget_used
            db.add(EmployeeProfile(
                user_id=u.id, department=department,
                monthly_budget=15000 if company == tirantech else 20000,
                used_amount=budget_used,
                pending_amount=0,
                remaining_amount=remaining,
                interests=interests,
                benefit_style="Explorer",
                level=level, xp=xp, streak_count=streak,
            ))
            return u

        def make_admin(full_name, email, company):
            u = User(
                full_name=full_name, email=email,
                hashed_password=hash_password("password123"),
                role="employer_admin", company_id=company.id,
                language="sq", country="AL", currency="ALL",
            )
            db.add(u)
            return u

        # Primary demo employee
        employee = make_employee(
            "Arta Hoxha", "arta@tiranatech.al", tirantech,
            "Engineering", ["wellness", "food", "travel"],
            budget_used=4200, level=3, xp=320, streak=5,
        )

        make_admin("Elira Admin", "admin@tiranatech.al", tirantech)

        tirantech_team = [
            ("Erion Krasniqi", "erion@tiranatech.al",  "Engineering", ["fitness", "learning"],      3500, 2, 180, 2),
            ("Mira Leka",      "mira@tiranatech.al",   "Design",       ["wellness", "food"],          6000, 3, 270, 7),
            ("Besnik Pula",    "besnik@tiranatech.al", "Sales",        ["travel", "food"],            1200, 1,  90, 1),
            ("Klea Demiri",    "klea@tiranatech.al",   "People",       ["health", "learning"],        8000, 4, 510, 12),
            ("Driton Mehmeti", "driton@tiranatech.al", "Engineering",  ["fitness"],                   2500, 2, 150, 3),
            ("Ardita Shehu",   "ardita@tiranatech.al", "Marketing",    ["food", "wellness", "health"],5500, 3, 290, 6),
            ("Flori Gashi",    "flori@tiranatech.al",  "Product",      ["learning", "travel"],        9000, 4, 420, 9),
            ("Gent Basha",     "gent@tiranatech.al",   "Finance",      ["health", "fitness"],            0, 1,  20, 0),
            ("Rron Sadiku",    "rron@tiranatech.al",   "Engineering",  ["fitness", "learning"],      11000, 5, 680, 15),
            ("Lola Çobani",    "lola@tiranatech.al",   "Design",       ["wellness", "food"],          7200, 3, 340, 8),
        ]
        for full_name, email, dept, interests, used, lvl, xp, streak in tirantech_team:
            make_employee(full_name, email, tirantech, dept, interests, used, lvl, xp, streak)

        # Banka Besa users
        make_admin("Alban Çela", "admin@bankabesa.al", banka_besa)

        bankabesa_team = [
            ("Dorina Malaj",  "dorina@bankabesa.al",  "Finance",    ["health", "wellness"],        12000, 4, 450, 10),
            ("Linda Vrapi",   "linda@bankabesa.al",   "HR",          ["wellness", "food", "health"], 5000, 2, 210, 4),
            ("Artan Doci",    "artan@bankabesa.al",   "Operations",  ["fitness", "travel"],          8500, 3, 300, 6),
            ("Mirel Hoxha",   "mirel@bankabesa.al",   "IT",          ["learning", "fitness"],        3000, 2, 160, 2),
            ("Enis Koci",     "enis@bankabesa.al",    "Sales",       ["food", "travel"],            16000, 5, 590, 11),
        ]
        for full_name, email, dept, interests, used, lvl, xp, streak in bankabesa_team:
            make_employee(full_name, email, banka_besa, dept, interests, used, lvl, xp, streak)

        # ── Challenges ─────────────────────────────────────────────────────────
        print("Seeding challenges...")
        challenges_data = [
            {
                "title": "Wellness Week",
                "description": "Complete 3 wellness benefits this month to earn your badge.",
                "type": "category", "category": "wellness", "goal": 3, "reward": 200,
                "days": 30, "progress_pct": 0.67,
            },
            {
                "title": "Explorer Streak",
                "description": "Redeem any 3 benefits in a row and keep your streak alive.",
                "type": "streak", "category": None, "goal": 3, "reward": 300,
                "days": 60, "progress_pct": 0.5,
            },
            {
                "title": "Fitness Month",
                "description": "Hit the gym or a class 4 times this month.",
                "type": "category", "category": "fitness", "goal": 4, "reward": 350,
                "days": 30, "progress_pct": 0.25,
            },
            {
                "title": "Mind & Body",
                "description": "Use any 2 health benefits — body and mind deserve equal care.",
                "type": "category", "category": "health", "goal": 2, "reward": 180,
                "days": 45, "progress_pct": 0.5,
            },
            {
                "title": "Learning Journey",
                "description": "Complete 2 learning benefits and invest in your growth.",
                "type": "category", "category": "learning", "goal": 2, "reward": 220,
                "days": 60, "progress_pct": 0.0,
            },
            {
                "title": "Budget Hero",
                "description": "Use benefits from 5 different categories in one month.",
                "type": "variety", "category": None, "goal": 5, "reward": 500,
                "days": 30, "progress_pct": 0.4,
            },
        ]
        challenges = []
        for ch_data in challenges_data:
            ch = Challenge(
                title=ch_data["title"],
                description=ch_data["description"],
                type=ch_data["type"],
                category=ch_data.get("category"),
                goal=ch_data["goal"],
                reward=ch_data["reward"],
                starts_at=now,
                ends_at=now + timedelta(days=ch_data["days"]),
            )
            db.add(ch)
            challenges.append(ch)
        db.flush()

        for i, ch in enumerate(challenges):
            pct = challenges_data[i]["progress_pct"]
            prog_val = float(ch.goal) * pct
            db.add(ChallengeProgress(
                challenge_id=ch.id,
                user_id=employee.id,
                progress=prog_val,
                completed=False,
            ))

        # ── User interests ─────────────────────────────────────────────────────
        print("Seeding interests...")
        for cat in ["Wellness", "Food", "Travel", "Fitness", "Learning"]:
            db.add(UserInterest(user_id=employee.id, category=cat))

        # ── Daily deal ─────────────────────────────────────────────────────────
        print("Seeding daily deal...")
        db.flush()
        db.add(DailyDeal(
            offer_id=om["Chef's Tasting Menu"].id,
            deal_date=now.date(),
            deal_price=2940,
            quantity_limit=20,
            quantity_claimed=8,
            is_active=True,
        ))

        # ── Shake credits ──────────────────────────────────────────────────────
        print("Seeding shake credits...")
        db.add(ShakeCredit(user_id=employee.id, credits=5))

        # ── Provider collaborations ────────────────────────────────────────────
        print("Seeding collaborations...")
        collabs_data = [
            {
                "title": "Gym + Healthy Dinner",
                "description": "Combine a FitZone workout with a healthy dinner — the perfect after-work combo.",
                "items": [
                    ("Pilates Class",       "FitZone Albania",     1800),
                    ("Healthy Dinner Voucher","Healthy Bowl Tirana",1500),
                ],
            },
            {
                "title": "Hike & Heal",
                "description": "Start the day on Mount Dajti and end it with a therapy session for the mind.",
                "items": [
                    ("Dajti Mountain Hike", "Albania Outdoors",     3000),
                    ("Therapy Session",     "Mental Clarity Center",2800),
                ],
            },
            {
                "title": "Spa & Dine",
                "description": "Indulge in a full spa day then top it off with rooftop fine dining.",
                "items": [
                    ("Spa Access Pass",     "Tirana Wellness Club", 3000),
                    ("Chef's Tasting Menu", "Panorama Restaurant",  3500),
                ],
            },
        ]
        for c_data in collabs_data:
            item_prices = [price for _, _, price in c_data["items"]]
            collab = ProviderCollaboration(
                title=c_data["title"],
                description=c_data["description"],
                total_price=sum(item_prices),
                currency="ALL",
                city="Tirana",
                is_active=True,
            )
            db.add(collab)
            db.flush()
            for offer_title, provider_name, price_share in c_data["items"]:
                db.add(CollaborationItem(
                    collaboration_id=collab.id,
                    offer_id=om[offer_title].id,
                    provider_id=pm[provider_name].id,
                    price_share=price_share,
                ))

        # ── Notifications ──────────────────────────────────────────────────────
        print("Seeding notifications...")
        demo_notifs = [
            Notification(user_id=employee.id, title="New AI Pick for you",    message="Your weekly AI pick is ready — checkout the Spa Access Pass.", type="ai_pick",          read=False, created_at=now - timedelta(minutes=5)),
            Notification(user_id=employee.id, title="Deal of the Day 🔥",     message="Chef's Tasting Menu at Panorama — 30% off, only 12 spots left!", type="deal",           read=False, created_at=now - timedelta(hours=1)),
            Notification(user_id=employee.id, title="Request approved ✅",    message="Your Hot Stone Massage is approved and ready to redeem.",          type="request_approved",read=False, created_at=now - timedelta(hours=3)),
            Notification(user_id=employee.id, title="Challenge milestone",    message="You're 67% through Wellness Week — keep going!",                  type="challenge",       read=True,  created_at=now - timedelta(hours=6)),
            Notification(user_id=employee.id, title="Shake reward unlocked",  message="+1 benefit credit added to your wallet.",                         type="shake_reward",    read=True,  created_at=now - timedelta(days=1)),
            Notification(user_id=employee.id, title="Wallet 70% used",        message="4 200 ALL remaining this month — make it count.",                 type="wallet_alert",    read=True,  created_at=now - timedelta(days=2)),
            Notification(user_id=employee.id, title="New collab available",   message="Spa & Dine — full spa day + rooftop dinner at a bundle price.",   type="collab",          read=True,  created_at=now - timedelta(days=3)),
            Notification(user_id=employee.id, title="Weekend Escape is back", message="Bovilla trip + yoga + dinner — limited spots this month.",        type="package",         read=True,  created_at=now - timedelta(days=4)),
        ]
        for n in demo_notifs:
            db.add(n)

        db.commit()
        print("\nDemo data seeded successfully!")
        print(f"\n  Companies : TiranaTech, Banka Besa")
        print(f"  Providers : {len(providers_data)}")
        print(f"  Offers    : {len(offers_data)}")
        print(f"  Packages  : {len(packages_data)}")
        print(f"  Challenges: {len(challenges_data)}")
        print(f"  Collabs   : {len(collabs_data)}")
        print(f"  Users     : {1 + len(tirantech_team) + 1} TiranaTech, {1 + len(bankabesa_team)} Banka Besa")
        print("\nLogin credentials:")
        print("  TiranaTech employee : arta@tiranatech.al    / password123")
        print("  TiranaTech admin    : admin@tiranatech.al   / password123")
        print("  Banka Besa employee : dorina@bankabesa.al   / password123")
        print("  Banka Besa admin    : admin@bankabesa.al    / password123")

    except Exception as e:
        db.rollback()
        print(f"Error seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
