"""Tornado handlers for nbgrader course list web service."""

import os
import json

import requests
from tornado import web

from urllib.parse import urljoin
from jupyter_server.base.handlers import JupyterHandler

import logging

class HistoryListHandler(JupyterHandler):

    base_url = os.environ.get("NAAS_BASE_URL", "https://noteable.edina.ac.uk/exchange")
    base_service_url = os.environ.get("NAAS_EXBASE_URL", base_url)

    @web.authenticated
    def get(self):
        course_id = self.get_argument('course_id')
        logging.info(f"get HISTORY for course: {course_id}")
        url = urljoin(self.base_service_url, f"/services/nbexchange/history?course_code={course_id}")
        logging.info(f"Request url: {url}")
        response = requests.get(url)
        response_content = response.content.decode("utf-8")

        try:
            d = json.loads(response_content)
            self.finish(d)
        except json.JSONDecodeError:
            logging.error("Could not decode response content")
