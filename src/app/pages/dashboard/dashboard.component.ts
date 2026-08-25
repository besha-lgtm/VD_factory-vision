import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {


  kpis = [
    { label: 'OPEN POS', value: '18', subtitle: 'Customer orders', icon: 'pi pi-file', colorClass: 'blue' },
    { label: 'DAILY JOBS', value: '24', subtitle: 'Active jobs', icon: 'pi pi-calendar', colorClass: 'purple' },
    { label: 'QC PENDING', value: '06', subtitle: 'Awaiting approval', icon: 'pi pi-check-circle', colorClass: 'green' },
    { label: 'DISPATCH PENDING', value: '09', subtitle: 'Ready / planned', icon: 'pi pi-box', colorClass: 'yellow' }
  ];

  flowSteps = [
    { label: 'Client PO' },
    { label: 'Daily Job' },
    { label: 'Item/PMS Check' },
    { label: 'Stock Check' },
    { label: 'Production' },
    { label: 'QC' },
    { label: 'Dispatch' }
  ];

  priorityJobs = [
    { jobId: 'JC-001', customer: 'Laurus Unit-2', item: '2000541', reqQty: '5,000', decision: 'Prod Required', decisionClass: 'decision-prod' },
    { jobId: 'JC-002', customer: 'Gland Pharma', item: '2000609', reqQty: '2,505', decision: 'Dispatch Ready', decisionClass: 'decision-ready' },
    { jobId: 'JC-003', customer: 'Pidilite', item: '2700428729', reqQty: '3,000', decision: 'Stock Check', decisionClass: 'decision-stock' }
  ];

  alerts = [
    { type: 'Reorder', text: '120 GSM below minimum weight', typeClass: 'alert-reorder' },
    { type: 'Review', text: 'PMS missing for one PO line', typeClass: 'alert-review' },
    { type: 'QC', text: '3 jobs waiting for final QC', typeClass: 'alert-qc' }
  ];
}
