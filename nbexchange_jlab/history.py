import json

from nbexchange_jlab.plugins.exchange import Exchange


class ExchangeHistory(Exchange):

    def query_exchange(self):
        """
        This queries the database for all the actions for a given course
        """
        try:
            self.log.info("Calling api_request...")
            r = self.api_request("history")
            self.log.info(f"Got back {r} when listing history")
        except request.exceptions.Timeout:
            self.fail("Timed out trying to reach the exchange service to list available history.")

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
