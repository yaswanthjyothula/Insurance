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
        self.policies_file = os.path.join(DATA_DIR, "policies.json")
        self.vault_file = os.path.join(DATA_DIR, "vault.json")
        self._init_files()

    def _init_files(self):
        for f in [self.assessments_file, self.scenarios_file, self.bookings_file, self.policies_file, self.vault_file]:
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

    def list_bookings(self) -> List[Dict[str, Any]]:
        data = self._read_data(self.bookings_file)
        return list(data.values())

    # User declared policies
    def save_policy(self, policy_dict: Dict[str, Any]) -> str:
        data = self._read_data(self.policies_file)
        pid = policy_dict.get("policy_id") or str(uuid.uuid4())
        policy_dict["policy_id"] = pid
        policy_dict["created_at"] = datetime.now().isoformat()
        data[pid] = policy_dict
        self._write_data(self.policies_file, data)
        return pid

    def list_policies(self) -> List[Dict[str, Any]]:
        data = self._read_data(self.policies_file)
        return list(data.values())

    # Vault documents
    def save_vault_item(self, doc_dict: Dict[str, Any]) -> str:
        data = self._read_data(self.vault_file)
        doc_id = doc_dict.get("doc_id") or str(uuid.uuid4())
        doc_dict["doc_id"] = doc_id
        doc_dict["uploaded_at"] = datetime.now().isoformat()
        data[doc_id] = doc_dict
        self._write_data(self.vault_file, data)
        return doc_id

    def list_vault_items(self) -> List[Dict[str, Any]]:
        data = self._read_data(self.vault_file)
        return list(data.values())

    def delete_vault_item(self, doc_id: str) -> bool:
        data = self._read_data(self.vault_file)
        if doc_id in data:
            del data[doc_id]
            self._write_data(self.vault_file, data)
            return True
        return False

storage_service = StorageService()
