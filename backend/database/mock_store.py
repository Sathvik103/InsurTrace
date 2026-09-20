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
        # =====================================================================
        # EXPLICITLY ISOLATED DEMO & DEVELOPMENT TEST FIXTURES
        # Strictly for offline evaluation, unit testing, and sandbox simulation.
        # NEVER loaded in production when connected to production Supabase.
        # =====================================================================
        
        # 1. Profiles (Demo Personas)
        self.tables["profiles"] = [
            {
                "id": "11111111-1111-1111-1111-111111111111",
                "role": "ADMIN",
                "organization_id": "00000000-0000-0000-0000-000000000001",
                "email": "demo-admin@verisure.in",
                "full_name": "Demo System Administrator"
            },
            {
                "id": "22222222-2222-2222-2222-222222222222",
                "role": "POLICYHOLDER",
                "organization_id": "00000000-0000-0000-0000-000000000002",
                "email": "demo-policyholder@verisure.in",
                "full_name": "Rahul Sharma (Demo)"
            },
            {
                "id": "33333333-3333-3333-3333-333333333333",
                "role": "GARAGE",
                "organization_id": "00000000-0000-0000-0000-000000000003",
                "email": "demo-garage@verisure.in",
                "full_name": "Demo Authorized Workshop"
            },
            {
                "id": "44444444-4444-4444-4444-444444444444",
                "role": "INSURER",
                "organization_id": "00000000-0000-0000-0000-000000000004",
                "email": "demo-insurer@verisure.in",
                "full_name": "Demo Insurer Claims Desk"
            },
            {
                "id": "55555555-5555-5555-5555-555555555555",
                "role": "SURVEYOR",
                "organization_id": "00000000-0000-0000-0000-000000000005",
                "email": "demo-surveyor@verisure.in",
                "full_name": "Demo Motor Loss Assessor"
            }
        ]

        # 2. Organizations
        self.tables["organizations"] = [
            {"id": "00000000-0000-0000-0000-000000000001", "name": "VeriSure Consortium Governance", "type": "ADMIN"},
            {"id": "00000000-0000-0000-0000-000000000002", "name": "Demo Policyholders Group", "type": "POLICYHOLDER"},
            {"id": "00000000-0000-0000-0000-000000000003", "name": "Quality Auto Care Workshop", "type": "GARAGE"},
            {"id": "00000000-0000-0000-0000-000000000004", "name": "Demo General Insurance Ltd", "type": "INSURER"},
            {"id": "00000000-0000-0000-0000-000000000005", "name": "Demo Independent Assessors Guild", "type": "SURVEYOR"}
        ]

        # 3. Vehicles (Multi-Segment Fleet)
        self.tables["vehicles"] = [
            {
                "id": "V-REAL-101",
                "registration_number": "MH02CB1234",
                "make": "Hyundai",
                "model": "Creta",
                "variant": "SX (O)",
                "manufacture_year": 2021,
                "vin": "MALC341CBM0010192",
                "fuel_type": "Petrol",
                "usage_type": "PERSONAL",
                "is_demo": True,
                "created_at": "2021-05-10T10:00:00Z"
            },
            {
                "id": "V-REAL-102",
                "registration_number": "KA01MJ5678",
                "make": "Tata",
                "model": "Nexon EV",
                "variant": "Fearless+",
                "manufacture_year": 2024,
                "vin": "MAT612015N0023411",
                "fuel_type": "Electric",
                "usage_type": "PERSONAL",
                "is_demo": True,
                "created_at": "2024-02-14T09:30:00Z"
            },
            {
                "id": "V-REAL-103",
                "registration_number": "DL04AA9999",
                "make": "Maruti Suzuki",
                "model": "Swift",
                "variant": "ZXi+",
                "manufacture_year": 2022,
                "vin": "MA3EKB11SM0098231",
                "fuel_type": "Petrol",
                "usage_type": "PERSONAL",
                "is_demo": True,
                "created_at": "2022-08-20T11:15:00Z"
            },
            {
                "id": "V-REAL-104",
                "registration_number": "TS09EZ4321",
                "make": "Honda",
                "model": "City",
                "variant": "ZX e:HEV",
                "manufacture_year": 2023,
                "vin": "MAKGM6680N0045129",
                "fuel_type": "Hybrid",
                "usage_type": "PERSONAL",
                "is_demo": True,
                "created_at": "2023-04-05T14:45:00Z"
            },
            {
                "id": "V-COMM-201",
                "registration_number": "KA04C8821",
                "make": "Mahindra",
                "model": "Bolero Maxi Truck",
                "variant": "Plus CNG",
                "manufacture_year": 2023,
                "vin": "MA1XX8821N0091244",
                "fuel_type": "CNG / Diesel",
                "usage_type": "GOODS_CARRIER",
                "permit_info": "All-India National Goods Permit",
                "fitness_valid_until": "2027-04-30",
                "downtime_cost_per_day": 3500.0,
                "is_demo": True,
                "created_at": "2023-06-12T08:00:00Z"
            },
            {
                "id": "V-COMM-202",
                "registration_number": "DL01T4501",
                "make": "Maruti Suzuki",
                "model": "Dzire Tour S",
                "variant": "Std Commercial",
                "manufacture_year": 2024,
                "vin": "MA3TOUR4501P003299",
                "fuel_type": "CNG",
                "usage_type": "TAXI",
                "permit_info": "Delhi NCR Taxi Permit",
                "fitness_valid_until": "2026-12-15",
                "downtime_cost_per_day": 2200.0,
                "is_demo": True,
                "created_at": "2024-01-20T10:00:00Z"
            }
        ]

        # 4. Ownership History (Associated with Rahul Sharma for Demo)
        self.tables["ownership_history"] = [
            {
                "id": "OWN-001",
                "vehicle_id": "V-REAL-101",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "start_date": "2021-05-10",
                "created_at": "2021-05-10T10:05:00Z"
            },
            {
                "id": "OWN-002",
                "vehicle_id": "V-REAL-102",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "start_date": "2024-02-14",
                "created_at": "2024-02-14T09:35:00Z"
            },
            {
                "id": "OWN-003",
                "vehicle_id": "V-REAL-103",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "start_date": "2022-08-20",
                "created_at": "2022-08-20T11:20:00Z"
            },
            {
                "id": "OWN-004",
                "vehicle_id": "V-REAL-104",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "start_date": "2023-04-05",
                "created_at": "2023-04-05T14:50:00Z"
            },
            {
                "id": "OWN-005",
                "vehicle_id": "V-COMM-201",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "start_date": "2023-06-12",
                "created_at": "2023-06-12T08:05:00Z"
            },
            {
                "id": "OWN-006",
                "vehicle_id": "V-COMM-202",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "start_date": "2024-01-20",
                "created_at": "2024-01-20T10:05:00Z"
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
            },
            {
                "id": "POL-REAL-102",
                "vehicle_id": "V-REAL-102",
                "policyholder_id": "22222222-2222-2222-2222-222222222222",
                "organization_id": "00000000-0000-0000-0000-000000000004",
                "policy_number": "3104/5521/11029/01/000",
                "policy_type": "COMPREHENSIVE_ZERO_DEP",
                "idv": 1420000.0,
                "compulsory_deductible": 2000.0,
                "ncb_percentage": 0,
                "zero_depreciation_addon": True,
                "start_date": "2026-02-15",
                "end_date": "2027-02-14",
                "created_at": "2026-02-15T00:00:00Z"
            },
            {
                "id": "POL-REAL-103",
                "vehicle_id": "V-REAL-103",
                "policyholder_id": "22222222-2222-2222-2222-222222222222",
                "organization_id": "00000000-0000-0000-0000-000000000004",
                "policy_number": "1809/4412/88219/00/000",
                "policy_type": "COMPREHENSIVE",
                "idv": 480000.0,
                "compulsory_deductible": 1000.0,
                "ncb_percentage": 35,
                "zero_depreciation_addon": False,
                "start_date": "2025-08-25",
                "end_date": "2026-08-24",
                "created_at": "2025-08-25T00:00:00Z"
            },
            {
                "id": "POL-REAL-104",
                "vehicle_id": "V-REAL-104",
                "policyholder_id": "22222222-2222-2222-2222-222222222222",
                "organization_id": "00000000-0000-0000-0000-000000000004",
                "policy_number": "4210/9981/33410/00/000",
                "policy_type": "COMPREHENSIVE",
                "idv": 950000.0,
                "compulsory_deductible": 1500.0,
                "ncb_percentage": 50,
                "zero_depreciation_addon": True,
                "start_date": "2026-04-10",
                "end_date": "2027-04-09",
                "created_at": "2026-04-10T00:00:00Z"
            },
            {
                "id": "POL-COMM-201",
                "vehicle_id": "V-COMM-201",
                "policyholder_id": "22222222-2222-2222-2222-222222222222",
                "organization_id": "00000000-0000-0000-0000-000000000004",
                "policy_number": "5520/7710/44910/00/000",
                "policy_type": "COMMERCIAL_GOODS_PACKAGE",
                "idv": 580000.0,
                "compulsory_deductible": 2500.0,
                "ncb_percentage": 20,
                "zero_depreciation_addon": False,
                "start_date": "2026-06-15",
                "end_date": "2027-06-14",
                "created_at": "2026-06-15T00:00:00Z"
            },
            {
                "id": "POL-COMM-202",
                "vehicle_id": "V-COMM-202",
                "policyholder_id": "22222222-2222-2222-2222-222222222222",
                "organization_id": "00000000-0000-0000-0000-000000000004",
                "policy_number": "6612/8821/11920/00/000",
                "policy_type": "COMMERCIAL_PASSENGER_TAXI",
                "idv": 620000.0,
                "compulsory_deductible": 1500.0,
                "ncb_percentage": 0,
                "zero_depreciation_addon": True,
                "start_date": "2026-01-25",
                "end_date": "2027-01-24",
                "created_at": "2026-01-25T00:00:00Z"
            }
        ]

        # 6. Claims Across Multiple Lifecycle Stages
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
            },
            {
                "id": "CLM-101",
                "policy_id": "POL-REAL-103",
                "vehicle_id": "V-REAL-103",
                "accident_id": "ACC-2026-002",
                "estimated_repair_cost": 12500.0,
                "status": "SETTLED",
                "created_at": "2026-07-12T14:10:00Z",
                "updated_at": "2026-07-15T11:00:00Z"
            },
            {
                "id": "CLM-102",
                "policy_id": "POL-REAL-102",
                "vehicle_id": "V-REAL-102",
                "accident_id": "ACC-2026-003",
                "estimated_repair_cost": 68000.0,
                "status": "UNDER_REVIEW",
                "created_at": "2026-09-10T10:00:00Z",
                "updated_at": "2026-09-12T16:45:00Z"
            },
            {
                "id": "CLM-103",
                "policy_id": "POL-REAL-104",
                "vehicle_id": "V-REAL-104",
                "accident_id": "ACC-2026-004",
                "estimated_repair_cost": 84500.0,
                "status": "APPROVED",
                "created_at": "2026-08-01T09:15:00Z",
                "updated_at": "2026-08-05T13:30:00Z"
            }
        ]

        # 7. Ledger References (Fabric Hashes & TxIDs)
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
            },
            {
                "id": "LEDGER-CLM-101",
                "entity_id": "CLM-101",
                "entity_table": "claims",
                "event_type": "CLAIM_SETTLED",
                "local_data_hash": "b8f411ce51792de5a19001b6329cbb91a6294d1f2a361e71239851acdb980145",
                "sync_status": "COMMITTED",
                "blockchain_tx_id": "7c92ae498b3f20d18e9531a892b1567ef401824a719234bb582103fca91b8921",
                "org_id": "00000000-0000-0000-0000-000000000004",
                "created_at": "2026-07-15T11:00:00Z"
            },
            {
                "id": "LEDGER-CLM-102",
                "entity_id": "CLM-102",
                "entity_table": "claims",
                "event_type": "CLAIM_SURVEYED",
                "local_data_hash": "5d2b78119ae4c8520a1b946ef280147cb9815024d981240562e841209b52a149",
                "sync_status": "COMMITTED",
                "blockchain_tx_id": "99e1428fa5b602187310d54a24c79801f9241b782903561ec9014529348123ab",
                "org_id": "00000000-0000-0000-0000-000000000005",
                "created_at": "2026-09-12T16:45:00Z"
            },
            {
                "id": "LEDGER-CLM-103",
                "entity_id": "CLM-103",
                "entity_table": "claims",
                "event_type": "CLAIM_APPROVED",
                "local_data_hash": "4fa091e7b2354917a8029c54e198b935cf182046ab819543e0129845ba362091",
                "sync_status": "COMMITTED",
                "blockchain_tx_id": "f82051048b1945196e8194b150923058a91254cb912803456810245196ab1409",
                "org_id": "00000000-0000-0000-0000-000000000004",
                "created_at": "2026-08-05T13:30:00Z"
            }
        ]

        # 8. Consents (DPDP Act Active Grants)
        self.tables["consents"] = [
            {
                "id": "CON-001",
                "vehicle_id": "V-REAL-101",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "requesting_org_id": "00000000-0000-0000-0000-000000000003",
                "valid_until": "2027-01-01T00:00:00Z",
                "created_at": "2026-01-02T10:00:00Z"
            },
            {
                "id": "CON-002",
                "vehicle_id": "V-REAL-102",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "requesting_org_id": "00000000-0000-0000-0000-000000000005",
                "valid_until": "2026-12-31T23:59:59Z",
                "created_at": "2026-02-15T11:00:00Z"
            },
            {
                "id": "CON-003",
                "vehicle_id": "V-REAL-104",
                "owner_profile_id": "22222222-2222-2222-2222-222222222222",
                "requesting_org_id": "00000000-0000-0000-0000-000000000004",
                "valid_until": "2027-04-10T00:00:00Z",
                "created_at": "2026-04-11T09:00:00Z"
            }
        ]

        # 9. Documents
        self.tables["documents"] = [
            {
                "id": "DOC-001",
                "document_type": "POLICY_SCHEDULE",
                "file_path": "/uploads/policies/POL-REAL-101.pdf",
                "file_hash": "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                "extraction_status": "VERIFIED",
                "created_at": "2026-01-01T00:00:00Z"
            },
            {
                "id": "DOC-002",
                "document_type": "ESTIMATE_BILL",
                "file_path": "/uploads/estimates/EST-2026-001.pdf",
                "file_hash": "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
                "extraction_status": "HUMAN_VERIFIED",
                "created_at": "2026-09-18T17:30:00Z"
            }
        ]

        # 10. Audit Logs
        self.tables["audit_logs"] = [
            {
                "id": "AUDIT-001",
                "user_id": "22222222-2222-2222-2222-222222222222",
                "action": "CONSENT_GRANTED",
                "details": "Granted 30-day read access for V-REAL-101 to Quality Auto Care Workshop",
                "created_at": "2026-01-02T10:00:00Z"
            },
            {
                "id": "AUDIT-002",
                "user_id": "44444444-4444-4444-4444-444444444444",
                "action": "CLAIM_LEDGER_COMMITTED",
                "details": "Committed CLM-999 state hash to Hyperledger Fabric channel mychannel",
                "created_at": "2026-09-18T18:20:00Z"
            }
        ]

        # 11. ML Predictions (Data Limited State)
        self.tables["ml_predictions"] = []

    def table(self, name: str) -> TableQueryBuilder:
        return TableQueryBuilder(self, name)

mock_db = MockDatabaseStore()
