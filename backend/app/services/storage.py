import json
import os
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data_store")
os.makedirs(DATA_DIR, exist_ok=True)

class StorageService:
    def __init__(self):
        self.assessments_file = os.path.join(DATA_DIR, "assessments.json")
        self.scenarios_file = os.path.join(DATA_DIR, "scenarios.json")
        self.bookings_file = os.path.join(DATA_DIR, "bookings.json")
        self.my_plans_file = os.path.join(DATA_DIR, "my_plans.json")
        self._init_files()

    def _init_files(self):
        for f in [self.assessments_file, self.scenarios_file, self.bookings_file, self.my_plans_file]:
            if not os.path.exists(f):
                with open(f, "w") as fp:
                    json.dump({}, fp)

    def _read_data(self, filepath: str) -> Dict[str, Any]:
        try:
            with open(filepath, "r") as fp:
                return json.load(fp)
        except Exception:
            return {}

    def _write_data(self, filepath: str, data: Dict[str, Any]):
        with open(filepath, "w") as fp:
            json.dump(data, fp, indent=2)

    # Assessments
    def save_assessment(self, assessment_dict: Dict[str, Any]) -> str:
        data = self._read_data(self.assessments_file)
        aid = assessment_dict.get("assessment_id") or str(uuid.uuid4())
        assessment_dict["assessment_id"] = aid
        assessment_dict["saved_at"] = datetime.now().isoformat()
        data[aid] = assessment_dict
        self._write_data(self.assessments_file, data)
        return aid

    def get_assessment(self, aid: str) -> Optional[Dict[str, Any]]:
        data = self._read_data(self.assessments_file)
        return data.get(aid)

    # Scenarios
    def save_scenario(self, scenario_dict: Dict[str, Any]) -> str:
        data = self._read_data(self.scenarios_file)
        sid = scenario_dict.get("scenario_id") or str(uuid.uuid4())
        scenario_dict["scenario_id"] = sid
        scenario_dict["saved_at"] = datetime.now().isoformat()
        data[sid] = scenario_dict
        self._write_data(self.scenarios_file, data)
        return sid

    def list_scenarios(self) -> List[Dict[str, Any]]:
        data = self._read_data(self.scenarios_file)
        return list(data.values())

    def delete_scenario(self, sid: str) -> bool:
        data = self._read_data(self.scenarios_file)
        if sid in data:
            del data[sid]
            self._write_data(self.scenarios_file, data)
            return True
        return False

    # Bookings
    def save_booking(self, booking_dict: Dict[str, Any]) -> str:
        data = self._read_data(self.bookings_file)
        bid = booking_dict.get("booking_id") or str(uuid.uuid4())
        booking_dict["booking_id"] = bid
        booking_dict["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
        booking_dict["status"] = "confirmed"
        data[bid] = booking_dict
        self._write_data(self.bookings_file, data)
        return bid

    def list_bookings(self, email: Optional[str] = None) -> List[Dict[str, Any]]:
        items = list(self._read_data(self.bookings_file).values())
        if email:
            items = [b for b in items if self._key(b.get("user_email", "")) == self._key(email)]
        return sorted(items, key=lambda b: b.get("created_at", ""), reverse=True)

    # Each signed-in user's saved plan (assessment summary and the plan they chose)
    @staticmethod
    def _key(email: str) -> str:
        return (email or "").strip().lower()

    def save_my_plan(self, email: str, plan: Dict[str, Any]) -> Dict[str, Any]:
        data = self._read_data(self.my_plans_file)
        key = self._key(email)
        merged = {**data.get(key, {}), **plan, "email": key, "updated_at": datetime.now().isoformat(timespec="seconds")}
        data[key] = merged
        self._write_data(self.my_plans_file, data)
        return merged

    def get_my_plan(self, email: str) -> Optional[Dict[str, Any]]:
        return self._read_data(self.my_plans_file).get(self._key(email))

    def delete_my_plan_choice(self, email: str) -> bool:
        data = self._read_data(self.my_plans_file)
        key = self._key(email)
        if key not in data:
            return False
        data[key].pop("plan", None)
        data[key]["updated_at"] = datetime.now().isoformat(timespec="seconds")
        self._write_data(self.my_plans_file, data)
        return True

    def cancel_booking(self, booking_id: str) -> Optional[Dict[str, Any]]:
        data = self._read_data(self.bookings_file)
        if booking_id not in data:
            return None
        data[booking_id]["status"] = "cancelled"
        self._write_data(self.bookings_file, data)
        return data[booking_id]

storage_service = StorageService()
