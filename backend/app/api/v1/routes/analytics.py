from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.offer import Offer
from app.models.provider import Provider
from app.models.redemption import Redemption
from app.models.request import BenefitRequest
from app.models.payment import Payment
from app.models.user import User
from app.models.swipe import SwipeInteraction
from app.models.saved_offer import SavedOffer
from app.models.interaction import UserInteraction

router = APIRouter(prefix="/analytics", tags=["analytics"])

WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
HOUR_BUCKETS = [0, 3, 6, 9, 12, 15, 18, 21]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _week_start(dt: datetime) -> datetime:
    monday = dt - timedelta(days=dt.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)


def _iso_week_label(dt: datetime) -> str:
    return f"W{dt.isocalendar()[1]}"


def _health_status(rate_pct: float) -> str:
    if rate_pct >= 90:
        return "healthy"
    if rate_pct >= 70:
        return "watch"
    return "down"


def _spend_velocity(db: Session) -> dict:
    now = _now()
    this_week = _week_start(now)
    range_start = this_week - timedelta(weeks=7)
    payments = db.query(Payment).filter(Payment.created_at >= range_start).all()

    weeks: List[dict] = []
    week_values: List[float] = []
    for i in range(7, -1, -1):
        week_start = this_week - timedelta(weeks=i)
        week_end = week_start + timedelta(days=7)
        total = sum(float(p.amount) for p in payments if week_start <= p.created_at < week_end)
        weeks.append({"label": _iso_week_label(week_start), "value": round(total)})
        week_values.append(total)

    approved_total = sum(week_values)
    prev_val, last_val = week_values[-2], week_values[-1]
    wow_pct = round((last_val - prev_val) / prev_val * 100, 1) if prev_val > 0 else 0.0

    day_totals: Dict[str, float] = defaultdict(float)
    for p in payments:
        day_totals[p.created_at.date().isoformat()] += float(p.amount)
    peak_day = None
    if day_totals:
        peak_key = max(day_totals, key=day_totals.get)
        peak_date = datetime.fromisoformat(peak_key)
        peak_day = {
            "date": peak_key,
            "label": peak_date.strftime("%b") + f" {peak_date.day}",
            "weekday": peak_date.strftime("%a"),
            "value": round(day_totals[peak_key]),
        }

    last7_start = now - timedelta(days=7)
    avg_7d = round(sum(float(p.amount) for p in payments if p.created_at >= last7_start) / 7)

    mean_week = approved_total / 8 if approved_total else 0
    variance_pct = round((max(week_values) - min(week_values)) / mean_week * 100) if mean_week > 0 else 0

    last4_avg = sum(week_values[-4:]) / 4
    forecast_30d = round(last4_avg * 30 / 7)

    return {
        "weeks": weeks,
        "approved_total": round(approved_total),
        "wow_pct": wow_pct,
        "peak_day": peak_day,
        "avg_7d": avg_7d,
        "variance_pct": variance_pct,
        "forecast_30d": forecast_30d,
    }


def _category_spend_in_range(db: Session, start: datetime, end: datetime) -> Dict[str, float]:
    rows = (
        db.query(Payment.amount, Offer.category)
        .join(BenefitRequest, Payment.request_id == BenefitRequest.id)
        .join(Offer, BenefitRequest.offer_id == Offer.id)
        .filter(Payment.created_at >= start, Payment.created_at < end)
        .all()
    )
    out: Dict[str, float] = defaultdict(float)
    for amount, category in rows:
        out[category] += float(amount)
    return out


def _top_categories(db: Session) -> List[dict]:
    now = _now()
    cur = _category_spend_in_range(db, now - timedelta(days=30), now)
    prev = _category_spend_in_range(db, now - timedelta(days=60), now - timedelta(days=30))
    total_cur = sum(cur.values()) or 1
    total_prev = sum(prev.values()) or 1

    rows = []
    for cat, amount in cur.items():
        share_cur = amount / total_cur * 100
        share_prev = prev.get(cat, 0) / total_prev * 100
        rows.append({
            "category": cat,
            "share_pct": round(share_cur),
            "wow_delta": round(share_cur - share_prev),
        })
    rows.sort(key=lambda r: r["share_pct"], reverse=True)
    return rows[:6]


def _conversion_funnel(db: Session) -> dict:
    now = _now()
    cutoff30 = now - timedelta(days=30)
    cutoff60 = now - timedelta(days=60)

    def counts(start: datetime, end: datetime) -> Tuple[int, int, int, int, int]:
        swipes = db.query(SwipeInteraction).filter(SwipeInteraction.created_at >= start, SwipeInteraction.created_at < end).count()
        saves = db.query(SavedOffer).filter(SavedOffer.created_at >= start, SavedOffer.created_at < end).count()
        requests = db.query(BenefitRequest).filter(BenefitRequest.submitted_at >= start, BenefitRequest.submitted_at < end).count()
        approved = db.query(BenefitRequest).filter(
            BenefitRequest.submitted_at >= start, BenefitRequest.submitted_at < end, BenefitRequest.status == "approved"
        ).count()
        redeemed = db.query(Redemption).filter(
            Redemption.redeemed_at >= start, Redemption.redeemed_at < end, Redemption.status == "redeemed"
        ).count()
        return swipes, saves, requests, approved, redeemed

    swipes, saves, requests, approved, redeemed = counts(cutoff30, now)
    p_swipes, _, _, _, p_redeemed = counts(cutoff60, cutoff30)

    stages = [("Swipes", swipes), ("Saves", saves), ("Requests", requests), ("Approved", approved), ("Redeemed", redeemed)]
    funnel = []
    prev_val = None
    for label, val in stages:
        pct_change = round((val - prev_val) / prev_val * 100, 1) if prev_val else None
        funnel.append({"label": label, "value": val, "pct_change": pct_change})
        prev_val = val

    overall_conv_pct = round(redeemed / swipes * 100, 1) if swipes > 0 else 0.0
    prev_conv_pct = round(p_redeemed / p_swipes * 100, 1) if p_swipes > 0 else 0.0
    wow_pts = round(overall_conv_pct - prev_conv_pct, 1)

    return {"stages": funnel, "overall_conv_pct": overall_conv_pct, "wow_pts": wow_pts}


def _redeem_heatmap(db: Session) -> dict:
    now = _now()
    cutoff30 = now - timedelta(days=30)
    redemptions = db.query(Redemption).filter(
        Redemption.redeemed_at.isnot(None), Redemption.redeemed_at >= cutoff30
    ).all()

    counts: Dict[Tuple[int, int], int] = defaultdict(int)
    for r in redemptions:
        wd = r.redeemed_at.weekday()
        hb = r.redeemed_at.hour // 3
        counts[(wd, hb)] += 1

    grid = [[counts.get((wd, hb), 0) for hb in range(8)] for wd in range(7)]
    peak_label = "—"
    if counts:
        (wd, hb), _ = max(counts.items(), key=lambda kv: kv[1])
        peak_label = f"{WEEKDAY_NAMES[wd].upper()} {HOUR_BUCKETS[hb]}-{HOUR_BUCKETS[hb] + 3}"

    return {"weekdays": WEEKDAY_NAMES, "hours": HOUR_BUCKETS, "grid": grid, "peak_label": peak_label}


def _geography(db: Session) -> List[dict]:
    now = _now()
    cutoff30 = now - timedelta(days=30)
    payments = db.query(Payment).filter(Payment.created_at >= cutoff30).all()
    providers = {p.id: p for p in db.query(Provider).all()}

    city_totals: Dict[str, float] = defaultdict(float)
    for p in payments:
        provider = providers.get(p.provider_id)
        city = provider.city if provider else "Other"
        city_totals[city] += float(p.amount)

    total = sum(city_totals.values()) or 1
    sorted_cities = sorted(city_totals.items(), key=lambda kv: kv[1], reverse=True)
    top = sorted_cities[:5]
    rest = sorted_cities[5:]

    rows = [{"label": city, "amount": round(amount), "share_pct": round(amount / total * 100)} for city, amount in top]
    if rest:
        rest_total = sum(a for _, a in rest)
        rows.append({"label": "Other", "amount": round(rest_total), "share_pct": round(rest_total / total * 100)})
    return rows


def _top_providers(db: Session) -> List[dict]:
    now = _now()
    this_week = _week_start(now)
    last_week_start = this_week - timedelta(days=7)
    cutoff30 = now - timedelta(days=30)

    providers = db.query(Provider).all()
    rows = []
    for p in providers:
        payments30 = db.query(Payment).filter(Payment.provider_id == p.id, Payment.created_at >= cutoff30).all()
        gmv_30d = sum(float(pay.amount) for pay in payments30)
        if gmv_30d <= 0:
            continue

        this_week_gmv = sum(float(pay.amount) for pay in payments30 if pay.created_at >= this_week)
        last_week_gmv = sum(
            float(pay.amount) for pay in payments30 if last_week_start <= pay.created_at < this_week
        )
        if last_week_gmv > 0:
            wow_pct = round((this_week_gmv - last_week_gmv) / last_week_gmv * 100)
        else:
            wow_pct = 100 if this_week_gmv > 0 else 0

        redemptions = db.query(Redemption).filter(Redemption.provider_id == p.id).all()
        total_redemptions = len(redemptions)
        if total_redemptions > 0:
            successful = sum(1 for r in redemptions if r.status != "expired")
            rate_pct = round(successful / total_redemptions * 100)
        else:
            rate_pct = round(float(p.rating) / 5 * 100)

        rows.append({
            "name": p.name,
            "city": p.city,
            "gmv": round(gmv_30d),
            "redemptions": total_redemptions,
            "rate_pct": rate_pct,
            "wow_pct": wow_pct,
            "health_status": _health_status(rate_pct),
        })

    rows.sort(key=lambda r: r["gmv"], reverse=True)
    return rows[:6]


def _top_offers(db: Session) -> List[dict]:
    offers = db.query(Offer).all()
    providers = {p.id: p.name for p in db.query(Provider).all()}
    rows = []
    for o in offers:
        approved_count = db.query(BenefitRequest).filter(
            BenefitRequest.offer_id == o.id, BenefitRequest.status == "approved"
        ).count()
        redemptions = db.query(Redemption).filter(Redemption.offer_id == o.id).all()
        redeemed_count = sum(1 for r in redemptions if r.status == "redeemed")
        total_redemptions = len(redemptions)

        value = max(approved_count, redeemed_count)
        if value == 0:
            continue
        if total_redemptions > 0:
            rate_pct = round(redeemed_count / total_redemptions * 100)
        elif approved_count > 0:
            rate_pct = round(redeemed_count / approved_count * 100)
        else:
            rate_pct = 0

        rows.append({
            "title": o.title,
            "provider_name": providers.get(o.provider_id),
            "value": value,
            "rate_pct": rate_pct,
        })

    rows.sort(key=lambda r: r["value"], reverse=True)
    for i, r in enumerate(rows[:6]):
        r["rank"] = i + 1
    return rows[:6]


def _retention_cohorts(db: Session) -> dict:
    now = _now()
    employees = db.query(User).filter(User.role == "employee").all()

    cohorts: Dict[datetime, List[User]] = defaultdict(list)
    for emp in employees:
        cohorts[_week_start(emp.created_at)].append(emp)

    cohort_weeks = sorted(cohorts.keys())[-8:]
    rows = []
    for week_start in cohort_weeks:
        users = cohorts[week_start]
        user_ids = [u.id for u in users]
        size = len(user_ids)
        offsets: List = []
        for offset in range(8):
            win_start = week_start + timedelta(days=7 * offset)
            win_end = win_start + timedelta(days=7)
            if win_start > now:
                offsets.append(None)
                continue
            swiped = {
                uid for (uid,) in db.query(SwipeInteraction.user_id).filter(
                    SwipeInteraction.user_id.in_(user_ids),
                    SwipeInteraction.created_at >= win_start, SwipeInteraction.created_at < win_end,
                ).all()
            }
            interacted = {
                uid for (uid,) in db.query(UserInteraction.user_id).filter(
                    UserInteraction.user_id.in_(user_ids),
                    UserInteraction.created_at >= win_start, UserInteraction.created_at < win_end,
                ).all()
            }
            requested = {
                uid for (uid,) in db.query(BenefitRequest.employee_id).filter(
                    BenefitRequest.employee_id.in_(user_ids),
                    BenefitRequest.submitted_at >= win_start, BenefitRequest.submitted_at < win_end,
                ).all()
            }
            active = swiped | interacted | requested
            pct = round(len(active) / size * 100) if size > 0 else 0
            offsets.append(pct)
        rows.append({"label": _iso_week_label(week_start), "size": size, "weeks": offsets})

    median_w4 = None
    w4_values = [r["weeks"][4] for r in rows if len(r["weeks"]) > 4 and r["weeks"][4] is not None]
    if w4_values:
        sorted_vals = sorted(w4_values)
        mid = len(sorted_vals) // 2
        median_w4 = sorted_vals[mid] if len(sorted_vals) % 2 else round((sorted_vals[mid - 1] + sorted_vals[mid]) / 2)

    return {"cohorts": rows, "median_w4_retention": median_w4}


def _ai_insights(top_categories: List[dict], top_providers: List[dict], cohorts: dict) -> List[dict]:
    insights = []

    if top_categories:
        worst = min(top_categories, key=lambda c: c["wow_delta"])
        if worst["wow_delta"] < 0:
            insights.append({
                "type": "anomaly",
                "title": "Anomaly",
                "body": f"{worst['category'].capitalize()} share of spend dropped {abs(worst['wow_delta'])} pts week over week — worth checking provider availability.",
            })

    if top_providers:
        best = max(top_providers, key=lambda p: p["wow_pct"])
        if best["wow_pct"] > 0:
            insights.append({
                "type": "opportunity",
                "title": "Opportunity",
                "body": f"{best['name']} is up {best['wow_pct']}% week over week with a {best['rate_pct']}% redemption rate — consider featuring more of its offers.",
            })

    cohort_rows = cohorts.get("cohorts", [])
    if cohort_rows:
        best_cohort = max(cohort_rows, key=lambda r: (r["weeks"][1] if len(r["weeks"]) > 1 and r["weeks"][1] is not None else -1))
        w1 = best_cohort["weeks"][1] if len(best_cohort["weeks"]) > 1 else None
        if w1 is not None:
            insights.append({
                "type": "retention",
                "title": "Retention",
                "body": f"Cohort {best_cohort['label']} retained {w1}% of users into week 1 — the strongest of the last 8 weeks.",
            })

    return insights[:3]


@router.get("/overview")
def analytics_overview(current_user=Depends(get_admin_user), db: Session = Depends(get_db)):
    top_categories = _top_categories(db)
    top_providers = _top_providers(db)
    retention = _retention_cohorts(db)

    return {
        "spend_velocity": _spend_velocity(db),
        "top_categories": top_categories,
        "conversion_funnel": _conversion_funnel(db),
        "redeem_heatmap": _redeem_heatmap(db),
        "geography": _geography(db),
        "top_providers": top_providers,
        "top_offers": _top_offers(db),
        "retention_cohorts": retention,
        "ai_insights": _ai_insights(top_categories, top_providers, retention),
    }
