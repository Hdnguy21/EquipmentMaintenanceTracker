import os
import csv
from flask import Flask, render_template, request, redirect, url_for, flash, send_file

app = Flask(__name__)
app.secret_key = 'factory_maintenance_secure_key_1928'

CSV_FILE = 'maintenance_records.csv'
CSV_HEADERS = [
    'equipment_id', 
    'equipment_name', 
    'equipment_type', 
    'issue_description', 
    'severity', 
    'technician_name', 
    'date', 
    'status',
    'priority',
    'location',
    'est_repair_time'
]

# Supported choices for options/dropdowns
EQUIPMENT_TYPES = [
    'Photolithography Machine',
    'Chemical Vapor Deposition (CVD) Chamber',
    'Etching System',
    'Wafer Inspection System',
    'CNC Milling Machine',
    'Industrial Robot Arm',
    'Clean Room HVAC',
    'Conveyor Belt System',
    'Turbine Generator',
    'Cooling Tower',
    'High Voltage Transformer',
    'Compressed Air System'
]

SEVERITY_LEVELS = [
    'Low',
    'Medium',
    'High',
    'Critical'
]

STATUSES = [
    'Open',
    'In Progress',
    'Resolved'
]

PRIORITIES = [
    'P1-Critical',
    'P2-High',
    'P3-Medium',
    'P4-Low'
]

LOCATIONS = [
    'Clean Room A',
    'Clean Room B',
    'Fab Floor 1',
    'Fab Floor 2',
    'Utility Room',
    'Maintenance Bay'
]

EST_REPAIR_TIMES = [
    'Less than 1 hour',
    '1-4 hours',
    '4-8 hours',
    '1-2 days',
    'More than 2 days'
]

def initialize_csv():
    """Create the CSV file with headers if it doesn't exist, or migrate it if columns are missing or old types exist."""
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(CSV_HEADERS)
    else:
        # Check if migration is needed
        with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader, None)
            
        old_types = {'HVAC', 'Conveyor Belt', 'Turbine', 'Sensor', 'Circuit Board Machine', 'Other'}
        has_old_types = False
        records = []
        
        with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append(row)
                if row.get('equipment_type') in old_types:
                    has_old_types = True
                    
        needs_cols = header and any(h not in header for h in CSV_HEADERS)
        
        if needs_cols or has_old_types:
            type_mapping = {
                'HVAC': 'Clean Room HVAC',
                'Conveyor Belt': 'Conveyor Belt System',
                'Turbine': 'Turbine Generator',
                'Sensor': 'Wafer Inspection System',
                'Circuit Board Machine': 'CNC Milling Machine',
                'Other': 'Compressed Air System'
            }
            for row in records:
                # Provide defaults for missing fields
                row['priority'] = row.get('priority') or 'P3-Medium'
                row['location'] = row.get('location') or 'Fab Floor 1'
                row['est_repair_time'] = row.get('est_repair_time') or '1-4 hours'
                
                # Map old equipment types
                eq_type = row.get('equipment_type')
                if eq_type in type_mapping:
                    row['equipment_type'] = type_mapping[eq_type]
                    
            # Rewrite file with new headers
            with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
                writer.writeheader()
                for r in records:
                    clean_row = {k: r.get(k, '') for k in CSV_HEADERS}
                    writer.writerow(clean_row)

# Initialize CSV file on start
initialize_csv()

def read_records():
    """Read all records from the CSV file."""
    records = []
    if os.path.exists(CSV_FILE):
        with open(CSV_FILE, mode='r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                records.append(row)
    return records

def write_record(record_dict):
    """Append a single record to the CSV file."""
    with open(CSV_FILE, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
        writer.writerow(record_dict)

@app.route('/')
def index():
    """Render the issue submission form."""
    return render_template(
        'index.html',
        equipment_types=EQUIPMENT_TYPES,
        severity_levels=SEVERITY_LEVELS,
        statuses=STATUSES
    )

@app.route('/submit', methods=['POST'])
def submit():
    """Handle the submission of a new maintenance record."""
    # Retrieve form data
    equipment_id = request.form.get('equipment_id', '').strip()
    equipment_name = request.form.get('equipment_name', '').strip()
    equipment_type = request.form.get('equipment_type', '').strip()
    issue_description = request.form.get('issue_description', '').strip()
    severity = request.form.get('severity', '').strip()
    technician_name = request.form.get('technician_name', '').strip()
    date = request.form.get('date', '').strip()
    status = request.form.get('status', '').strip()
    priority = request.form.get('priority', '').strip()
    location = request.form.get('location', '').strip()
    est_repair_time = request.form.get('est_repair_time', '').strip()

    # Basic backend validation
    if not all([equipment_id, equipment_name, equipment_type, issue_description, severity, technician_name, date, status, priority, location, est_repair_time]):
        flash('Error: All form fields are required.', 'error')
        return redirect(url_for('index'))

    # Verify dropdown options
    if (equipment_type not in EQUIPMENT_TYPES or 
        severity not in SEVERITY_LEVELS or 
        status not in STATUSES or 
        priority not in PRIORITIES or 
        location not in LOCATIONS or 
        est_repair_time not in EST_REPAIR_TIMES):
        flash('Error: Invalid selection for dropdown fields.', 'error')
        return redirect(url_for('index'))

    # Construct record and write to CSV
    record = {
        'equipment_id': equipment_id,
        'equipment_name': equipment_name,
        'equipment_type': equipment_type,
        'issue_description': issue_description,
        'severity': severity,
        'technician_name': technician_name,
        'date': date,
        'status': status,
        'priority': priority,
        'location': location,
        'est_repair_time': est_repair_time
    }

    try:
        write_record(record)
        flash('Success: Maintenance record logged successfully!', 'success')
    except Exception as e:
        flash(f'Error saving record: {str(e)}', 'error')
        return redirect(url_for('index'))

    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    """Render the analytics dashboard listing stats and logs."""
    records = read_records()

    # Add original index to each record to uniquely identify it for deletion
    for i, r in enumerate(records):
        r['original_index'] = i

    # Calculate statistics
    total_records = len(records)
    open_count = sum(1 for r in records if r.get('status') == 'Open')
    in_progress_count = sum(1 for r in records if r.get('status') == 'In Progress')
    resolved_count = sum(1 for r in records if r.get('status') == 'Resolved')
    critical_count = sum(1 for r in records if r.get('severity') == 'Critical')

    # Calculate Health Score: % resolved
    health_score = int((resolved_count / total_records) * 100) if total_records > 0 else 100

    # Calculate MTTR (Mean Time to Repair) based on resolved issues
    time_mapping = {
        'Less than 1 hour': 0.5,
        '1-4 hours': 2.5,
        '4-8 hours': 6.0,
        '1-2 days': 36.0,
        'More than 2 days': 72.0
    }
    resolved_times = [time_mapping.get(r.get('est_repair_time'), 2.5) for r in records if r.get('status') == 'Resolved']
    mttr = sum(resolved_times) / len(resolved_times) if len(resolved_times) > 0 else 0.0
    if mttr == 0.0:
        mttr_display = "0.0h"
    elif mttr < 24:
        mttr_display = f"{mttr:.1f}h"
    else:
        mttr_display = f"{mttr/24:.1f}d"

    stats = {
        'total': total_records,
        'open': open_count,
        'in_progress': in_progress_count,
        'resolved': resolved_count,
        'critical': critical_count,
        'health_score': health_score,
        'mttr': mttr_display
    }

    # Reverse records to show newest logged issues first
    display_records = list(reversed(records))

    return render_template(
        'dashboard.html',
        records=display_records,
        stats=stats
    )

@app.route('/export-csv')
def export_csv():
    """Allow downloading the CSV file directly."""
    return send_file(
        CSV_FILE,
        mimetype='text/csv',
        as_attachment=True,
        download_name='maintenance_records.csv'
    )

@app.route('/api/delete-record/<int:index>', methods=['POST'])
def delete_record(index):
    """Delete a record by its original index in the CSV file."""
    records = read_records()
    if 0 <= index < len(records):
        records.pop(index)
        # Rewrite the CSV file
        with open(CSV_FILE, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=CSV_HEADERS)
            writer.writeheader()
            for r in records:
                clean_row = {k: r[k] for k in CSV_HEADERS if k in r}
                writer.writerow(clean_row)
        return {'success': True}
    return {'success': False, 'error': 'Invalid index'}, 400

@app.route('/api/chart-data')
def chart_data():
    """Return status and severity counts as JSON."""
    records = read_records()
    
    status_counts = {status: 0 for status in STATUSES}
    severity_counts = {severity: 0 for severity in SEVERITY_LEVELS}
    
    total_records = len(records)
    open_count = sum(1 for r in records if r.get('status') == 'Open')
    in_progress_count = sum(1 for r in records if r.get('status') == 'In Progress')
    resolved_count = sum(1 for r in records if r.get('status') == 'Resolved')
    critical_count = sum(1 for r in records if r.get('severity') == 'Critical')
    
    for r in records:
        status = r.get('status')
        if status in status_counts:
            status_counts[status] += 1
        severity = r.get('severity')
        if severity in severity_counts:
            severity_counts[severity] += 1
            
    # Calculate Health Score: % resolved
    health_score = int((resolved_count / total_records) * 100) if total_records > 0 else 100

    # Calculate MTTR (Mean Time to Repair) based on resolved issues
    time_mapping = {
        'Less than 1 hour': 0.5,
        '1-4 hours': 2.5,
        '4-8 hours': 6.0,
        '1-2 days': 36.0,
        'More than 2 days': 72.0
    }
    resolved_times = [time_mapping.get(r.get('est_repair_time'), 2.5) for r in records if r.get('status') == 'Resolved']
    mttr = sum(resolved_times) / len(resolved_times) if len(resolved_times) > 0 else 0.0
    if mttr == 0.0:
        mttr_display = "0.0h"
    elif mttr < 24:
        mttr_display = f"{mttr:.1f}h"
    else:
        mttr_display = f"{mttr/24:.1f}d"

    return {
        'status': status_counts,
        'severity': severity_counts,
        'stats': {
            'total': total_records,
            'open': open_count,
            'in_progress': in_progress_count,
            'resolved': resolved_count,
            'critical': critical_count,
            'health_score': health_score,
            'mttr': mttr_display
        }
    }

@app.route('/reports')
def reports():
    """Render the Reports page."""
    records = read_records()
    
    # Standard nominal resolution hours dictionary for semiconductor tools
    nominal_res_times = {
        'Photolithography Machine': 8.5,
        'Chemical Vapor Deposition (CVD) Chamber': 6.2,
        'Etching System': 5.5,
        'Wafer Inspection System': 4.0,
        'CNC Milling Machine': 3.0,
        'Industrial Robot Arm': 4.5,
        'Clean Room HVAC': 3.5,
        'Conveyor Belt System': 2.0,
        'Turbine Generator': 12.0,
        'Cooling Tower': 6.0,
        'High Voltage Transformer': 10.0,
        'Compressed Air System': 2.5
    }
    
    # Calculate stats per type
    type_stats = []
    for eq_type in EQUIPMENT_TYPES:
        type_records = [r for r in records if r.get('equipment_type') == eq_type]
        total = len(type_records)
        active = sum(1 for r in type_records if r.get('status') in ['Open', 'In Progress'])
        res_time = nominal_res_times.get(eq_type, 2.5)
        type_stats.append({
            'type': eq_type,
            'total': total,
            'avg_res_time': res_time,
            'active': active
        })
        
    # Global metrics
    total_active = sum(1 for r in records if r.get('status') in ['Open', 'In Progress'])
    
    # Sort types by issue count (most common issue types)
    most_common_types = sorted(type_stats, key=lambda x: x['total'], reverse=True)

    # Priority distribution calculation
    priority_counts = {p: 0 for p in PRIORITIES}
    for r in records:
        p = r.get('priority')
        if p in priority_counts:
            priority_counts[p] += 1
            
    priority_dist = []
    total_records = len(records)
    for p in PRIORITIES:
        count = priority_counts[p]
        pct = (count / total_records * 100) if total_records > 0 else 0.0
        priority_dist.append({
            'priority': p,
            'count': count,
            'percentage': f"{pct:.1f}%"
        })
    
    return render_template(
        'reports.html',
        type_stats=type_stats,
        total_active=total_active,
        most_common_types=most_common_types,
        priority_dist=priority_dist
    )

@app.route('/equipment-list')
def equipment_list():
    """Render the Equipment List page."""
    records = read_records()
    
    # Group by equipment_id to find unique equipment logged
    equipment_dict = {}
    for r in records:
        eq_id = r.get('equipment_id', '').strip()
        if not eq_id:
            continue
        if eq_id not in equipment_dict:
            equipment_dict[eq_id] = {
                'equipment_id': eq_id,
                'equipment_name': r.get('equipment_name', 'Unknown'),
                'equipment_type': r.get('equipment_type', 'Other'),
                'total_issues': 0,
                'active_issues': 0
            }
        
        equipment_dict[eq_id]['total_issues'] += 1
        if r.get('status') in ['Open', 'In Progress']:
            equipment_dict[eq_id]['active_issues'] += 1
            
    # Convert dict to sorted list (alphabetical by ID)
    equipment_data = sorted(equipment_dict.values(), key=lambda x: x['equipment_id'])
    
    return render_template(
        'equipment_list.html',
        equipment=equipment_data
    )

@app.route('/settings')
def settings():
    """Render the Settings page."""
    # We can pass some mock current settings
    current_settings = {
        'company_name': 'Apex Industrial Group',
        'node_id': 'TX-H1',
        'default_technician': 'Marcus Miller',
        'email_notifications': True,
        'refresh_interval': '30s',
        'system_mode': 'Operational'
    }
    return render_template(
        'settings.html',
        settings=current_settings
    )

@app.route('/save-settings', methods=['POST'])
def save_settings():
    """Handle settings form submission (does not persist, just flashes success)."""
    company_name = request.form.get('company_name', '').strip()
    node_id = request.form.get('node_id', '').strip()
    
    # Validate basic settings fields
    if not company_name or not node_id:
        flash('Error: Company Name and Node ID are required fields.', 'error')
        return redirect(url_for('settings'))
        
    flash('Success: System settings updated successfully!', 'success')
    return redirect(url_for('settings'))

@app.route('/api/reports-data')
def reports_data():
    """Return reports analytics data as JSON."""
    records = read_records()
    
    # Daily counts
    daily_counts = {}
    for r in records:
        d = r.get('date', '')
        if d:
            daily_counts[d] = daily_counts.get(d, 0) + 1
            
    # Sort chronologically by date
    sorted_dates = sorted(daily_counts.keys())
    counts = [daily_counts[d] for d in sorted_dates]
    
    # Equipment type counts
    equipment_counts = {eq_type: 0 for eq_type in EQUIPMENT_TYPES}
    for r in records:
        eq_type = r.get('equipment_type')
        if eq_type in equipment_counts:
            equipment_counts[eq_type] += 1
            
    return {
        'dates': sorted_dates,
        'counts': counts,
        'equipment_counts': equipment_counts
    }

if __name__ == '__main__':
    # Run server locally on port 5000 in debug mode
    app.run(host='127.0.0.1', port=5000, debug=True)
