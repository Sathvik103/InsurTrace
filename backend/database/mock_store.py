import uuid
import datetime
from typing import Dict, List, Any, Optional

class MockResponse:
    def __init__(self, data: List[Dict[str, Any]]):
        self.data = data

class TableQueryBuilder:
    def __init__(self, store: "MockDatabaseStore", table_name: str):
        self.store = store
        self.table_name = table_name
        self.selected_fields = "*"
        self.filters = []
        self.limit_val: Optional[int] = None
        self.operation = "SELECT"
        self.update_payload: Optional[Dict[str, Any]] = None
        self.insert_payload: Optional[Any] = None

    def select(self, fields: str = "*"):
        self.selected_fields = fields
        return self

    def eq(self, field: str, value: Any):
        self.filters.append(("EQ", field, value))
        return self

    def in_(self, field: str, values: List[Any]):
        self.filters.append(("IN", field, set(values)))
        return self

    def limit(self, count: int):
        self.limit_val = count
        return self

    def insert(self, data: Any):
        self.operation = "INSERT"
        self.insert_payload = data
        return self

    def update(self, data: Dict[str, Any]):
        self.operation = "UPDATE"
        self.update_payload = data
        return self

    def delete(self):
        self.operation = "DELETE"
        return self

    def _matches_filters(self, item: Dict[str, Any]) -> bool:
        for op, field, val in self.filters:
            if op == "EQ":
                if item.get(field) != val:
                    return False
            elif op == "IN":
                if item.get(field) not in val:
                    return False
        return True

    def _enrich_relations(self, rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if "policies(vehicle_id)" in self.selected_fields:
            for r in rows:
                pol_id = r.get("policy_id")
                pol = next((p for p in self.store.tables["policies"] if p.get("id") == pol_id), {})
                r["policies"] = {"vehicle_id": pol.get("vehicle_id")}
        if "organizations(name)" in self.selected_fields:
            for r in rows:
                org_id = r.get("organization_id") or r.get("requesting_org_id")
                org = next((o for o in self.store.tables["organizations"] if o.get("id") == org_id), {})
                r["organizations"] = {"name": org.get("name", "Insurer / Garage")}
        if "profiles(full_name)" in self.selected_fields:
            for r in rows:
                prof_id = r.get("owner_profile_id")
                prof = next((p for p in self.store.tables["profiles"] if p.get("id") == prof_id), {})
                r["profiles"] = {"full_name": prof.get("full_name", "Registered Owner")}
        return rows

    def execute(self) -> MockResponse:
        table = self.store.tables.setdefault(self.table_name, [])

        if self.operation == "SELECT":
            matched = [dict(item) for item in table if self._matches_filters(item)]
            enriched = self._enrich_relations(matched)
            if self.limit_val is not None:
                enriched = enriched[:self.limit_val]
            return MockResponse(enriched)

        elif self.operation == "INSERT":
            items = self.insert_payload if isinstance(self.insert_payload, list) else [self.insert_payload]
            inserted = []
            for item in items:
                new_row = dict(item)
                if "id" not in new_row:
                    new_row["id"] = str(uuid.uuid4())
                if "created_at" not in new_row:
                    new_row["created_at"] = datetime.datetime.utcnow().isoformat() + "Z"
                table.append(new_row)
                inserted.append(new_row)
            return MockResponse(inserted)

        elif self.operation == "UPDATE":
            updated = []
            for item in table:
                if self._matches_filters(item):
                    item.update(self.update_payload or {})
                    updated.append(dict(item))
            return MockResponse(updated)

        elif self.operation == "DELETE":
            remaining = [item for item in table if not self._matches_filters(item)]
            deleted = [item for item in table if self._matches_filters(item)]
            self.store.tables[self.table_name] = remaining
            return MockResponse(deleted)

        return MockResponse([])


class MockDatabaseStore:
    def __init__(self):
        self.tables: Dict[str, List[Dict[str, Any]]] = {}
        self.seed_defaults()

    def seed_defaults(self):
        # 1. Profiles
        self.tables["profiles"] = [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "role": "ADMIN",
                "organization_id": "00000000-0000-0000-0000-000000000001",
                "email": "admin@insuretrace.in",
                "full_name": "System Administrator"
            },
            {
                "id": "22222222-2222-2222-2222-222222222222",
                "role": "POLICYHOLDER",
                "organization_id": "00000000-0000-0000-0000-000000000002",
                "email": "user@example.com",
                "full_name": "Rahul Sharma"
            },
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "role": "GARAGE",
                "organization_id": "00000000-0000-0000-0000-000000000003",
                "email": "garage@repair.com",
                "full_name": "Quality Garage Works"
            },
            {
                "id": "44444444-4444-4444-4444-444444444444",
                "role": "INSURER",
                "organization_id": "00000000-0000-0000-0000-000000000004",
                "email": "claims@hdfcergo.com",
                "full_name": "HDFC ERGO Claims Desk"
            },
            {
                "id": "55555555-5555-5555-5555-555555555555",
                "role": "SURVEYOR",
                "organization_id": "00000000-0000-0000-0000-000000000005",
                "email": "surveyor@irda-licence.in",
                "full_name": "Licensed Motor Surveyor"
            }
        ]

        # 2. Organizations
        self.tables["organizations"] = [
            {"id": "00000000-0000-0000-0000-000000000001", "name": "InsureTrace Core Admin", "type": "REGULATOR"},
            {"id": "00000000-0000-0000-0000-000000000002", "name": "Retail Policyholders", "type": "INDIVIDUAL"},
            {"id": "00000000-0000-0000-0000-000000000003", "name": "Quality Garage & Bodyworks", "type": "GARAGE"},
            {"id": "00000000-0000-0000-0000-000000000004", "name": "HDFC ERGO General Insurance", "type": "INSURER"},
            {"id": "00000000-0000-0000-0000-000000000005", "name": "National Motor Surveyors Council", "type": "SURVEYOR"}
        ]

        # 3. Vehicles
        self.tables["vehicles"] = [
            {
                "id": "V-REAL-101",
                "registration_number": "MH02CB1234",
                "make": "Hyundai",
                "model": "Creta SX",
                "manufacture_year": 2021,
                "vin": "MALC341CBM0010192",
                "created_at": "2021-05-10T10:00:00Z"
            }
        ]

        # 4. Ownership History
        self.tables["ownership_history"] = [
            {
                "id": "OWN-001",
                "vehicle_id": "V-REAL-101",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "start_date": "2021-05-10",
                "created_at": "2021-05-10T10:05:00Z"
            }
        ]

        # 5. Policies
        self.tables["policies"] = [
            {
                "id": "POL-REAL-101",
                "vehicle_id": "V-REAL-101",
                "policyholder_id": "22222222-2222-2222-2222-222222222222",
                "organization_id": "00000000-0000-0000-0000-000000000004",
                "policy_number": "2311/2004/99812/00/000",
                "policy_type": "COMPREHENSIVE",
                "idv": 650000.0,
                "compulsory_deductible": 1000.0,
                "ncb_percentage": 25,
                "zero_depreciation_addon": False,
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "created_at": "2026-01-01T00:00:00Z"
            }
        ]

        # 6. Claims
        self.tables["claims"] = [
            {
                "id": "CLM-999",
                "policy_id": "POL-REAL-101",
                "vehicle_id": "V-REAL-101",
                "accident_id": "ACC-2026-001",
                "estimated_repair_cost": 45000.0,
                "status": "PENDING_SURVEY",
                "created_at": "2026-09-18T18:20:00Z",
                "updated_at": "2026-09-18T18:20:00Z"
            }
        ]

        # 7. Ledger References
        self.tables["ledger_references"] = [
            {
                "id": "LEDGER-CLM-999",
                "entity_id": "CLM-999",
                "entity_table": "claims",
                "event_type": "CLAIM_CREATED",
                "local_data_hash": "3a3267bb774c1dea18b84aaa30c9173444e67c817a57e3e108ab767d45e28d5f",
                "sync_status": "COMMITTED",
                "blockchain_tx_id": "e14646ae3aa8e7abca324f525aac9e91e632372ba6999e9f1654259885b7488f",
                "org_id": "00000000-0000-0000-0000-000000000001",
                "created_at": "2026-09-18T18:20:00Z"
            }
        ]

        # 8. Consents
        self.tables["consents"] = [
            {
                "id": "CON-001",
                "vehicle_id": "V-REAL-101",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "requesting_org_id": "00000000-0000-0000-0000-000000000003",
                "valid_until": "2027-01-01T00:00:00Z",
                "created_at": "2026-01-02T10:00:00Z"
            }
        ]

        # 9. Documents
        self.tables["documents"] = []

        # 10. Audit Logs
        self.tables["audit_logs"] = []

        # 11. ML Predictions
        self.tables["ml_predictions"] = []

    def table(self, name: str) -> TableQueryBuilder:
        return TableQueryBuilder(self, name)

mock_db = MockDatabaseStore()
