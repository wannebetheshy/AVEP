from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise

from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.instance import router as instance_router
from app.utils.logger import setup_logging
from config import _csv, settings


setup_logging(debug=settings.debug)

app = FastAPI(title="AVEP Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=_csv(settings.cors_allow_methods),
    allow_headers=_csv(settings.cors_allow_headers),
)

app.include_router(auth_router)
app.include_router(instance_router)
app.include_router(admin_router)


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "service": "avep-backend",
        "version": "1.0.0",
    }


register_tortoise(
    app,
    db_url=settings.database_url,
    modules={"models": ["app.db.models"]},
    generate_schemas=True,
    add_exception_handlers=True,
)
