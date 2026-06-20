"""
Backfills 8 weeks of realistic historical activity (swipes, saves, requests,
payments, redemptions) plus staggered employee signup dates, so the platform
analytics dashboard has enough volume to render trends instead of being empty.

Additive only — does not wipe or touch existing rows beyond backdating
employee `created_at` and a handful of provider `city` values for geographic
variety. Safe to run once against an already-seeded demo database.

Run with:
  python -m app.seed.seed_analytics_history
"""
import sys
import os
import random
import secrets

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv()

from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal
from app.core.security import hash_password

import app.models  # noqa: F401

from app.models.company import Company
from app.models.user import User
from app.models.employee_profile import EmployeeProfile
from app.models.provider import Provider
from app.models.offer import Offer
from app.models.request import BenefitRequest
from app.models.payment import Payment
from app.models.redemption import Redemption
from app.models.swipe import SwipeInteraction
from app.models.saved_offer import SavedOffer

random.seed(42)

EXTRA_EMPLOYEES = [
    ("Sara Bajrami", "Engineering"), ("Edon Krasniqi", "Sales"), ("Vera Hoxha", "Design"),
    ("Bledar Rama", "Marketing"), ("Anisa Dervishi", "People"), ("Klajdi Berisha", "Finance"),
    ("Megi Toska", "Product"), ("Arian Mema", "Engineering"), ("Fjona Çela", "Operations"),
    ("Indrit Lala", "Sales"), ("Greta Spahiu", "Design"), ("Albi Nuredini", "IT"),
    ("Dafina Krasniqi", "HR"), ("Erald Brahimi", "Engineering"), ("Lira Sako", "Marketing"),
    ("Genti Avdiu", "Finance"), ("Mirsada Hasani", "Operations"), ("Bora Lila", "Product"),
    ("Andi Frashëri", "Sales"), ("Klea Vata", "Engineering"),
]

CITY_REASSIGN = {
    "FitZone Albania": "Vlorë",
    "Albania Outdoors": "Durrës",
    "Barleti Languages": "Shkodër",
    "Glow Studio Tirana": "Durrës",
}


def week_start(dt: datetime) -> datetime:
    monday = dt - timedelta(days=dt.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


def random_time_in(start: datetime, end: datetime) -> datetime:
    delta = (end - start).total_seconds()
    return start + timedelta(seconds=random.uniform(0, max(delta, 1)))


def run():
    db = SessionLocal()
    try:
        existing_swipes = db.query(SwipeInteraction).count()
        if existing_swipes >= 300:
            print(f"Analytics history already seeded ({existing_swipes} swipes found). Skipping.")
            return

        companies = db.query(Company).all()
        if not companies:
            print("No companies found — run `python -m app.seed.seed_demo` first.")
            return
        company_by_name = {c.name: c for c in companies}
        tirantech = company_by_name.get("TiranaTech") or companies[0]
        banka_besa = company_by_name.get("Banka Besa") or companies[-1]

        providers = db.query(Provider).all()
        offers = db.query(Offer).filter(Offer.status == "active").all()
        if not offers:
            print("No offers found — run `python -m app.seed.seed_demo` first.")
            return
        providers_by_name = {p.name: p for p in providers}

        now = datetime.now(timezone.utc)
        window_start = week_start(now) - timedelta(weeks=7)

        # ── Geographic variety: move a few providers to other Albanian cities ──
        print("Diversifying provider cities...")
        for name, city in CITY_REASSIGN.items():
            p = providers_by_name.get(name)
            if p:
                p.city = city
        db.flush()

        # ── New employees + staggered signup dates across 8 weeks ──────────────
        print("Adding employees with staggered signup dates...")
        existing_employees = db.query(User).filter(User.role == "employee").all()
        new_employees = []
        for i, (full_name, dept) in enumerate(EXTRA_EMPLOYEES):
            company = tirantech if i % 2 == 0 else banka_besa
            slug = full_name.lower().replace(" ", ".")
            domain = "tiranatech.al" if company is tirantech else "bankabesa.al"
            email = f"{slug}@{domain}"
            if db.query(User).filter(User.email == email).first():
                continue
            u = User(
                full_name=full_name, email=email,
                hashed_password=hash_password("password123"),
                role="employee", company_id=company.id,
                language="sq", country="AL", currency="ALL",
            )
            db.add(u)
            db.flush()
            budget = 15000 if company is tirantech else 20000
            used = random.randint(0, int(budget * 0.6))
            db.add(EmployeeProfile(
                user_id=u.id, department=dept,
                monthly_budget=budget, used_amount=used,
                pending_amount=0, remaining_amount=budget - used,
                interests=random.sample(
                    ["wellness", "food", "travel", "fitness", "learning", "health"], 2
                ),
                benefit_style="Explorer", level=random.randint(1, 4),
                xp=random.randint(20, 500), streak_count=random.randint(0, 10),
            ))
            new_employees.append(u)
        db.flush()

        all_employees = existing_employees + new_employees
        random.shuffle(all_employees)
        buckets = [[] for _ in range(8)]
        for i, emp in enumerate(all_employees):
            buckets[i % 8].append(emp)
        for week_idx, bucket in enumerate(buckets):
            w_start = window_start + timedelta(weeks=week_idx)
            w_end = w_start + timedelta(days=7)
            for emp in bucket:
                emp.created_at = random_time_in(w_start, min(w_end, now))
        db.flush()

        employee_ids_by_company = {
            tirantech.id: [e.id for e in all_employees if e.company_id == tirantech.id],
            banka_besa.id: [e.id for e in all_employees if e.company_id == banka_besa.id],
        }

        # ── Swipes + saves spread across 8 weeks ────────────────────────────────
        print("Seeding swipes and saves...")
        saved_pairs = {
            (uid, oid) for uid, oid in db.query(SavedOffer.user_id, SavedOffer.offer_id).all()
        }
        swipe_count, save_count = 0, 0
        for week_idx in range(8):
            w_start = window_start + timedelta(weeks=week_idx)
            w_end = min(w_start + timedelta(days=7), now)
            if w_end <= w_start:
                continue
            for _ in range(random.randint(70, 110)):
                emp = random.choice(all_employees)
                offer = random.choice(offers)
                direction = "like" if random.random() < 0.65 else "dislike"
                ts = random_time_in(w_start, w_end)
                db.add(SwipeInteraction(user_id=emp.id, offer_id=offer.id, direction=direction, created_at=ts))
                swipe_count += 1
                pair = (emp.id, offer.id)
                if direction == "like" and random.random() < 0.35 and pair not in saved_pairs:
                    db.add(SavedOffer(user_id=emp.id, offer_id=offer.id, created_at=ts + timedelta(minutes=1)))
                    saved_pairs.add(pair)
                    save_count += 1
            db.flush()

        # ── Benefit requests, payments, redemptions spread across 8 weeks ──────
        print("Seeding requests, payments, and redemptions...")
        request_count, payment_count, redemption_count = 0, 0, 0
        for week_idx in range(8):
            w_start = window_start + timedelta(weeks=week_idx)
            w_end = min(w_start + timedelta(days=7), now)
            if w_end <= w_start:
                continue
            for _ in range(random.randint(9, 16)):
                company = tirantech if random.random() < 0.6 else banka_besa
                emp_ids = employee_ids_by_company[company.id]
                if not emp_ids:
                    continue
                employee_id = random.choice(emp_ids)
                offer = random.choice(offers)
                submitted_at = random_time_in(w_start, w_end)

                roll = random.random()
                status = "approved" if roll < 0.70 else ("pending" if roll < 0.85 else "rejected")
                req = BenefitRequest(
                    employee_id=employee_id, company_id=company.id,
                    offer_id=offer.id, request_type="single_offer",
                    total_amount=offer.price, currency="ALL",
                    status=status, submitted_at=submitted_at,
                )
                if status == "approved":
                    req.approved_at = submitted_at + timedelta(hours=random.randint(1, 36))
                elif status == "rejected":
                    req.rejected_at = submitted_at + timedelta(hours=random.randint(1, 36))
                    req.rejection_reason = "Over monthly category cap"
                db.add(req)
                db.flush()
                request_count += 1

                if status != "approved":
                    continue

                db.add(Payment(
                    request_id=req.id, provider_id=offer.provider_id,
                    amount=offer.price, currency="ALL", status="simulated_paid",
                    created_at=req.approved_at,
                ))
                payment_count += 1

                if random.random() < 0.75:
                    r_roll = random.random()
                    r_status = "redeemed" if r_roll < 0.8 else ("expired" if r_roll < 0.95 else "active")
                    redeemed_at = req.approved_at + timedelta(hours=random.randint(1, 96)) if r_status == "redeemed" else None
                    db.add(Redemption(
                        request_id=req.id, offer_id=offer.id, provider_id=offer.provider_id,
                        qr_code=secrets.token_hex(6), status=r_status,
                        redeemed_at=redeemed_at,
                        expires_at=req.approved_at + timedelta(days=30),
                    ))
                    redemption_count += 1
            db.flush()

        db.commit()
        print("\nAnalytics history seeded successfully!")
        print(f"  New employees : {len(new_employees)}")
        print(f"  Swipes        : {swipe_count}")
        print(f"  Saves         : {save_count}")
        print(f"  Requests      : {request_count}")
        print(f"  Payments      : {payment_count}")
        print(f"  Redemptions   : {redemption_count}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding analytics history: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
