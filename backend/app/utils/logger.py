import logging


def setup_logging(debug: bool = False) -> None:
    logging.basicConfig(
        level=logging.DEBUG if debug else logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

    tortoise_level = logging.DEBUG if debug else logging.WARNING
    logging.getLogger("tortoise").setLevel(tortoise_level)
    logging.getLogger("tortoise.db_client").setLevel(tortoise_level)
