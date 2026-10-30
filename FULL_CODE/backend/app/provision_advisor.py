"""Gives a pack advisor a password login: `python -m app.provision_advisor ADV-XXXXXX`.

The password is asked for interactively, never passed on the command line.
"""

import getpass
import sys

from app.services import auth


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: python -m app.provision_advisor <advisor_id>")  # noqa: T201
        return 2
    try:
        auth.provision_advisor(sys.argv[1], getpass.getpass("New password (12+ characters): "))
    except auth.AuthError as exc:
        print(str(exc))  # noqa: T201
        return 1
    print("Advisor login created.")  # noqa: T201
    return 0


if __name__ == "__main__":
    sys.exit(main())
