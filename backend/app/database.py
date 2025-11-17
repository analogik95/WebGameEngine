"""
Database configuration and session management
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from typing import AsyncGenerator
import os

# Database URL (can be configured via environment variable)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./the_gamer_rpg.db")

# For async postgres: postgresql+asyncpg://user:password@localhost/dbname
# For sync sqlite (development): sqlite:///./the_gamer_rpg.db

# Synchronous engine (for migrations and simple ops)
engine = create_engine(
    DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://"),
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=True  # Log SQL queries (disable in production)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency for FastAPI
def get_db() -> Session:
    """Get database session for synchronous operations"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Async engine (for high-performance async operations)
if "postgresql" in DATABASE_URL and "asyncpg" not in DATABASE_URL:
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
else:
    ASYNC_DATABASE_URL = DATABASE_URL

async_engine = create_async_engine(
    ASYNC_DATABASE_URL if "postgresql" in DATABASE_URL else "sqlite+aiosqlite:///./the_gamer_rpg.db",
    echo=True
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session for async operations"""
    async with AsyncSessionLocal() as session:
        yield session


def init_db():
    """Initialize database tables"""
    from app.models import Base
    Base.metadata.create_all(bind=engine)
    print("Database initialized!")
