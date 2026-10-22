"""RSA key pair for API tests when ENVIRONMENT=test."""

import time

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

_PRIVATE_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)

TEST_PUBLIC_KEY_PEM = (
    _PRIVATE_KEY.public_key()
    .public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )
    .decode("utf-8")
)


def make_auth_token(clerk_user_id: str, email: str) -> str:
    """Sign a Clerk-like RS256 token with the test private key."""
    now = int(time.time())
    payload = {
        "sub": clerk_user_id,
        "email": email,
        "iat": now,
        "exp": now + 3600,
    }
    token = jwt.encode(payload, _PRIVATE_KEY, algorithm="RS256")
    if isinstance(token, bytes):
        return token.decode("utf-8")
    return token
