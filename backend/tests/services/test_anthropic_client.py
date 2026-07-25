"""Tests for shared Anthropic client utilities."""

import pytest
from unittest.mock import MagicMock, patch

from services.anthropic_client import (
    call_anthropic_api,
    extract_json_from_response,
    extract_text_from_response,
)


class TestCallAnthropicAPI:
    """Tests for Anthropic API calling function."""

    @patch("services.anthropic_client.Anthropic")
    def test_call_anthropic_api_disables_thinking(self, mock_anthropic_class):
        """Structured JSON calls should disable adaptive thinking on Sonnet 5."""
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client
        mock_response = MagicMock()
        mock_response.content = [MagicMock(type="text", text='{"suggestions": []}')]
        mock_client.messages.create.return_value = mock_response

        call_anthropic_api("Test prompt", "test-key", "claude-sonnet-5")

        mock_client.messages.create.assert_called_once()
        call_kwargs = mock_client.messages.create.call_args.kwargs
        assert call_kwargs["thinking"] == {"type": "disabled"}

    @patch("services.anthropic_client.Anthropic")
    def test_call_anthropic_api_success(self, mock_anthropic_class):
        """Test successful API call returns response."""
        mock_client = MagicMock()
        mock_anthropic_class.return_value = mock_client
        mock_response = MagicMock()
        mock_response.content = [MagicMock(type="text", text='{"suggestions": []}')]
        mock_client.messages.create.return_value = mock_response

        result = call_anthropic_api("Test prompt", "test-key")

        assert result is mock_response

    @patch("services.anthropic_client.Anthropic")
    def test_call_anthropic_api_missing_key(self, mock_anthropic_class):
        """Test API call with missing API key."""
        with pytest.raises(ValueError, match="API key"):
            call_anthropic_api("test prompt", "")


class TestExtractTextFromResponse:
    """Tests for response text extraction."""

    def test_extract_text_skips_thinking_blocks(self):
        """Thinking-only blocks should not count as response text."""
        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(type="thinking", text=None, thinking="internal reasoning"),
        ]
        mock_response.stop_reason = "end_turn"

        with pytest.raises(ValueError, match="Empty response from LLM"):
            extract_text_from_response(mock_response)

    def test_extract_text_from_mixed_thinking_and_text_blocks(self):
        """Text blocks should be extracted even when thinking blocks are present."""
        mock_response = MagicMock()
        thinking_block = MagicMock(type="thinking", text=None)
        thinking_block.thinking = "planning meals"
        text_block = MagicMock(type="text", text='{"suggestions": []}')
        mock_response.content = [thinking_block, text_block]

        result = extract_text_from_response(mock_response)

        assert result == '{"suggestions": []}'

    def test_extract_text_reports_max_tokens_stop_reason(self):
        """Empty text with max_tokens stop reason should mention token limit."""
        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(type="thinking", text=None, thinking=""),
        ]
        mock_response.stop_reason = "max_tokens"

        with pytest.raises(ValueError, match="token limit"):
            extract_text_from_response(mock_response)


class TestExtractJsonFromResponse:
    """Tests for JSON extraction from Anthropic responses."""

    def test_extract_json_from_text_block(self):
        """Test parsing JSON from a standard text block."""
        mock_response = MagicMock()
        mock_response.content = [
            MagicMock(type="text", text='{"suggestions": [{"meal_name": "Pasta"}]}')
        ]

        result = extract_json_from_response(mock_response)

        assert result["suggestions"][0]["meal_name"] == "Pasta"
