import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';

interface ReportTab {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-reports-and-dashboards',
  standalone: false,
  templateUrl: './reports-and-dashboards.component.html',
  styleUrl: './reports-and-dashboards.component.css'
})
export class ReportsAndDashboardsComponent implements OnInit {

  activeTab: string = 'jobs';
  filterFromDate: string = '';
  filterToDate: string = '';

  reportTabs: ReportTab[] = [
    { key: 'jobs',       label: 'Pending Jobs',  icon: 'pi pi-calendar' },
    { key: 'stock',      label: 'Stock Report',  icon: 'pi pi-box' },
    { key: 'qc',         label: 'QC Report',     icon: 'pi pi-check-square' },
    { key: 'dispatch',   label: 'Dispatch',      icon: 'pi pi-truck' },
    { key: 'production', label: 'Production',    icon: 'pi pi-cog' }
  ];

  kpis = [
    { label: 'PENDING ORDERS', value: 18, icon: 'pi pi-file-o', colorClass: 'blue' },
    { label: 'REORDER ALERTS', value: 4, icon: 'pi pi-exclamation-triangle', colorClass: 'yellow' },
    { label: 'QC REJECTIONS', value: 2, icon: 'pi pi-times-circle', colorClass: 'purple' },
    { label: 'DISPATCH CLOSED', value: 31, icon: 'pi pi-check-circle', colorClass: 'green' }
  ];

  // ---- JOBS REPORT DATA ----
  jobsReport: any[] = [];
  jobsReportFull: any[] = [];

  // ---- STOCK REPORT DATA ----
  stockReport: any[] = [];
  stockReportFull: any[] = [];

  // ---- QC REPORT DATA ----
  qcReport: any[] = [];
  qcReportFull: any[] = [];

  // ---- DISPATCH REPORT DATA ----
  dispatchReport: any[] = [];
  dispatchReportFull: any[] = [];

  // ---- PRODUCTION REPORT DATA ----
  productionReport: any[] = [];
  productionReportFull: any[] = [];

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.filterToDate = today;
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    this.filterFromDate = pastDate.toISOString().split('T')[0];

    this.jobsReportFull = [
      { jobId: 'JC-001', poNo: '1000131605', customer: 'Laurus Labs Unit-2', itemCode: '2000541', reqQty: 5000, assignedQty: 3000, priority: 'P1', status: 'Open', jobDate: today },
      { jobId: 'JC-002', poNo: '1000131830', customer: 'Gland Pharma', itemCode: '2000609', reqQty: 2505, assignedQty: 2505, priority: 'P2', status: 'Closed', jobDate: today }
    ];

    this.stockReportFull = [
      { material: 'ABC 123 Kraft', stockType: 'Reel', gsm: 250, size: 180, availableQty: 1200, reorderLevel: 500, status: 'OK' },
      { material: 'XYZ 345 Duplex', stockType: 'Reel', gsm: 120, size: 110, availableQty: 300, reorderLevel: 500, status: 'Reorder' },
      { material: 'Starch Powder', stockType: 'Chemical', gsm: null, size: null, availableQty: 80, reorderLevel: 100, status: 'Low' }
    ];

    this.qcReportFull = [
      { qcId: 'QC001', qcDate: today, jobId: 'JC-001', qcType: 'Raw Material QC', gsm: 250, bf: 22, inspector: 'QC User', result: 'Pass' },
      { qcId: 'QC002', qcDate: today, jobId: 'JC-001', qcType: 'Stage QC', gsm: 216, bf: 22.1, inspector: 'QC User', result: 'Pass' },
      { qcId: 'QC003', qcDate: today, jobId: 'JC-001', qcType: 'Final QC', gsm: 220, bf: 22.5, inspector: 'QC User', result: 'Pass' }
    ];

    this.dispatchReportFull = [
      { dispatchId: 'D-001', dispatchDate: today, poNo: '1000131605', customer: 'Laurus Labs Unit-2', itemCode: '2000541', dispatchQty: 5000, vehicleNo: 'AP39WQ2299', ewayBill: 'EWB-123456789', status: 'Closed' }
    ];

    this.productionReportFull = [
      { execId: 'EX001', execDate: today, jobId: 'JC-001', stage: 'Sheet Cutting', outputQty: 3100, wastageQty: 50, operator: 'Raju', status: 'Done' },
      { execId: 'EX002', execDate: today, jobId: 'JC-001', stage: 'Fluting', outputQty: 3050, wastageQty: 30, operator: 'Suresh', status: 'Done' }
    ];

    this.applyFilter();
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  applyFilter(): void {
    // In a real app this would pass date params to the API.
    // For now we serve all seeded data.
    this.jobsReport = [...this.jobsReportFull];
    this.stockReport = [...this.stockReportFull];
    this.qcReport = [...this.qcReportFull];
    this.dispatchReport = [...this.dispatchReportFull];
    this.productionReport = [...this.productionReportFull];
    this.messageService.add({ severity: 'info', summary: 'Filter Applied', detail: `Showing data from ${this.filterFromDate} to ${this.filterToDate}` });
  }

  exportExcel(): void {
    this.messageService.add({ severity: 'success', summary: 'Export Excel', detail: `Exporting ${this.activeTab} report as Excel...` });
    // TODO: integrate xlsx library or call backend export API
  }

  exportPDF(): void {
    this.messageService.add({ severity: 'warn', summary: 'Export PDF', detail: `Exporting ${this.activeTab} report as PDF...` });
    // TODO: integrate jsPDF or call backend export API
  }
}
