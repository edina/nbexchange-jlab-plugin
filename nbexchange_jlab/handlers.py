from jupyter_server.utils import url_path_join

import logging
import sys

from nbexchange_jlab.history_list.handlers import HistoryListHandler

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern_history = url_path_join(base_url, "nbexchange-jlab", "history")
    handlers = [
        (route_pattern_history, HistoryListHandler)
    ]
    web_app.add_handlers(host_pattern, handlers)
