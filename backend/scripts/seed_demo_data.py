import uuid
import datetime
import random

def generate_sql():
    sql = []
    sql.append("-- INSURETRACE INDIA DEMO DATA SEED")
    sql.append("-- Execute this in your Supabase SQL Editor")
    sql.append("")

    # IDs
    org_insurer_a = str(uuid.uuid4())
    org_insurer_b = str(uuid.uuid4())
    org_garage = str(uuid.uuid4())

    profile_user_1 = str(uuid.uuid4())
    profile_user_2 = str(uuid.uuid4())

    vehicle_1 = str(uuid.uuid4())
    vehicle_2 = str(uuid.uuid4())
    vehicle_3 = str(uuid.uuid4())

    policy_1 = str(uuid.uuid4())
    policy_2 = str(uuid.uuid4())

    # Organizations
    sql.append(f"INSERT INTO organizations (id, name, org_type) VALUES ('{org_insurer_a}', 'Insurer A', 'INSURER');")
    sql.append(f"INSERT INTO organizations (id, name, org_type) VALUES ('{org_insurer_b}', 'Insurer B', 'INSURER');")
    sql.append(f"INSERT INTO organizations (id, name, org_type) VALUES ('{org_garage}', 'Quality Garage', 'GARAGE');")

    # Profiles (bypassing auth.users FK for demo, assume it's removed or manually mapped)
    sql.append(f"-- Note: Make sure to map these profiles.id to actual auth.users if FK is enforced!")
    sql.append(f"INSERT INTO profiles (id, organization_id, role, full_name, email) VALUES ('{profile_user_1}', NULL, 'POLICYHOLDER', 'Rahul Sharma', 'rahul.demo@example.com');")
    sql.append(f"INSERT INTO profiles (id, organization_id, role, full_name, email) VALUES ('{profile_user_2}', '{org_insurer_a}', 'INSURER', 'Anjali Desk', 'anjali@insurera.com');")

    # Vehicles
    sql.append(f"INSERT INTO vehicles (id, registration_number, make, model, manufacture_year) VALUES ('{vehicle_1}', 'MH-01-AB-1234', 'Hyundai', 'Creta', 2021);")
    sql.append(f"INSERT INTO vehicles (id, registration_number, make, model, manufacture_year) VALUES ('{vehicle_2}', 'DL-4C-XY-9876', 'Maruti', 'Swift', 2018);")
    sql.append(f"INSERT INTO vehicles (id, registration_number, make, model, manufacture_year) VALUES ('{vehicle_3}', 'KA-05-MN-4567', 'Tata', 'Nexon', 2023);")

    # Ownership
    sql.append(f"INSERT INTO ownership_history (vehicle_id, owner_profile_id, start_date) VALUES ('{vehicle_1}', '{profile_user_1}', '2021-05-10');")
    sql.append(f"INSERT INTO ownership_history (vehicle_id, owner_profile_id, start_date) VALUES ('{vehicle_2}', '{profile_user_1}', '2019-01-15');")

    # Policies
    sql.append(f"INSERT INTO policies (id, policy_number, vehicle_id, insurer_org_id, policyholder_id, start_date, end_date, idv_amount, deductible_amount, ncb_percentage) VALUES ('{policy_1}', 'POL-A-1001', '{vehicle_1}', '{org_insurer_a}', '{profile_user_1}', '2025-05-10', '2026-05-09', 800000.0, 2000.0, 35);")
    
    # Write to file
    with open("seed_demo.sql", "w") as f:
        f.write("\n".join(sql))
    print("Generated seed_demo.sql")

if __name__ == "__main__":
    generate_sql()
