import json
import os

import requests

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from urllib.parse import urljoin
import tornado

import logging
import sys

from traitlets import Unicode

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)


class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "data": "This is /nbexchange-jlab/get-example endpoint!"
        }))

class HistoryRouteHandler(APIHandler):

    #

    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        print("get HISTORY...")
        my_base_service_url = Unicode(os.environ.get("NAAS_EXBASE_URL", "https://noteable.edina.ac.uk/exchange")).tag(config=True)
        print(type(my_base_service_url))
        base_service_url = os.environ.get("NAAS_EXBASE_URL", "https://noteable.edina.ac.uk/exchange")
        logging.info(f"base_service_url: {base_service_url}")
        url = urljoin(base_service_url, "/services/nbexchange/history?course_code=Made%20up")
        logging.info(f"this_url: {url}")
        response = requests.get(url)
        logging.info(f"response: {response}")
        response_content = response.content.decode("utf-8")
        logging.info(f"response_content: {response_content}")

        try:
            d = json.loads(response_content)
            self.finish(d)
        except json.JSONDecodeError:
            logging.error("Could not decode response content")


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "nbexchange-jlab", "get-example")
    route_pattern_history = url_path_join(base_url, "nbexchange-jlab", "history")
    handlers = [
        (route_pattern, HistoryRouteHandler),
        (route_pattern_history, HistoryRouteHandler)
    ]
    web_app.add_handlers(host_pattern, handlers)
