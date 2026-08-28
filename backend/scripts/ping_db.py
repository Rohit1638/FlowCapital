from app.core.config import get_settings
from sqlalchemy import create_engine, text

settings = get_settings()
engine = create_engine(
    settings.sqlalchemy_url,
    connect_args={"connect_timeout": 20, "prepare_threshold": None},
)
with engine.connect() as connection:
    print(connection.execute(text("SELECT 1")).scalar())
