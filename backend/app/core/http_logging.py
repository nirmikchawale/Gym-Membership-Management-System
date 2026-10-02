import json
import logging

logger = logging.getLogger("gridstone.http")


def http_log_payload(
    *,
    request_id: str,
    method: str,
    route: str,
    status_code: int,
    duration_ms: float,
    error_type: str | None = None,
) -> str:
    payload: dict[str, str | int | float] = {
        "duration_ms": round(duration_ms, 2),
        "event": "http_request",
        "method": method,
        "request_id": request_id,
        "route": route,
        "status_code": status_code,
    }
    if error_type is not None:
        payload["error_type"] = error_type
    return json.dumps(payload, separators=(",", ":"), sort_keys=True)


def log_http_request(
    *,
    request_id: str,
    method: str,
    route: str,
    status_code: int,
    duration_ms: float,
    error_type: str | None = None,
) -> None:
    message = http_log_payload(
        request_id=request_id,
        method=method,
        route=route,
        status_code=status_code,
        duration_ms=duration_ms,
        error_type=error_type,
    )
    if status_code >= 500:
        logger.error(message)
    else:
        logger.info(message)
