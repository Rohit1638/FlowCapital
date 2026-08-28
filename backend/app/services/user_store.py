from __future__ import annotations

import json
import secrets
import uuid
from dataclasses import asdict, dataclass
from pathlib import Path

import bcrypt

from app.core.auth import DEMO_LENDER_ID, DEMO_MANUFACTURER_ID

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
USERS_FILE = DATA_DIR / "users.json"


@dataclass
class StoredUser:
    id: str
    username: str
    email: str
    password_hash: str
    role: str
    company_name: str
    full_name: str
    designation: str


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


class UserStore:
    def __init__(self) -> None:
        self._users: dict[str, StoredUser] = {}
        self._sessions: dict[str, str] = {}
        self._load()
        self._seed_demo_users()

    def _load(self) -> None:
        if not USERS_FILE.exists():
            return
        try:
            raw = json.loads(USERS_FILE.read_text(encoding="utf-8"))
            for item in raw.get("users", []):
                user = StoredUser(**item)
                self._users[user.username.lower()] = user
        except Exception:
            pass

    def _persist(self) -> None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        payload = {"users": [asdict(u) for u in self._users.values()]}
        USERS_FILE.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _internal_email(self, username: str) -> str:
        safe = username.lower().replace(" ", "_")
        return f"{safe}@flowcapital.internal"

    def _seed_demo_users(self) -> None:
        seeds = [
            {
                "username": "manufacturer_demo",
                "password": "FlowDemo@123",
                "role": "MANUFACTURER",
                "company_name": "VoltRide Mobility Pvt. Ltd.",
                "full_name": "Demo Manufacturer",
                "designation": "Operations Lead",
                "id": DEMO_MANUFACTURER_ID,
            },
            {
                "username": "lender_demo",
                "password": "FlowDemo@123",
                "role": "LENDER",
                "company_name": "Apex Capital Partners",
                "full_name": "Demo Lender",
                "designation": "Underwriter",
                "id": DEMO_LENDER_ID,
            },
        ]
        changed = False
        for seed in seeds:
            key = seed["username"].lower()
            if key not in self._users:
                self._users[key] = StoredUser(
                    id=seed["id"],
                    username=seed["username"],
                    email=self._internal_email(seed["username"]),
                    password_hash=_hash_password(seed["password"]),
                    role=seed["role"],
                    company_name=seed["company_name"],
                    full_name=seed["full_name"],
                    designation=seed["designation"],
                )
                changed = True
        if changed:
            self._persist()

    def register(self, username: str, password: str, role: str, company_name: str | None = None) -> StoredUser:
        key = username.strip().lower()
        if not key or len(password) < 8:
            raise ValueError("Invalid username or password")
        if key in self._users:
            raise ValueError("Username already exists")
        if role not in ("MANUFACTURER", "LENDER"):
            raise ValueError("Invalid role")
        user = StoredUser(
            id=str(uuid.uuid4()),
            username=username.strip(),
            email=self._internal_email(username),
            password_hash=_hash_password(password),
            role=role,
            company_name=company_name or username.strip(),
            full_name=username.strip().replace("_", " ").title(),
            designation="Member",
        )
        self._users[key] = user
        self._persist()
        return user

    def authenticate(self, username: str, password: str) -> StoredUser | None:
        user = self._users.get(username.strip().lower())
        if not user:
            return None
        if not _verify_password(password, user.password_hash):
            return None
        return user

    def create_session(self, user: StoredUser) -> str:
        token = f"fc-{secrets.token_urlsafe(24)}"
        self._sessions[token] = user.id
        return token

    def get_by_token(self, token: str) -> StoredUser | None:
        user_id = self._sessions.get(token)
        if not user_id:
            return None
        for user in self._users.values():
            if user.id == user_id:
                return user
        return None

    def profile_dict(self, user: StoredUser) -> dict:
        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "organization_name": user.company_name,
            "role": user.role,
            "company_name": user.company_name,
            "designation": user.designation,
            "username": user.username,
        }


user_store = UserStore()
