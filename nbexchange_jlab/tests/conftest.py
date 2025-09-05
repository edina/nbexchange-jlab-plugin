"""pytest fixtures for nbexchange"""

import logging
import os

import pytest
from pytest_docker_tools import build, container
from tornado import ioloop
from traitlets.config.loader import PyFileConfigLoader

here = os.path.abspath(os.path.dirname(__file__))
root = os.path.join(here, os.pardir, os.pardir)

testing_config = os.path.join(here, "testing_config.py")
testing_plugin_config = os.path.join(here, "testing_plugin_config.py")
logger = logging.getLogger(__name__)

# global db session object
_db = None


@pytest.fixture
def io_loop(request):
    """Fix tornado-5 compatibility in pytest_tornado io_loop"""
    io_loop = ioloop.IOLoop()
    io_loop.make_current()

    def _close():
        io_loop.clear_current()
        io_loop.close(all_fds=True)

    request.addfinalizer(_close)
    return io_loop


@pytest.fixture(scope="session")
def _nbexchange_config():
    """Load the nbexchange configuration
    Currently separate from the app fixture
    so that it can have a different scope (only once per session).
    """
    cfg = PyFileConfigLoader(testing_config).load_config()

    return cfg


@pytest.fixture()
def plugin_config():
    cfg = PyFileConfigLoader(testing_plugin_config).load_config()

    return cfg


# Docker images
nbexchange_image = build(path=".")
container = container(image="{nbexchange_image.id}", ports={"9000/tcp": None})
