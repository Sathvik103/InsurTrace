# REAL-WORLD DATA READINESS REPORT
## InsureTrace India

This report details the availability, legitimacy, and integration readiness of real-world datasets for the ML and intelligence features of InsureTrace India.

### 1. Executive Summary
Adhering to the mandate that InsureTrace must not pretend synthetic models are production-valid, we have conducted an extensive survey of publicly available, legally accessible data relevant to the Indian Motor Insurance market.

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
*   **Limitations:** Pure text extraction works perfectly for digitally generated PDFs (standard wordings).

#### B. Motor Policy Documents
*   **Source:** IRDAI Standard Motor Package Policy wordings & Insurer Public Disclosures.
*   **Status:** Publicly accessible PDFs. Real-world data.
*   **Integration:** We have built the extraction engine (`extractor.py`) to parse these into our Pydantic schemas. 

#### C. Vehicle Registration Data (Vahan/Parivahan)
*   **Source:** Ministry of Road Transport and Highways (MoRTH) / Vahan database.
*   **Status:** Legitimate, but strictly gated. Official APIs require extensive KYC and commercial agreements. Third-party gateways (SurePass, Karza) exist but are paid.
*   **Integration:** We built the schema `IngestedVehicleData` to act as the standard interface, but we cannot scrape Vahan for free without violating Terms of Service.

#### D. Repair Parts & Pricing
*   **Source:** Audatex India, DAT India, OEM Proprietary Catalogs.
*   **Status:** Completely closed and proprietary. No open-source, row-level Indian auto-parts pricing dataset exists.
*   **Integration:** Built `RepairEstimateParser` with an `external_pricing_adapter` interface. We remain blocked from training a pricing model due to lack of open data.

#### E. Claims, Severity & Admissibility
*   **Source:** Insurance Information Bureau of India (IIB).
*   **Status:** IIB publishes excellent aggregate statistics, but strictly protects row-level claim histories (PII). There is no legally obtainable, open-source dataset of Indian motor claims.
*   **Integration:** `SeverityPredictor` is structurally complete but forces an `UNAVAILABLE_DATA` response, adhering to the rule against fabricating ML on synthetic data.

#### F. Fraud & Anomaly Datasets
*   **Source:** IIB Fraud Registry.
*   **Status:** Strictly gated to member insurers only.
*   **Integration:** `FraudScorer` remains an architectural stub.

#### G. Vehicle Damage Assessment (Images)
*   **Source:** Kaggle (Car Damage Assessment Datasets).
*   **Status:** Accessible under various CC licenses. Universal applicability (car damage looks similar globally).
*   **Integration:** Not integrated in this phase, as the priority was backend NLP/numerical intelligence, but data *is* available if requested for Phase 6.

### 4. ML Architecture & State
*   **Pipeline:** Built `backend/services/ml_engine/pipeline.py`.
*   **Provenance:** All data ingestion is governed by `ProvenanceMetadata` (Source, License, Real vs Synthetic).
*   **Current State:** `FraudScorer` and `SeverityPredictor` operate as interfaces. They currently return `UNAVAILABLE_DATA` because the required legitimate datasets have not yet been mounted.

### 5. Git Status
All architectures have been successfully committed to the local `main` branch. GitHub remote (`origin`) remains pending authorization.
