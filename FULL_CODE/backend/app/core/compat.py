"""Cross-version Python compatibility helpers (Python 3.9 through 3.13+)."""

from datetime import timezone

try:
    from datetime import UTC
except ImportError:
    UTC = timezone.utc  # noqa: UP017 - Python 3.9 compatibility shim

__all__ = ["UTC"]
