# AALCPI MIS - Data Flow Diagrams (DFD)

This folder contains comprehensive Data Flow Diagrams for the AALCPI Management Information System, from Level 0 (context) through Level 3 (detailed processes).

## Diagram Structure

### Level 0: Context Diagram
- **File:** `L0_Context_Diagram.drawio`
- **Description:** High-level system boundary showing interactions between external entities (Users, Excel files, PDF files, Reports) and the AALCPI MIS system as a single black box.

### Level 1: Main Processes
- **File:** `L1_Main_Processes.drawio`
- **Description:** System decomposed into 5 major processes:
  - **P1.0:** Authentication & Authorization
  - **P2.0:** Import & Map Data (Excel/PDF Processing)
  - **P3.0:** Operational Management (Core CRUD operations)
  - **P4.0:** Weekly PDF Processing (Async Python-based)
  - **P5.0:** Report & Certification Generation

### Level 2: Detailed Processes

#### P1.0 - Authentication & Authorization
- **File:** `L2_P1_Authentication.drawio`
- **Sub-processes:**
  - P1.1: Authenticate Credentials
  - P1.2: Check Authorization
  - P1.3: Create Session/Token
  - P1.4: Validate Session
  - P1.5: Account Management
- **Data Stores:** Users, Roles & Permissions, Sessions

#### P2.0 - Import & Map Data
- **File:** `L2_P2_Import_Mapping.drawio`
- **Sub-processes:**
  - P2.1: Upload & Validate File
  - P2.2: Preview Data & Column Mapping
  - P2.3: Apply Mapping Transform Data
  - P2.4: Deduplication & Validation
  - P2.5: Store to Database
- **Data Stores:** Import Mappings, Planter/Production Data, Import Logs

#### P3.0 - Operational Management
- **File:** `L2_P3_Operational_Management.drawio`
- **Sub-processes:**
  - P3.1: Planter Management
  - P3.2: Hacienda Management
  - P3.3: Production Management
  - P3.4: Employee Management
  - P3.5: Milling Period Management
- **Data Stores:** Planters, Haciendas, Productions, Employees, Milling Periods

#### P4.0 - Weekly PDF Processing
- **File:** `L2_P4_Weekly_PDF_Processing.drawio`
- **Sub-processes:**
  - P4.1: Upload PDF & Queue Job
  - P4.2: Async Job Process (Queue)
  - P4.3: Python Script PDF Processing
  - P4.4: Split & Extract Data from PDF
  - P4.5: Parse Extracted Data to JSON
  - P4.6: Store Output Files
  - P4.7: Store Weekly Records
- **Data Stores:** Temp Storage, Public Storage, Weekly Records

#### P5.0 - Report & Certification Generation
- **File:** `L2_P5_Report_Generation.drawio`
- **Sub-processes:**
  - P5.1: Query Production Data
  - P5.2: Retrieve Related Data
  - P5.3: Calculate Financial Data
  - P5.4: Generate PDF Report
  - P5.5: Prepare Download/Bulk Export
- **Data Stores:** Productions, Planters, Haciendas, Milling Periods, Report Storage

### Level 3: Sub-Process Details

#### P3.3 - Production Management (Detailed)
- **File:** `L3_P3_3_Production_Management.drawio`
- **Operations:**
  - P3.3.1: View Productions List
  - P3.3.2: Filter by Crop Year/Criteria
  - P3.3.3: Search Productions
  - P3.3.4: Create New Production
  - P3.3.5: Update Production Data
  - P3.3.6: Calculate Financial Data
  - P3.3.7: Delete Production
  - P3.3.8: Bulk Download/Export
- **Related Data Stores:** Productions, Planters, Haciendas, Milling Periods

#### P3.4 - Employee & Payroll Management (Detailed)
- **File:** `L3_P3_4_Employee_Payroll.drawio`
- **Operations:**
  - P3.4.1: Employee CRUD Operations
  - P3.4.2: Import Attendance Data (from Excel)
  - P3.4.3: View Attendance Records
  - P3.4.4: Calculate Payroll
  - P3.4.5: Generate Payslips
- **Related Data Stores:** Employees, Attendance, Payroll

## How to Open Files

All files are in **draw.io format** (.drawio) and can be opened with:
- [draw.io](https://www.draw.io/) (Online version)
- [VS Code draw.io extension](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)
- Desktop draw.io application

## Color Coding Legend

### Entities & Processes
- **Light Green (50E3C2):** External Entities (Users)
- **Orange (F5A623):** External Data Sources (Excel, PDF files)
- **Blue (4A90E2, 4ECDC4, 45B7D1, FFA07A, 98D8C8):** Processes (by type)
- **Yellow (F7DC6F):** Data Stores
- **Light Blue (B0E0E6):** UI/Interface components

### Process Types
- **Red (FF6B6B):** Authentication & Security
- **Teal (4ECDC4):** Data Import & Mapping
- **Blue (45B7D1):** Operational Management
- **Salmon (FFA07A):** PDF Processing
- **Mint (98D8C8):** Report Generation

## Data Flow Conventions

- **Arrows:** Show direction of data flow between entities, processes, and data stores
- **Labels:** Indicate the type or description of data being transferred
- **Dashed/Solid Lines:** Generally solid lines used throughout

## Key System Characteristics

### High-Level Features
- **Multi-user with Role-based Access Control** (Manager, Certification Officer)
- **Flexible Data Import** with configurable column mapping
- **Async PDF Processing** using Python backend
- **Financial Calculations** for production data
- **HR Module Integration** (Employees, Attendance, Payroll)
- **Report Generation** with PDF output capabilities

### Data Relationships
- **Production** links to Planter, Hacienda, and Milling Period
- **Hacienda** belongs to Planter
- **Attendance** belongs to Employee
- **Payroll** calculated from Attendance and Employee data

## Notes

- These diagrams follow the **Structured Analysis and Design Technique (SADT)** DFD conventions
- The system uses **Inertia + React** for frontend and **Laravel** for backend
- File D1.0, D2.0, etc. represent data storage entities
- Process numbering (P1.0, P2.0, etc.) follows hierarchical decomposition