import glob
import hashlib
import json
import os
from urllib.parse import quote_plus

import nbgrader.exchange.abc as abc
import requests
from nbgrader.exchange.default.list import ExchangeList as DefaultExchangeList
from traitlets import Unicode

from .exchange import Exchange


def _checksum(path):
    m = hashlib.md5()
    m.update(open(path, "rb").read())
    return m.hexdigest()


# "outbound" is files released by instructors (.... but there may be local copies!)
# "inbound" is files submitted by students (on external service)
# "cached" is files submitted by students & collected by instructors (so on local disk)
class ExchangeList(abc.ExchangeList, Exchange):

    def do_copy(self, src, dest):
        pass

    fetched_root = Unicode("", help="Root location for files to be fetched into")

    # the list of assignments the exchange knows about
    assignments = []

    # for filtering on-disk items from exchange items
    # (eg removed 'released' items if the 'fetched' item is on disk)
    seen_assignments = {"fetched": [], "collected": []}

    def query_exchange(self):
        """
        This queries the database for all the actions for a course

        if self.inbound or self.cached are true, it returns all the 'submitted'
        items, else it returns all the 'released' ones.

        (it doesn't care about feedback or collected actions)
        """
        try:
            if self.coursedir.course_id:
                """List history for specific course"""
                r = self.api_request(f"history?course_id={quote_plus(self.coursedir.course_id)}")
            else:
                """List history for all courses"""
                r = self.api_request("history")
        except requests.exceptions.Timeout:
            self.fail("Timed out trying to reach the exchange service to list available history.")

        self.log.debug(f"Got back {r} when listing history")

        try:
            history = r.json()
        except json.decoder.JSONDecodeError as err:
            self.log.error(
                "Got back an invalid response when listing history\n"
                f"response text: {r.text}\n"
                f"JSONDecodeError: {err}"
            )
            return []

        return history["value"]

    def init_src(self):
        pass

    # sets self.history to be the list of assignment records that match the
    #  released/submitted/cached criteria configured
    def init_dest(self):
        self.history = []

        exchange_listed_history = self.query_exchange()
        self.log.debug(f"ExternalExchange.list.init_dest collected {exchange_listed_history}")

        # if "inbound", looking for inbound (submitted) records
        # elif 'cached', looking for already downloaded files
        # else, looking for outbound (released) files
        if self.inbound or self.cached:
            for assignment in exchange_listed_history:
                if assignment.get("status") == "submitted":
                    self.history.append(assignment)
        else:
            self.history = filter(lambda x: x.get["status"] == "released", exchange_listed_history)

    def copy_files(self):
        pass

    # Add the path for notebooks on disk, and add the blank parameters
    # Feedback details is listed in "submitted" records
    def parse_action(self, action):
        # If the assignment was found on disk, we need to expand the metadata
        if action.get("status") == "fetched":
            # get the individual notebook details
            action_dir = os.path.join(self.action_dir, action.get("assignment_id"))

            if self.path_includes_course:
                action_dir = os.path.join(
                    self.action_dir,
                    self.coursedir.course_id,
                    action.get("assignment_id"),
                )

            action["notebooks"] = []
            # Find the ipynb files
            for notebook in sorted(glob.glob(os.path.join(action_dir, "*.ipynb"))):
                notebook_id = os.path.splitext(os.path.split(notebook)[1])[0]
                action["notebooks"].append(
                    {
                        "path": notebook,
                        "notebook_id": notebook_id,
                        "has_local_feedback": False,
                        "has_exchange_feedback": False,
                        "local_feedback_path": None,
                        "feedback_updated": False,
                    }
                )

        return action

    def parse_history(self):

        # Set up some general variables
        self.history = []
        held_history = {"fetched": {}, "released": {}}

        # Get a list of everything from the exchange
        exchange_listed_history = self.query_exchange()

        # if "inbound" or "cached" are true, we're looking for inbound
        #  (submitted) records else we're looking for outbound (released)
        #  records
        # (everything else is irrelevant for this method - self.history will
        #   contain either a list of `released` items or a list of `submitted items`
        #   ..... and nothing else!)
        if self.inbound or self.cached:
            for action in exchange_listed_history:
                if action.get("status") == "submitted":
                    self.history.append(action)
        else:
            for action in exchange_listed_history:
                if action.get("status") == "released":
                    self.history.append(action)

        # We want to check the local disk for "fetched" items, not what the external server
        #   says we should have.
        # **NOTE** the way this works is that the status of a `released` record gets changed to
        #  `fetched` if the item is on disk
        interim_history = []
        found_fetched = set([])
        for action in self.history:
            if self.path_includes_course:
                action_directory = os.path.join(
                    self.action_dir, action["course_id"], action["assignment_id"]
                )
            else:
                action_directory = os.path.join(self.action_dir, action["assignment_id"])

            if action["status"] == "released":
                # Has this release already been found on disk?
                if action["assignment_id"] in found_fetched:
                    continue
                # Check to see if the 'released' action is on disk
                if os.path.isdir(action_directory):
                    action["status"] = "fetched"
                    # lets just take a note of having found this action
                    found_fetched.add(action["action"])

            interim_history.append(self.parse_assignment(action))
            self.log.debug(f"parse_assignment singular action returned: {action}")

        # now we build two sub-lists:
        # - the last "released" per assignment_id - but only if they've not been "fetched"
        #
        my_history = []

        for action in interim_history:
            # Skip those not being seen
            if action is None:
                continue

            # Hang onto the fetched action, if there is one
            # Note, we'll only have a note of the _first_ one - but that's fine
            #  as the timestamp is irrelevant... we just need to know if we
            #  need to look to the local disk
            if action.get("status") == "fetched":
                held_history["fetched"][action.get("assignment_id")] = action
                continue

            # filter out all the released items:
            if action.get("status") == "released":
                # This is complicated:
                #  - If the user has "fetched" the action, we ignore any released records
                #    ... whatever age they are
                #  - otherwise keep the latest one
                if action.get("assignment_id") in held_history["fetched"]:
                    continue
                else:
                    latest = held_history["released"].get(
                        action.get("assignment_id"),
                        {"timestamp": "1990-01-01 00:00:00 UTC"},
                    )
                    if action.get("timestamp") >= latest.get("timestamp"):
                        held_history["released"][action.get("assignment_id")] = action
                    continue

            # "Submitted" assignments [may] have feedback
            # If they do, we need to promote details of local [on disk] feedback
            # to the "action" level. It would have been nice to match
            # sumbission times to feedback directories.
            # Note that the UI displays the "submitted" time in the table, but
            # will provide a link to a folder that is the "feedback" time
            # ("feedback-time" for all notebooks in one 'release' is the same)
            if action.get("status") == "submitted":
                feedback_dir = os.path.join(action.get("assignment_id"), "feedback")
                if self.path_includes_course:
                    feedback_dir = os.path.join(
                        self.coursedir.course_id,
                        action.get("assignment_id"),
                        "feedback",
                    )

                local_feedback_path = None
                has_local_feedback = False

                # There's a flaw: if the last notebook in the list does not have a matching submitted
                #  .ipynb file, then 'release_feedback' does not push a .html file to the exchange, which
                # therefore has no record in it's database. This means the the assignments lister in the
                # exchange doesn't add a feedback_timestamp to _that_ notebook. Therefore we need to note
                # if _any_ notebooks in the action [for that student] has a timestamp, and use that
                # rather than rely on the last notebook having a timestamp
                group_nb_timestamp = None
                for notebook in action["notebooks"]:
                    local_feedback_path = None
                    has_local_feedback = False
                    nb_timestamp = notebook["feedback_timestamp"]
                    # This has to match timestamp in fetch_feedback.download
                    if nb_timestamp:
                        # Note the timestamp, unless we already have a note
                        if group_nb_timestamp is None:
                            group_nb_timestamp = nb_timestamp
                        # get the individual notebook details
                        timestamped_feedback_dir = os.path.join(
                            feedback_dir,
                            nb_timestamp,
                        )

                        if os.path.isdir(timestamped_feedback_dir):
                            local_feedback_path = os.path.join(
                                timestamped_feedback_dir,
                                f"{notebook['notebook_id']}.html",
                            )
                            has_local_feedback = os.path.isfile(
                                os.path.join(
                                    timestamped_feedback_dir,
                                    f"{notebook['notebook_id']}.html",
                                )
                            )
                    notebook["has_local_feedback"] = has_local_feedback
                    notebook["local_feedback_path"] = local_feedback_path

                # Set action-level variables is any not the individual notebooks
                # have them
                if action["notebooks"]:
                    has_local_feedback = any([nb["has_local_feedback"] for nb in action["notebooks"]])
                    has_exchange_feedback = any([nb["has_exchange_feedback"] for nb in action["notebooks"]])
                    feedback_updated = any([nb["feedback_updated"] for nb in action["notebooks"]])
                else:
                    has_local_feedback = False
                    has_exchange_feedback = False
                    feedback_updated = False

                action["has_local_feedback"] = has_local_feedback
                action["has_exchange_feedback"] = has_exchange_feedback
                action["feedback_updated"] = feedback_updated
                if has_local_feedback:
                    action["local_feedback_path"] = os.path.join(
                        feedback_dir,
                        group_nb_timestamp,
                    )
                else:
                    action["local_feedback_path"] = None

            # We keep everything we've not filtered out
            my_history.append(action)

        # concatinate the "released" and "fetched" sublists to my_history
        for assignment_type in ("released", "fetched"):
            if held_history[assignment_type].items():
                for assignment_id in held_history[assignment_type]:
                    my_history.append(held_history[assignment_type][assignment_id])

        if self.inbound or self.cached:
            _get_key = lambda info: (  # noqa: E731 'do not assign a lambda expression, use a def'
                info["course_id"],
                info["student_id"],
                info["assignment_id"],
            )
            _match_key = lambda info, key: (  # noqa: E731 'do not assign a lambda expression, use a def'
                info["course_id"] == key[0] and info["student_id"] == key[1] and info["assignment_id"] == key[2]
            )
            assignment_keys = sorted(list(set([_get_key(info) for info in my_history])))
            assignment_submissions = []
            for key in assignment_keys:
                submissions = [x for x in my_history if _match_key(x, key)]
                submissions = sorted(submissions, key=lambda x: x["timestamp"])
                info = {
                    "course_id": key[0],
                    "student_id": key[1],
                    "assignment_id": key[2],
                    "status": submissions[0]["status"],
                    "submissions": submissions,
                }
                assignment_submissions.append(info)
            my_history = assignment_submissions
        else:
            my_history = [x for x in my_history if x.get("status") != "submitted"]

        return my_history

    def list_files(self):
        """List files"""
        self.log.debug("ExchangeList.list_file starting")

        assignments = self.parse_assignments()
        if self.inbound or self.cached:
            self.log.info("Submitted assignments:")
            for assignment in assignments:
                for info in assignment["submissions"]:
                    self.log.info(DefaultExchangeList.format_inbound_assignment(self, info))
        else:
            self.log.info("Released assignments:")
            for info in assignments:
                self.log.info(DefaultExchangeList.format_outbound_assignment(self, info))
        return assignments

    def remove_files(self):
        if self.coursedir.course_id:
            """Delete assignment"""
            self.log.info(
                f"Unreleasing assignment_id {self.coursedir.assignment_id} on course code {self.coursedir.course_id}"
            )

            url = f"assignment?course_id={quote_plus(self.coursedir.course_id)}&assignment_id={quote_plus(self.coursedir.assignment_id)}"  # noqa: E501

            try:
                r = self.api_request(url, method="DELETE")
            except requests.exceptions.Timeout:
                self.fail("Timed out trying to reach the exchange service to 'delete' an assignment.")

            self.log.info(f"Got back {r.status_code} after assignment unrelease")

    def start(self):
        if self.remove:
            return self.remove_files()
        else:
            return self.list_files()
