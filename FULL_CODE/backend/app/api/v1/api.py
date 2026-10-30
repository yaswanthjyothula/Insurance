from fastapi import APIRouter

from app.api.v1.routes import advisory, assessments, auth, catalogue, my_plan, recommend, scenarios, tools

api_router = APIRouter()
for module in (auth, assessments, catalogue, recommend, scenarios, tools, advisory, my_plan):
    api_router.include_router(module.router)
