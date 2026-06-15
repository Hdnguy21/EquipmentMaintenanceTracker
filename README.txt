Equipment Maintenance Tracker

What the Application Does:
---------------------------
The Equipment Maintenance Tracker is a factory node issue logging station and operational dashboard. It allows maintenance supervisors and technicians to log equipment faults, track issues by status and severity, view historical records in real time, and analyze trends dynamically.

Key Features:
-------------
1. Log Issue Station:
   - A clean submission form to input: Equipment ID, Equipment Name, Equipment Type, Issue Description, Severity Level, Technician Name, Date, and Status.
   - Includes auto-populating date fields and backend validation.

2. Live Statistics (KPIs):
   - Real-time counters showing Total Records, Open Issues, In Progress, Resolved, and Critical Fault counts.

3. Interactive Visualizations (Chart.js):
   - A dynamic bar chart showing maintenance records grouped by Status.
   - A dynamic donut chart showing records grouped by Severity Level.
   - Charts refresh dynamically in real time without reloading the page upon deletion of logs.

4. Real-time Search & Filtering:
   - Search box: Filters the logs table instantaneously as the user types (matches Equipment ID, Name, Description, Type, Technician).
   - Dropdown Filters: Narrow down logs by Status (All, Open, In Progress, Resolved) and/or Severity (All, Low, Medium, High, Critical).

5. Export to CSV:
   - "Export CSV" button downloads all logged maintenance records as a standard CSV file directly to the browser.

6. Delete Record:
   - Inline "Delete" trash icon on each log row.
   - Updates the backend CSV database file immediately.
   - Refreshes all charts and KPI counters dynamically in the viewport without reloading the page.


How to Install and Run:
-----------------------
1. Ensure Python (version 3.6 or higher) is installed on your computer.

2. Open a terminal or command prompt in this directory ("EquipmentMaintenanceTracker").

3. Install the required dependencies:
   pip install -r requirements.txt
   (or simply: pip install flask)

4. Run the application:
   python app.py

5. Access the application in your web browser:
   - Logging Station: http://127.0.0.1:5000/
   - Dashboard: http://127.0.0.1:5000/dashboard


File Structure:
---------------
- app.py                      : Flask backend application logic & API endpoints.
- maintenance_records.csv     : CSV database storing all maintenance records.
- requirements.txt            : Python dependencies package specification.
- README.txt                  : Documentation and setup guide.
- static/
  - css/styles.css            : Modern responsive Dark Theme stylesheets.
  - js/main.js                : Client-side logic for real-time clocks, charts, search, filters, deletion, and exports.
- templates/
  - index.html                : Logging station HTML form template.
  - dashboard.html            : Operations dashboard HTML grid template.
