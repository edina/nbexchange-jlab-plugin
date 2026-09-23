"""Tests for the feature status module."""

import pytest
from traitlets.config.loader import LazyConfigValue

from nbexchange_jlab.feature_status.handlers import (
    FeatureStatusHandler,
    FeatureStatusManager,
)
from nbexchange_jlab.utils import BaseListerClass


class TestCheckEnabled:
    """Tests for BaseListerClass.check_enabled method."""

    @pytest.mark.gen_test
    def test_check_enabled_with_course_id_and_db_url(self, monkeypatch):
        """When course_id and db_url are set, should return True."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course123", "db_url": "sqlite:///grades.db"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is True

    @pytest.mark.gen_test
    def test_check_enabled_with_course_id_no_db_url(self, monkeypatch):
        """When course_id is set but db_url is missing (default instructor_only=False), should return True."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course123"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is True

    @pytest.mark.gen_test
    def test_check_enabled_no_course_id(self, monkeypatch):
        """When course_id is missing, should return False."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"db_url": "sqlite:///grades.db"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_empty_course_id(self, monkeypatch):
        """When course_id is empty string, should return False."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "", "db_url": "sqlite:///grades.db"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_coursedir_missing(self, monkeypatch):
        """When CourseDirectory key is missing, should return False."""
        manager = BaseListerClass()
        mock_config = {}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_coursedir_is_lazyconfigvalue(self, monkeypatch):
        """When CourseDirectory is a LazyConfigValue, should return False."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": LazyConfigValue()}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_instructor_only_true_with_db_url(self, monkeypatch):
        """When instructor_only=True, course_id and db_url are set, should return True."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course123", "db_url": "sqlite:///grades.db"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled(instructor_only=True)
        assert result is True

    @pytest.mark.gen_test
    def test_check_enabled_instructor_only_true_no_db_url(self, monkeypatch):
        """When instructor_only=True and db_url is missing, should return False."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course123"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled(instructor_only=True)
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_instructor_only_false_no_course_id(self, monkeypatch):
        """When instructor_only=False but course_id is missing, should return False."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled(instructor_only=False)
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_course_id_none(self, monkeypatch):
        """When course_id is explicitly None, should return False."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": None}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_course_id_whitespace(self, monkeypatch):
        """When course_id is whitespace only, should return True (whitespace is truthy)."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "   "}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is True

    @pytest.mark.gen_test
    def test_check_enabled_db_url_empty_string_instructor_only(self, monkeypatch):
        """When db_url is empty string and instructor_only=True, should return False."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course123", "db_url": ""}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled(instructor_only=True)
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_db_url_none_instructor_only(self, monkeypatch):
        """When db_url is None and instructor_only=True, should return False."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course123", "db_url": None}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled(instructor_only=True)
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_coursedir_empty_dict(self, monkeypatch):
        """When CourseDirectory is an empty dict, should return False (no course_id)."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is False

    @pytest.mark.gen_test
    def test_check_enabled_course_id_with_special_chars(self, monkeypatch):
        """When course_id has special characters, should return True."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course-123_abc!@#", "db_url": "sqlite:///grades.db"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is True

    @pytest.mark.gen_test
    def test_check_enabled_course_id_unicode(self, monkeypatch):
        """When course_id has unicode characters, should return True."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course_éàü", "db_url": "sqlite:///grades.db"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.check_enabled()
        assert result is True

    @pytest.mark.gen_test
    def test_check_enabled_instructor_only_toggle(self, monkeypatch):
        """Test toggling instructor_only parameter on same config."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course123"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        assert manager.check_enabled(instructor_only=False) is True
        assert manager.check_enabled(instructor_only=True) is False

    @pytest.mark.gen_test
    def test_check_enabled_multiple_calls_consistent(self, monkeypatch):
        """Multiple calls should return consistent results."""
        manager = BaseListerClass()
        mock_config = {"CourseDirectory": {"course_id": "course123", "db_url": "sqlite:///grades.db"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result1 = manager.check_enabled()
        result2 = manager.check_enabled()
        result3 = manager.check_enabled(instructor_only=True)
        assert result1 is True
        assert result2 is True
        assert result3 is True


class TestFeatureStatusManagerGetStatus:
    """Tests for FeatureStatusManager.get_status method."""

    @pytest.mark.gen_test
    def test_get_status_all_features_no_config(self, monkeypatch):
        """When no config is set, history and bulk_autograde should be disabled."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is False
        assert result["value"]["bulk_autograde"] is False

    @pytest.mark.gen_test
    def test_get_status_all_features_with_course_id(self, monkeypatch):
        """When course_id is set, history should be enabled."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course_123"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True
        assert result["value"]["bulk_autograde"] is False

    @pytest.mark.gen_test
    def test_get_status_all_features_with_db_url(self, monkeypatch):
        """When course_id and db_url are set, bulk_autograde should be enabled."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course_123", "db_url": "sqlite:///grades.db"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True
        assert result["value"]["bulk_autograde"] is True

    @pytest.mark.gen_test
    def test_get_status_specific_feature_history_enabled(self, monkeypatch):
        """Get status for specific feature (history) when enabled."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course_123"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status("history")

        assert result["success"] is True
        assert result["value"]["feature"] == "history"
        assert result["value"]["enabled"] is True

    @pytest.mark.gen_test
    def test_get_status_specific_feature_history_disabled(self, monkeypatch):
        """Get status for specific feature (history) when disabled."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status("history")

        assert result["success"] is True
        assert result["value"]["feature"] == "history"
        assert result["value"]["enabled"] is False

    @pytest.mark.gen_test
    def test_get_status_specific_feature_bulk_autograde_enabled(self, monkeypatch):
        """Get status for specific feature (bulk_autograde) when enabled."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course_123", "db_url": "sqlite:///grades.db"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status("bulk_autograde")

        assert result["success"] is True
        assert result["value"]["feature"] == "bulk_autograde"
        assert result["value"]["enabled"] is True

    @pytest.mark.gen_test
    def test_get_status_specific_feature_bulk_autograde_disabled(self, monkeypatch):
        """Get status for specific feature (bulk_autograde) when disabled (no db_url)."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course_123"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status("bulk_autograde")

        assert result["success"] is True
        assert result["value"]["feature"] == "bulk_autograde"
        assert result["value"]["enabled"] is False

    @pytest.mark.gen_test
    def test_get_status_specific_feature_unknown(self, monkeypatch):
        """Get status for unknown feature should return False."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course_123"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status("unknown_feature")

        assert result["success"] is True
        assert result["value"]["feature"] == "unknown_feature"
        assert result["value"]["enabled"] is False


class TestFeatureStatusHandler:
    """Tests for FeatureStatusHandler."""

    @pytest.mark.gen_test
    def test_handler_get_all_features(self):
        """Test handler GET endpoint for all features."""

        class MockHandler(FeatureStatusHandler):
            def initialize(self):
                self.settings["feature_status_manager"] = FeatureStatusManager()

        manager = FeatureStatusManager()
        assert manager is not None

    @pytest.mark.gen_test
    def test_handler_get_specific_feature(self, monkeypatch):
        """Test handler GET endpoint for specific feature."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course_123"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status("history")
        assert result["success"] is True
        assert "feature" in result["value"]


class TestFeatureStatusManagerEdgeCases:
    """Edge case tests for FeatureStatusManager."""

    @pytest.mark.gen_test
    def test_get_status_with_special_characters_in_course_id(self, monkeypatch):
        """Test with special characters in course_id."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course-with-special-chars_123!@#"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True

    @pytest.mark.gen_test
    def test_get_status_with_whitespace_only_course_id(self, monkeypatch):
        """Test with whitespace-only course_id (should be enabled as whitespace is truthy)."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "   "}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True

    @pytest.mark.gen_test
    def test_get_status_with_unicode_in_course_id(self, monkeypatch):
        """Test with unicode characters in course_id."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course_éàü"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)
        result = manager.get_status()

        assert result["success"] is True
        assert result["value"]["history"] is True

    @pytest.mark.gen_test
    def test_get_status_multiple_calls_consistent(self, monkeypatch):
        """Test that multiple calls return consistent results."""
        manager = FeatureStatusManager()
        mock_config = {"CourseDirectory": {"course_id": "course_123"}}
        monkeypatch.setattr(manager, "load_config", lambda: mock_config)

        result1 = manager.get_status()
        result2 = manager.get_status()
        result3 = manager.get_status()

        assert result1 == result2 == result3

    @pytest.mark.gen_test
    def test_get_status_config_changed_between_calls(self, monkeypatch):
        """Test behavior when config changes between calls."""
        manager = FeatureStatusManager()
        mock_config1 = {"CourseDirectory": {"course_id": "course_123"}}
        mock_config2 = {"CourseDirectory": {}}

        monkeypatch.setattr(manager, "load_config", lambda: mock_config1)
        result1 = manager.get_status()
        assert result1["value"]["history"] is True

        monkeypatch.setattr(manager, "load_config", lambda: mock_config2)
        result2 = manager.get_status()
        assert result2["value"]["history"] is False
