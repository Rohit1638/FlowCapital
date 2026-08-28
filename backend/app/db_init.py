from pathlib import Path

from sqlalchemy import text

from app.core.database import get_engine
from app.core.logging import get_logger

logger = get_logger("db_init")


def apply_schema() -> None:
    schema_dir = Path(__file__).resolve().parents[1] / "database"
    files = ["schema.sql", "schema_module_6a.sql"]
    engine = get_engine()
    for filename in files:
        schema = schema_dir / filename
        if not schema.exists():
            continue
        sql = schema.read_text(encoding="utf-8")
        statements = [item.strip() for item in sql.split(";") if item.strip()]
        with engine.begin() as connection:
            for statement in statements:
                connection.execute(text(statement))
        logger.info("schema applied from %s (%s statements)", schema, len(statements))


if __name__ == "__main__":
    apply_schema()
    print("Schema applied.")
