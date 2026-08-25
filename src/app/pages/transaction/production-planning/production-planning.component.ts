import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

export interface BatchItem {
  sNo: number;
  itemCode: string;
  itemDescription: string;
  customerPo: string;
  size: string;
  specification: string;
  plannedQty: number;
  sheetWidth: number;
  sheetLength: number;
  status: string;
}

export interface ProductionStageSequence {
  name: string;
  machine: string;
  model: string;
  plannedSpeed: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'On Hold';
  checked: boolean;
}

export interface KeySpec {
  fluteType: string;
  ply: string;
  color: string;
  boardGsm: string;
  sheetWidth: number;
  sheetLength: number;
  dieCutOuts: number;
  finishSize: string;
}

export interface PlanningBatch {
  jobId: string;
  batchNo: string;
  customer: string;
  pos: string;
  totalItems: number;
  jobReleaseDate: string;
  plannedStartDate: string;
  plannedDeliveryDate: string;
  status: string;
  versionNo: number;
  totalPlannedQty: number;
  totalWeight: number;
  totalSheets: number;
  createdBy: string;
  createdOn: string;
  items: BatchItem[];
  stages: ProductionStageSequence[];
  keySpecs: KeySpec;
  standardWastage: number;
  bomSize: number;
  drawingNo: string;
  approvedBy: string;
  approvedOn: string;
  remarks: string;
  attachments: { name: string; size: string; type?: string }[];
  time: string;
}

@Component({
  selector: 'app-production-planning',
  standalone: false,
  templateUrl: './production-planning.component.html',
  styleUrl: './production-planning.component.css'
})
export class ProductionPlanningComponent implements OnInit {
  @ViewChild('attachmentInput') attachmentInput!: ElementRef<HTMLInputElement>;
  @ViewChild('excelInput') excelInput!: ElementRef<HTMLInputElement>;

  batches: PlanningBatch[] = [];
  selectedBatch: PlanningBatch | null = null;
  activeTab: string = 'Item Details';
  
  // State control flags
  isEditMode = false;
  isCreateMode = false;
  showExcelDialog = false;
  editingSequence = false;
  searchQuery = '';
  stageFilter = 'All Stages';

  // Pagination State
  currentPage = 1;
  pageSize = 6;

  get totalPages(): number {
    return Math.ceil(this.filteredBatches.length / this.pageSize);
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

  get paginatedBatches(): PlanningBatch[] {
    const total = this.filteredBatches.length;
    const maxPage = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredBatches.slice(startIndex, startIndex + this.pageSize);
  }

  // Standard lists
  tabs: string[] = [
    'Item Details',
    'Process Flow',
    'Materials / BOM',
    'Specifications',
    'Machine Plan',
    'QC Plan',
    'Notes',
    'History'
  ];

  stageFilters: string[] = [
    'All Stages',
    'Sheet Cutting',
    'Corrugation',
    'Printing',
    'Slotting',
    'Die Cutting',
    'Stitching',
    'Packing'
  ];

  // Temp holder for checkbox edits in sequence screen
  tempSequenceStages: ProductionStageSequence[] = [];

  constructor(
    private route: ActivatedRoute,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.initializeMockData();
    if (this.batches.length > 0) {
      this.selectBatch(this.batches[0]);
    }

    // Check for query parameters passed from other screens
    this.route.queryParams.subscribe(params => {
      if (params['job']) {
        const matching = this.batches.find(b => b.jobId === params['job'] || b.batchNo === params['job']);
        if (matching) {
          this.selectBatch(matching);
        }
      }
    });
  }

  // Filter batches based on search query and active stage
  get filteredBatches(): PlanningBatch[] {
    return this.batches.filter(b => {
      const query = this.searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        b.batchNo.toLowerCase().includes(query) ||
        b.jobId.toLowerCase().includes(query) ||
        b.customer.toLowerCase().includes(query) ||
        b.pos.toLowerCase().includes(query);

      let matchesStage = true;
      if (this.stageFilter !== 'All Stages') {
        const hasStage = b.stages.some(s => s.checked && s.name.toLowerCase().includes(this.stageFilter.replace(' QC', '').toLowerCase()));
        matchesStage = hasStage;
      }

      return matchesSearch && matchesStage;
    });
  }

  selectBatch(batch: PlanningBatch): void {
    this.selectedBatch = batch;
    this.isEditMode = false;
    this.isCreateMode = false;
    this.editingSequence = false;
    this.activeTab = 'Item Details';
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  // Form operations
  newBatch(): void {
    this.isCreateMode = true;
    this.isEditMode = true;
    this.editingSequence = false;
    this.activeTab = 'Item Details';

    // Blank template planning record
    const todayStr = new Date().toISOString().split('T')[0];
    this.selectedBatch = {
      jobId: '',
      batchNo: 'BCH-' + Math.floor(1000000 + Math.random() * 9000000) + '-01',
      customer: '',
      pos: '',
      totalItems: 1,
      jobReleaseDate: todayStr,
      plannedStartDate: todayStr,
      plannedDeliveryDate: todayStr,
      status: 'Planned',
      versionNo: 1,
      totalPlannedQty: 0,
      totalWeight: 0,
      totalSheets: 0,
      createdBy: 'GOPINATH',
      createdOn: todayStr + ' 10:00 AM',
      items: [
        { sNo: 1, itemCode: '', itemDescription: '', customerPo: '', size: '', specification: '', plannedQty: 0, sheetWidth: 0, sheetLength: 0, status: 'Planned' }
      ],
      stages: this.getDefaultStages(),
      keySpecs: {
        fluteType: '3C',
        ply: '3 Ply',
        color: 'Brown',
        boardGsm: '120/120/120',
        sheetWidth: 0,
        sheetLength: 0,
        dieCutOuts: 0,
        finishSize: ''
      },
      standardWastage: 7,
      bomSize: 100000,
      drawingNo: '',
      approvedBy: 'GOPINATH',
      approvedOn: todayStr + ' 10:00 AM',
      remarks: '',
      attachments: [],
      time: 'Just Now'
    };
  }

  editBatch(): void {
    if (!this.selectedBatch) return;
    this.isEditMode = true;
    this.isCreateMode = false;
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Mode Active',
      detail: 'Form fields are now editable.'
    });
  }

  saveBatch(): void {
    if (!this.selectedBatch) return;

    if (!this.selectedBatch.batchNo || !this.selectedBatch.jobId || !this.selectedBatch.customer) {
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Batch No, Job ID and Customer are required fields.'
      });
      return;
    }

    if (this.isCreateMode) {
      this.batches.unshift(this.selectedBatch);
      this.isCreateMode = false;
    }

    this.isEditMode = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: `Production plan for ${this.selectedBatch.batchNo} saved successfully.`
    });
  }

  cancelEdit(): void {
    this.isEditMode = false;
    if (this.isCreateMode && this.batches.length > 0) {
      this.selectBatch(this.batches[0]);
    } else if (this.selectedBatch) {
      // Reload current selected
      const origin = this.batches.find(b => b.batchNo === this.selectedBatch?.batchNo);
      if (origin) {
        this.selectedBatch = JSON.parse(JSON.stringify(origin));
      }
    }
  }

  printPlan(): void {
    if (!this.selectedBatch) return;
    this.messageService.add({
      severity: 'success',
      summary: 'Print Spooled',
      detail: `Sending ${this.selectedBatch.batchNo} summary sheets to the floor printer.`
    });
  }

  // Attachments
  triggerAttachmentUpload(): void {
    this.attachmentInput.nativeElement.click();
  }

  onAttachmentSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (!this.selectedBatch) return;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sz = file.size > 1024 * 1024 
          ? (file.size / (1024 * 1024)).toFixed(2) + ' MB'
          : (file.size / 1024).toFixed(1) + ' KB';
        this.selectedBatch.attachments.push({
          name: file.name,
          size: sz,
          type: file.type
        });
      }
      this.messageService.add({
        severity: 'success',
        summary: 'Attachments Added',
        detail: `${files.length} file(s) uploaded. Review inside Notes & Attachments tab.`
      });
    }
    event.target.value = '';
  }

  deleteAttachment(index: number): void {
    if (!this.selectedBatch) return;
    this.selectedBatch.attachments.splice(index, 1);
    this.messageService.add({
      severity: 'info',
      summary: 'Removed',
      detail: 'File attachment deleted.'
    });
  }

  // Excel template pop up dialog
  openExcelImport(): void {
    this.showExcelDialog = true;
  }

  triggerExcelUpload(): void {
    this.excelInput.nativeElement.click();
  }

  onExcelFileUploaded(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.simulateExcelImport(files[0].name);
    }
    event.target.value = '';
  }

  simulateExcelImport(fileName: string = 'planning_template.xlsx'): void {
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Create new batch autofilled from template
    const importedBatch: PlanningBatch = {
      jobId: 'JOB-24070085',
      batchNo: 'BCH-24070085-01',
      customer: 'SONIA FOODS INDUSTRIES LIMITED',
      pos: 'PO-2412-00501',
      totalItems: 2,
      jobReleaseDate: todayStr,
      plannedStartDate: todayStr,
      plannedDeliveryDate: '29/12/2024',
      status: 'Planned',
      versionNo: 1,
      totalPlannedQty: 18000,
      totalWeight: 5900.00,
      totalSheets: 280,
      createdBy: 'EXCEL_LOADER',
      createdOn: todayStr + ' 11:30 AM',
      items: [
        { sNo: 1, itemCode: 'ITM-000180', itemDescription: 'KIVO CHOCO DELIGHT SACHETS X 24G', customerPo: 'PO-2412-00501', size: '300x200x120', specification: '3 Ply / 3C / Brown', plannedQty: 10000, sheetWidth: 320, sheetLength: 1000, status: 'Released' },
        { sNo: 2, itemCode: 'ITM-000181', itemDescription: 'KIVO CHOCO DELIGHT DISPLAY BOX', customerPo: 'PO-2412-00501', size: '350x250x200', specification: '5 Ply / 4C / Brown', plannedQty: 8000, sheetWidth: 380, sheetLength: 1100, status: 'Released' }
      ],
      stages: [
        { name: 'Sheet Cutting', machine: 'Auto Corrugator', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'Pending', checked: true },
        { name: 'Corrugation', machine: 'Single Facer', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'Pending', checked: true },
        { name: 'Printing', machine: 'Flexo Printer', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'Pending', checked: true },
        { name: 'Slotting', machine: 'Slotter', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'Pending', checked: true },
        { name: 'Die Cutting', machine: 'Rotary Die Cutter', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'Pending', checked: false },
        { name: 'Stitching / Gluing', machine: 'Stitching Machine', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'Pending', checked: true },
        { name: 'Packing', machine: 'Packing Table', model: 'PT-01', plannedSpeed: 'Manual', status: 'Pending', checked: true }
      ],
      keySpecs: {
        fluteType: '3C',
        ply: '3 Ply',
        color: 'Brown',
        boardGsm: '120 / 120 / 120',
        sheetWidth: 320,
        sheetLength: 1000,
        dieCutOuts: 0,
        finishSize: '300 x 200 x 120'
      },
      standardWastage: 7,
      bomSize: 80000,
      drawingNo: 'SA.9902/SA-102',
      approvedBy: 'GOPINATH',
      approvedOn: todayStr + ' 11:35 AM',
      remarks: 'Imported from Excel template successfully.',
      attachments: [{ name: fileName, size: '24.5 KB' }],
      time: 'Just Now'
    };

    // Insert imported batch at the top of list
    this.batches.unshift(importedBatch);
    this.selectBatch(importedBatch);

    this.showExcelDialog = false;
    this.messageService.add({
      severity: 'success',
      summary: 'Excel Imported',
      detail: `Plan values autofilled for Batch ${importedBatch.batchNo}.`
    });

    // Move to the Process Flow tab automatically as requested
    this.switchTab('Process Flow');
  }

  downloadExcelTemplate(): void {
    // Generates a simple text CSV as a mock Excel template download
    const csvContent = "data:text/csv;charset=utf-8," 
      + "BatchNo,JobID,Customer,PlannedQty,Sheets,Weight,ItemsCsv\n"
      + "BCH-24070085-01,JOB-24070085,SONIA FOODS INDUSTRIES LIMITED,18000,280,5900,ITM-000180|ITM-000181";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Production_Planning_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.messageService.add({
      severity: 'info',
      summary: 'Template Downloaded',
      detail: 'Use this format to load spreadsheet variables.'
    });
  }

  // Process Flow sequence edit logic
  startSequenceEdit(): void {
    if (!this.selectedBatch) return;
    this.editingSequence = true;
    // Clone sequence to edit checked values safely
    this.tempSequenceStages = JSON.parse(JSON.stringify(this.selectedBatch.stages));
  }

  saveSequence(): void {
    if (!this.selectedBatch) return;
    
    // Assign edited checklist sequence back to job
    this.selectedBatch.stages = JSON.parse(JSON.stringify(this.tempSequenceStages));
    this.editingSequence = false;

    // Reset status sequences logically based on sequence indices
    let metPending = false;
    this.selectedBatch.stages.forEach(st => {
      if (!st.checked) return;
      if (st.status === 'In Progress') {
        metPending = true;
      } else if (st.status === 'Completed') {
        // Keeps completed status
      } else {
        // Rest becomes Pending if we haven't hit the active stage, or On Hold
        if (!metPending) {
          st.status = 'In Progress';
          metPending = true;
        } else {
          st.status = 'Pending';
        }
      }
    });

    this.messageService.add({
      severity: 'success',
      summary: 'Sequence Saved',
      detail: 'Process flow sequence timeline updated successfully.'
    });
  }

  cancelSequenceEdit(): void {
    this.editingSequence = false;
    this.tempSequenceStages = [];
  }

  // Get only checked sequence list for presentation view
  get activeStagesSequence(): ProductionStageSequence[] {
    if (!this.selectedBatch) return [];
    return this.selectedBatch.stages.filter(s => s.checked);
  }

  private getDefaultStages(): ProductionStageSequence[] {
    return [
      { name: 'Sheet Cutting', machine: 'Auto Corrugator', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'Completed', checked: true },
      { name: 'Corrugation', machine: 'Single Facer', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'Completed', checked: true },
      { name: 'Printing', machine: 'Flexo Printer', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'In Progress', checked: true },
      { name: 'Slotting', machine: 'Slotter', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'Pending', checked: true },
      { name: 'Die Cutting', machine: 'Rotary Die Cutter', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'Pending', checked: true },
      { name: 'Stitching / Gluing', machine: 'Stitching Machine', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'Pending', checked: true },
      { name: 'Packing', machine: 'Packing Table', model: 'PT-01', plannedSpeed: 'Manual', status: 'Pending', checked: true }
    ];
  }

  private initializeMockData(): void {
    const today = '19/12/2024';

    this.batches = [
      {
        jobId: 'JOB-24070071',
        batchNo: 'BCH-24070071-01',
        customer: 'SONIA FOODS INDUSTRIES LIMITED',
        pos: 'PO-2412-00108, PO-2412-00109',
        totalItems: 3,
        jobReleaseDate: today,
        plannedStartDate: '20/12/2024',
        plannedDeliveryDate: '28/12/2024',
        status: 'Released to Production',
        versionNo: 1,
        totalPlannedQty: 25000,
        totalWeight: 8250.00,
        totalSheets: 362,
        createdBy: 'GOPINATH',
        createdOn: '19/12/2024 10:30 AM',
        items: [
          { sNo: 1, itemCode: 'ITM-000145', itemDescription: 'KIVO GOOD TIMES NDC SECONDARY 220 SACHETS X 12G.', customerPo: 'PO-2412-00108', size: '334x214x148', specification: '3 Ply / 3C / Brown', plannedQty: 10000, sheetWidth: 362, sheetLength: 1136, status: 'Released' },
          { sNo: 2, itemCode: 'ITM-000146', itemDescription: 'KIVO GOOD TIMES NDC SECONDARY 110 SACHETS X 12G.', customerPo: 'PO-2412-00108', size: '250x160x120', specification: '3 Ply / 2C / Brown', plannedQty: 8000, sheetWidth: 362, sheetLength: 900, status: 'Released' },
          { sNo: 3, itemCode: 'ITM-000147', itemDescription: 'KIVO GOOD TIMES NDC DISPLAY BOX', customerPo: 'PO-2412-00109', size: '400x300x250', specification: '5 Ply / 4C / Brown', plannedQty: 7000, sheetWidth: 400, sheetLength: 1200, status: 'Released' }
        ],
        stages: this.getDefaultStages(),
        keySpecs: { fluteType: '3C', ply: '3 Ply', color: 'Brown', boardGsm: '150 / 150 / 150', sheetWidth: 362, sheetLength: 1136, dieCutOuts: 0, finishSize: '334 x 214 x 148' },
        standardWastage: 7,
        bomSize: 100000,
        drawingNo: 'SA.2301/SA-144/1',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 10:45 AM',
        remarks: 'All specifications, materials and machines are planned as per customer requirements.',
        attachments: [],
        time: 'Today 10:30 AM'
      },
      {
        jobId: 'JOB-24070072',
        batchNo: 'BCH-24070072-02',
        customer: 'KRAFT NIGERIA PLC',
        pos: 'PO-2412-00210',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '21/12/2024',
        plannedDeliveryDate: '29/12/2024',
        status: 'Released to Production',
        versionNo: 1,
        totalPlannedQty: 15000,
        totalWeight: 4950.00,
        totalSheets: 210,
        createdBy: 'AMIT',
        createdOn: '19/12/2024 11:15 AM',
        items: [
          { sNo: 1, itemCode: 'ITM-000150', itemDescription: 'KRAFT BISCUIT CORRUGATED BOX', customerPo: 'PO-2412-00210', size: '300x200x150', specification: '3 Ply / 3C / Brown', plannedQty: 15000, sheetWidth: 320, sheetLength: 950, status: 'Released' }
        ],
        stages: [
          { name: 'Sheet Cutting', machine: 'Auto Corrugator', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'In Progress', checked: true },
          { name: 'Corrugation', machine: 'Single Facer', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'Pending', checked: true },
          { name: 'Printing', machine: 'Flexo Printer', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'Pending', checked: true },
          { name: 'Slotting', machine: 'Slotter', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'Pending', checked: true },
          { name: 'Die Cutting', machine: 'Rotary Die Cutter', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'Pending', checked: false },
          { name: 'Stitching / Gluing', machine: 'Stitching Machine', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'Pending', checked: false },
          { name: 'Packing', machine: 'Packing Table', model: 'PT-01', plannedSpeed: 'Manual', status: 'Pending', checked: true }
        ],
        keySpecs: { fluteType: '3C', ply: '3 Ply', color: 'Brown', boardGsm: '120 / 120 / 120', sheetWidth: 320, sheetLength: 950, dieCutOuts: 0, finishSize: '300 x 200 x 150' },
        standardWastage: 7,
        bomSize: 60000,
        drawingNo: 'SA.4402/SA-90',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 11:20 AM',
        remarks: 'Line production schedule active.',
        attachments: [],
        time: 'Today 09:45 AM'
      },
      {
        jobId: 'JOB-24070073',
        batchNo: 'BCH-24070073-03',
        customer: 'XYZ PACKAGING LTD',
        pos: 'PO-2412-00305',
        totalItems: 2,
        jobReleaseDate: today,
        plannedStartDate: '22/12/2024',
        plannedDeliveryDate: '30/12/2024',
        status: 'On Hold',
        versionNo: 1,
        totalPlannedQty: 10000,
        totalWeight: 3100.00,
        totalSheets: 140,
        createdBy: 'VIJAY',
        createdOn: '19/12/2024 12:00 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000161', itemDescription: 'XYZ SHIPPER INNER CARTONS', customerPo: 'PO-2412-00305', size: '200x150x100', specification: '3 Ply / B / Craft', plannedQty: 6000, sheetWidth: 220, sheetLength: 800, status: 'On Hold' },
          { sNo: 2, itemCode: 'ITM-000162', itemDescription: 'XYZ SHIPPER OUTER BOX', customerPo: 'PO-2412-00305', size: '400x300x200', specification: '5 Ply / BC / Kraft', plannedQty: 4000, sheetWidth: 420, sheetLength: 1200, status: 'On Hold' }
        ],
        stages: this.getDefaultStages(),
        keySpecs: { fluteType: 'BC', ply: '5 Ply', color: 'Kraft', boardGsm: '150 / 120 / 120 / 120 / 150', sheetWidth: 420, sheetLength: 1200, dieCutOuts: 0, finishSize: '400 x 300 x 200' },
        standardWastage: 8,
        bomSize: 45000,
        drawingNo: 'SA.1102/SA-44',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 12:10 PM',
        remarks: 'Awaiting customer color confirmation.',
        attachments: [],
        time: 'Today 09:10 AM'
      },
      {
        jobId: 'JOB-24070074',
        batchNo: 'BCH-24070074-04',
        customer: 'NIGERIA BEVERAGES LTD',
        pos: 'PO-2412-00401',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '23/12/2024',
        plannedDeliveryDate: '01/01/2025',
        status: 'Planned',
        versionNo: 2,
        totalPlannedQty: 30000,
        totalWeight: 9900.00,
        totalSheets: 450,
        createdBy: 'GOPINATH',
        createdOn: '19/12/2024 02:30 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000171', itemDescription: 'KIVO BEVERAGE TRAYS', customerPo: 'PO-2412-00401', size: '450x350x80', specification: '3 Ply / 3C / Brown', plannedQty: 30000, sheetWidth: 470, sheetLength: 1050, status: 'Released' }
        ],
        stages: this.getDefaultStages(),
        keySpecs: { fluteType: '3C', ply: '3 Ply', color: 'Brown', boardGsm: '120 / 120 / 120', sheetWidth: 470, sheetLength: 1050, dieCutOuts: 0, finishSize: '450 x 350 x 80' },
        standardWastage: 6,
        bomSize: 120000,
        drawingNo: 'SA.8890/SA-77',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 02:45 PM',
        remarks: 'Scheduled on High Speed Corrugator.',
        attachments: [],
        time: 'Today 08:30 AM'
      },
      {
        jobId: 'JOB-24070075',
        batchNo: 'BCH-24070075-05',
        customer: 'BLUE OCEAN BEVERAGES',
        pos: 'PO-2412-00501',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '24/12/2024',
        plannedDeliveryDate: '02/01/2025',
        status: 'Released to Production',
        versionNo: 1,
        totalPlannedQty: 22000,
        totalWeight: 7260.00,
        totalSheets: 310,
        createdBy: 'AMIT',
        createdOn: '19/12/2024 03:15 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000185', itemDescription: 'BLUE OCEAN 350ML 24PK TRAY', customerPo: 'PO-2412-00501', size: '400x280x100', specification: '3 Ply / 3C / Brown', plannedQty: 22000, sheetWidth: 420, sheetLength: 980, status: 'Released' }
        ],
        stages: [
          { name: 'Sheet Cutting', machine: 'Auto Corrugator', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Corrugation', machine: 'Single Facer', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'Completed', checked: true },
          { name: 'Printing', machine: 'Flexo Printer', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Slotting', machine: 'Slotter', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'In Progress', checked: true },
          { name: 'Die Cutting', machine: 'Rotary Die Cutter', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'Pending', checked: false },
          { name: 'Stitching / Gluing', machine: 'Stitching Machine', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'Pending', checked: true },
          { name: 'Packing', machine: 'Packing Table', model: 'PT-01', plannedSpeed: 'Manual', status: 'Pending', checked: true }
        ],
        keySpecs: { fluteType: '3C', ply: '3 Ply', color: 'Brown', boardGsm: '125 / 125 / 125', sheetWidth: 420, sheetLength: 980, dieCutOuts: 0, finishSize: '400 x 280 x 100' },
        standardWastage: 7,
        bomSize: 90000,
        drawingNo: 'SA.9012/SA-88',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 03:30 PM',
        remarks: 'Direct feed from corrugator printing slotting.',
        attachments: [],
        time: 'Today 07:15 AM'
      },
      {
        jobId: 'JOB-24070076',
        batchNo: 'BCH-24070076-06',
        customer: 'SUPREME FOODS CO',
        pos: 'PO-2412-00602',
        totalItems: 2,
        jobReleaseDate: today,
        plannedStartDate: '25/12/2024',
        plannedDeliveryDate: '03/01/2025',
        status: 'Released to Production',
        versionNo: 1,
        totalPlannedQty: 18000,
        totalWeight: 6120.00,
        totalSheets: 260,
        createdBy: 'VIJAY',
        createdOn: '19/12/2024 04:00 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000191', itemDescription: 'SUPREME OIL CARTONS 1L', customerPo: 'PO-2412-00602', size: '320x240x260', specification: '5 Ply / BC / Brown', plannedQty: 10000, sheetWidth: 340, sheetLength: 1050, status: 'Released' },
          { sNo: 2, itemCode: 'ITM-000192', itemDescription: 'SUPREME OIL CARTONS 2L', customerPo: 'PO-2412-00602', size: '360x280x280', specification: '5 Ply / BC / Brown', plannedQty: 8000, sheetWidth: 380, sheetLength: 1150, status: 'Released' }
        ],
        stages: [
          { name: 'Sheet Cutting', machine: 'Auto Corrugator', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Corrugation', machine: 'Single Facer', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'In Progress', checked: true },
          { name: 'Printing', machine: 'Flexo Printer', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'Pending', checked: true },
          { name: 'Slotting', machine: 'Slotter', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'Pending', checked: true },
          { name: 'Die Cutting', machine: 'Rotary Die Cutter', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'Pending', checked: true },
          { name: 'Stitching / Gluing', machine: 'Stitching Machine', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'Pending', checked: true },
          { name: 'Packing', machine: 'Packing Table', model: 'PT-01', plannedSpeed: 'Manual', status: 'Pending', checked: true }
        ],
        keySpecs: { fluteType: 'BC', ply: '5 Ply', color: 'Brown', boardGsm: '150 / 120 / 120 / 120 / 150', sheetWidth: 340, sheetLength: 1050, dieCutOuts: 0, finishSize: '320 x 240 x 260' },
        standardWastage: 8,
        bomSize: 80000,
        drawingNo: 'SA.3312/SA-10',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 04:10 PM',
        remarks: 'Heavy duty starch formulation planned.',
        attachments: [],
        time: 'Today 06:45 AM'
      },
      {
        jobId: 'JOB-24070077',
        batchNo: 'BCH-24070077-07',
        customer: 'GLOBAL BREWERIES',
        pos: 'PO-2412-00703',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '26/12/2024',
        plannedDeliveryDate: '04/01/2025',
        status: 'Released to Production',
        versionNo: 1,
        totalPlannedQty: 12000,
        totalWeight: 4560.00,
        totalSheets: 180,
        createdBy: 'GOPINATH',
        createdOn: '19/12/2024 04:30 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000201', itemDescription: 'LAGER BEER 24BTL EXPORT BOX', customerPo: 'PO-2412-00703', size: '400x270x250', specification: '3 Ply / C / Brown', plannedQty: 12000, sheetWidth: 420, sheetLength: 950, status: 'Released' }
        ],
        stages: [
          { name: 'Sheet Cutting', machine: 'Auto Corrugator', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Corrugation', machine: 'Single Facer', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'Completed', checked: true },
          { name: 'Printing', machine: 'Flexo Printer', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Slotting', machine: 'Slotter', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Die Cutting', machine: 'Rotary Die Cutter', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'In Progress', checked: true },
          { name: 'Stitching / Gluing', machine: 'Stitching Machine', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'Pending', checked: true },
          { name: 'Packing', machine: 'Packing Table', model: 'PT-01', plannedSpeed: 'Manual', status: 'Pending', checked: true }
        ],
        keySpecs: { fluteType: 'C', ply: '3 Ply', color: 'Brown', boardGsm: '130 / 130 / 130', sheetWidth: 420, sheetLength: 950, dieCutOuts: 2, finishSize: '400 x 270 x 250' },
        standardWastage: 6,
        bomSize: 50000,
        drawingNo: 'SA.1099/SA-15',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 04:40 PM',
        remarks: 'Export quality gloss print run.',
        attachments: [],
        time: 'Yesterday 05:30 PM'
      },
      {
        jobId: 'JOB-24070078',
        batchNo: 'BCH-24070078-08',
        customer: 'RUDRA COSMETICS',
        pos: 'PO-2412-00804',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '27/12/2024',
        plannedDeliveryDate: '05/01/2025',
        status: 'Released to Production',
        versionNo: 1,
        totalPlannedQty: 8500,
        totalWeight: 3100.00,
        totalSheets: 130,
        createdBy: 'AMIT',
        createdOn: '19/12/2024 05:00 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000211', itemDescription: 'COSMETIC TUBE SHIPPING MASTER', customerPo: 'PO-2412-00804', size: '300x200x200', specification: '3 Ply / E / White', plannedQty: 8500, sheetWidth: 320, sheetLength: 850, status: 'Released' }
        ],
        stages: [
          { name: 'Sheet Cutting', machine: 'Auto Corrugator', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Corrugation', machine: 'Single Facer', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'Completed', checked: true },
          { name: 'Printing', machine: 'Flexo Printer', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Slotting', machine: 'Slotter', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Die Cutting', machine: 'Rotary Die Cutter', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Stitching / Gluing', machine: 'Stitching Machine', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'In Progress', checked: true },
          { name: 'Packing', machine: 'Packing Table', model: 'PT-01', plannedSpeed: 'Manual', status: 'Pending', checked: true }
        ],
        keySpecs: { fluteType: 'E', ply: '3 Ply', color: 'White', boardGsm: '140 / 110 / 140', sheetWidth: 320, sheetLength: 850, dieCutOuts: 0, finishSize: '300 x 200 x 200' },
        standardWastage: 7,
        bomSize: 40000,
        drawingNo: 'SA.8845/SA-01',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 05:10 PM',
        remarks: 'Premium white duplex board.',
        attachments: [],
        time: 'Yesterday 04:20 PM'
      },
      {
        jobId: 'JOB-24070079',
        batchNo: 'BCH-24070079-09',
        customer: 'BLUE STAR LOGISTICS',
        pos: 'PO-2412-00905',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '28/12/2024',
        plannedDeliveryDate: '06/01/2025',
        status: 'Released to Production',
        versionNo: 1,
        totalPlannedQty: 14000,
        totalWeight: 5320.00,
        totalSheets: 210,
        createdBy: 'VIJAY',
        createdOn: '19/12/2024 05:30 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000221', itemDescription: 'BLUE STAR MASTER CARGO BOX', customerPo: 'PO-2412-00905', size: '500x400x350', specification: '5 Ply / BC / Brown', plannedQty: 14000, sheetWidth: 520, sheetLength: 1250, status: 'Released' }
        ],
        stages: [
          { name: 'Sheet Cutting', machine: 'Auto Corrugator', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Corrugation', machine: 'Single Facer', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'Completed', checked: true },
          { name: 'Printing', machine: 'Flexo Printer', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Slotting', machine: 'Slotter', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Die Cutting', machine: 'Rotary Die Cutter', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Stitching / Gluing', machine: 'Stitching Machine', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Packing', machine: 'Packing Table', model: 'PT-01', plannedSpeed: 'Manual', status: 'In Progress', checked: true }
        ],
        keySpecs: { fluteType: 'BC', ply: '5 Ply', color: 'Brown', boardGsm: '180 / 120 / 120 / 120 / 180', sheetWidth: 520, sheetLength: 1250, dieCutOuts: 0, finishSize: '500 x 400 x 350' },
        standardWastage: 8,
        bomSize: 60000,
        drawingNo: 'SA.7723/SA-09',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 05:40 PM',
        remarks: 'Heavy shipper containers.',
        attachments: [],
        time: 'Yesterday 03:00 PM'
      },
      {
        jobId: 'JOB-24070080',
        batchNo: 'BCH-24070080-10',
        customer: 'VIBRANT ADHESIVES',
        pos: 'PO-2412-01006',
        totalItems: 2,
        jobReleaseDate: today,
        plannedStartDate: '29/12/2024',
        plannedDeliveryDate: '07/01/2025',
        status: 'Released to Production',
        versionNo: 1,
        totalPlannedQty: 20000,
        totalWeight: 6800.00,
        totalSheets: 290,
        createdBy: 'GOPINATH',
        createdOn: '19/12/2024 06:00 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000231', itemDescription: 'GLUE TUBE PACKING OUTER 100G', customerPo: 'PO-2412-01006', size: '280x180x150', specification: '3 Ply / C / Brown', plannedQty: 12000, sheetWidth: 300, sheetLength: 900, status: 'Released' },
          { sNo: 2, itemCode: 'ITM-000232', itemDescription: 'GLUE TUBE PACKING OUTER 250G', customerPo: 'PO-2412-01006', size: '320x220x180', specification: '3 Ply / C / Brown', plannedQty: 8000, sheetWidth: 340, sheetLength: 980, status: 'Released' }
        ],
        stages: [
          { name: 'Sheet Cutting', machine: 'Auto Corrugator', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Corrugation', machine: 'Single Facer', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'Completed', checked: true },
          { name: 'Printing', machine: 'Flexo Printer', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Slotting', machine: 'Slotter', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Die Cutting', machine: 'Rotary Die Cutter', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Stitching / Gluing', machine: 'Stitching Machine', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'Completed', checked: true },
          { name: 'Packing', machine: 'Packing Table', model: 'PT-01', plannedSpeed: 'Manual', status: 'Completed', checked: true }
        ],
        keySpecs: { fluteType: 'C', ply: '3 Ply', color: 'Brown', boardGsm: '120 / 120 / 120', sheetWidth: 300, sheetLength: 900, dieCutOuts: 0, finishSize: '280 x 180 x 150' },
        standardWastage: 7,
        bomSize: 75000,
        drawingNo: 'SA.1245/SA-52',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 06:10 PM',
        remarks: 'Order completed, final audit pending.',
        attachments: [],
        time: '2 days ago'
      },
      {
        jobId: 'JOB-24070081',
        batchNo: 'BCH-24070081-11',
        customer: 'SUMMIT CONTAINER CO',
        pos: 'PO-2412-01107',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '30/12/2024',
        plannedDeliveryDate: '08/01/2025',
        status: 'Planned',
        versionNo: 1,
        totalPlannedQty: 16000,
        totalWeight: 5440.00,
        totalSheets: 230,
        createdBy: 'AMIT',
        createdOn: '19/12/2024 06:30 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000241', itemDescription: 'SUMMIT HEAVY STACKABLE TRAY', customerPo: 'PO-2412-01107', size: '500x350x120', specification: '5 Ply / BC / Brown', plannedQty: 16000, sheetWidth: 520, sheetLength: 1100, status: 'Released' }
        ],
        stages: this.getDefaultStages(),
        keySpecs: { fluteType: 'BC', ply: '5 Ply', color: 'Brown', boardGsm: '150 / 120 / 120 / 120 / 150', sheetWidth: 520, sheetLength: 1100, dieCutOuts: 4, finishSize: '500 x 350 x 120' },
        standardWastage: 8,
        bomSize: 65000,
        drawingNo: 'SA.9934/SA-66',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 06:40 PM',
        remarks: 'Planned for stackable tray machinery.',
        attachments: [],
        time: '2 days ago'
      },
      {
        jobId: 'JOB-24070082',
        batchNo: 'BCH-24070082-12',
        customer: 'PRIME PACKAGING CORP',
        pos: 'PO-2412-01208',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '31/12/2024',
        plannedDeliveryDate: '09/01/2025',
        status: 'On Hold',
        versionNo: 1,
        totalPlannedQty: 28000,
        totalWeight: 9240.00,
        totalSheets: 410,
        createdBy: 'VIJAY',
        createdOn: '19/12/2024 07:00 PM',
        items: [
          { sNo: 1, itemCode: 'ITM-000251', itemDescription: 'PRIME BROWN SHIPPING BOX 3 PLY', customerPo: 'PO-2412-01208', size: '400x300x200', specification: '3 Ply / 3C / Kraft', plannedQty: 28000, sheetWidth: 420, sheetLength: 1200, status: 'On Hold' }
        ],
        stages: this.getDefaultStages(),
        keySpecs: { fluteType: '3C', ply: '3 Ply', color: 'Kraft', boardGsm: '120 / 120 / 120', sheetWidth: 420, sheetLength: 1200, dieCutOuts: 0, finishSize: '400 x 300 x 200' },
        standardWastage: 7,
        bomSize: 110000,
        drawingNo: 'SA.4489/SA-12',
        approvedBy: 'GOPINATH',
        approvedOn: '19/12/2024 07:10 PM',
        remarks: 'Hold due to credit check validation.',
        attachments: [],
        time: '3 days ago'
      }
    ];
  }
}
