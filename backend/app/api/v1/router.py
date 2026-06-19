from fastapi import APIRouter

from app.api.v1.routes import (
    auth,
    users,
    wallet,
    offers,
    providers,
    packages,
    ai,
    benefit_requests,
    employer,
    provider_routes,
    redemptions,
    challenges,
    interactions,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(wallet.router)
api_router.include_router(offers.router)
api_router.include_router(providers.router)
api_router.include_router(packages.router)
api_router.include_router(ai.router)
api_router.include_router(benefit_requests.router)
api_router.include_router(employer.router)
api_router.include_router(provider_routes.router)
api_router.include_router(redemptions.router)
api_router.include_router(challenges.router)
api_router.include_router(interactions.router)
