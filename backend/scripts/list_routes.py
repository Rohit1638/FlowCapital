from app.api.router import api_router
from app.main import app

print("api_router count", len(api_router.routes))
for route in api_router.routes:
    print(type(route).__name__, getattr(route, "path", None), getattr(route, "methods", None))
print("app count", len(app.routes))
for route in app.routes:
    print(type(route).__name__, getattr(route, "path", None), getattr(route, "methods", None))
