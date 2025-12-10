import os


def get_current_course():
    return os.environ.get("NAAS_COURSE_ID", None)
