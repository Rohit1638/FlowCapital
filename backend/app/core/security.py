SENSITIVE_KEYS = {"password", "secret", "service_role", "database_url", "connection_string"}


def redact(payload: dict) -> dict:
    cleaned: dict = {}
    for key, value in payload.items():
        if any(token in key.lower() for token in SENSITIVE_KEYS):
            cleaned[key] = "[redacted]"
        else:
            cleaned[key] = value
    return cleaned
