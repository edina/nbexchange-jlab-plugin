"""Tornado handlers for nbexchange feature status web service."""

import json

from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.utils import url_path_join
from tornado import web

from nbexchange_jlab.utils import BaseListerClass


class FeatureStatusManager(BaseListerClass):
    """Manager for checking feature status based on configuration validity."""

    SUPPORTED_METHODS = ("GET", "HEAD")

    def get_status(self, feature_name: str = None) -> dict:
        """Get the status of a feature or all features.

        Checks configuration validity (course_id, db_url) to determine if features are available.

        Args:
            feature_name: Optional specific feature to check. If None, returns all features.

        Returns:
            Dict with feature status information.
        """
        if feature_name:
            if feature_name == "history":
                enabled = self.check_enabled(instructor_only=False)
            elif feature_name == "bulk_autograde":
                enabled = self.check_enabled(instructor_only=True)
            else:
                enabled = False
            return {"success": True, "value": {"feature": feature_name, "enabled": enabled}}
        else:
            features = {
                "history": self.check_enabled(instructor_only=False),
                "bulk_autograde": self.check_enabled(instructor_only=True),
            }
            return {"success": True, "value": features}


class BaseFeatureStatusHandler(JupyterHandler):
    """Base handler for feature status endpoints."""

    @property
    def manager(self):
        return self.settings["feature_status_manager"]


class FeatureStatusHandler(BaseFeatureStatusHandler):
    """Handler for getting feature status."""

    @web.authenticated
    def get(self):
        feature_name = self.get_argument("feature", None)
        self.finish(json.dumps(self.manager.get_status(feature_name)))


def setup_handlers(web_app):
    """Set up the feature status handlers."""
    host_pattern = ".*$"
    base_url = web_app.settings["base_url"]

    default_handlers = [
        (r"feature-status", FeatureStatusHandler),
    ]

    web_app.add_handlers(
        host_pattern,
        [(url_path_join(base_url, "nbexchange-jlab", hook), handler) for hook, handler in default_handlers],
    )


def load_jupyter_server_extension(nbapp):
    """Load the feature status server extension."""
    web_app = nbapp.web_app
    web_app.settings["feature_status_manager"] = FeatureStatusManager(parent=nbapp)
    web_app.settings["feature_status_manager"].root_dir = nbapp.root_dir

    setup_handlers(web_app)
    name = "nbexchange_jlab_feature_status"
    nbapp.log.info(f"Registered {name} server extension")
