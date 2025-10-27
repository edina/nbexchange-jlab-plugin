"""Tornado handlers for nbgrader course list web service."""

import contextlib
import json
import os
import traceback
from urllib.parse import quote_plus

import requests
from jupyter_core.paths import jupyter_config_path
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.utils import url_path_join
from nbgrader.apps import NbGrader
from nbgrader.auth import Authenticator
from nbgrader.coursedir import CourseDirectory
from tornado import web
from traitlets.config import LoggingConfigurable

from nbexchange_jlab.plugins import Exchange, ExchangeError


@contextlib.contextmanager
def chdir(dirname):
    currdir = os.getcwd()
    os.chdir(dirname)
    yield
    os.chdir(currdir)


class HistoryList(LoggingConfigurable):
    SUPPORTED_METHODS = ("GET", "HEAD")

    # This gives us all the exchange config details & functions
    exchange: Exchange = None

    @property
    def root_dir(self):
        return self._root_dir

    @root_dir.setter
    def root_dir(self, directory):
        self._root_dir = directory

    def load_config(self):
        paths = jupyter_config_path()
        paths.insert(0, os.getcwd())
        app = NbGrader()
        app.config_file_paths.append(paths)
        app.load_config_file()

        return app.config

    @contextlib.contextmanager
    def get_history_config(self):
        app = NbGrader()
        app.config_file_paths.append(os.getcwd())
        app.load_config_file()
        yield app.config

    def get_current_course(self):
        return os.environ.get("NAAS_COURSE_ID", None)

    def query_exchange(self):
        """
        This queries the database for all the actions for a course

        Note that the exchange itself filters the return, based on the identity
        of the person making the call: students only see released actions and their
        own actions; instructors see all actions
        """

        try:
            if self.exchange.coursedir.course_id:
                """List history for specific course"""
                self.log.info(f"calling exchange.api_request with course_code {self.exchange.coursedir.course_id}")
                r = self.exchange.api_request(f"history?course_id={quote_plus(self.exchange.coursedir.course_id)}")
            else:
                """List history for all courses"""
                self.log.info("calling exchange.api_request withOUT course_code")
                r = self.exchange.api_request("history")
        except requests.exceptions.Timeout:
            self.fail("Timed out trying to reach the exchange service to list history.")

        self.log.debug(f"Got back {r} when listing history")

        try:
            history = r.json()
        except json.decoder.JSONDecodeError as err:
            self.log.error(
                "Got back an invalid response when history\n" f"response text: {r.text}\n" f"JSONDecodeError: {err}"
            )
            return []

        currnent_course_code = self.get_current_course()

        for item in history["value"]:
            if item["course_code"] == currnent_course_code:
                item["isCurrent"] = True
            else:
                item["isCurrent"] = False

        return history["value"]

    def list_history(self, course_id: str = None):

        with self.get_history_config() as config:

            try:
                if course_id:
                    config.CourseDirectory.course_id = course_id

                coursedir = CourseDirectory(config=config)
                authenticator = Authenticator(config=config)
                self.exchange = Exchange(coursedir=coursedir, authenticator=authenticator, config=config)

                history = self.query_exchange()
                self.log.info(f"#### current course: {self.exchange.coursedir.__dict__}")
            except Exception as e:
                self.log.error(traceback.format_exc())
                if isinstance(e, ExchangeError):
                    retvalue = {
                        "success": False,
                        "value": """The exchange directory does not exist and could
                                    not be created. The "release" and "collect" functionality will not be available.
                                    Please see the documentation on
                                    http://nbgrader.readthedocs.io/en/stable/user_guide/managing_assignment_files.html#setting-up-the-exchange
                                    for instructions.
                                """,
                    }
                else:
                    retvalue = {"success": False, "value": traceback.format_exc()}
            else:
                retvalue = {"success": True, "value": history}

        return retvalue

    def get(self):
        self.log.info(f"Called get on {self.__class__.__name__}")

    def head(self):
        self.log.info(f"Called head on {self.__class__.__name__}")


# class HistoryListHandler(JupyterHandler):
class BaseHistoryHandler(JupyterHandler):
    @property
    def manager(self):
        return self.settings["history_list_manager"]


class HistoryListHandler(BaseHistoryHandler):
    api_timeout = 10

    base_service_url = os.environ.get("NAAS_BASE_URL", "https://noteable.edina.ac.uk/exchange")

    @web.authenticated
    def get(self):
        course_id = self.get_argument("course_id")
        self.log.info(f"get HISTORY for course: {course_id}")
        self.finish(json.dumps(self.manager.list_history(course_id=course_id)))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    # Our hander urls are made up of <base_url>, <namespace>, <endpoint>
    # (this is done to keep things out of the nbgrader & jupyterlab handler paths)
    route_pattern_history = url_path_join(base_url, "nbexchange-jlab", "history")
    handlers = [(route_pattern_history, HistoryListHandler)]
    web_app.add_handlers(host_pattern, handlers)


def load_jupyter_server_extension(nbapp):
    web_app = nbapp.web_app
    web_app.settings["history_list_manager"] = HistoryList(parent=nbapp)
    web_app.settings["history_list_manager"].root_dir = nbapp.root_dir

    setup_handlers(web_app)
    name = "nbexchange_jlab"
    nbapp.log.info(f"Registered {name} server extension")
