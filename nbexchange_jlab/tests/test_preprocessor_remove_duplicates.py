import pytest
from nbformat.v4 import new_notebook
from nbgrader.tests import create_grade_cell, create_locked_cell, create_solution_cell
from nbgrader.tests.preprocessors.base import BaseTestPreprocessor

from nbexchange_jlab.preprocessors.remove_duplicates import NbExDeduplicateIds

mock_resources = {
    "nbgrader": {"student": "1-test", "notebook": "exam 1"},
    "metadata": {
        "path": "/tmp",
    },
}


@pytest.fixture
def preprocessor():
    pp = NbExDeduplicateIds()
    return pp


@pytest.fixture(autouse=True)
def course_root(tmp_path, monkeypatch):
    """Run each test from a temporary directory.

    The preprocessor writes its report to nbgrader's course root, which defaults to the
    current directory, so without this the reports end up in the repository.
    """
    monkeypatch.chdir(tmp_path)
    return tmp_path


class TestDeduplicateIds(BaseTestPreprocessor):

    def test_duplicate_grade_cell(self, preprocessor, tmpdir):
        mock_resources["metadata"]["path"] = str(tmpdir.mkdir("preprocessor_testing").realpath())
        cell1 = create_grade_cell("hello", "code", "foo", 2)
        cell2 = create_grade_cell("goodbye", "code", "foo", 2)
        nb = new_notebook()
        nb.cells.append(cell1)
        nb.cells.append(cell2)

        nb, resources = preprocessor.preprocess(nb, mock_resources)

        assert len(nb.cells) == 1
        assert nb.cells[0].metadata.nbgrader == {
            "grade": True,
            "grade_id": "foo",
            "locked": False,
            "points": 2,
            "schema_version": 3,
            "solution": False,
            "task": False,
        }
        assert nb.cells[0].source == "hello"

    def test_duplicate_solution_cell(self, preprocessor, tmpdir):
        mock_resources["metadata"]["path"] = str(tmpdir.mkdir("preprocessor_testing").realpath())
        cell1 = create_solution_cell("hello", "code", "foo")
        cell2 = create_solution_cell("goodbye", "code", "foo")
        nb = new_notebook()
        nb.cells.append(cell1)
        nb.cells.append(cell2)

        nb, resources = preprocessor.preprocess(nb, mock_resources)

        assert nb.cells[0].metadata.nbgrader == {
            "grade": False,
            "grade_id": "foo",
            "locked": False,
            "schema_version": 3,
            "solution": True,
            "task": False,
        }
        assert nb.cells[0].source == "hello"

    def test_duplicate_locked_cell(self, preprocessor, tmpdir):
        mock_resources["metadata"]["path"] = str(tmpdir.mkdir("preprocessor_testing").realpath())
        cell1 = create_locked_cell("hello", "code", "foo")
        cell2 = create_locked_cell("goodbye", "code", "foo")
        nb = new_notebook()
        nb.cells.append(cell1)
        nb.cells.append(cell2)

        nb, resources = preprocessor.preprocess(nb, mock_resources)

        assert len(nb.cells) == 1
        assert nb.cells[0].metadata.nbgrader == {
            "grade": False,
            "grade_id": "foo",
            "locked": True,
            "schema_version": 3,
            "solution": False,
            "task": False,
        }
        assert nb.cells[0].source == "hello"

    def test_no_duplicates_pass(self, preprocessor, tmpdir):
        mock_resources["metadata"]["path"] = str(tmpdir.mkdir("preprocessor_testing").realpath())
        cell1 = create_grade_cell("hello", "code", "foo", 2)
        cell2 = create_locked_cell("goodbye", "code", "bah")
        nb = new_notebook()
        nb.cells.append(cell1)
        nb.cells.append(cell2)

        nb, resources = preprocessor.preprocess(nb, mock_resources)

        assert len(nb.cells) == 2
        assert nb.cells[0].metadata.nbgrader == {
            "grade": True,
            "grade_id": "foo",
            "locked": False,
            "points": 2,
            "schema_version": 3,
            "solution": False,
            "task": False,
        }
        assert nb.cells[0].source == "hello"
        assert nb.cells[1].metadata.nbgrader == {
            "grade": False,
            "grade_id": "bah",
            "locked": True,
            "schema_version": 3,
            "solution": False,
            "task": False,
        }
        assert nb.cells[1].source == "goodbye"

    def test_report_written_to_course_root(self, preprocessor, course_root):
        cell1 = create_grade_cell("hello", "code", "foo", 2)
        cell2 = create_grade_cell("goodbye", "code", "foo", 2)
        nb = new_notebook()
        nb.cells.append(cell1)
        nb.cells.append(cell2)

        preprocessor.preprocess(nb, mock_resources)

        reports = list(course_root.glob("autograde_report_1-test_exam 1_deduplicate_*.txt"))
        assert len(reports) == 1
        assert "Duplicates removed for student 1-test" in reports[0].read_text()

    def test_no_report_without_duplicates(self, preprocessor, course_root):
        nb = new_notebook()
        nb.cells.append(create_grade_cell("hello", "code", "foo", 2))

        preprocessor.preprocess(nb, mock_resources)

        assert list(course_root.glob("autograde_report_*.txt")) == []
