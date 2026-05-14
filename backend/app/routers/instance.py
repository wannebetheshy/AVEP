from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import ROLE_ADMIN
from app.db.models import User
from app.middleware.auth import require_token
from app.models.schemas import (
    DeployRequest,
    DeployResponse,
    ExtendResponse,
    TerminateResponse,
    TaskListResponse,
    UserInstanceStatusResponse,
)
from app.services.instance_service import (
    build_instance_payload,
    deploy_instance_for_user,
    extend_user_instance,
    get_user_instance,
    list_tasks,
    terminate_user_instance,
)

router = APIRouter(prefix="/api/v1", tags=["Tasks", "Instance"])


def _require_regular_user(token_payload: dict) -> str:
    user_id = token_payload.get("sub")
    role = token_payload.get("role")
    if not user_id or not role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    if role == ROLE_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin token cannot use user instance endpoints",
        )
    return str(user_id)


@router.get("/tasks", response_model=TaskListResponse)
async def tasks(token_payload: dict = Depends(require_token)):
    _ = token_payload
    return TaskListResponse(tasks=list_tasks())


@router.get("/instance/status", response_model=UserInstanceStatusResponse)
async def instance_status(token_payload: dict = Depends(require_token)):
    user_id = _require_regular_user(token_payload)
    instance = await get_user_instance(user_id)
    if not instance:
        return UserInstanceStatusResponse(has_active_instance=False)
    return UserInstanceStatusResponse(has_active_instance=True, instance=build_instance_payload(instance))


@router.post("/instance/deploy", response_model=DeployResponse, status_code=status.HTTP_201_CREATED)
async def deploy_instance(payload: DeployRequest, token_payload: dict = Depends(require_token)):
    user_id = _require_regular_user(token_payload)
    user = await User.filter(id=user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    instance = await deploy_instance_for_user(user, payload.task_id)
    return DeployResponse(instance=build_instance_payload(instance))


@router.post("/instance/extend", response_model=ExtendResponse)
async def extend_instance(token_payload: dict = Depends(require_token)):
    user_id = _require_regular_user(token_payload)
    instance = await extend_user_instance(user_id)
    payload = build_instance_payload(instance)
    return ExtendResponse(
        instance=payload,
        new_expires_at=payload.expires_at,
        new_time_remaining_ms=payload.time_remaining_ms,
    )


@router.delete("/instance/terminate", response_model=TerminateResponse)
async def terminate_instance(token_payload: dict = Depends(require_token)):
    user_id = _require_regular_user(token_payload)
    instance_uuid = await terminate_user_instance(user_id)
    return TerminateResponse(message="Instance terminated successfully", instance_uuid=instance_uuid)