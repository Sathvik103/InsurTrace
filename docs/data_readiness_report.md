# REAL-WORLD DATA READINESS REPORT
## InsureTrace India

This report details the availability, legitimacy, and integration readiness of real-world datasets for the ML and intelligence features of InsureTrace India.

### 1. Executive Summary
Adhering to the mandate that InsureTrace must not pretend synthetic models are production-valid, we have conducted an extensive survey of publicly available, legally accessible data relevant to the Indian Motor Insurance market, and extended our search to global datasets.

*Where legitimate labelled data exists, we have prepared the ingestion pipelines. Where it does not, the ML components have been structurally secured to return `UNAVAILABLE_DATA` rather than hallucinating predictions.*

### 2. Readiness Matrix

| Component | Real source found | Accessible | Suitable | Integrated |
| :--- | :--- | :--- | :--- | :--- |
| **Policy documents** | Yes (IRDAI Std Wordings) | Yes (Public PDFs) | Yes | Yes (Pipeline ready) |
| **Vehicle data** | Yes (Vahan/Parivahan) | No (Gated/Paid APIs) | Yes | No (Adapter built) |
| **Repair pricing** | Yes (Audatex/OEMs) | No (Proprietary/Closed) | Yes | No (Adapter built) |
| **Claims (Severity)** | No (Aggregated only) | No (PII Restricted) | No | No (Model stubbed) |
| **Fraud/anomaly** | No (IIB Registry) | No (Restricted to Insurers) | No | No (Model stubbed) |
| **Damage images** | Yes (Open Kaggle/COCO) | Yes (CC Licenses) | Partial | No (Outside current scope) |
| **OCR/document processing** | Yes (pdfplumber/PyMuPDF) | Yes (Open-Source) | Yes (Text Extraction) | Yes (Structural pipeline) |

### 3. Source Investigations & Licensing

#### A. Document Processing / OCR (Open Source)
*   **Sources Investigated:** PyMuPDF, pdfplumber, Tesseract.
*   **Integrated:** `pdfplumber` and `PyMuPDF` have been integrated into `backend/services/document_processing/extractor.py`.
*   **Status:** Working locally without paid APIs. Extracts text and bounds successfully from PDFs.

#### B. Motor Policy Documents
*   **Source:** IRDAI Standard Motor Package Policy wordings & Insurer Public Disclosures.
*   **Status:** Publicly accessible PDFs. Real-world data.
*   **Integration:** We have built the extraction engine (`extractor.py`) to parse these into our Pydantic schemas. 

#### C. Vehicle Registration Data (Vahan/Parivahan)
*   **Source:** MoRTH / Vahan database.
*   **Status:** Legitimate, but strictly gated. APIs require KYC and commercial agreements. 
*   **Integration:** We built the schema `IngestedVehicleData` to act as the standard interface.

#### D. Repair Parts & Pricing
*   **Source:** Audatex India, DAT India, OEM Proprietary Catalogs.
*   **Status:** Completely closed and proprietary. 
*   **Integration:** Built `RepairEstimateParser` with an `external_pricing_adapter` interface. 

#### E. Claims, Severity & Admissibility
*   **Source:** Insurance Information Bureau of India (IIB).
*   **Status:** IIB strictly protects row-level claim histories (PII). 
*   **Integration:** `SeverityPredictor` is structurally complete but forces an `UNAVAILABLE_DATA` response.

#### F. Fraud & Anomaly Datasets
*   **Source:** IIB Fraud Registry.
*   **Status:** Strictly gated to member insurers only.
*   **Integration:** `FraudScorer` remains an architectural stub.

### 4. Global ML Dataset Addendum
To avoid blocking the ML architecture, we investigated global public datasets for experimental use:

*   **Vehicle Damage Assessment (Images):** 
    *   *Dataset:* COCO-Vehicle-Damage (Open Kaggle).
    *   *Suitability:* Partially Suitable. Global car damages (dents, scratches) are visually analogous to Indian damages. 
    *   *Limitation:* Does not reflect Indian-specific contexts (auto-rickshaws). Can be used to train an experimental `DamageDetector` model.
*   **Claim Severity / Admissibility:** 
    *   *Dataset:* French Motor Claims Dataset / Allstate Claims (Kaggle).
    *   *Suitability:* NOT SUITABLE for Indian context. 
    *   *Limitation:* European/US legal frameworks, and repair networks drastically differ from the Indian Motor Vehicles Act. Training an Indian admissibility engine on US litigation patterns is fundamentally invalid. These models must remain DATA-LIMITED stubs.
*   **Fraud Detection:** 
    *   *Dataset:* Vehicle Insurance Fraud Dataset (Generic Kaggle data).
    *   *Suitability:* NOT SUITABLE.
    *   *Limitation:* Synthetic fraud behavior does not match actual Indian organized fraud syndicates. Model remains UNTRAINED.
