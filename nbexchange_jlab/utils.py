import contextlib
import os

from jupyter_core.paths import jupyter_config_path
from nbgrader.apps import NbGrader
from traitlets.config import LoggingConfigurable


def get_current_course():
    return os.environ.get("NAAS_COURSE_ID", None)


class BaseListerClass(LoggingConfigurable):

    def load_config(self):
        paths = jupyter_config_path()
        app = NbGrader()
        app.config_file_paths.append(paths)
        app.load_config_file()

        return app.config

    @contextlib.contextmanager
    def yield_config(self):
        yield self.load_config()

    def check_enabled(self):
        """Returns whether or not the History list should be enabled in the UI."""
        config = self.load_config()
        self.log.info(f"Loaded config: {config}")
        if config.get("CourseDirectory").get("db_url") is not None:
            return True
        return False

    def check_feature_enabled(self, env_var: str = None) -> bool:
        """Returns whether a feature is enabled based on environment variable existence.

        Args:
            env_var: The full environment variable name to check. If None or empty,
                    returns True (feature enabled by default).

        Returns:
            True if the environment variable exists (is set), False otherwise.
            The value of the variable does not matter.
        """
        if env_var is None or env_var == "":
            return True

        exists = env_var in os.environ
        self.log.info(f"Feature enabled check: {env_var} exists={exists}")
        return exists
