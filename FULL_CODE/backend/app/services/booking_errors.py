class SlotTakenError(Exception):
    """Someone else already holds this slot. Raised by storage when a second confirmed booking would take the same time."""
