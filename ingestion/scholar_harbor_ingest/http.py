from __future__ import annotations

import json
import logging
import time
import urllib.error
import urllib.request
from collections.abc import Callable
from typing import Any, TypeVar

T = TypeVar("T")
LOGGER = logging.getLogger(__name__)
USER_AGENT = "ScholarHarbor/0.1 (+https://github.com/RyanChang1412/Scholar-Harbor)"


class SourceUnavailable(RuntimeError):
    pass


def with_retries(operation: Callable[[], T], *, source: str, attempts: int, backoff: float) -> T:
    for attempt in range(1, attempts + 1):
        try:
            return operation()
        except (OSError, TimeoutError, urllib.error.URLError, ValueError) as error:
            if attempt == attempts:
                raise SourceUnavailable(f"{source} failed after {attempts} attempts: {error}") from error
            delay = backoff * (2 ** (attempt - 1))
            LOGGER.warning("source_retry", extra={"source": source, "attempt": attempt, "delay_seconds": delay})
            time.sleep(delay)
    raise AssertionError("unreachable")


def fetch_bytes(url: str, *, timeout: float) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json, application/atom+xml"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def fetch_json(url: str, *, timeout: float) -> Any:
    return json.loads(fetch_bytes(url, timeout=timeout))
