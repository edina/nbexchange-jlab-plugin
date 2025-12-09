from collections import Counter
from typing import Dict, List, Set, Tuple

from nbconvert.exporters.exporter import ResourcesDict
from nbformat.notebooknode import NotebookNode
from nbgrader.preprocessors.base import NbGraderPreprocessor

# from datetime import datetime
# import os


class NbExDeduplicateIds(NbGraderPreprocessor):
    """A preprocessor which removes second and subsequent duplicated cells."""

    def find_duplicate_grade_ids(self, notebook: Dict) -> Dict[str, int]:
        """
        Return a dict of grade_id -> count for any grade_ids that appear more than once.
        grade_id values are normalized to str.
        """
        ids: List[str] = []
        for cell in notebook.get("cells", []):
            metadata = cell.get("metadata", {})
            nbgrader = metadata.get("nbgrader", {})
            grade_id = nbgrader.get("grade_id")
            if grade_id is not None:
                ids.append(str(grade_id))
        counts = Counter(ids)
        return {grade_id: count for grade_id, count in counts.items() if count > 1}

    # def write_log(self, found_dict: dict, resources: ResourcesDict):
    #     print("write_log starting")
    #     pprint(self.__dict__)
    #     timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    #     sub_dir = self.coursedir.submitted_directory
    #     filename = os.path.join(
    #        resources['metadata']['path'],
    #        f"{resources['nbgrader']['notebook']}_deduplicate_{timestamp}.txt")
    #     msg = [
    #         f"A total of {len(found_dict['before'])} cells were found to be duplicates\n",
    #         "The Following cells were removed before the book was passed to the autograder:\n"
    #     ]
    #     for detail in found_dict['removed_details']:
    #         msg.append(f"Cell count: {detail[0]}, cell-id: {detail[1]}")
    #     msg.append(f"\nThere are {len(found_dict['after'])} remaining after this processor completes")
    #     with open(filename, 'w') as f:
    #         f.write("\n".join(msg))
    #     return msg

    def deduplicate_notebook_by_grade_id(
        self, nb: NotebookNode
    ) -> Tuple[bool, Dict[str, int], Dict[str, int], List[Tuple[int, str]], NotebookNode]:
        """
        Remove second and subsequent cells that share the same nbgrader.grade_id.

        Returns:
        (modified, dupes_before, dupes_after, removed_details, nb)

        - modified: True if the notebook was changed (duplicates removed).
        - dupes_before: map grade_id -> count for duplicates prior to edit.
        - dupes_after: map grade_id -> count for duplicates after edit (should be empty if fixed).
        - removed_details: list of (original_cell_index, grade_id) for each removed cell.
        - nb: the json object that is the _modified_ notebook-document

        Notes:
        - Keeps the first occurrence of each grade_id; removes subsequent ones.
        """

        cells = nb.get("cells", None)
        if not isinstance(cells, list):
            return (False, {}, {}, [])

        dupes_before = self.find_duplicate_grade_ids(nb)

        if not dupes_before:
            return (False, {}, {}, [], nb)  # nothing to do

        seen: Set[str] = set()
        kept_cells: List[Dict] = []
        removed_details: List[Tuple[int, str]] = []

        for index, cell in enumerate(cells):
            nbgrader = cell.get("metadata", {}).get("nbgrader", {})
            grade_id = nbgrader.get("grade_id")
            if grade_id is None:
                kept_cells.append(cell)
                continue
            grade_id_str = str(grade_id)
            if grade_id_str in seen:
                # remove this duplicate occurrence
                removed_details.append((index, grade_id_str))
            else:
                seen.add(grade_id_str)
                kept_cells.append(cell)
        nb["cells"] = kept_cells
        modified = len(removed_details) > 0

        # Recompute duplicates after modification
        dupes_after = self.find_duplicate_grade_ids(nb)

        return (modified, dupes_before, dupes_after, removed_details, nb)

    def preprocess(self, nb: NotebookNode, resources: ResourcesDict) -> Tuple[NotebookNode, ResourcesDict]:
        modified, dupes_before, dupes_after, removed_details, nb = self.deduplicate_notebook_by_grade_id(nb)

        # if modified, write a note into the submission directory
        if modified:
            self.log.warning(
                f"Duplicates removed for student {resources['nbgrader']['student']}:",
                f" {len(dupes_before)} cells removed.",
                " Full report in submission directory\n",
            )
            # msg = self.write_log(
            #           {
            #             'modified': modified,
            #             'before': dupes_before,
            #             'after': dupes_after,
            #             'removed_details': removed_details
            #           },
            #           resources
            #          )
        return nb, resources

    def preprocess_cell(
        self, cell: NotebookNode, resources: ResourcesDict, cell_index: int
    ) -> Tuple[NotebookNode, ResourcesDict]:

        return cell, resources
