# SRF Document Number Storage Guide

## Overview
SRF document numbers are stored in two tables for different purposes.

## Document Format
`{Number}/SRF/{Factory}/{Category}/{RomanMonth}/{Year}`

Example: `003/SRF/CBT/RM/I/2026`

---

## Storage Strategy

### 1. Full String (`t_ticket_work_data`)
| Field | Value |
|-------|-------|
| ticket_id | 260610040001 |
| field_name | srf_document_number |
| field_value | 003/SRF/CBT/RM/I/2026 |
| service_id | 6 |

**Purpose**: Display, queries, PDF generation.

---

### 2. Components (`t_ticket_doc_no`)
Each document creates **7 rows** for historical tracking:

| ticket_id | lbl_col | cstm_col | service_id |
|-----------|---------|----------|------------|
| 260610040001 | number | 003 | 6 |
| 260610040001 | Document | SRF | 6 |
| 260610040001 | Factory | CBT | 6 |
| 260610040001 | Category | RM | 6 |
| 260610040001 | Month | I | 6 |
| 260610040001 | Year | 2026 | 6 |
| 260610040001 | factory_id | 1 | 6 |

**Purpose**: Historical logging, analytics, race-condition prevention via transaction locking.

---

## Transaction Safety
The `saveSRFDocumentNumber` endpoint uses:
1. `START TRANSACTION`
2. `FOR UPDATE` lock on counting query
3. Delete existing components → Insert new ones
4. `COMMIT`

This prevents duplicate or missing numbers during concurrent saves.
