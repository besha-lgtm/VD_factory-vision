import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';

export interface AttachedPhoto {
  url: string;
  name: string;
}

export interface QCParam {
  srNo: number;
  parameterName: string;
  specification: string;
  observedValue: string;
  unit: string;
  result: 'Pass' | 'Fail';
  remarks: string;
}

export interface ProductionStage {
  name: string;
  status: 'Approved' | 'Pending' | 'Not Started';
  timestamp?: string;
}

export interface JobPO {
  poNo: string;
  qty: number;
}

export interface JobItem {
  name: string;
  plannedQty: number;
  producedQty: number;
  uom: string;
  poNo: string;
}

export interface QCJob {
  jobId: string;
  batchNo: string;
  customer: string;
  plannedQty: number;
  producedQty: number;
  uom: string;
  jobDate: string;
  dueDate: string;
  pos: JobPO[];
  totalItems: number;
  items: JobItem[];
  stages: ProductionStage[];
  inspectedBy: string;
  inspectedOn: string;
  remarks: string;
  photos: AttachedPhoto[];
  stageParameters: { [stageName: string]: QCParam[] };
  stageBadgeClass: string;
  time: string;
}

@Component({
  selector: 'app-stagewise-qc-management',
  standalone: false,
  templateUrl: './stagewise-qc-management.component.html',
  styleUrl: './stagewise-qc-management.component.css'
})
export class StagewiseQcManagementComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  jobs: QCJob[] = [];
  selectedJob: QCJob | null = null;
  activeStageIndex: number = 2; // Default active stage index for inspection (e.g. Printing QC)
  selectedItemIndex: number = 0; // Selected item tab

  searchQuery: string = '';
  selectedStageFilter: string = 'All Stages';

  // Pagination State
  currentPage = 1;
  pageSize = 6;

  get totalPages(): number {
    return Math.ceil(this.filteredJobs.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get paginatedJobs(): QCJob[] {
    const total = this.filteredJobs.length;
    const maxPage = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredJobs.slice(startIndex, startIndex + this.pageSize);
  }
  viewQuantityIn: string = 'Nos';
  
  inspectorOptions: string[] = ['Raj Kumar', 'Amit Sharma', 'Vijay Singh', 'Deepak Patil'];
  selectedInspector: string = 'Raj Kumar';

  // Available stage filters for the dropdown
  stageFilters: string[] = [
    'All Stages',
    'Sheet Cutting QC',
    'Corrugation QC',
    'Printing QC',
    'Slotting QC',
    'Die Cutting QC',
    'Stitching QC',
    'Packing QC',
    'Final QC'
  ];

  getJobStageName(job: QCJob): string {
    const pending = job.stages.find(s => s.status === 'Pending');
    return pending ? `${pending.name} QC` : 'Final QC';
  }

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.initializeMockData();
    if (this.jobs.length > 0) {
      this.selectJob(this.jobs[0]);
    }
  }

  // Filter jobs based on search text and selected stage filter
  get filteredJobs(): QCJob[] {
    return this.jobs.filter(job => {
      // Text search match
      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !query || 
        job.jobId.toLowerCase().includes(query) ||
        job.batchNo.toLowerCase().includes(query) ||
        job.customer.toLowerCase().includes(query) ||
        job.pos.some(p => p.poNo.toLowerCase().includes(query));

      // Stage filter match
      let matchesStage = true;
      if (this.selectedStageFilter !== 'All Stages') {
        const activeStage = job.stages.find(s => s.status === 'Pending');
        const activeStageName = activeStage ? activeStage.name : '';
        const filterClean = this.selectedStageFilter.replace(' QC', '').toLowerCase();
        matchesStage = activeStageName.toLowerCase().includes(filterClean);
      }

      return matchesSearch && matchesStage;
    });
  }

  // Select job from left panel list
  selectJob(job: QCJob): void {
    this.selectedJob = job;
    this.selectedItemIndex = 0;
    this.selectedInspector = job.inspectedBy || 'Raj Kumar';
    
    // Find the pending/current stage index for this job
    const pendingIdx = job.stages.findIndex(s => s.status === 'Pending');
    if (pendingIdx !== -1) {
      this.activeStageIndex = pendingIdx;
    } else {
      // Default to first stage or last approved
      const lastApproved = job.stages.map(s => s.status).lastIndexOf('Approved');
      this.activeStageIndex = lastApproved !== -1 ? Math.min(lastApproved + 1, job.stages.length - 1) : 0;
    }
  }

  // Set the current selected item tab
  selectItemTab(index: number): void {
    this.selectedItemIndex = index;
  }

  // Handle click on stage cards in the horizontal stages progress bar
  onStageClick(stage: ProductionStage, index: number): void {
    if (!this.selectedJob) return;

    // Check if the stage is not started. If so, move it to "Pending" (In Progress)
    if (stage.status === 'Not Started') {
      // Check if the previous stages are approved. If not, prompt the user.
      const hasUnapprovedPrevious = this.selectedJob.stages
        .slice(0, index)
        .some(s => s.status !== 'Approved');

      if (hasUnapprovedPrevious) {
        this.messageService.add({
          severity: 'warn',
          summary: 'Sequence Warning',
          detail: `Please approve the preceding stages before starting ${stage.name}.`
        });
        return;
      }

      // Transition this stage to Pending (In Progress)
      stage.status = 'Pending';
      this.messageService.add({
        severity: 'info',
        summary: 'Stage In Progress',
        detail: `${stage.name} is now in progress.`
      });
    }

    // Set as the active inspection view
    this.activeStageIndex = index;
  }

  // Get parameters checklist for the active stage of the selected job
  get activeStageParameters(): QCParam[] {
    if (!this.selectedJob) return [];
    const stage = this.selectedJob.stages[this.activeStageIndex];
    if (!stage) return [];
    return this.selectedJob.stageParameters[stage.name] || [];
  }

  // Toggle result of a parameter between Pass and Fail
  toggleResult(param: QCParam): void {
    param.result = param.result === 'Pass' ? 'Fail' : 'Pass';
    this.messageService.add({
      severity: 'info',
      summary: 'Result Updated',
      detail: `${param.parameterName} set to ${param.result}`
    });
  }

  // Add photos using local upload
  triggerUpload(): void {
    this.fileInput.nativeElement.click();
  }

  onPhotoSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (!this.selectedJob) return;
      if (this.selectedJob.photos.length >= 5) {
        this.messageService.add({
          severity: 'error',
          summary: 'Limit Exceeded',
          detail: 'Maximum of 5 photos can be attached.'
        });
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (e: any) => {
          if (this.selectedJob && this.selectedJob.photos.length < 5) {
            this.selectedJob.photos.push({
              url: e.target.result,
              name: file.name
            });
            this.messageService.add({
              severity: 'success',
              summary: 'Photo Added',
              detail: `${file.name} attached successfully.`
            });
          }
        };
        reader.readAsDataURL(file);
      }
    }
    // Reset file input value to allow uploading same file again
    event.target.value = '';
  }

  // Remove photo from job
  deletePhoto(index: number): void {
    if (!this.selectedJob) return;
    const removed = this.selectedJob.photos.splice(index, 1);
    if (removed.length > 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Photo Removed',
        detail: `${removed[0].name} removed.`
      });
    }
  }

  // Approve the current active stage and advance to the next
  approveCurrentStage(): void {
    if (!this.selectedJob) return;

    const currentStage = this.selectedJob.stages[this.activeStageIndex];
    if (!currentStage) return;

    if (currentStage.status === 'Approved') {
      this.messageService.add({
        severity: 'warn',
        summary: 'Already Approved',
        detail: `${currentStage.name} has already been approved.`
      });
      return;
    }

    // Set current stage status to Approved
    currentStage.status = 'Approved';
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    currentStage.timestamp = `${day}/${month} ${hours}:${minutes} ${hours >= '12' ? 'PM' : 'AM'}`;

    this.messageService.add({
      severity: 'success',
      summary: 'Stage Approved',
      detail: `${currentStage.name} approved successfully.`
    });

    // Save inspector and inspection time
    this.selectedJob.inspectedBy = this.selectedInspector;
    this.selectedJob.inspectedOn = `${day}/${month}/${now.getFullYear()} ${hours}:${minutes} ${hours >= '12' ? 'PM' : 'AM'}`;

    // Advance to the next stage if available
    const nextIdx = this.activeStageIndex + 1;
    if (nextIdx < this.selectedJob.stages.length) {
      const nextStage = this.selectedJob.stages[nextIdx];
      nextStage.status = 'Pending'; // Mark next stage as Pending/In Progress
      this.activeStageIndex = nextIdx; // Highlight next stage

      this.messageService.add({
        severity: 'info',
        summary: 'Next Stage Active',
        detail: `${nextStage.name} is now the current stage.`
      });
    } else {
      this.messageService.add({
        severity: 'success',
        summary: 'Job Complete',
        detail: 'All stages of this job have been approved.'
      });
    }
  }

  // Hold / Reject current stage
  holdOrRejectStage(): void {
    if (!this.selectedJob) return;
    const currentStage = this.selectedJob.stages[this.activeStageIndex];
    if (!currentStage) return;

    this.messageService.add({
      severity: 'error',
      summary: 'Stage Held / Rejected',
      detail: `${currentStage.name} has been placed on hold. Remarks: ${this.selectedJob.remarks || 'None'}`
    });
  }

  // Triggered on Refresh button click
  refreshJobData(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Data Refreshed',
      detail: 'Job information has been synchronized.'
    });
  }

  // Triggered on Job History button click
  viewHistory(): void {
    if (!this.selectedJob) return;
    this.messageService.add({
      severity: 'info',
      summary: 'Job History Log',
      detail: `Opening historic tracking log for ${this.selectedJob.jobId}.`
    });
  }

  // Pre-populates job data matching the mockup images
  private initializeMockData(): void {
    const boxImg1 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 100 80"><rect width="100%" height="100%" fill="%23dcd6cd"/><path d="M10 20 L50 5 L90 20 L50 35 Z" fill="%23b8ada1"/><path d="M10 20 L50 35 L50 70 L10 55 Z" fill="%23a09385"/><path d="M90 20 L50 35 L50 70 L90 55 Z" fill="%238a7c6f"/><text x="50%" y="85%" font-size="8" font-family="sans-serif" text-anchor="middle" fill="%23333">Box Preview</text></svg>';
    const boxImg2 = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80" viewBox="0 0 100 80"><rect width="100%" height="100%" fill="%23d6c7b9"/><path d="M10 20 L50 5 L90 20 L50 35 Z" fill="%23bfac99"/><path d="M10 20 L50 35 L50 70 L10 55 Z" fill="%23a8937d"/><path d="M90 20 L50 35 L50 70 L90 55 Z" fill="%23917a63"/><text x="50%" y="85%" font-size="8" font-family="sans-serif" text-anchor="middle" fill="%23333">Side View</text></svg>';

    const getStageParams = (stage: string) => {
      if (stage === 'Sheet Cutting') {
        return [
          { srNo: 1, parameterName: 'Sheet Length', specification: 'Target ±1.0 mm', observedValue: '600', unit: 'mm', result: 'Pass' as const, remarks: '-' },
          { srNo: 2, parameterName: 'Sheet Width', specification: 'Target ±1.0 mm', observedValue: '400', unit: 'mm', result: 'Pass' as const, remarks: '-' }
        ];
      }
      if (stage === 'Corrugation') {
        return [
          { srNo: 1, parameterName: 'Moisture', specification: '8.0% - 12.0%', observedValue: '10.2%', unit: '%', result: 'Pass' as const, remarks: '-' },
          { srNo: 2, parameterName: 'Cobb Value (60s)', specification: '80 - 100 g/m²', observedValue: '91', unit: 'g/m²', result: 'Pass' as const, remarks: '-' }
        ];
      }
      if (stage === 'Printing') {
        return [
          { srNo: 1, parameterName: 'Print Registration', specification: 'Within ±1.0 mm', observedValue: '0.6', unit: 'mm', result: 'Pass' as const, remarks: '-' },
          { srNo: 2, parameterName: 'Color Match / Shade', specification: 'As per PMS Ref', observedValue: 'Match', unit: '-', result: 'Pass' as const, remarks: '-' },
          { srNo: 3, parameterName: 'Print Density', specification: '1.20 - 1.60', observedValue: '1.35', unit: 'D', result: 'Pass' as const, remarks: '-' },
          { srNo: 4, parameterName: 'Barcode Readability', specification: 'Readable', observedValue: 'Readable', unit: '-', result: 'Pass' as const, remarks: '-' }
        ];
      }
      return [
        { srNo: 1, parameterName: `${stage} Parameter 1`, specification: 'Standard Spec', observedValue: 'Optimal', unit: '-', result: 'Pass' as const, remarks: '-' },
        { srNo: 2, parameterName: `${stage} Parameter 2`, specification: 'Standard Spec', observedValue: 'Optimal', unit: '-', result: 'Pass' as const, remarks: '-' }
      ];
    };

    const buildStageParameters = () => {
      const params: { [key: string]: QCParam[] } = {};
      const stages = ['Sheet Cutting', 'Corrugation', 'Printing', 'Slotting', 'Die Cutting', 'Stitching / Gluing', 'Packing', 'Final QC'];
      stages.forEach(st => {
        params[st] = getStageParams(st);
      });
      return params;
    };

    const buildJobStages = (activeStageIdx: number): ProductionStage[] => {
      const stagesList = ['Sheet Cutting', 'Corrugation', 'Printing', 'Slotting', 'Die Cutting', 'Stitching / Gluing', 'Packing', 'Final QC'];
      return stagesList.map((name, idx) => {
        let status: 'Approved' | 'Pending' | 'Not Started' = 'Not Started';
        let timestamp: string | undefined = undefined;
        if (idx < activeStageIdx) {
          status = 'Approved';
          timestamp = `17/05 0${8 + idx}:00 AM`;
        } else if (idx === activeStageIdx && activeStageIdx >= 0) {
          status = 'Pending';
        }
        return { name, status, timestamp };
      });
    };

    this.jobs = [
      {
        jobId: 'JOB-24070071',
        batchNo: 'BCH-24070071-01',
        customer: 'SONIA FOODS INDUSTRIES LIMITED',
        plannedQty: 25000,
        producedQty: 12400,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '28 Dec 2024',
        pos: [
          { poNo: 'PO-2412-00108', qty: 18000 },
          { poNo: 'PO-2412-00109', qty: 7000 }
        ],
        totalItems: 3,
        items: [
          { name: 'KIVO GOOD TIMES NDC SECONDARY 220 SACHETS X 12G.', plannedQty: 10000, producedQty: 5200, uom: 'Nos', poNo: 'PO-2412-00108' },
          { name: 'KIVO GOOD TIMES NDC SECONDARY 110 SACHETS X 12G.', plannedQty: 8000, producedQty: 4600, uom: 'Nos', poNo: 'PO-2412-00108' },
          { name: 'KIVO GOOD TIMES NDC DISPLAY BOX', plannedQty: 7000, producedQty: 2600, uom: 'Nos', poNo: 'PO-2412-00109' }
        ],
        stages: buildJobStages(2),
        inspectedBy: 'Raj Kumar',
        inspectedOn: '19/12/2024 10:45 AM',
        remarks: 'All parameters are within specification.',
        photos: [{ url: boxImg1, name: 'box_top.jpg' }, { url: boxImg2, name: 'box_printing.jpg' }],
        stageBadgeClass: 'printing-qc-badge',
        time: 'Today 10:30 AM',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070072',
        batchNo: 'BCH-24070072-02',
        customer: 'KRAFT NIGERIA PLC',
        plannedQty: 15000,
        producedQty: 5000,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '29 Dec 2024',
        pos: [{ poNo: 'PO-2412-00210', qty: 15000 }],
        totalItems: 1,
        items: [
          { name: 'KRAFT BISCUIT CORRUGATED BOX', plannedQty: 15000, producedQty: 5000, uom: 'Nos', poNo: 'PO-2412-00210' }
        ],
        stages: buildJobStages(0),
        inspectedBy: 'Amit Sharma',
        inspectedOn: '19/12/2024 11:20 AM',
        remarks: 'Sheet dimensions matched.',
        photos: [],
        stageBadgeClass: 'corrugation-qc-badge',
        time: 'Today 09:45 AM',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070073',
        batchNo: 'BCH-24070073-03',
        customer: 'XYZ PACKAGING LTD',
        plannedQty: 10000,
        producedQty: 0,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '30 Dec 2024',
        pos: [{ poNo: 'PO-2412-00305', qty: 10000 }],
        totalItems: 2,
        items: [
          { name: 'XYZ SHIPPER INNER CARTONS', plannedQty: 6000, producedQty: 0, uom: 'Nos', poNo: 'PO-2412-00305' },
          { name: 'XYZ SHIPPER OUTER BOX', plannedQty: 4000, producedQty: 0, uom: 'Nos', poNo: 'PO-2412-00305' }
        ],
        stages: buildJobStages(0),
        inspectedBy: 'Vijay Singh',
        inspectedOn: '19/12/2024 12:10 PM',
        remarks: 'Job on hold.',
        photos: [],
        stageBadgeClass: 'corrugation-qc-badge',
        time: 'Today 09:10 AM',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070074',
        batchNo: 'BCH-24070074-04',
        customer: 'NIGERIA BEVERAGES LTD',
        plannedQty: 30000,
        producedQty: 0,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '01 Jan 2025',
        pos: [{ poNo: 'PO-2412-00401', qty: 30000 }],
        totalItems: 1,
        items: [
          { name: 'KIVO BEVERAGE TRAYS', plannedQty: 30000, producedQty: 0, uom: 'Nos', poNo: 'PO-2412-00401' }
        ],
        stages: buildJobStages(-1),
        inspectedBy: 'Raj Kumar',
        inspectedOn: '',
        remarks: '',
        photos: [],
        stageBadgeClass: 'printing-qc-badge',
        time: 'Today 08:30 AM',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070075',
        batchNo: 'BCH-24070075-05',
        customer: 'BLUE OCEAN BEVERAGES',
        plannedQty: 22000,
        producedQty: 10000,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '02 Jan 2025',
        pos: [{ poNo: 'PO-2412-00501', qty: 22000 }],
        totalItems: 1,
        items: [
          { name: 'BLUE OCEAN 350ML 24PK TRAY', plannedQty: 22000, producedQty: 10000, uom: 'Nos', poNo: 'PO-2412-00501' }
        ],
        stages: buildJobStages(3),
        inspectedBy: 'Amit Sharma',
        inspectedOn: '19/12/2024 03:30 PM',
        remarks: 'Slotter settings aligned.',
        photos: [],
        stageBadgeClass: 'slotting-qc-badge',
        time: 'Today 07:15 AM',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070076',
        batchNo: 'BCH-24070076-06',
        customer: 'SUPREME FOODS CO',
        plannedQty: 18000,
        producedQty: 8000,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '03 Jan 2025',
        pos: [{ poNo: 'PO-2412-00602', qty: 18000 }],
        totalItems: 2,
        items: [
          { name: 'SUPREME OIL CARTONS 1L', plannedQty: 10000, producedQty: 4500, uom: 'Nos', poNo: 'PO-2412-00602' },
          { name: 'SUPREME OIL CARTONS 2L', plannedQty: 8000, producedQty: 3500, uom: 'Nos', poNo: 'PO-2412-00602' }
        ],
        stages: buildJobStages(1),
        inspectedBy: 'Vijay Singh',
        inspectedOn: '19/12/2024 04:10 PM',
        remarks: 'Checking adhesive bonding.',
        photos: [],
        stageBadgeClass: 'corrugation-qc-badge',
        time: 'Today 06:45 AM',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070077',
        batchNo: 'BCH-24070077-07',
        customer: 'GLOBAL BREWERIES',
        plannedQty: 12000,
        producedQty: 6000,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '04 Jan 2025',
        pos: [{ poNo: 'PO-2412-00703', qty: 12000 }],
        totalItems: 1,
        items: [
          { name: 'LAGER BEER 24BTL EXPORT BOX', plannedQty: 12000, producedQty: 6000, uom: 'Nos', poNo: 'PO-2412-00703' }
        ],
        stages: buildJobStages(4),
        inspectedBy: 'Deepak Patil',
        inspectedOn: '19/12/2024 04:40 PM',
        remarks: 'Hand slots cut check ok.',
        photos: [],
        stageBadgeClass: 'die-cutting-qc-badge',
        time: 'Yesterday 05:30 PM',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070078',
        batchNo: 'BCH-24070078-08',
        customer: 'RUDRA COSMETICS',
        plannedQty: 8500,
        producedQty: 4000,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '05 Jan 2025',
        pos: [{ poNo: 'PO-2412-00804', qty: 8500 }],
        totalItems: 1,
        items: [
          { name: 'COSMETIC TUBE SHIPPING MASTER', plannedQty: 8500, producedQty: 4000, uom: 'Nos', poNo: 'PO-2412-00804' }
        ],
        stages: buildJobStages(5),
        inspectedBy: 'Raj Kumar',
        inspectedOn: '19/12/2024 05:10 PM',
        remarks: 'Stitch count verifies ok.',
        photos: [],
        stageBadgeClass: 'stitching-qc-badge',
        time: 'Yesterday 04:20 PM',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070079',
        batchNo: 'BCH-24070079-09',
        customer: 'BLUE STAR LOGISTICS',
        plannedQty: 14000,
        producedQty: 7000,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '06 Jan 2025',
        pos: [{ poNo: 'PO-2412-00905', qty: 14000 }],
        totalItems: 1,
        items: [
          { name: 'BLUE STAR MASTER CARGO BOX', plannedQty: 14000, producedQty: 7000, uom: 'Nos', poNo: 'PO-2412-00905' }
        ],
        stages: buildJobStages(6),
        inspectedBy: 'Amit Sharma',
        inspectedOn: '19/12/2024 05:40 PM',
        remarks: 'Secured bundling verification.',
        photos: [],
        stageBadgeClass: 'packing-qc-badge',
        time: 'Yesterday 03:00 PM',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070080',
        batchNo: 'BCH-24070080-10',
        customer: 'VIBRANT ADHESIVES',
        plannedQty: 20000,
        producedQty: 20000,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '07 Jan 2025',
        pos: [{ poNo: 'PO-2412-01006', qty: 20000 }],
        totalItems: 2,
        items: [
          { name: 'GLUE TUBE PACKING OUTER 100G', plannedQty: 12000, producedQty: 12000, uom: 'Nos', poNo: 'PO-2412-01006' },
          { name: 'GLUE TUBE PACKING OUTER 250G', plannedQty: 8000, producedQty: 8000, uom: 'Nos', poNo: 'PO-2412-01006' }
        ],
        stages: buildJobStages(7),
        inspectedBy: 'Vijay Singh',
        inspectedOn: '19/12/2024 06:10 PM',
        remarks: 'Order finalized.',
        photos: [],
        stageBadgeClass: 'final-qc-badge',
        time: '2 days ago',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070081',
        batchNo: 'BCH-24070081-11',
        customer: 'SUMMIT CONTAINER CO',
        plannedQty: 16000,
        producedQty: 0,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '08 Jan 2025',
        pos: [{ poNo: 'PO-2412-01107', qty: 16000 }],
        totalItems: 1,
        items: [
          { name: 'SUMMIT HEAVY STACKABLE TRAY', plannedQty: 16000, producedQty: 0, uom: 'Nos', poNo: 'PO-2412-01107' }
        ],
        stages: buildJobStages(-1),
        inspectedBy: 'Deepak Patil',
        inspectedOn: '',
        remarks: '',
        photos: [],
        stageBadgeClass: 'printing-qc-badge',
        time: '2 days ago',
        stageParameters: buildStageParameters()
      },
      {
        jobId: 'JOB-24070082',
        batchNo: 'BCH-24070082-12',
        customer: 'PRIME PACKAGING CORP',
        plannedQty: 28000,
        producedQty: 0,
        uom: 'Nos',
        jobDate: '19 Dec 2024',
        dueDate: '09 Jan 2025',
        pos: [{ poNo: 'PO-2412-01208', qty: 28000 }],
        totalItems: 1,
        items: [
          { name: 'PRIME BROWN SHIPPING BOX 3 PLY', plannedQty: 28000, producedQty: 0, uom: 'Nos', poNo: 'PO-2412-01208' }
        ],
        stages: buildJobStages(0),
        inspectedBy: 'Raj Kumar',
        inspectedOn: '19/12/2024 07:10 PM',
        remarks: 'Validation pending.',
        photos: [],
        stageBadgeClass: 'corrugation-qc-badge',
        time: '3 days ago',
        stageParameters: buildStageParameters()
      }
    ];
  }
}