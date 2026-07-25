"""Shared Anthropic Claude API client utilities."""

import json
import logging
from typing import Any, Dict

from anthropic import Anthropic

from config import settings

logger = logging.getLogger(__name__)


def get_anthropic_model() -> str:
    """Return configured Anthropic model identifier."""
    return settings.anthropic_model


def call_anthropic_api(prompt: str, api_key: str, model: str | None = None) -> Any:
    """
    Call Anthropic Claude API with the formatted prompt.

    Args:
        prompt: Formatted prompt string
        api_key: Anthropic API key
        model: Model identifier (defaults to settings.anthropic_model)

    Returns:
        API response object

    Raises:
        ValueError: If API key is missing
        Exception: If API call fails
    """
    if not api_key:
        raise ValueError("Anthropic API key is required")

    model_id = model or get_anthropic_model()

    try:
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model_id,
            max_tokens=4096,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            timeout=60.0,
        )
        return response
    except Exception as e:
        logger.error(f"Anthropic API call failed: {e}")
        raise


def extract_text_from_response(response: Any) -> str:
    """Extract concatenated text content from an Anthropic response."""
    if not hasattr(response, "content") or not response.content:
        raise ValueError(
            "Invalid response format from LLM - no content attribute or content is empty"
        )

    text_content = ""
    for content_block in response.content:
        if hasattr(content_block, "text"):
            text_content += content_block.text
        elif isinstance(content_block, dict) and "text" in content_block:
            text_content += content_block["text"]

    if not text_content:
        raise ValueError("Empty response from LLM")

    return text_content


def extract_json_from_response(response: Any) -> Dict[str, Any]:
    """
    Extract and parse JSON from an Anthropic response, stripping markdown fences.
    """
    text_content = extract_text_from_response(response).strip()
    original_stripped = text_content

    if "```json" in text_content:
        start = text_content.find("```json") + 7
        end = text_content.find("```", start)
        if end != -1:
            extracted = text_content[start:end].strip()
            if extracted:
                text_content = extracted
            else:
                text_content = original_stripped
    elif "```" in text_content:
        start = text_content.find("```") + 3
        end = text_content.find("```", start)
        if end != -1:
            extracted = text_content[start:end].strip()
            if extracted:
                text_content = extracted
            else:
                text_content = original_stripped

    if not text_content:
        raise ValueError(
            "Empty text content after extraction - LLM response may be malformed"
        )

    try:
        parsed = json.loads(text_content)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from LLM response: {e}")
        raise ValueError(f"Could not parse JSON response from LLM: {e}") from e

    if not isinstance(parsed, dict):
        raise ValueError("LLM response must be a JSON object")

    return parsed
