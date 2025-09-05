"""Tornado handlers for nbgrader course list web service."""

import os
import json

import requests
import tornado
from tornado import web

from urllib.parse import urljoin
from jupyter_server.base.handlers import JupyterHandler

import logging


class HistoryListHandler(JupyterHandler):

    api_timeout = 10

    base_service_url = os.environ.get("NAAS_BASE_URL", "https://noteable.edina.ac.uk/exchange")

    @web.authenticated
    def get(self):
        course_id = self.get_argument('course_id')
        logging.info(f"get HISTORY for course: {course_id}")
        url = urljoin(self.base_service_url, f"/services/nbexchange/history?course_code={course_id}")
        logging.info(f"api_request: {url}")

        jwt_token = os.environ.get("NAAS_JWT")
        cookies = dict()
        headers = dict()

        if jwt_token:
            cookies["noteable_auth"] = jwt_token

        try:
            r = requests.get(url, headers=headers, cookies=cookies, timeout=self.api_timeout)
            r.raise_for_status()
            response_content = r.content.decode("utf-8")
            d = json.loads(response_content)
            self.finish(d)
        except requests.exceptions.ConnectionError:
            self.finish({
                "success": False,
                "value": f"Could not connect to NbExchange service.",
            })
        except requests.exceptions.RequestException as e:
            logging.error("Http Error:",e)
            self.finish({
                "success": False,
                "value": f"Could not fetch history data from NbExchange service.",
            })
        except json.JSONDecodeError:
            logging.error("Could not decode response content")
            self.finish({
                "success": False,
                "value": "Could not decode response content from NbExchange service."
            })