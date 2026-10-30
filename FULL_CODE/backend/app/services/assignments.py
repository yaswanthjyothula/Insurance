"""Which advisor looks after which customer.

Customers stored in Supabase carry their advisor. The pack files have no assignment column, so without Supabase sample customers
are shared out deterministically: sorted customer ids are dealt to sorted advisor ids in turn, giving the same split on every run.
Either way every customer has exactly one advisor. A real deployment would read assignments from the bank's CRM.
"""

from functools import lru_cache
from typing import Dict, List, Optional

from app.pack.loader import PackData, get_pack
from app.pack.models import Profile


def deal(pack: PackData) -> Dict[str, str]:
    """Sorted customer ids dealt to sorted advisor ids in turn. The seed script stores this split in Supabase."""
    advisor_ids = sorted(pack.advisors)
    if not advisor_ids:
        return {}
    return {pid: advisor_ids[i % len(advisor_ids)] for i, pid in enumerate(sorted(pack.profiles))}


@lru_cache(maxsize=1)
def _assignment_map() -> Dict[str, str]:
    pack = get_pack()
    dealt = deal(pack)
    if not dealt:
        return {}
    # An advisor stored with the profile (Supabase) wins; the deal only fills in customers that have none
    return {pid: (p.advisor_id if p.advisor_id in pack.advisors else dealt[pid]) for pid, p in pack.profiles.items()}


def advisor_for(profile_id: str) -> Optional[str]:
    return _assignment_map().get(profile_id)


def customers_for(advisor_id: str) -> List[Profile]:
    profiles = get_pack().profiles
    return [profiles[pid] for pid, adv in sorted(_assignment_map().items()) if adv == advisor_id]


def get_assigned(advisor_id: str, profile_id: str) -> Optional[Profile]:
    """The customer, only if they are assigned to this advisor. Anyone else's customer looks exactly like one that does not exist."""
    if _assignment_map().get(profile_id) != advisor_id:
        return None
    return get_pack().profiles.get(profile_id)
