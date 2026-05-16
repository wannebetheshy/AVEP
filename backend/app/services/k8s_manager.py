import os
import yaml
from kubernetes_asyncio import client, config
from kubernetes_asyncio.utils import create_from_dict

IMAGES = {
    "dvwa": {"image": "vulnerables/web-dvwa", "port": 80},
    "juice-shop": {"image": "bkimminich/juice-shop:latest", "port": 3000},
}

TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "..", "k8s_templates")

async def init_k8s():
    try:
        config.load_incluster_config()
    except:
        await config.load_kube_config()


def _load_and_render_templates(template_name: str, context: dict) -> list:
    path = os.path.join(TEMPLATE_DIR, template_name)
    with open(path, "r") as f:
        content = f.read()
    
    for key, val in context.items():
        content = content.replace(f"{{{{{key}}}}}", str(val))
        
    return list(yaml.safe_load_all(content))


async def deploy_k8s_instance(task_id: str, uuid: str, namespace: str = "vuln-lab"):
    await init_k8s()
    task = IMAGES.get(task_id, IMAGES["dvwa"])
    
    context = {
        "UUID": uuid,
        "TASK_ID": task_id,
        "IMAGE": task["image"],
        "PORT": task["port"]
    }

    async with client.ApiClient() as api_client:
        templates = ["sa-rbac.yaml", "service.yaml", "deployment.yaml", "ingress.yaml"]
        for template in templates:
            manifests = _load_and_render_templates(template, context)
            for manifest in manifests:
                if manifest:
                    await create_from_dict(
                        api_client, 
                        data=manifest,
                        namespace=namespace
                    )


async def delete_k8s_instance(uuid: str, namespace: str = "vuln-lab"):
    await init_k8s()
    
    task_name = f"task-{uuid}"
    sa_name = f"sa-{uuid}"
    rb_name = f"rb-{uuid}"
    
    async with client.ApiClient() as api:
        apps_v1 = client.AppsV1Api(api)
        core_v1 = client.CoreV1Api(api)
        net_v1 = client.NetworkingV1Api(api)
        rbac_v1 = client.RbacAuthorizationV1Api(api)
        
        try: await net_v1.delete_namespaced_ingress(task_name, namespace)
        except: pass
            
        try: await core_v1.delete_namespaced_service(task_name, namespace)
        except: pass
            
        try: await apps_v1.delete_namespaced_deployment(task_name, namespace)
        except: pass
            
        try: await rbac_v1.delete_namespaced_role_binding(rb_name, namespace)
        except: pass
            
        try: await core_v1.delete_namespaced_service_account(sa_name, namespace)
        except: pass