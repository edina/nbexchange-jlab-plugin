"""Tornado handlers for nbgrader course list web service."""

import contextlib
import json
import os
from typing import Dict, Set

from jupyter_core.paths import jupyter_config_path
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.utils import url_path_join
from nbgrader.apps import NbGrader, NbGraderAPI
from tornado import web
from traitlets.config import LoggingConfigurable

from nbexchange_jlab.history_list import HistoryList
from nbexchange_jlab.utils import get_current_course

# import traceback


class BaAssignmentsList(LoggingConfigurable):

    SUPPORTED_METHODS = ("GET", "HEAD")

    def load_config(self):
        paths = jupyter_config_path()
        paths.insert(0, os.getcwd())
        app = NbGrader()
        app.config_file_paths.append(paths)
        app.load_config_file()

        return app.config

    @contextlib.contextmanager
    def get_BaAssignment_config(self):
        yield self.load_config()

    # Takes in a full course record, returns a dict of assignment_code: set-of-submitted-users
    def _parse_course_data(self, course: dict = None) -> Dict:
        if not course:
            return None
        data: Set = {}
        for assignment in course["assignments"]:
            data[assignment["assignment_code"]] = set()
            for action in list(
                filter(lambda tag: tag["action"] == "AssignmentActions.submitted", assignment["actions"])
            ):
                data[assignment["assignment_code"]].add(action["user"])
        return data

    def _get_history_data(self, course_id: str = None) -> Dict:
        historyList = HistoryList()
        history = historyList.list_history()

        for course in history["value"]:
            if course["course_code"] == course_id:
                return self._parse_course_data(course)
        return None

    def list_BaAssignment(self, course_id: str = None) -> Dict:
        if not get_current_course():
            return {"success": False, "value": "You need to have a current course code."}

        data: Dict = {}
        with self.get_BaAssignment_config() as config:
            api = NbGraderAPI(config=config)

            history = self._get_history_data(course_id=get_current_course())
            if history:
                for assignment in history.keys():
                    api.coursedir.assignment_id = assignment
                    local_submissions = api.get_submissions(assignment)
                    data[assignment] = {"exchange": len(history[assignment]), "locally": len(local_submissions)}
        retvalue = {"success": True, "value": data}
        return retvalue


class BaseBaAssignmentHandler(JupyterHandler):
    @property
    def manager(self):
        return self.settings["BaAssignment_list_manager"]


class BaAssignmentsListHandler(BaseBaAssignmentHandler):
    api_timeout = 10

    base_service_url = os.environ.get("NAAS_BASE_URL", "https://noteable.edina.ac.uk/exchange")

    # get a dict of assignments: name; in exchange; locally
    @web.authenticated
    def get(self):
        course_id = self.get_argument("course_id", get_current_course())
        self.log.info(f"get assignments for course: {course_id}")

        self.finish(json.dumps(self.manager.list_BaAssignment(course_id=course_id)))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]

    default_handlers = [(r"getAssignment", BaAssignmentsListHandler)]
    # route_pattern_BaAssignment = url_path_join(base_url, "nbexchange-jlab", "getAssignment")
    # handlers = [(route_pattern_BaAssignment, BaAssignmentsListHandler)]
    # web_app.add_handlers(host_pattern, handlers)

    # Our hander urls are made up of <base_url>, <namespace>, <endpoint>
    # (this is done to keep things out of the nbgrader & jupyterlab handler paths)
    web_app.add_handlers(
        host_pattern,
        [(url_path_join(base_url, "nbexchange-jlab", hook), handler) for hook, handler in default_handlers],
    )


def load_jupyter_server_extension(nbapp):
    web_app = nbapp.web_app
    web_app.settings["BaAssignment_list_manager"] = BaAssignmentsList(parent=nbapp)
    web_app.settings["BaAssignment_list_manager"].root_dir = nbapp.root_dir

    setup_handlers(web_app)
    name = "nbexchange_jlab"
    nbapp.log.info(f"Registered {name} server extension")
