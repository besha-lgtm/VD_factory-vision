import { Component, OnInit } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';

interface DailyJob {
  jobId: string;
  jobDate: string;
  poNo: string;
  customer: string;
  itemCode: string;
  jobType: string;
  reqQty: number | null;
  availableQty: number | null;
  assignedQty: number | null;
  // PMS auto-fetch fields (Business Rule 4)
  ply: string;
  dimensions: string;
  gsm: string;
  size: string;
  bf: string;
  artwork: string;       // TBD per open points
  priority: string;
  status: string;
  remarks: string;
  avatarColor?: string;
}

// Simulated PMS specification lookup (Business Rule 3 & 4)
interface PmsSpec {
  ply: string;
  dimensions: string;
  gsm: string;
  size: string;
  bf: string;
  artwork: string;
}

// Simulated PO → Customer mapping (Business Rule 2)
interface PoRecord {
  poNo: string;
  customer: string;
}

@Component({
  selector: 'app-daily-jobs',
  standalone: false,
  templateUrl: './daily-jobs.component.html',
  styleUrl: './daily-jobs.component.css'
})
export class DailyJobsComponent implements OnInit {

  // Must be first — used by getEmptyJob() at field-init time
  private avatarColors = [
    '#2e90fa', '#7a5af8', '#12b76a', '#f79009',
    '#f04438', '#0794ad', '#ee46bc', '#16b364'
  ];

  jobs: DailyJob[] = [];

  showJobModal  = false;
  showViewModal = false;
  viewJob: DailyJob = this.getEmptyJob();

  // ── Dropdown options ──────────────────────────────────────────────────────
  poOptions: string[] = ['1000131605', '1000131606', '1000131607'];
  itemOptions: string[] = ['2000541', '2000542', '2000543'];
  jobTypeOptions: string[] = ['DC Job', 'Regular', 'Urgent', 'Rework', 'Trial'];
  priorityOptions: string[] = ['P1', 'P2', 'P3'];
  statusOptions: string[] = ['Draft', 'Released', 'In Progress', 'Completed'];

  // ── Simulated PO → Customer master lookup ────────────────────────────────
  private poCustomerMap: Record<string, string> = {
    '1000131605': 'Laurus Labs Unit-2',
    '1000131606': 'Gland Pharma',
    '1000131607': 'Pidilite'
  };

  // ── Simulated Item → PMS spec lookup ─────────────────────────────────────
  private pmsSpecMap: Record<string, PmsSpec> = {
    '2000541': { ply: '3 Ply', dimensions: '475 × 245 × 270', gsm: '120 / 150 / 120', size: '180', bf: '14 / 16 / 14', artwork: 'ART-LL-001 v2' },
    '2000542': { ply: '5 Ply', dimensions: '510 × 310 × 290', gsm: '150 / 120 / 150 / 120 / 150', size: '200', bf: '16 / 14 / 16 / 14 / 16', artwork: 'ART-GP-002 v1' },
    '2000543': { ply: '7 Ply', dimensions: '600 × 400 × 350', gsm: '180 / 120 / 150 / 120 / 150 / 120 / 180', size: '240', bf: '18 / 14 / 16 / 14 / 16 / 14 / 18', artwork: 'ART-PD-003 v3' }
  };

  kpis = [
    { label: 'TOTAL JOBS',        value: 1,    icon: 'pi pi-calendar',           colorClass: 'blue'   },
    { label: 'P1 JOBS',           value: 1,    icon: 'pi pi-bolt',                colorClass: 'yellow' },
    { label: 'TOTAL ASSIGNED QTY',value: 3000, icon: 'pi pi-box',                 colorClass: 'purple' },
    { label: 'SHORTFALL QTY',     value: 3000, icon: 'pi pi-exclamation-circle',  colorClass: 'green'  }
  ];

  isEditMode = false;
  currentJob: DailyJob = this.getEmptyJob();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.jobs = [
      {
        jobId: 'JC-001',
        jobDate: today,
        poNo: '1000131605',
        customer: 'Laurus Labs Unit-2',
        itemCode: '2000541',
        jobType: 'Regular',
        reqQty: 5000,
        availableQty: 2000,
        assignedQty: 3000,
        ply: '3 Ply',
        dimensions: '475 × 245 × 270',
        gsm: '120 / 150 / 120',
        size: '180',
        bf: '14 / 16 / 14',
        artwork: 'ART-LL-001 v2',
        priority: 'P1',
        status: 'Released',
        remarks: '',
        avatarColor: '#2e90fa'
      }
    ];
    this.updateKPIs();
    this.currentJob = this.getEmptyJob();
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }

  getRandomAvatarColor(): string {
    return this.avatarColors[Math.floor(Math.random() * this.avatarColors.length)];
  }

  getEmptyJob(): DailyJob {
    return {
      jobId:        this.generateNextJobId(),
      jobDate:      new Date().toISOString().split('T')[0],
      poNo:         '',
      customer:     '',
      itemCode:     '',
      jobType:      'Regular',
      reqQty:       null,
      availableQty: null,
      assignedQty:  null,
      ply:          '',
      dimensions:   '',
      gsm:          '',
      size:         '',
      bf:           '',
      artwork:      '',
      priority:     'P2',
      status:       'Draft',
      remarks:      '',
      avatarColor:  this.getRandomAvatarColor()
    };
  }

  generateNextJobId(): string {
    if (!this.jobs || this.jobs.length === 0) return 'JC-001';
    const ids = this.jobs.map(j => {
      const parts = j.jobId.split('-');
      return parts.length > 1 ? (parseInt(parts[1]) || 0) : 0;
    });
    return 'JC-' + (Math.max(...ids) + 1).toString().padStart(3, '0');
  }

  // ─── PO / Item change handlers (auto-fetch simulation) ────────────────────

  onPoChange(event: any): void {
    const po = event.value as string;
    this.currentJob.customer = this.poCustomerMap[po] || '';
  }

  onItemChange(event: any): void {
    const spec = this.pmsSpecMap[event.value as string];
    if (spec) {
      this.currentJob.ply        = spec.ply;
      this.currentJob.dimensions = spec.dimensions;
      this.currentJob.gsm        = spec.gsm;
      this.currentJob.size       = spec.size;
      this.currentJob.bf         = spec.bf;
      this.currentJob.artwork    = spec.artwork;
    } else {
      this.currentJob.ply = this.currentJob.dimensions = this.currentJob.gsm =
      this.currentJob.size = this.currentJob.bf = this.currentJob.artwork = '';
    }
  }

  // Business Rule 7: auto-calc assigned qty = req – available
  onQtyChange(): void {
    const req = this.currentJob.reqQty ?? 0;
    const avl = this.currentJob.availableQty ?? 0;
    this.currentJob.assignedQty = Math.max(0, req - avl);
  }

  // ─── Modal controls ────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentJob = this.getEmptyJob();
    this.showJobModal = true;
  }

  closeModal(form?: any): void {
    this.showJobModal = false;
    this.resetForm(form);
  }

  onModalHide(form?: any): void {
    this.resetForm(form);
  }

  viewJobDetails(job: DailyJob): void {
    this.viewJob = { ...job };
    this.showViewModal = true;
  }

  editFromView(): void {
    this.showViewModal = false;
    this.editJob(this.viewJob);
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  editJob(job: DailyJob): void {
    this.isEditMode = true;
    this.currentJob = { ...job };
    this.showJobModal = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Mode Active',
      detail: `Editing Job ${job.jobId}`
    });
  }

  confirmDelete(event: Event, job: DailyJob): void {
    this.confirmationService.confirm({
      message: `Delete Job ${job.jobId} for ${job.customer}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => this.deleteJob(job)
    });
  }

  deleteJob(job: DailyJob): void {
    this.jobs = this.jobs.filter(j => j.jobId !== job.jobId);
    this.updateKPIs();
    this.messageService.add({
      severity: 'success',
      summary: 'Job Deleted',
      detail: `${job.jobId} has been removed.`
    });
    if (this.currentJob.jobId === job.jobId) this.resetForm();
  }

  saveJob(form?: any): void {
    if (form && form.invalid) {
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill all required fields.' });
      return;
    }

    // Business Rule 5: Assigned Qty must not exceed Required Qty
    if ((this.currentJob.assignedQty ?? 0) > (this.currentJob.reqQty ?? 0)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Quantity Error',
        detail: 'Assigned Qty cannot exceed Required Qty.'
      });
      return;
    }

    if (this.isEditMode) {
      const index = this.jobs.findIndex(j => j.jobId === this.currentJob.jobId);
      if (index !== -1) {
        this.jobs[index] = { ...this.currentJob };
        this.messageService.add({ severity: 'success', summary: 'Job Updated', detail: `${this.currentJob.jobId} updated.` });
      }
    } else {
      if (this.jobs.some(j => j.jobId === this.currentJob.jobId)) {
        this.currentJob.jobId = this.generateNextJobId();
      }
      this.jobs.unshift({ ...this.currentJob });
      this.messageService.add({ severity: 'success', summary: 'Job Created', detail: `${this.currentJob.jobId} generated.` });
    }

    this.updateKPIs();
    this.closeModal(form);
  }

  resetForm(form?: any): void {
    this.isEditMode = false;
    this.currentJob = this.getEmptyJob();
    if (form) form.resetForm(this.currentJob);
  }

  updateKPIs(): void {
    this.kpis[0].value = this.jobs.length;
    this.kpis[1].value = this.jobs.filter(j => j.priority === 'P1').length;
    this.kpis[2].value = this.jobs.reduce((sum, j) => sum + (j.assignedQty ?? 0), 0);
    this.kpis[3].value = this.jobs.reduce((sum, j) =>
      sum + Math.max(0, (j.reqQty ?? 0) - (j.availableQty ?? 0)), 0);
  }
}