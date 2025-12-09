import pytest

from nbformat.v4 import new_notebook

from nbexchange_jlab.preprocessors.remove_duplicates import  NbExDeduplicateIds
from nbgrader.tests.preprocessors.base import BaseTestPreprocessor
from nbgrader.tests import (
    create_grade_cell, create_solution_cell, create_locked_cell)

from pprint import pprint

mock_resources = {
    'nbgrader': {
        'student': '1-test',
        'notebook': 'exam 1'
    },
    'metadata': {
        'path': '/tmp',

    }
}
@pytest.fixture
def preprocessor():
    pp = NbExDeduplicateIds()
    return pp


class TestDeduplicateIds(BaseTestPreprocessor):

    def test_duplicate_grade_cell(self, preprocessor, tmpdir):
        mock_resources['metadata']['path'] = str(tmpdir.mkdir("preprocessor_testing").realpath())
        cell1 = create_grade_cell("hello", "code", "foo", 2)
        cell2 = create_grade_cell("goodbye", "code", "foo", 2)
        nb = new_notebook()
        nb.cells.append(cell1)
        nb.cells.append(cell2)

        nb, resources = preprocessor.preprocess(nb, mock_resources)
        pprint(nb)

        assert len(nb.cells) == 1
        assert nb.cells[0].metadata.nbgrader == {
            'grade': True,
            'grade_id': 'foo',
            'locked': False,
            'points': 2,
            'schema_version': 3,
            'solution': False,
            'task': False,
        }
        assert nb.cells[0].source == "hello"

    def test_duplicate_solution_cell(self, preprocessor, tmpdir):
        mock_resources['metadata']['path'] = str(tmpdir.mkdir("preprocessor_testing").realpath())
        cell1 = create_solution_cell("hello", "code", "foo")
        cell2 = create_solution_cell("goodbye", "code", "foo")
        nb = new_notebook()
        nb.cells.append(cell1)
        nb.cells.append(cell2)

        nb, resources = preprocessor.preprocess(nb, mock_resources)

        assert nb.cells[0].metadata.nbgrader == {
            'grade': False,
            'grade_id': 'foo',
            'locked': False,
            'schema_version': 3,
            'solution': True,
            'task': False,
        }
        assert nb.cells[0].source == "hello"

    def test_duplicate_locked_cell(self, preprocessor, tmpdir):
        mock_resources['metadata']['path'] = str(tmpdir.mkdir("preprocessor_testing").realpath())
        cell1 = create_locked_cell("hello", "code", "foo")
        cell2 = create_locked_cell("goodbye", "code", "foo")
        nb = new_notebook()
        nb.cells.append(cell1)
        nb.cells.append(cell2)

        nb, resources = preprocessor.preprocess(nb, mock_resources)

        assert len(nb.cells) == 1
        assert nb.cells[0].metadata.nbgrader == {
            'grade': False,
            'grade_id': 'foo',
            'locked': True,
            'schema_version': 3,
            'solution': False,
            'task': False,
        }
        assert nb.cells[0].source == "hello"

    def test_no_duplicates_pass(self, preprocessor, tmpdir):
        mock_resources['metadata']['path'] = str(tmpdir.mkdir("preprocessor_testing").realpath())
        cell1 = create_grade_cell("hello", "code", "foo", 2)
        cell2 = create_locked_cell("goodbye", "code", "bah")
        nb = new_notebook()
        nb.cells.append(cell1)
        nb.cells.append(cell2)

        nb, resources = preprocessor.preprocess(nb, mock_resources)
        pprint(nb)

        assert len(nb.cells) == 2
        assert nb.cells[0].metadata.nbgrader == {
            'grade': True,
            'grade_id': 'foo',
            'locked': False,
            'points': 2,
            'schema_version': 3,
            'solution': False,
            'task': False,
        }
        assert nb.cells[0].source == "hello"
        assert nb.cells[1].metadata.nbgrader == {
            'grade': False,
            'grade_id': 'bah',
            'locked': True,
            'schema_version': 3,
            'solution': False,
            'task': False,
        }
        assert nb.cells[1].source == "goodbye"       