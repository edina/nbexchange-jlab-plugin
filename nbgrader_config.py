# Configuration file for nbgrader-generate-config.

import os

c = get_config()  # noqa

# ------------------------------------------------------------------------------
# ExchangeFactory(LoggingConfigurable) configuration
# ------------------------------------------------------------------------------
# # A plugin for collecting assignments.
#  Default: 'nbgrader.exchange.default.collect.ExchangeCollect'
c.ExchangeFactory.collect = "nbexchange_jlab.plugins.ExchangeCollect"

# # A plugin for exchange.
#  Default: 'nbgrader.exchange.default.exchange.Exchange'
c.ExchangeFactory.exchange = "nbexchange_jlab.plugins.Exchange"

# # A plugin for fetching assignments.
#  Default: 'nbgrader.exchange.default.fetch_assignment.ExchangeFetchAssignment'
c.ExchangeFactory.fetch_assignment = "nbexchange_jlab.plugins.ExchangeFetchAssignment"

# # A plugin for fetching feedback.
#  Default: 'nbgrader.exchange.default.fetch_feedback.ExchangeFetchFeedback'
c.ExchangeFactory.fetch_feedback = "nbexchange_jlab.plugins.ExchangeFetchFeedback"

# # A plugin for listing exchange files.
#  Default: 'nbgrader.exchange.default.list.ExchangeList'
c.ExchangeFactory.list = "nbexchange_jlab.plugins.ExchangeList"

# # A plugin for releasing assignments.
#  Default: 'nbgrader.exchange.default.release_assignment.ExchangeReleaseAssignment'
c.ExchangeFactory.release_assignment = "nbexchange_jlab.plugins.ExchangeReleaseAssignment"

# # A plugin for releasing feedback.
#  Default: 'nbgrader.exchange.default.release_feedback.ExchangeReleaseFeedback'
c.ExchangeFactory.release_feedback = "nbexchange_jlab.plugins.ExchangeReleaseFeedback"

# # A plugin for submitting assignments.
#  Default: 'nbgrader.exchange.default.submit.ExchangeSubmit'
c.ExchangeFactory.submit = "nbexchange_jlab.plugins.ExchangeSubmit"

# # A key that is unique per instructor and course. This can be specified, either
#  by setting the config option, or using the --course option on the command
#  line.
#  Default: ''
c.CourseDirectory.course_id = os.environ.get("NAAS_COURSE_ID", "missing")
