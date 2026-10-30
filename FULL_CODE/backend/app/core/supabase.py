"""A thin PostgREST and Auth-admin client for Supabase. Server only: it uses the service_role key, which must never reach a browser."""

import logging
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import settings

log = logging.getLogger("lifesure.supabase")
TIMEOUT = httpx.Timeout(15.0)
PAGE = 1000


class SupabaseError(Exception):
    """A Supabase call failed. The message is for logs; callers show their own safe text."""

    def __init__(self, message: str, missing_table: bool = False, duplicate: bool = False):
        super().__init__(message)
        self.missing_table = missing_table
        self.duplicate = duplicate


def configured() -> bool:
    return bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)


class SupabaseClient:
    def __init__(self, url: str, key: str, client: Optional[httpx.Client] = None):
        self.url = url.rstrip("/")
        self.headers = {"apikey": key, "Authorization": f"Bearer {key}"}
        self.http = client or httpx.Client(timeout=TIMEOUT)

    def _request(self, method: str, path: str, *, params=None, json=None, prefer: Optional[str] = None) -> Any:
        headers = {**self.headers, "Content-Type": "application/json"}
        if prefer:
            headers["Prefer"] = prefer
        try:
            resp = self.http.request(method, f"{self.url}{path}", params=params, json=json, headers=headers)
        except httpx.HTTPError as exc:
            raise SupabaseError(f"{method} {path} could not be reached: {type(exc).__name__}") from exc
        if resp.status_code >= 400:
            raise SupabaseError(
                f"{method} {path} failed with {resp.status_code}: {resp.text[:300]}",
                missing_table="PGRST205" in resp.text,
                duplicate="23505" in resp.text,
            )
        return resp.json() if resp.content else None

    # ---- tables (PostgREST) ----
    def select(self, table: str, params: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        return self._request("GET", f"/rest/v1/{table}", params={"select": "*", **(params or {})}) or []

    def select_all(self, table: str, params: Optional[Dict[str, str]] = None) -> List[Dict[str, Any]]:
        """Every row, fetched a page at a time (the API caps one response)."""
        rows: List[Dict[str, Any]] = []
        while True:
            page = self.select(table, {**(params or {}), "limit": str(PAGE), "offset": str(len(rows))})
            rows += page
            if len(page) < PAGE:
                return rows

    def insert(self, table: str, rows: Any) -> List[Dict[str, Any]]:
        return self._request("POST", f"/rest/v1/{table}", json=rows, prefer="return=representation") or []

    def upsert(self, table: str, rows: Any, on_conflict: str) -> List[Dict[str, Any]]:
        return (
            self._request(
                "POST",
                f"/rest/v1/{table}",
                params={"on_conflict": on_conflict},
                json=rows,
                prefer="resolution=merge-duplicates,return=representation",
            )
            or []
        )

    def update(self, table: str, match: Dict[str, str], values: Dict[str, Any]) -> List[Dict[str, Any]]:
        return self._request("PATCH", f"/rest/v1/{table}", params=match, json=values, prefer="return=representation") or []

    def delete(self, table: str, match: Dict[str, str]) -> List[Dict[str, Any]]:
        return self._request("DELETE", f"/rest/v1/{table}", params=match, prefer="return=representation") or []

    # ---- Auth admin ----
    def list_users(self) -> List[Dict[str, Any]]:
        users: List[Dict[str, Any]] = []
        page = 1
        while True:
            data = self._request("GET", "/auth/v1/admin/users", params={"page": str(page), "per_page": "200"}) or {}
            batch = data.get("users", [])
            users += batch
            if len(batch) < 200:
                return users
            page += 1

    def create_user(self, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("POST", "/auth/v1/admin/users", json=body)

    def update_user(self, user_id: str, body: Dict[str, Any]) -> Dict[str, Any]:
        return self._request("PUT", f"/auth/v1/admin/users/{user_id}", json=body)


_client: Optional[SupabaseClient] = None


def get_client() -> SupabaseClient:
    global _client
    if _client is None:
        if not configured():
            raise SupabaseError("SUPABASE_URL and SUPABASE_KEY are not set")
        _client = SupabaseClient(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _client
