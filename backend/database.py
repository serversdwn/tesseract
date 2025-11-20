import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DB_PATH = BASE_DIR / "data" / "data.db"

# Allow overriding the DB path (useful in Docker where the working directory may differ)
db_env = os.getenv("SQLALCHEMY_DATABASE_URL", "")
if db_env:
    # If provided, ensure it is a valid sqlite URL or file path
    if db_env.startswith("sqlite:"):
        SQLALCHEMY_DATABASE_URL = db_env
    else:
        resolved = Path(db_env)
        resolved.parent.mkdir(parents=True, exist_ok=True)
        SQLALCHEMY_DATABASE_URL = f"sqlite:///{resolved}"
else:
    DEFAULT_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    SQLALCHEMY_DATABASE_URL = f"sqlite:///{DEFAULT_DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
