from fastapi import APIRouter

from app.admin.crm_routes import router as crm_router
from app.admin.routes import router as admin_router
from app.api.v1.routes import advisor, advisory, assessments, auth, catalogue, events, me, my_plan, recommend, scenarios, tools

api_router = APIRouter()
for module in (auth, assessments, catalogue, recommend, scenarios, tools, advisory, my_plan, advisor, me, events):
    api_router.include_router(module.router)
api_router.include_router(admin_router)
api_router.include_router(crm_router)
