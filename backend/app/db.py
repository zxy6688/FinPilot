import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")
url = os.getenv("DATABASE_URL", "sqlite:///data/finpilot.db")
if url.startswith("sqlite:///") and not Path(url[10:]).is_absolute():
    url = "sqlite:///" + (ROOT / url[10:]).as_posix()
engine = create_engine(
    url,
    connect_args=(
        {"check_same_thread": False, "timeout": 20} if url.startswith("sqlite") else {}
    ),
)
if url.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def sqlite_pragmas(connection, _):
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")


SessionLocal = sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    with SessionLocal() as db:
        yield db
