from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException, status

from app.db.models import Instance, User
from app.models.schemas import AdminInstanceResponse, InstanceResponse, TaskResponse
from app.services.k8s_manager import deploy_k8s_instance, delete_k8s_instance

TASK_CATALOG: dict[str, TaskResponse] = {
    "dvwa": TaskResponse(
        id="dvwa",
        name="Damn Vulnerable Web App",
        description="Classic deliberately vulnerable web application for practice.",
        difficulty="Easy",
        category="Web",
    ),
    "juice-shop": TaskResponse(
        id="juice-shop",
        name="OWASP Juice Shop",
        description="A modern shopping app packed with security flaws.",
        difficulty="Medium",
        category="Web",
    ),
    "vulnerable-api": TaskResponse(
        id="vulnerable-api",
        name="Vulnerable REST API",
        description="Practice SQL injection, IDOR, and auth weaknesses in an API.",
        difficulty="Hard",
        category="API",
    ),
}


def list_tasks() -> list[TaskResponse]:
    return list(TASK_CATALOG.values())


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _time_remaining_ms(expires_at: datetime) -> int:
    remaining = int((_to_utc(expires_at) - _now()).total_seconds() * 1000)
    return max(0, remaining)


def _serialize_instance(instance: Instance) -> InstanceResponse:
    return InstanceResponse(
        uuid=instance.uuid,
        task_id=instance.task_id,
        task_name=instance.task_name,
        status=instance.status,
        url=instance.url,
        created_at=_to_utc(instance.created_at).isoformat(),
        expires_at=_to_utc(instance.expires_at).isoformat(),
        time_remaining_ms=_time_remaining_ms(instance.expires_at),
        extensions_count=instance.extensions_count,
    )


def _serialize_admin_instance(instance: Instance) -> AdminInstanceResponse:
    return AdminInstanceResponse(
        uuid=instance.uuid,
        user_id=str(instance.user_id),
        username=instance.user.username,
        task_id=instance.task_id,
        task_name=instance.task_name,
        status=instance.status,
        url=instance.url,
        created_at=_to_utc(instance.created_at).isoformat(),
        expires_at=_to_utc(instance.expires_at).isoformat(),
        time_remaining_ms=_time_remaining_ms(instance.expires_at),
        extensions_count=instance.extensions_count,
    )


async def get_user_instance(user_id: str) -> Instance | None:
    return await Instance.filter(user_id=user_id).prefetch_related("user").first()


async def deploy_instance_for_user(user: User, task_id: str) -> Instance:
    task = TASK_CATALOG.get(task_id)
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    existing = await get_user_instance(str(user.id))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already has an active instance")

    now = _now()
    instance_uuid = str(uuid4())
    
    # 1. Дергаем кластер Minikube
    await deploy_k8s_instance(task_id, instance_uuid)

    # 2. Пишем в БД
    instance = await Instance.create(
        uuid=instance_uuid,
        user=user,
        task_id=task.id,
        task_name=task.name,
        status="running",
        url=f"http://{instance_uuid}.vulnavep.com",
        expires_at=now + timedelta(hours=1),
        extensions_count=0,
    )
    await instance.fetch_related("user")
    return instance


async def extend_user_instance(user_id: str) -> Instance:
    instance = await get_user_instance(user_id)
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active instance not found")

    if _time_remaining_ms(instance.expires_at) >= 15 * 60 * 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Extension is only allowed when less than 15 minutes remain",
        )

    instance.expires_at = _to_utc(instance.expires_at) + timedelta(minutes=30)
    instance.extensions_count += 1
    await instance.save()
    await instance.fetch_related("user")
    return instance


async def terminate_user_instance(user_id: str) -> str:
    instance = await get_user_instance(user_id)
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active instance not found")

    await delete_k8s_instance(instance.uuid)

    instance_uuid = instance.uuid
    await instance.delete()
    return instance_uuid

async def list_admin_instances() -> list[AdminInstanceResponse]:
    instances = await Instance.all().prefetch_related("user").order_by("-created_at")
    return [_serialize_admin_instance(instance) for instance in instances]


async def force_terminate_instance(instance_uuid: str) -> str:
    instance = await Instance.filter(uuid=instance_uuid).prefetch_related("user").first()
    if not instance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Instance not found")

    await instance.delete()
    return instance_uuid


def build_instance_payload(instance: Instance) -> InstanceResponse:
    return _serialize_instance(instance)