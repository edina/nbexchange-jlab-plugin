"""Tornado handlers for nbgrader course list web service."""

import contextlib
import json
import os
import traceback
from urllib.parse import quote_plus

import requests

# from jupyter_core.paths import jupyter_config_path
from jupyter_server.base.handlers import JupyterHandler
from jupyter_server.utils import url_path_join

# from nbgrader.apps import NbGrader
from nbgrader.auth import Authenticator
from nbgrader.coursedir import CourseDirectory
from tornado import web

from nbexchange_jlab.plugins import Exchange, ExchangeError
from nbexchange_jlab.utils import BaseListerClass, get_current_course

# from traitlets.config import LoggingConfigurable


@contextlib.contextmanager
def chdir(dirname):
    currdir = os.getcwd()
    os.chdir(dirname)
    yield
    os.chdir(currdir)


class HistoryError(Exception):
    pass


class HistoryList(BaseListerClass):
    SUPPORTED_METHODS = ("GET", "HEAD")

    # This gives us all the exchange config details & functions
    exchange: Exchange = None

    @property
    def root_dir(self):
        return self._root_dir

    @root_dir.setter
    def root_dir(self, directory):
        self._root_dir = directory

    # def load_config(self):
    #     paths = jupyter_config_path()
    #     paths.insert(0, os.getcwd())
    #     app = NbGrader()
    #     app.config_file_paths.append(paths)
    #     app.load_config_file()

    #     return app.config

    # @contextlib.contextmanager
    # def get_history_config(self):
    #     yield self.load_config()

    # def check_enabled(self):
    #     """Returns whether or not the History list should be enabled in the UI.
    #     """
    #     with self.get_history_config() as config:
    #         if config.course_directory.db_url is not None:
    #             return True
    #     return False

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
            raise HistoryError("Timed out trying to reach the exchange service to list history.")
        except Exception as e:
            raise HistoryError(f"Connection to the exchange failed: {e}")
        if r.status_code >= 400:
            raise HistoryError(r.reason)
        self.log.debug(f"Got back {r} when listing history")

        try:
            history = r.json()
        except AttributeError:
            msg = f"Got back an invalid response when history: response text: '{r.text}'"
            self.log.error(msg)
            raise HistoryError(msg)
        if not isinstance(history, dict):
            raise HistoryError(f"Invalid response from the exchange: {history}")
        response_keys = list(history.keys())
        if set(response_keys) != set(["success", "value"]):
            raise HistoryError(f"Invalid response from the exchange: {history}")

        if not history["success"]:
            raise HistoryError(f"Error message from exchange: '{history['value']}'")

        currnent_course_code = get_current_course()

        for item in history["value"]:
            if item["course_code"] == currnent_course_code:
                item["isCurrent"] = True
            else:
                item["isCurrent"] = False

        currnent_course_code = get_current_course()

        for item in history["value"]:
            if item["course_code"] == currnent_course_code:
                item["isCurrent"] = True
            else:
                item["isCurrent"] = False

        return history["value"]

    def list_history(self, course_id: str = None):
        if not get_current_course():
            return {"success": False, "value": "You need to have a current course code."}

        with self.get_history_config() as config:

            try:
                if course_id:
                    config.CourseDirectory.course_id = course_id

                coursedir = CourseDirectory(config=config)
                authenticator = Authenticator(config=config)
                self.exchange = Exchange(coursedir=coursedir, authenticator=authenticator, config=config)

                history = self.query_exchange()
            except HistoryError as e:
                retvalue = {"success": False, "value": str(e)}
            except Exception as e:
                self.log.error(traceback.format_exc())
                if isinstance(e, ExchangeError):
                    retvalue = {
                        "success": False,
                        "value": (
                            "The exchange directory does not exist and could",
                            "not be created. The 'release' and 'collect' functionality will not be available.",
                            "Please see the documentation on",
                            "http://nbgrader.readthedocs.io/en/stable/user_guide/managing_assignment_files.html#setting-up-the-exchange",  # noqa E501
                            "for instructions.",
                        ),
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
