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
    def get_history_config(self):
        yield self.load_config()

    def check_enabled(self):
        """Returns whether or not the History list should be enabled in the UI."""
        with self.get_history_config() as config:
            if config.get("CourseDirectory").get("db_url") is not None:
                return True
        return False
