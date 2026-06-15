document.addEventListener('DOMContentLoaded', () => {
    // 1. Pre-populate Date Picker with Today's Date (in local timezone format: YYYY-MM-DD)
    const dateInput = document.getElementById('date');
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }

    // 1.5 Sidebar Hamburger Toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (sidebarToggle && sidebar && mainContent) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }

    // Helper to display a custom notification banner
    function showAlert(message, type) {
        const container = document.getElementById('alert-container');
        if (!container) return;
        
        // Clear previous validation alerts if any
        container.innerHTML = '';
        
        const alertEl = document.createElement('div');
        alertEl.className = `alert alert-${type}`;
        alertEl.innerHTML = `
            <span>${message}</span>
            <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(alertEl);
        setupAlertDismissal(alertEl);
    }

    function setupAlertDismissal(alert) {
        setTimeout(() => {
            if (alert.parentNode) {
                alert.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                alert.style.opacity = '0';
                alert.style.transform = 'translateX(100px)';
                setTimeout(() => {
                    alert.remove();
                }, 400);
            }
        }, 5000);
    }

    // 2. Auto-dismiss Existing Alert Notifications (e.g. from Flask flash)
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach((alert) => {
        setupAlertDismissal(alert);
    });

    // 2.5 Custom Client-Side Form Validation for Log Issue Page
    const maintenanceForm = document.getElementById('maintenance-form');
    if (maintenanceForm) {
        maintenanceForm.setAttribute('novalidate', ''); // Disable browser native tooltip validation
        
        maintenanceForm.addEventListener('submit', (event) => {
            const fieldsToCheck = [
                { id: 'equipment_id', name: 'Equipment ID' },
                { id: 'equipment_name', name: 'Equipment Name' },
                { id: 'equipment_type', name: 'Equipment Type' },
                { id: 'severity', name: 'Severity Level' },
                { id: 'technician_name', name: 'Technician Name' },
                { id: 'date', name: 'Date Identified' },
                { id: 'status', name: 'Initial Status' },
                { id: 'priority', name: 'Priority Level' },
                { id: 'location', name: 'Location / Zone' },
                { id: 'est_repair_time', name: 'Estimated Repair Time' },
                { id: 'issue_description', name: 'Issue Description' }
            ];

            const missingFields = [];
            fieldsToCheck.forEach(field => {
                const el = document.getElementById(field.id);
                if (!el || !el.value || el.value.trim() === '') {
                    missingFields.push(field.name);
                }
            });

            if (missingFields.length > 0) {
                event.preventDefault(); // Halt submit
                const errorMsg = `Error: The following required fields are missing: ${missingFields.join(', ')}`;
                showAlert(errorMsg, 'error');
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

    // 3. Live Digital Clock in Sidebar
    const clockElement = document.getElementById('server-time-clock');
    if (clockElement) {
        const updateClock = () => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            clockElement.textContent = `${hours}:${minutes}:${seconds}`;
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    // 3.5 Live Digital Date & Time in Page Header
    const headerDatetime = document.getElementById('live-datetime');
    if (headerDatetime) {
        const updateHeaderDatetime = () => {
            const now = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            };
            headerDatetime.textContent = now.toLocaleDateString('en-US', options);
        };
        updateHeaderDatetime();
        setInterval(updateHeaderDatetime, 1000);
    }

    // 4. Initialize Dashboard Charts using Chart.js
    let statusChartInstance = null;
    let severityChartInstance = null;

    const statusCanvas = document.getElementById('statusChart');
    const severityCanvas = document.getElementById('severityChart');
    
    if (statusCanvas && severityCanvas) {
        fetch('/api/chart-data')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                renderCharts(data);
            })
            .catch(error => {
                console.error('Error fetching chart data:', error);
            });
    }

    function renderCharts(data) {
        if (statusChartInstance) {
            statusChartInstance.destroy();
        }
        if (severityChartInstance) {
            severityChartInstance.destroy();
        }

        // Status Chart (Bar Chart)
        statusChartInstance = new Chart(statusCanvas, {
            type: 'bar',
            data: {
                labels: ['Open', 'In Progress', 'Resolved'],
                datasets: [{
                    label: 'Records by Status',
                    data: [
                        data.status['Open'] || 0,
                        data.status['In Progress'] || 0,
                        data.status['Resolved'] || 0
                    ],
                    backgroundColor: [
                        '#f59e0b', // Open - Amber
                        '#0055cc', // In Progress - Blue
                        '#16a34a'  // Resolved - Green
                    ],
                    borderWidth: 0,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#1a1a2e',
                        bodyColor: '#4b5563',
                        borderColor: '#e0e4ea',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: {
                            color: '#4b5563',
                            font: { family: 'Inter', size: 10 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(0, 0, 0, 0.05)' },
                        ticks: {
                            color: '#4b5563',
                            font: { family: 'Roboto Mono', size: 10 },
                            stepSize: 1
                        }
                    }
                }
            }
        });

        // Severity Chart (Donut Chart)
        severityChartInstance = new Chart(severityCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Low', 'Medium', 'High', 'Critical'],
                datasets: [{
                    data: [
                        data.severity['Low'] || 0,
                        data.severity['Medium'] || 0,
                        data.severity['High'] || 0,
                        data.severity['Critical'] || 0
                    ],
                    backgroundColor: [
                        '#16a34a', // Low - Green
                        '#f59e0b', // Medium - Amber
                        '#dc2626', // High - Red
                        '#dc2626'  // Critical - Red
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#4b5563',
                            boxWidth: 10,
                            font: { family: 'Inter', size: 11 }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        titleColor: '#1a1a2e',
                        bodyColor: '#4b5563',
                        borderColor: '#e0e4ea',
                        borderWidth: 1
                    }
                }
            }
        });
    }

    // 5. Real-time Search and Filter for Activity Logs Table
    const searchInput = document.getElementById('table-search');
    const statusFilter = document.getElementById('filter-status');
    const severityFilter = document.getElementById('filter-severity');
    const noMatchesRow = document.getElementById('no-matches-row');

    if (searchInput && statusFilter && severityFilter) {
        const filterTable = () => {
            const searchQuery = searchInput.value.toLowerCase().trim();
            const selectedStatus = statusFilter.value;
            const selectedSeverity = severityFilter.value;
            let visibleCount = 0;
            
            const currentRows = document.querySelectorAll('.log-row');

            currentRows.forEach(row => {
                const rowStatus = row.getAttribute('data-status');
                const rowSeverity = row.getAttribute('data-severity');
                const rowText = row.textContent.toLowerCase();
                const matchesSearch = rowText.includes(searchQuery);

                const matchesStatus = (selectedStatus === 'All' || rowStatus === selectedStatus);
                const matchesSeverity = (selectedSeverity === 'All' || rowSeverity === selectedSeverity);

                if (matchesSearch && matchesStatus && matchesSeverity) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            if (noMatchesRow) {
                noMatchesRow.style.display = (visibleCount === 0) ? '' : 'none';
            }
        };

        searchInput.addEventListener('input', filterTable);
        statusFilter.addEventListener('change', filterTable);
        severityFilter.addEventListener('change', filterTable);
    }

    // 6. Export logs to CSV
    const exportBtn = document.getElementById('btn-export');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            window.location.href = '/export-csv';
        });
    }

    // 7. Dynamic Record Deletion
    const tableBody = document.querySelector('.records-table tbody');
    if (tableBody) {
        tableBody.addEventListener('click', (event) => {
            const deleteBtn = event.target.closest('.btn-delete');
            if (deleteBtn) {
                const originalIndex = deleteBtn.getAttribute('data-index');
                if (originalIndex !== null) {
                    if (confirm('Are you sure you want to delete this maintenance record? This action cannot be undone.')) {
                        fetch(`/api/delete-record/${originalIndex}`, {
                            method: 'POST'
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to delete record');
                            }
                            return response.json();
                        })
                        .then(result => {
                            if (result.success) {
                                const row = deleteBtn.closest('tr');
                                if (row) {
                                    row.remove();
                                }
                                refreshDashboardData();
                            } else {
                                alert('Error: ' + (result.error || 'Failed to delete record'));
                            }
                        })
                        .catch(error => {
                            console.error('Error deleting record:', error);
                            alert('An error occurred while deleting the record.');
                        });
                    }
                }
            }
        });
    }

    // 8. Refresh Dashboard Button
    const refreshBtn = document.getElementById('btn-refresh-dashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            const svgIcon = refreshBtn.querySelector('svg');
            if (svgIcon) {
                svgIcon.style.transform = 'rotate(360deg)';
                setTimeout(() => {
                    svgIcon.style.transform = 'none';
                }, 300);
            }
            refreshDashboardData();
        });
    }

    function refreshDashboardData() {
        fetch('/api/chart-data')
            .then(response => response.json())
            .then(data => {
                renderCharts(data);

                if (data.stats) {
                    const totalVal = document.querySelector('.stat-card.total .stat-value');
                    const openVal = document.querySelector('.stat-card.open .stat-value');
                    const progressVal = document.querySelector('.stat-card.in-progress .stat-value');
                    const resolvedVal = document.querySelector('.stat-card.resolved .stat-value');
                    const criticalVal = document.querySelector('.stat-card.critical .stat-value');
                    const healthVal = document.querySelector('.stat-card.health-score .stat-value');
                    const mttrVal = document.querySelector('.stat-card.mttr .stat-value');
                    
                    if (totalVal) totalVal.textContent = data.stats.total;
                    if (openVal) openVal.textContent = data.stats.open;
                    if (progressVal) progressVal.textContent = data.stats.in_progress;
                    if (resolvedVal) resolvedVal.textContent = data.stats.resolved;
                    if (criticalVal) criticalVal.textContent = data.stats.critical;
                    if (healthVal) healthVal.textContent = `${data.stats.health_score}%`;
                    if (mttrVal) mttrVal.textContent = data.stats.mttr;
                }

                const currentRows = document.querySelectorAll('.log-row');
                const noMatchesRow = document.getElementById('no-matches-row');
                const activeRows = Array.from(currentRows).filter(row => row.style.display !== 'none');
                
                if (currentRows.length === 0) {
                    window.location.reload();
                } else if (activeRows.length === 0 && noMatchesRow) {
                    noMatchesRow.style.display = '';
                } else if (noMatchesRow) {
                    noMatchesRow.style.display = 'none';
                }
                
                // Update Last Updated clock
                const lastUpdatedEl = document.getElementById('last-updated-time');
                if (lastUpdatedEl) {
                    const now = new Date();
                    const h = String(now.getHours()).padStart(2, '0');
                    const m = String(now.getMinutes()).padStart(2, '0');
                    const s = String(now.getSeconds()).padStart(2, '0');
                    lastUpdatedEl.textContent = `${h}:${m}:${s}`;
                }
            })
            .catch(error => {
                console.error('Error refreshing dashboard metrics:', error);
            });
    }

    // Auto-refresh Dashboard metrics every 30 seconds
    const lastUpdatedEl = document.getElementById('last-updated-time');
    if (lastUpdatedEl) {
        setInterval(() => {
            refreshDashboardData();
        }, 30000);
    }

    // Loading states on buttons when clicked
    const actionButtons = document.querySelectorAll('.btn-submit, .btn-refresh, .btn-secondary');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const form = btn.closest('form');
            if (form) {
                if (form.checkValidity && form.checkValidity()) {
                    setTimeout(() => {
                        const hasErrors = document.querySelector('.alert-error');
                        if (!hasErrors) {
                            btn.classList.add('btn-loading');
                            btn.style.opacity = '0.7';
                            btn.style.cursor = 'not-allowed';
                            const origText = btn.innerHTML;
                            btn.setAttribute('data-original-text', origText);
                            btn.innerHTML = `<span class="spinner"></span> Processing...`;
                        }
                    }, 50);
                }
            } else {
                btn.classList.add('btn-loading');
                btn.style.opacity = '0.7';
                btn.style.cursor = 'not-allowed';
                const origText = btn.innerHTML;
                btn.setAttribute('data-original-text', origText);
                btn.innerHTML = `<span class="spinner"></span> Loading...`;
                setTimeout(() => {
                    btn.classList.remove('btn-loading');
                    btn.style.opacity = '';
                    btn.style.cursor = '';
                    btn.innerHTML = origText;
                }, 2000);
            }
        });
    });

    // Reports Charts Loader (Line chart & Pie chart)
    const reportsCanvas = document.getElementById('dailyActivityChart');
    const eqTypeCanvas = document.getElementById('equipmentTypeChart');
    if (reportsCanvas && eqTypeCanvas) {
        fetch('/api/reports-data')
            .then(response => response.json())
            .then(data => {
                // Line Chart
                new Chart(reportsCanvas, {
                    type: 'line',
                    data: {
                        labels: data.dates,
                        datasets: [{
                            label: 'Issues Logged',
                            data: data.counts,
                            borderColor: '#0055cc',
                            backgroundColor: 'rgba(0, 85, 204, 0.05)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.15,
                            pointBackgroundColor: '#0055cc',
                            pointHoverBackgroundColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: '#ffffff',
                                titleColor: '#1a1a2e',
                                bodyColor: '#4b5563',
                                borderColor: '#e0e4ea',
                                borderWidth: 1
                            }
                        },
                        scales: {
                            x: {
                                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                ticks: {
                                    color: '#4b5563',
                                    font: { family: 'Roboto Mono', size: 10 }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                                ticks: {
                                    color: '#4b5563',
                                    font: { family: 'Roboto Mono', size: 10 },
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });

                // Pie Chart for Equipment Type Breakdown
                const eqLabels = Object.keys(data.equipment_counts).filter(k => data.equipment_counts[k] > 0);
                const eqCounts = eqLabels.map(k => data.equipment_counts[k]);
                
                const colorMap = {
                    'Photolithography Machine': '#0055cc',
                    'Chemical Vapor Deposition (CVD) Chamber': '#7c3aed',
                    'Wafer Inspection System': '#0891b2',
                    'Industrial Robot Arm': '#059669',
                    'CNC Milling Machine': '#d97706',
                    'Cooling Tower': '#dc2626',
                    'High Voltage Transformer': '#db2777',
                    'Compressed Air System': '#65a30d',
                    'Clean Room HVAC': '#ea580c',
                    'Etching System': '#8b5cf6',
                    'Conveyor Belt System': '#475569',
                    'Turbine Generator': '#0d9488'
                };
                const eqColors = eqLabels.map(label => colorMap[label] || '#6b7280');
                
                const pluginsList = [];
                if (typeof ChartDataLabels !== 'undefined') {
                    pluginsList.push(ChartDataLabels);
                }

                new Chart(eqTypeCanvas, {
                    type: 'pie',
                    plugins: pluginsList,
                    data: {
                        labels: eqLabels,
                        datasets: [{
                            data: eqCounts,
                            backgroundColor: eqColors,
                            borderWidth: 1,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    color: '#4b5563',
                                    boxWidth: 10,
                                    font: { family: 'Inter', size: 10 }
                                }
                            },
                            tooltip: {
                                backgroundColor: '#ffffff',
                                titleColor: '#1a1a2e',
                                bodyColor: '#4b5563',
                                borderColor: '#e0e4ea',
                                borderWidth: 1
                            },
                            datalabels: {
                                formatter: (value, ctx) => {
                                    let sum = 0;
                                    let dataArr = ctx.chart.data.datasets[0].data;
                                    dataArr.forEach(d => {
                                        sum += d;
                                    });
                                    return sum > 0 ? (value * 100 / sum).toFixed(1) + "%" : "0%";
                                },
                                color: '#ffffff',
                                font: {
                                    weight: 'bold',
                                    family: 'Inter',
                                    size: 11
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => console.error('Error loading reports charts:', error));
    }

    // Equipment List real-time search filtering
    const eqSearchInput = document.getElementById('equipment-search');
    const eqTable = document.getElementById('equipment-table');
    const noMatchesEqRow = document.getElementById('no-matches-eq-row');

    if (eqSearchInput && eqTable) {
        eqSearchInput.addEventListener('input', () => {
            const query = eqSearchInput.value.toLowerCase().trim();
            let visibleCount = 0;
            const rows = eqTable.querySelectorAll('.eq-row');

            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(query)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            if (noMatchesEqRow) {
                noMatchesEqRow.style.display = (visibleCount === 0) ? '' : 'none';
            }
        });
    }
});
