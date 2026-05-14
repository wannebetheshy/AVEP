from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import ROLE_ADMIN
from app.middleware.auth import require_token
from app.models.schemas import AdminInstanceListResponse, AdminTerminateResponse
from app.services.instance_service import force_terminate_instance, list_admin_instances

router = APIRouter(prefix="/api/v1/admin", tags=["Admin"])


def _require_admin(token_payload: dict) -> None:
    if token_payload.get("role") != ROLE_ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")


@router.get("/instances", response_model=AdminInstanceListResponse)
async def admin_instances(token_payload: dict = Depends(require_token)):
    _require_admin(token_payload)
    return AdminInstanceListResponse(items=await list_admin_instances())


@router.delete("/instances/{instance_uuid}", response_model=AdminTerminateResponse)
async def admin_force_terminate(instance_uuid: str, token_payload: dict = Depends(require_token)):
    _require_admin(token_payload)
    terminated_uuid = await force_terminate_instance(instance_uuid)
    return AdminTerminateResponse(
        message="Instance force-terminated successfully",
        instance_uuid=terminated_uuid,
    )