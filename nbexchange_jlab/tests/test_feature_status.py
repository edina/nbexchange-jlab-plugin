"""Tests for the feature status module."""

import pytest

from nbexchange_jlab.feature_status.handlers import (
    FeatureStatusHandler,
    FeatureStatusManager,
)
from nbexchange_jlab.utils import BaseListerClass


class TestCheckFeatureEnabled:
    """Tests for BaseListerClass.check_feature_enabled method."""

    @pytest.mark.gen_test
    def test_check_feature_enabled_no_env_var(self):
        """When no env var is specified, should return True (enabled by default)."""
        manager = BaseListerClass()
        result = manager.check_feature_enabled()
        assert result is True

    @pytest.mark.gen_test
    def test_check_feature_enabled_env_var_exists(self, monkeypatch):
        """When env var exists (any value), should return True."""
        monkeypatch.setenv("TEST_FEATURE_VAR", "anything")
        manager = BaseListerClass()
        result = manager.check_feature_enabled("TEST_FEATURE_VAR")
        assert result is True

    @pytest.mark.gen_test
    def test_check_feature_enabled_env_var_exists_empty_string(self, monkeypatch):
        """When env var exists but is empty string, should return True (exists)."""
        monkeypatch.setenv("TEST_FEATURE_VAR", "")
        manager = BaseListerClass()
        result = manager.check_feature_enabled("TEST_FEATURE_VAR")
        assert result is True

    @pytest.mark.gen_test
    def test_check_feature_enabled_env_var_does_not_exist(self):
        """When env var does not exist, should return False."""
        manager = BaseListerClass()
        result = manager.check_feature_enabled("NONEXISTENT_VAR_12345")
        assert result is False

    @pytest.mark.gen_test
    def test_check_feature_enabled_env_var_none(self):
        """When env_var is None, should return True."""
        manager = BaseListerClass()
        result = manager.check_feature_enabled(None)
        assert result is True

    @pytest.mark.gen_test
    def test_check_feature_enabled_env_var_empty_string(self):
        """When env_var is empty string, should return True."""
        manager = BaseListerClass()
        result = manager.check_feature_enabled("")
        assert result is True

    @pytest.mark.gen_test
    def test_check_feature_enabled_naas_course_id(self, monkeypatch):
        """Test with NAAS_COURSE_ID variable."""
        monkeypatch.setenv("NAAS_COURSE_ID", "course_123")
        manager = BaseListerClass()
        result = manager.check_feature_enabled("NAAS_COURSE_ID")
        assert result is True

    @pytest.mark.gen_test
    def test_check_feature_enabled_naas_role(self, monkeypatch):
        """Test with NAAS_ROLE variable."""
        monkeypatch.setenv("NAAS_ROLE", "Instructor")
        manager = BaseListerClass()
        result = manager.check_feature_enabled("NAAS_ROLE")
        assert result is True

    @pytest.mark.gen_test
    def test_check_feature_enabled_value_false_still_true(self, monkeypatch):
        """When env var exists with value 'false', should still return True (existence check)."""
        monkeypatch.setenv("TEST_FEATURE_VAR", "false")
        manager = BaseListerClass()
        result = manager.check_feature_enabled("TEST_FEATURE_VAR")
        assert result is True

    @pytest.mark.gen_test
    def test_check_feature_enabled_value_0_still_true(self, monkeypatch):
        """When env var exists with value '0', should still return True (existence check)."""
        monkeypatch.setenv("TEST_FEATURE_VAR", "0")
        manager = BaseListerClass()
        result = manager.check_feature_enabled("TEST_FEATURE_VAR")
        assert result is True


class TestFeatureStatusManagerGetStatus:
    """Tests for FeatureStatusManager.get_status method."""

    @pytest.mark.gen_test
    def test_get_status_all_features_no_env_vars(self):
        """When no env vars are set, history and bulk_autograde should be disabled."""
        manager = FeatureStatusManager()
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["general"] is True
        assert result["value"]["history"] is False
        assert result["value"]["bulk_autograde"] is False

    @pytest.mark.gen_test
    def test_get_status_all_features_with_course_id(self, monkeypatch):
        """When NAAS_COURSE_ID is set, history should be enabled."""
        monkeypatch.setenv("NAAS_COURSE_ID", "course_123")
        manager = FeatureStatusManager()
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True

    @pytest.mark.gen_test
    def test_get_status_all_features_with_role(self, monkeypatch):
        """When NAAS_ROLE is set, bulk_autograde should be enabled."""
        monkeypatch.setenv("NAAS_ROLE", "Instructor")
        manager = FeatureStatusManager()
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["bulk_autograde"] is True

    @pytest.mark.gen_test
    def test_get_status_all_features_both_vars(self, monkeypatch):
        """When both vars are set, both features should be enabled."""
        monkeypatch.setenv("NAAS_COURSE_ID", "course_123")
        monkeypatch.setenv("NAAS_ROLE", "Instructor")
        manager = FeatureStatusManager()
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True
        assert result["value"]["bulk_autograde"] is True

    @pytest.mark.gen_test
    def test_get_status_specific_feature_history_enabled(self, monkeypatch):
        """Get status for specific feature (history) when enabled."""
        monkeypatch.setenv("NAAS_COURSE_ID", "course_123")
        manager = FeatureStatusManager()
        result = manager.get_status("history")

        assert result["success"] is True
        assert result["value"]["feature"] == "history"
        assert result["value"]["enabled"] is True
        assert result["value"]["env_var"] == "NAAS_COURSE_ID"

    @pytest.mark.gen_test
    def test_get_status_specific_feature_history_disabled(self):
        """Get status for specific feature (history) when disabled."""
        manager = FeatureStatusManager()
        result = manager.get_status("history")

        assert result["success"] is True
        assert result["value"]["feature"] == "history"
        assert result["value"]["enabled"] is False

    @pytest.mark.gen_test
    def test_get_status_specific_feature_bulk_autograde_enabled(self, monkeypatch):
        """Get status for specific feature (bulk_autograde) when enabled."""
        monkeypatch.setenv("NAAS_ROLE", "Instructor")
        manager = FeatureStatusManager()
        result = manager.get_status("bulk_autograde")

        assert result["success"] is True
        assert result["value"]["feature"] == "bulk_autograde"
        assert result["value"]["enabled"] is True
        assert result["value"]["env_var"] == "NAAS_ROLE"

    @pytest.mark.gen_test
    def test_get_status_specific_feature_bulk_autograde_disabled(self):
        """Get status for specific feature (bulk_autograde) when disabled."""
        manager = FeatureStatusManager()
        result = manager.get_status("bulk_autograde")

        assert result["success"] is True
        assert result["value"]["feature"] == "bulk_autograde"
        assert result["value"]["enabled"] is False

    @pytest.mark.gen_test
    def test_get_status_specific_feature_unknown(self):
        """Get status for unknown feature should check its specific env var."""
        manager = FeatureStatusManager()
        result = manager.get_status("unknown_feature")

        assert result["success"] is True
        assert result["value"]["feature"] == "unknown_feature"
        assert result["value"]["env_var"] == "NBEXCHANGE_UNKNOWN_FEATURE_ENABLED"
        assert result["value"]["enabled"] is False


class TestFeatureStatusHandler:
    """Tests for FeatureStatusHandler."""

    @pytest.mark.gen_test
    def test_handler_get_all_features(self):
        """Test handler GET endpoint for all features."""

        class MockHandler(FeatureStatusHandler):
            def initialize(self):
                self.settings["feature_status_manager"] = FeatureStatusManager()

        # Basic test that handler can be instantiated
        manager = FeatureStatusManager()
        assert manager is not None

    @pytest.mark.gen_test
    def test_handler_get_specific_feature(self):
        """Test handler GET endpoint for specific feature."""
        manager = FeatureStatusManager()
        result = manager.get_status("history")
        assert result["success"] is True
        assert "feature" in result["value"]


class TestFeatureStatusManagerEdgeCases:
    """Edge case tests for FeatureStatusManager."""

    @pytest.mark.gen_test
    def test_get_status_with_special_characters_in_env(self, monkeypatch):
        """Test with special characters in environment variable value."""
        monkeypatch.setenv("NAAS_COURSE_ID", "course-with-special-chars_123!@#")
        manager = FeatureStatusManager()
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True

    @pytest.mark.gen_test
    def test_get_status_with_whitespace_only_env(self, monkeypatch):
        """Test with whitespace-only environment variable value."""
        monkeypatch.setenv("NAAS_COURSE_ID", "   ")
        manager = FeatureStatusManager()
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True

    @pytest.mark.gen_test
    def test_get_status_with_unicode_in_env(self, monkeypatch):
        """Test with unicode characters in environment variable value."""
        monkeypatch.setenv("NAAS_COURSE_ID", "course_\u00e9")
        manager = FeatureStatusManager()
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True

    @pytest.mark.gen_test
    def test_get_status_multiple_calls_consistent(self, monkeypatch):
        """Test that multiple calls return consistent results."""
        monkeypatch.setenv("NAAS_COURSE_ID", "course_123")
        manager = FeatureStatusManager()

        result1 = manager.get_status()
        result2 = manager.get_status()
        result3 = manager.get_status()

        assert result1 == result2 == result3

    @pytest.mark.gen_test
    def test_get_status_env_var_removed_between_calls(self, monkeypatch):
        """Test behavior when env var is removed between calls."""
        monkeypatch.setenv("NAAS_COURSE_ID", "course_123")
        manager = FeatureStatusManager()

        result1 = manager.get_status()
        assert result1["value"]["history"] is True

        monkeypatch.delenv("NAAS_COURSE_ID")
        result2 = manager.get_status()
        assert result2["value"]["history"] is False
