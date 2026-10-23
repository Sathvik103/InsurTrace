"""
Generates the fictional SAMPLE documents offered on the Documents page
(frontend/public/samples). They exist so people can try extraction without
uploading their own papers. Every page is watermarked SAMPLE; the insurer,
policyholder and workshop are invented.

Run: python scripts/make_sample_documents.py
"""
from pathlib import Path

import pymupdf as fitz

OUT = Path(__file__).resolve().parents[2] / "frontend" / "public" / "samples"
NAVY = (0.07, 0.10, 0.19)
GREY = (0.35, 0.40, 0.50)


def page_with_header(doc, title):
    page = doc.new_page(width=595, height=842)
    page.insert_text((180, 470), "SAMPLE", fontsize=110, color=(0.93, 0.94, 0.97), rotate=0)
    page.insert_text((40, 50), title, fontsize=18, color=NAVY)
    page.insert_text((40, 68), "FICTIONAL SAMPLE DOCUMENT - NOT A REAL POLICY OR QUOTE - FOR TRYING VERISURE ONLY", fontsize=7.5, color=GREY)
    page.draw_line((40, 78), (555, 78), color=GREY, width=0.6)
    return page


def policy():
    doc = fitz.open()
    p = page_with_header(doc, "Sample General Insurance Co. (fictional)")
    lines = [
        "Private Car Package Policy - Policy Schedule",
        "",
        "Policy Number: SGI/2026/PC/0048213",
        "Insured: A. Sample Owner",
        "Vehicle Registration No: KA05MN4821",
        "Make / Model: Maruti Suzuki Baleno Zeta  |  Year of manufacture: 2023",
        "Period of Insurance: 12-03-2026 to 11-03-2027",
        "",
        "Insured Declared Value (IDV): 6,85,000.00",
        "No Claim Bonus (NCB): 25 %",
        "Compulsory Deductible: 1000",
        "Add-on covers: Roadside assistance",
        "",
        "Own Damage premium (before NCB): 15,200.00",
        "Third Party premium: 3,416.00",
    ]
    y = 110
    for line in lines:
        p.insert_text((40, y), line, fontsize=11, color=NAVY)
        y += 20
    doc.save(OUT / "sample-policy-schedule.pdf")


def estimate():
    doc = fitz.open()
    p = page_with_header(doc, "Sample Auto Works (fictional workshop)")
    p.insert_text((40, 105), "Repair Estimate  |  Vehicle: KA05MN4821  |  Date: 18-10-2026", fontsize=11, color=NAVY)
    rows = [
        ("Description", "Qty", "Amount"),
        ("Front Bumper (replace)", "1", "14800.00"),
        ("Headlamp Assembly LH", "1", "9600.00"),
        ("Bonnet Panel (replace)", "1", "21500.00"),
        ("Windshield Glass", "1", "11200.00"),
        ("Labour and Paint Charges", "1", "7400.00"),
    ]
    x = [40, 360, 430, 555]
    top, h = 125, 26
    for r, row in enumerate(rows):
        yy = top + r * h
        for c, cell in enumerate(row):
            p.insert_text((x[c] + 6, yy + 17), cell, fontsize=10.5, color=NAVY)
    for r in range(len(rows) + 1):
        p.draw_line((x[0], top + r * h), (x[-1], top + r * h), color=GREY, width=0.6)
    for xx in x:
        p.draw_line((xx, top), (xx, top + len(rows) * h), color=GREY, width=0.6)
    yy = top + len(rows) * h + 30
    p.insert_text((40, yy), "Estimate excludes GST. Final amounts subject to surveyor approval.", fontsize=9.5, color=GREY)
    doc.save(OUT / "sample-workshop-estimate.pdf")


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    policy()
    estimate()
    print("written to", OUT)
