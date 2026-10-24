"""
Generates golden vectors from the Python claim engine for the in-browser port
(frontend/src/lib/engine.ts). Run after any engine change, then
`npm run test:engine` in frontend/.
"""
import datetime
import itertools
import json
import math
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.financial_engine.calculator import calculate_decision  # noqa: E402
from services.financial_engine.models import ClaimDecisionInput, PolicyInfo, RepairItem, VehicleInfo  # noqa: E402

OUT = Path(__file__).resolve().parents[2] / "frontend" / "scripts" / "engine-golden.json"
CATS = ["metal", "plastic", "glass", "fiberglass", "labour", "consumables", "rubber"]


def case(age, idv, ded, ncb, zd, items, premium):
    inp = ClaimDecisionInput(
        vehicle=VehicleInfo(age_years=age),
        policy=PolicyInfo(idv=idv, deductible=ded, ncb_percentage=ncb, zero_depreciation_addon=zd,
                          policy_start_date=datetime.date(2026, 1, 1)),
        repair_items=[RepairItem(category=c, cost=v) for c, v in items],
        estimated_base_premium_next_year=premium,
    )
    out = calculate_decision(inp).model_dump()
    out.pop("timestamp")
    if math.isinf(out["break_even_threshold"]):
        out["break_even_threshold"] = "Infinity"
    return {"input": {"vehicle": {"age_years": age},
                      "policy": {"idv": idv, "deductible": ded, "ncb_percentage": ncb, "zero_depreciation_addon": zd},
                      "repair_items": [{"category": c, "cost": v} for c, v in items],
                      "estimated_base_premium_next_year": premium},
            "output": out}


cases = []
# Every age band boundary x NCB slab x zero-dep, with a mixed bill.
for age, ncb, zd in itertools.product([0.3, 0.5, 0.8, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 7, 10, 12], [0, 20, 25, 35, 45, 50], [False, True]):
    cases.append(case(age, 600000, 1000, ncb, zd, [("metal", 24500), ("plastic", 18000), ("glass", 9500), ("labour", 6000)], 14000))
# Edge cases: tiny bills, IDV cap, high deductible, all-consumables, empty.
cases += [
    case(2, 600000, 1000, 35, False, [("plastic", 500)], 14000),
    case(2, 50000, 1000, 20, False, [("metal", 400000)], 9000),
    case(1, 600000, 15000, 50, False, [("metal", 12000)], 20000),
    case(6, 300000, 2000, 25, True, [("consumables", 8000)], 7000),
    case(3, 600000, 1000, 0, False, [], 12000),
]
rng = random.Random(7)
for _ in range(120):
    items = [(rng.choice(CATS), round(rng.uniform(300, 90000), 2)) for _ in range(rng.randint(1, 6))]
    cases.append(case(round(rng.uniform(0, 14), 2), rng.choice([150000, 400000, 650000, 1200000]),
                      rng.choice([1000, 2000, 5000]), rng.choice([0, 20, 25, 35, 45, 50]), rng.random() < 0.3,
                      items, rng.choice([6000, 11000, 15000, 24000])))

OUT.write_text(json.dumps(cases, separators=(",", ":")))
print(f"wrote {len(cases)} cases to {OUT}")
