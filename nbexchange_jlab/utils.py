import contextlib
import os

from jupyter_core.paths import jupyter_config_path
from nbgrader.apps import NbGrader
from traitlets.config import LoggingConfigurable
from traitlets.config.loader import LazyConfigValue


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

    def check_enabled(self, instructor_only: bool = False) -> bool:
        """
        Returns whether or not a feature should be enabled in the UI.

        Checks configuration validity (course_id, db_url).

        Args:
            instructor_only: If True, only instructors can use the feature. Requires db_url. Default is False.

        Returns:
            True if the feature is enabled, False otherwise.
        """
        config = self.load_config()
        self.log.info(f"Loaded config: {config}")

        course_dir = config.get("CourseDirectory")
        if course_dir is None or isinstance(course_dir, LazyConfigValue):
            self.log.warning("CourseDirectory config is missing or not fully loaded.")
            return False
        if not course_dir.get("course_id"):
            self.log.warning("Feature is disabled because course_id is not set.")
            return False
        if instructor_only:
            if not course_dir.get("db_url"):
                self.log.warning("Instructor-only feature is disabled because db_url is not set.")
                return False
        return True
