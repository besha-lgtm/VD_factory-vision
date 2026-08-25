import { Component, OnInit } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';

export interface StageTracking {
  name: string;
  machine: string;
  model: string;
  plannedSpeed: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'On Hold';
}

export interface ItemStageSummary {
  stageName: string;
  plannedQty: number;
  goodQty: number;
  status: 'completed' | 'in-progress' | 'pending' | 'hold';
}

export interface ExecutionItem {
  sNo: number;
  itemCode: string;
  itemDescription: string;
  customerPo: string;
  size: string;
  specification: string;
  plannedQty: number;
  producedQty: number;
  goodQty: number;
  rejectedQty: number;
  sheetWidth: number;
  sheetLength: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'On Hold';
  stagesSummary: ItemStageSummary[];
}

export interface ProductionBatch {
  batchNo: string;
  jobId: string;
  customer: string;
  pos: string;
  totalItems: number;
  jobReleaseDate: string;
  plannedStartDate: string;
  plannedDeliveryDate: string;
  status: 'Planned' | 'In Progress' | 'On Hold' | 'Completed';
  versionNo: number;
  totalPlannedQty: number;
  totalProducedQty: number;
  totalWeight: number;
  totalSheets: number;
  createdBy: string;
  createdOn: string;
  lastUpdatedBy: string;
  lastUpdatedOn: string;
  currentStage: string;
  nextStage: string;
  workCenter: string;
  lineMachine: string;
  goodQty: number;
  rejectedQty: number;
  elapsedTime: string;
  isLate: boolean; // Flag to enable the Priority Override option
  items: ExecutionItem[];
  stages: StageTracking[];
  attachments: { name: string; size: string }[];
  downtimeLogs: { downtimeReason: string; durationMin: number; timestamp: string }[];
  materialConsumption: { itemCode: string; desc: string; qtyConsumed: number; reelNo: string }[];
  remarks?: string;
}

@Component({
  selector: 'app-production-execution',
  standalone: false,
  templateUrl: './production-execution.component.html',
  styleUrl: './production-execution.component.css'
})
export class ProductionExecutionComponent implements OnInit {
  // Batches list
  batches: ProductionBatch[] = [];
  filteredBatches: ProductionBatch[] = [];
  selectedBatch!: ProductionBatch;
  selectedItem!: ExecutionItem;
  selectedStage!: StageTracking;

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

  get paginatedBatches(): ProductionBatch[] {
    const total = this.filteredBatches.length;
    const maxPage = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredBatches.slice(startIndex, startIndex + this.pageSize);
  }

  // Search & Filter
  searchQuery = '';
  stageFilter = 'All Stages';
  stageFilters: string[] = [
    'All Stages',
    'Sheet Cutting',
    'Corrugation',
    'Printing',
    'Slotting',
    'Die Cutting',
    'Stitching / Gluing',
    'Packing'
  ];

  // Tabs
  tabs: string[] = [
    'Item Wise Progress',
    'Production Flow',
    'Stage Execution',
    'Downtime Log',
    'Material Consumption',
    'Documents',
    'Notes',
    'History'
  ];
  activeTab = 'Item Wise Progress';

  // Active Stage Form
  activeExecution = {
    machine: 'Flexo Line - 01',
    operator: 'Ramesh Kumar',
    assistant: 'Suresh',
    shift: 'A - Morning',
    startTime: '20/12/2024 11:00 AM',
    plannedQty: 10000,
    producedQty: 5200,
    goodQty: 5000,
    rejectedQty: 200,
    changeoverLoss: 50,
    downtime: 25,
    speed: 75,
    remarks: 'Printing quality satisfactory. Minor color variation on few sheets.'
  };

  // Dropdown lists
  machineOptions = [
    { label: 'Flexo Line - 01', value: 'Flexo Line - 01' },
    { label: 'BHS M/C-1 (2.2M)', value: 'BHS M/C-1 (2.2M)' },
    { label: 'Auto Cutting MC', value: 'Auto Cutting MC' },
    { label: 'Single Facer SF-1600', value: 'Single Facer SF-1600' },
    { label: 'Rotary Die Cutter', value: 'Rotary Die Cutter' }
  ];

  operatorOptions = [
    { label: 'Ramesh Kumar', value: 'Ramesh Kumar' },
    { label: 'Anil Sharma', value: 'Anil Sharma' },
    { label: 'Vikram Singh', value: 'Vikram Singh' },
    { label: 'Rajesh Patel', value: 'Rajesh Patel' }
  ];

  assistantOptions = [
    { label: 'Suresh', value: 'Suresh' },
    { label: 'Mahesh', value: 'Mahesh' },
    { label: 'Rakesh', value: 'Rakesh' },
    { label: 'Dinesh', value: 'Dinesh' }
  ];

  shiftOptions = [
    { label: 'A - Morning', value: 'A - Morning' },
    { label: 'B - Evening', value: 'B - Evening' },
    { label: 'C - Night', value: 'C - Night' }
  ];

  // Logs and inputs
  downtimeReasons = [
    'No Material',
    'Mechanical Breakdown',
    'Electrical Fault',
    'Set-up / Changeover',
    'Quality Inspection'
  ];
  newDowntime = { reason: 'Mechanical Breakdown', duration: 15 };
  
  newConsumption = { itemCode: 'KRAFT-150-1200', desc: '150 GSM Kraft Paper Reel', qty: 250, reelNo: 'R-241209-A' };

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeData();
    if (this.batches.length > 0) {
      this.selectBatch(this.batches[0]);
    }
  }

  initializeData(): void {
    const today = '19/12/2024';

    const defaultStagesSummary = (plannedQty: number, goodQty: number, status: 'completed' | 'in-progress' | 'pending' | 'hold'): ItemStageSummary[] => [
      { stageName: 'Sheet Cutting', plannedQty, goodQty: status === 'completed' ? plannedQty : goodQty, status: status === 'completed' ? 'completed' : 'in-progress' },
      { stageName: 'Corrugation', plannedQty, goodQty: status === 'completed' ? plannedQty : 0, status: status === 'completed' ? 'completed' : 'pending' },
      { stageName: 'Printing', plannedQty, goodQty: 0, status: 'pending' },
      { stageName: 'Slotting', plannedQty, goodQty: 0, status: 'pending' },
      { stageName: 'Die Cutting', plannedQty, goodQty: 0, status: 'pending' },
      { stageName: 'Stitching / Gluing', plannedQty, goodQty: 0, status: 'pending' },
      { stageName: 'Packing', plannedQty, goodQty: 0, status: 'pending' }
    ];

    const standardStages = (): StageTracking[] => [
      { name: 'Sheet Cutting', machine: 'Auto Cutter 1800', model: 'AC-1800', plannedSpeed: '120 Sheets/Min', status: 'Completed' },
      { name: 'Corrugation', machine: 'Single Facer 1600', model: 'SF-1600', plannedSpeed: '100 M/Min', status: 'Completed' },
      { name: 'Printing', machine: 'Flexo Printer BHS', model: 'BHS M/C-1', plannedSpeed: '80 Sheets/Min', status: 'In Progress' },
      { name: 'Slotting', machine: 'Rotary Slotter 2000', model: 'SLO-2000', plannedSpeed: '70 Sheets/Min', status: 'Pending' },
      { name: 'Die Cutting', machine: 'Rotary Die Cutter 1500', model: 'RDC-1500', plannedSpeed: '60 Sheets/Min', status: 'Pending' },
      { name: 'Stitching / Gluing', machine: 'Stitcher ST-1200', model: 'ST-1200', plannedSpeed: '90 Sheets/Min', status: 'Pending' },
      { name: 'Packing', machine: 'Packing Table PT-01', model: 'PT-01', plannedSpeed: 'Manual', status: 'Pending' }
    ];

    this.batches = [
      {
        batchNo: 'BCH-24070071-01',
        jobId: 'JOB-24070071',
        customer: 'SONIA FOODS INDUSTRIES LIMITED',
        pos: 'PO-2412-00108, PO-2412-00109',
        totalItems: 3,
        jobReleaseDate: today,
        plannedStartDate: '20/12/2024 08:00 AM',
        plannedDeliveryDate: '28/12/2024',
        status: 'In Progress',
        versionNo: 1,
        totalPlannedQty: 25000,
        totalProducedQty: 12400,
        totalWeight: 8400,
        totalSheets: 14500,
        createdBy: 'GOPINATH',
        createdOn: '19/12/2024 10:30 AM',
        lastUpdatedBy: 'GOPINATH',
        lastUpdatedOn: '20/12/2024 01:15 PM',
        currentStage: 'Printing',
        nextStage: 'Slotting',
        workCenter: 'WC-01',
        lineMachine: 'Flexo Line - 01',
        goodQty: 11840,
        rejectedQty: 560,
        elapsedTime: '02:15 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000145',
            itemDescription: 'KIVO GOOD TIMES NDC SECONDARY 220 SACHETS X 12G.',
            customerPo: 'PO-2412-00108',
            size: '334 x 214 x 148',
            specification: '3 Ply / 3C / Brown',
            plannedQty: 10000,
            producedQty: 5200,
            goodQty: 5000,
            rejectedQty: 200,
            sheetWidth: 362,
            sheetLength: 1136,
            status: 'In Progress',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 10000, goodQty: 10000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 10000, goodQty: 10000, status: 'completed' },
              { stageName: 'Printing', plannedQty: 10000, goodQty: 5000, status: 'in-progress' },
              { stageName: 'Slotting', plannedQty: 10000, goodQty: 0, status: 'pending' },
              { stageName: 'Die Cutting', plannedQty: 10000, goodQty: 0, status: 'pending' },
              { stageName: 'Stitching / Gluing', plannedQty: 10000, goodQty: 0, status: 'pending' },
              { stageName: 'Packing', plannedQty: 10000, goodQty: 0, status: 'pending' }
            ]
          },
          {
            sNo: 2,
            itemCode: 'ITM-000146',
            itemDescription: 'KIVO GOOD TIMES NDC SECONDARY 110 SACHETS X 12G.',
            customerPo: 'PO-2412-00108',
            size: '334 x 214 x 110',
            specification: '3 Ply / 3B / Brown',
            plannedQty: 8000,
            producedQty: 4600,
            goodQty: 4400,
            rejectedQty: 200,
            sheetWidth: 362,
            sheetLength: 900,
            status: 'In Progress',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 8000, goodQty: 8000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 8000, goodQty: 8000, status: 'completed' },
              { stageName: 'Printing', plannedQty: 8000, goodQty: 4400, status: 'in-progress' },
              { stageName: 'Slotting', plannedQty: 8000, goodQty: 0, status: 'pending' },
              { stageName: 'Die Cutting', plannedQty: 8000, goodQty: 0, status: 'pending' },
              { stageName: 'Stitching / Gluing', plannedQty: 8000, goodQty: 0, status: 'pending' },
              { stageName: 'Packing', plannedQty: 8000, goodQty: 0, status: 'pending' }
            ]
          },
          {
            sNo: 3,
            itemCode: 'ITM-000147',
            itemDescription: 'KIVO GOOD TIMES NDC DISPLAY BOX',
            customerPo: 'PO-2412-00109',
            size: '220 x 150 x 80',
            specification: '3 Ply / E-Flute / Brown',
            plannedQty: 7000,
            producedQty: 2600,
            goodQty: 2440,
            rejectedQty: 160,
            sheetWidth: 250,
            sheetLength: 600,
            status: 'Pending',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 7000, goodQty: 7000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 7000, goodQty: 7000, status: 'completed' },
              { stageName: 'Printing', plannedQty: 7000, goodQty: 0, status: 'pending' },
              { stageName: 'Slotting', plannedQty: 7000, goodQty: 0, status: 'pending' },
              { stageName: 'Die Cutting', plannedQty: 7000, goodQty: 0, status: 'pending' },
              { stageName: 'Stitching / Gluing', plannedQty: 7000, goodQty: 0, status: 'pending' },
              { stageName: 'Packing', plannedQty: 7000, goodQty: 0, status: 'pending' }
            ]
          }
        ],
        stages: standardStages(),
        attachments: [
          { name: 'Box_Drawing_2301.pdf', size: '2.4 MB' },
          { name: 'Color_Spec_Sheet.pdf', size: '940 KB' }
        ],
        downtimeLogs: [
          { downtimeReason: 'Set-up / Changeover', durationMin: 15, timestamp: '20/12/2024 10:45 AM' },
          { downtimeReason: 'Quality Inspection', durationMin: 10, timestamp: '20/12/2024 11:30 AM' }
        ],
        materialConsumption: [
          { itemCode: 'PAPER-150-1200', desc: '150 GSM Kraft Paper Reel', qtyConsumed: 3200, reelNo: 'R2409-08A' },
          { itemCode: 'GLUE-NATIVE-ST', desc: 'Native Starch Glue Powder', qtyConsumed: 210, reelNo: 'G2411-92' }
        ]
      },
      {
        batchNo: 'BCH-24070072-02',
        jobId: 'JOB-24070072',
        customer: 'KRAFT NIGERIA PLC',
        pos: 'PO-2412-00210',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '21/12/2024 09:00 AM',
        plannedDeliveryDate: '29/12/2024',
        status: 'In Progress',
        versionNo: 2,
        totalPlannedQty: 15000,
        totalProducedQty: 5000,
        totalWeight: 3100,
        totalSheets: 5500,
        createdBy: 'ANIL.S',
        createdOn: '19/12/2024 11:15 AM',
        lastUpdatedBy: 'ANIL.S',
        lastUpdatedOn: '20/12/2024 10:00 AM',
        currentStage: 'Sheet Cutting',
        nextStage: 'Corrugation',
        workCenter: 'WC-02',
        lineMachine: 'Auto Cutter 1800',
        goodQty: 4800,
        rejectedQty: 200,
        elapsedTime: '01:30 Hrs',
        isLate: true,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000150',
            itemDescription: 'KRAFT BISCUIT CORRUGATED BOX',
            customerPo: 'PO-2412-00210',
            size: '300 x 200 x 150',
            specification: '3 Ply / 3C / Brown',
            plannedQty: 15000,
            producedQty: 5000,
            goodQty: 4800,
            rejectedQty: 200,
            sheetWidth: 320,
            sheetLength: 950,
            status: 'In Progress',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 15000, goodQty: 4800, status: 'in-progress' },
              { stageName: 'Corrugation', plannedQty: 15000, goodQty: 0, status: 'pending' },
              { stageName: 'Printing', plannedQty: 15000, goodQty: 0, status: 'pending' },
              { stageName: 'Slotting', plannedQty: 15000, goodQty: 0, status: 'pending' },
              { stageName: 'Die Cutting', plannedQty: 15000, goodQty: 0, status: 'pending' },
              { stageName: 'Stitching / Gluing', plannedQty: 15000, goodQty: 0, status: 'pending' },
              { stageName: 'Packing', plannedQty: 15000, goodQty: 0, status: 'pending' }
            ]
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070073-03',
        jobId: 'JOB-24070073',
        customer: 'XYZ PACKAGING LTD',
        pos: 'PO-2412-00305',
        totalItems: 2,
        jobReleaseDate: today,
        plannedStartDate: '22/12/2024 10:00 AM',
        plannedDeliveryDate: '30/12/2024',
        status: 'On Hold',
        versionNo: 1,
        totalPlannedQty: 10000,
        totalProducedQty: 0,
        totalWeight: 2200,
        totalSheets: 4000,
        createdBy: 'GOPINATH',
        createdOn: '20/12/2024 09:30 AM',
        lastUpdatedBy: 'GOPINATH',
        lastUpdatedOn: '20/12/2024 09:30 AM',
        currentStage: 'Sheet Cutting',
        nextStage: 'Corrugation',
        workCenter: 'WC-02',
        lineMachine: 'Auto Cutter 1800',
        goodQty: 0,
        rejectedQty: 0,
        elapsedTime: '00:00 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000161',
            itemDescription: 'XYZ SHIPPER INNER CARTONS',
            customerPo: 'PO-2412-00305',
            size: '200 x 150 x 100',
            specification: '3 Ply / B / Craft',
            plannedQty: 6000,
            producedQty: 0,
            goodQty: 0,
            rejectedQty: 0,
            sheetWidth: 220,
            sheetLength: 800,
            status: 'On Hold',
            stagesSummary: defaultStagesSummary(6000, 0, 'hold')
          },
          {
            sNo: 2,
            itemCode: 'ITM-000162',
            itemDescription: 'XYZ SHIPPER OUTER BOX',
            customerPo: 'PO-2412-00305',
            size: '400 x 300 x 200',
            specification: '5 Ply / BC / Kraft',
            plannedQty: 4000,
            producedQty: 0,
            goodQty: 0,
            rejectedQty: 0,
            sheetWidth: 420,
            sheetLength: 1200,
            status: 'On Hold',
            stagesSummary: defaultStagesSummary(4000, 0, 'hold')
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070074-04',
        jobId: 'JOB-24070074',
        customer: 'NIGERIA BEVERAGES LTD',
        pos: 'PO-2412-00401',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '23/12/2024 08:30 AM',
        plannedDeliveryDate: '01/01/2025',
        status: 'Planned',
        versionNo: 1,
        totalPlannedQty: 30000,
        totalProducedQty: 0,
        totalWeight: 9900,
        totalSheets: 12000,
        createdBy: 'GOPINATH',
        createdOn: '19/12/2024 02:30 PM',
        lastUpdatedBy: 'GOPINATH',
        lastUpdatedOn: '19/12/2024 02:45 PM',
        currentStage: 'Sheet Cutting',
        nextStage: 'Corrugation',
        workCenter: 'WC-01',
        lineMachine: 'Auto Cutter 1800',
        goodQty: 0,
        rejectedQty: 0,
        elapsedTime: '00:00 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000171',
            itemDescription: 'KIVO BEVERAGE TRAYS',
            customerPo: 'PO-2412-00401',
            size: '450 x 350 x 80',
            specification: '3 Ply / 3C / Brown',
            plannedQty: 30000,
            producedQty: 0,
            goodQty: 0,
            rejectedQty: 0,
            sheetWidth: 470,
            sheetLength: 1050,
            status: 'Pending',
            stagesSummary: defaultStagesSummary(30000, 0, 'pending')
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070075-05',
        jobId: 'JOB-24070075',
        customer: 'BLUE OCEAN BEVERAGES',
        pos: 'PO-2412-00501',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '24/12/2024 10:00 AM',
        plannedDeliveryDate: '02/01/2025',
        status: 'In Progress',
        versionNo: 1,
        totalPlannedQty: 22000,
        totalProducedQty: 10000,
        totalWeight: 7260,
        totalSheets: 8000,
        createdBy: 'AMIT',
        createdOn: '19/12/2024 03:15 PM',
        lastUpdatedBy: 'AMIT',
        lastUpdatedOn: '20/12/2024 02:00 PM',
        currentStage: 'Slotting',
        nextStage: 'Die Cutting',
        workCenter: 'WC-03',
        lineMachine: 'Rotary Slotter 2000',
        goodQty: 9700,
        rejectedQty: 300,
        elapsedTime: '01:45 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000185',
            itemDescription: 'BLUE OCEAN 350ML 24PK TRAY',
            customerPo: 'PO-2412-00501',
            size: '400 x 280 x 100',
            specification: '3 Ply / 3C / Brown',
            plannedQty: 22000,
            producedQty: 10000,
            goodQty: 9700,
            rejectedQty: 300,
            sheetWidth: 420,
            sheetLength: 980,
            status: 'In Progress',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 22000, goodQty: 22000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 22000, goodQty: 22000, status: 'completed' },
              { stageName: 'Printing', plannedQty: 22000, goodQty: 22000, status: 'completed' },
              { stageName: 'Slotting', plannedQty: 22000, goodQty: 9700, status: 'in-progress' },
              { stageName: 'Die Cutting', plannedQty: 22000, goodQty: 0, status: 'pending' },
              { stageName: 'Stitching / Gluing', plannedQty: 22000, goodQty: 0, status: 'pending' },
              { stageName: 'Packing', plannedQty: 22000, goodQty: 0, status: 'pending' }
            ]
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070076-06',
        jobId: 'JOB-24070076',
        customer: 'SUPREME FOODS CO',
        pos: 'PO-2412-00602',
        totalItems: 2,
        jobReleaseDate: today,
        plannedStartDate: '25/12/2024 09:30 AM',
        plannedDeliveryDate: '03/01/2025',
        status: 'In Progress',
        versionNo: 1,
        totalPlannedQty: 18000,
        totalProducedQty: 8000,
        totalWeight: 6120,
        totalSheets: 7000,
        createdBy: 'VIJAY',
        createdOn: '19/12/2024 04:00 PM',
        lastUpdatedBy: 'VIJAY',
        lastUpdatedOn: '20/12/2024 03:30 PM',
        currentStage: 'Corrugation',
        nextStage: 'Printing',
        workCenter: 'WC-02',
        lineMachine: 'Single Facer 1600',
        goodQty: 7800,
        rejectedQty: 200,
        elapsedTime: '01:10 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000191',
            itemDescription: 'SUPREME OIL CARTONS 1L',
            customerPo: 'PO-2412-00602',
            size: '320 x 240 x 260',
            specification: '5 Ply / BC / Brown',
            plannedQty: 10000,
            producedQty: 4500,
            goodQty: 4400,
            rejectedQty: 100,
            sheetWidth: 340,
            sheetLength: 1050,
            status: 'In Progress',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 10000, goodQty: 10000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 10000, goodQty: 4400, status: 'in-progress' },
              { stageName: 'Printing', plannedQty: 10000, goodQty: 0, status: 'pending' },
              { stageName: 'Slotting', plannedQty: 10000, goodQty: 0, status: 'pending' },
              { stageName: 'Die Cutting', plannedQty: 10000, goodQty: 0, status: 'pending' },
              { stageName: 'Stitching / Gluing', plannedQty: 10000, goodQty: 0, status: 'pending' },
              { stageName: 'Packing', plannedQty: 10000, goodQty: 0, status: 'pending' }
            ]
          },
          {
            sNo: 2,
            itemCode: 'ITM-000192',
            itemDescription: 'SUPREME OIL CARTONS 2L',
            customerPo: 'PO-2412-00602',
            size: '360 x 280 x 280',
            specification: '5 Ply / BC / Brown',
            plannedQty: 8000,
            producedQty: 3500,
            goodQty: 3400,
            rejectedQty: 100,
            sheetWidth: 380,
            sheetLength: 1150,
            status: 'In Progress',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 8000, goodQty: 8000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 8000, goodQty: 3400, status: 'in-progress' },
              { stageName: 'Printing', plannedQty: 8000, goodQty: 0, status: 'pending' },
              { stageName: 'Slotting', plannedQty: 8000, goodQty: 0, status: 'pending' },
              { stageName: 'Die Cutting', plannedQty: 8000, goodQty: 0, status: 'pending' },
              { stageName: 'Stitching / Gluing', plannedQty: 8000, goodQty: 0, status: 'pending' },
              { stageName: 'Packing', plannedQty: 8000, goodQty: 0, status: 'pending' }
            ]
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070077-07',
        jobId: 'JOB-24070077',
        customer: 'GLOBAL BREWERIES',
        pos: 'PO-2412-00703',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '26/12/2024 11:00 AM',
        plannedDeliveryDate: '04/01/2025',
        status: 'In Progress',
        versionNo: 1,
        totalPlannedQty: 12000,
        totalProducedQty: 6000,
        totalWeight: 4560,
        totalSheets: 5000,
        createdBy: 'GOPINATH',
        createdOn: '19/12/2024 04:30 PM',
        lastUpdatedBy: 'GOPINATH',
        lastUpdatedOn: '20/12/2024 04:30 PM',
        currentStage: 'Die Cutting',
        nextStage: 'Stitching / Gluing',
        workCenter: 'WC-04',
        lineMachine: 'Rotary Die Cutter 1500',
        goodQty: 5800,
        rejectedQty: 200,
        elapsedTime: '01:50 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000201',
            itemDescription: 'LAGER BEER 24BTL EXPORT BOX',
            customerPo: 'PO-2412-00703',
            size: '400 x 270 x 250',
            specification: '3 Ply / C / Brown',
            plannedQty: 12000,
            producedQty: 6000,
            goodQty: 5800,
            rejectedQty: 200,
            sheetWidth: 420,
            sheetLength: 950,
            status: 'In Progress',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Printing', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Slotting', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Die Cutting', plannedQty: 12000, goodQty: 5800, status: 'in-progress' },
              { stageName: 'Stitching / Gluing', plannedQty: 12000, goodQty: 0, status: 'pending' },
              { stageName: 'Packing', plannedQty: 12000, goodQty: 0, status: 'pending' }
            ]
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070078-08',
        jobId: 'JOB-24070078',
        customer: 'RUDRA COSMETICS',
        pos: 'PO-2412-00804',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '27/12/2024 10:30 AM',
        plannedDeliveryDate: '05/01/2025',
        status: 'In Progress',
        versionNo: 1,
        totalPlannedQty: 8500,
        totalProducedQty: 4000,
        totalWeight: 3100,
        totalSheets: 3500,
        createdBy: 'AMIT',
        createdOn: '19/12/2024 05:00 PM',
        lastUpdatedBy: 'AMIT',
        lastUpdatedOn: '20/12/2024 05:10 PM',
        currentStage: 'Stitching / Gluing',
        nextStage: 'Packing',
        workCenter: 'WC-05',
        lineMachine: 'Stitcher ST-1200',
        goodQty: 3900,
        rejectedQty: 100,
        elapsedTime: '01:05 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000211',
            itemDescription: 'COSMETIC TUBE SHIPPING MASTER',
            customerPo: 'PO-2412-00804',
            size: '300 x 200 x 200',
            specification: '3 Ply / E / White',
            plannedQty: 8500,
            producedQty: 4000,
            goodQty: 3900,
            rejectedQty: 100,
            sheetWidth: 320,
            sheetLength: 850,
            status: 'In Progress',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 8500, goodQty: 8500, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 8500, goodQty: 8500, status: 'completed' },
              { stageName: 'Printing', plannedQty: 8500, goodQty: 8500, status: 'completed' },
              { stageName: 'Slotting', plannedQty: 8500, goodQty: 8500, status: 'completed' },
              { stageName: 'Die Cutting', plannedQty: 8500, goodQty: 8500, status: 'completed' },
              { stageName: 'Stitching / Gluing', plannedQty: 8500, goodQty: 3900, status: 'in-progress' },
              { stageName: 'Packing', plannedQty: 8500, goodQty: 0, status: 'pending' }
            ]
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070079-09',
        jobId: 'JOB-24070079',
        customer: 'BLUE STAR LOGISTICS',
        pos: 'PO-2412-00905',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '28/12/2024 11:30 AM',
        plannedDeliveryDate: '06/01/2025',
        status: 'In Progress',
        versionNo: 1,
        totalPlannedQty: 14000,
        totalProducedQty: 7000,
        totalWeight: 5320,
        totalSheets: 6000,
        createdBy: 'VIJAY',
        createdOn: '19/12/2024 05:30 PM',
        lastUpdatedBy: 'VIJAY',
        lastUpdatedOn: '20/12/2024 06:00 PM',
        currentStage: 'Packing',
        nextStage: 'Completed',
        workCenter: 'WC-06',
        lineMachine: 'Packing Table PT-01',
        goodQty: 6950,
        rejectedQty: 50,
        elapsedTime: '02:00 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000221',
            itemDescription: 'BLUE STAR MASTER CARGO BOX',
            customerPo: 'PO-2412-00905',
            size: '500 x 400 x 350',
            specification: '5 Ply / BC / Brown',
            plannedQty: 14000,
            producedQty: 7000,
            goodQty: 6950,
            rejectedQty: 50,
            sheetWidth: 520,
            sheetLength: 1250,
            status: 'In Progress',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 14000, goodQty: 14000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 14000, goodQty: 14000, status: 'completed' },
              { stageName: 'Printing', plannedQty: 14000, goodQty: 14000, status: 'completed' },
              { stageName: 'Slotting', plannedQty: 14000, goodQty: 14000, status: 'completed' },
              { stageName: 'Die Cutting', plannedQty: 14000, goodQty: 14000, status: 'completed' },
              { stageName: 'Stitching / Gluing', plannedQty: 14000, goodQty: 14000, status: 'completed' },
              { stageName: 'Packing', plannedQty: 14000, goodQty: 6950, status: 'in-progress' }
            ]
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070080-10',
        jobId: 'JOB-24070080',
        customer: 'VIBRANT ADHESIVES',
        pos: 'PO-2412-01006',
        totalItems: 2,
        jobReleaseDate: today,
        plannedStartDate: '29/12/2024 08:00 AM',
        plannedDeliveryDate: '07/01/2025',
        status: 'Completed',
        versionNo: 1,
        totalPlannedQty: 20000,
        totalProducedQty: 20000,
        totalWeight: 6800,
        totalSheets: 15000,
        createdBy: 'GOPINATH',
        createdOn: '19/12/2024 06:00 PM',
        lastUpdatedBy: 'GOPINATH',
        lastUpdatedOn: '21/12/2024 05:00 PM',
        currentStage: 'Completed',
        nextStage: 'None',
        workCenter: 'WC-06',
        lineMachine: 'Packing Table PT-01',
        goodQty: 19600,
        rejectedQty: 400,
        elapsedTime: '03:30 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000231',
            itemDescription: 'GLUE TUBE PACKING OUTER 100G',
            customerPo: 'PO-2412-01006',
            size: '280 x 180 x 150',
            specification: '3 Ply / C / Brown',
            plannedQty: 12000,
            producedQty: 12000,
            goodQty: 11750,
            rejectedQty: 250,
            sheetWidth: 300,
            sheetLength: 900,
            status: 'Completed',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Printing', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Slotting', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Die Cutting', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Stitching / Gluing', plannedQty: 12000, goodQty: 12000, status: 'completed' },
              { stageName: 'Packing', plannedQty: 12000, goodQty: 11750, status: 'completed' }
            ]
          },
          {
            sNo: 2,
            itemCode: 'ITM-000232',
            itemDescription: 'GLUE TUBE PACKING OUTER 250G',
            customerPo: 'PO-2412-01006',
            size: '320 x 220 x 180',
            specification: '3 Ply / C / Brown',
            plannedQty: 8000,
            producedQty: 8000,
            goodQty: 7850,
            rejectedQty: 150,
            sheetWidth: 340,
            sheetLength: 980,
            status: 'Completed',
            stagesSummary: [
              { stageName: 'Sheet Cutting', plannedQty: 8000, goodQty: 8000, status: 'completed' },
              { stageName: 'Corrugation', plannedQty: 8000, goodQty: 8000, status: 'completed' },
              { stageName: 'Printing', plannedQty: 8000, goodQty: 8000, status: 'completed' },
              { stageName: 'Slotting', plannedQty: 8000, goodQty: 8000, status: 'completed' },
              { stageName: 'Die Cutting', plannedQty: 8000, goodQty: 8000, status: 'completed' },
              { stageName: 'Stitching / Gluing', plannedQty: 8000, goodQty: 8000, status: 'completed' },
              { stageName: 'Packing', plannedQty: 8000, goodQty: 7850, status: 'completed' }
            ]
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070081-11',
        jobId: 'JOB-24070081',
        customer: 'SUMMIT CONTAINER CO',
        pos: 'PO-2412-01107',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '30/12/2024 08:00 AM',
        plannedDeliveryDate: '08/01/2025',
        status: 'Planned',
        versionNo: 1,
        totalPlannedQty: 16000,
        totalProducedQty: 0,
        totalWeight: 5440,
        totalSheets: 8000,
        createdBy: 'AMIT',
        createdOn: '19/12/2024 06:30 PM',
        lastUpdatedBy: 'AMIT',
        lastUpdatedOn: '19/12/2024 06:30 PM',
        currentStage: 'Sheet Cutting',
        nextStage: 'Corrugation',
        workCenter: 'WC-02',
        lineMachine: 'Auto Cutter 1800',
        goodQty: 0,
        rejectedQty: 0,
        elapsedTime: '00:00 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000241',
            itemDescription: 'SUMMIT HEAVY STACKABLE TRAY',
            customerPo: 'PO-2412-01107',
            size: '500 x 350 x 120',
            specification: '5 Ply / BC / Brown',
            plannedQty: 16000,
            producedQty: 0,
            goodQty: 0,
            rejectedQty: 0,
            sheetWidth: 520,
            sheetLength: 1100,
            status: 'Pending',
            stagesSummary: defaultStagesSummary(16000, 0, 'pending')
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      },
      {
        batchNo: 'BCH-24070082-12',
        jobId: 'JOB-24070082',
        customer: 'PRIME PACKAGING CORP',
        pos: 'PO-2412-01208',
        totalItems: 1,
        jobReleaseDate: today,
        plannedStartDate: '31/12/2024 02:00 PM',
        plannedDeliveryDate: '09/01/2025',
        status: 'On Hold',
        versionNo: 1,
        totalPlannedQty: 28000,
        totalProducedQty: 0,
        totalWeight: 9240,
        totalSheets: 15000,
        createdBy: 'VIJAY',
        createdOn: '19/12/2024 07:00 PM',
        lastUpdatedBy: 'VIJAY',
        lastUpdatedOn: '19/12/2024 07:10 PM',
        currentStage: 'Sheet Cutting',
        nextStage: 'Corrugation',
        workCenter: 'WC-02',
        lineMachine: 'Auto Cutter 1800',
        goodQty: 0,
        rejectedQty: 0,
        elapsedTime: '00:00 Hrs',
        isLate: false,
        items: [
          {
            sNo: 1,
            itemCode: 'ITM-000251',
            itemDescription: 'PRIME BROWN SHIPPING BOX 3 PLY',
            customerPo: 'PO-2412-01208',
            size: '400 x 300 x 200',
            specification: '3 Ply / 3C / Kraft',
            plannedQty: 28000,
            producedQty: 0,
            goodQty: 0,
            rejectedQty: 0,
            sheetWidth: 420,
            sheetLength: 1200,
            status: 'On Hold',
            stagesSummary: defaultStagesSummary(28000, 0, 'hold')
          }
        ],
        stages: standardStages(),
        attachments: [],
        downtimeLogs: [],
        materialConsumption: []
      }
    ];
    this.filterList();
  }

  filterList(): void {
    let temp = [...this.batches];
    if (this.stageFilter !== 'All Stages') {
      temp = temp.filter(b => b.currentStage === this.stageFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      temp = temp.filter(
        b =>
          b.batchNo.toLowerCase().includes(q) ||
          b.jobId.toLowerCase().includes(q) ||
          b.customer.toLowerCase().includes(q)
      );
    }
    this.filteredBatches = temp;
  }

  onSearch(): void {
    this.filterList();
  }

  onFilterChange(): void {
    this.filterList();
  }

  selectBatch(batch: ProductionBatch): void {
    this.selectedBatch = batch;
    this.selectedStage = batch.stages.find(s => s.status === 'In Progress') || batch.stages[0];
    if (batch.items && batch.items.length > 0) {
      this.selectItem(batch.items[0]);
    }
  }

  selectItem(item: ExecutionItem): void {
    this.selectedItem = item;
    
    // Synchronize selectedStage to the active stage for this item (prioritizing in-progress/hold, then pending)
    const activeItemStage = item.stagesSummary.find(s => s.status === 'in-progress' || s.status === 'hold') || 
                            item.stagesSummary.find(s => s.status === 'pending') || 
                            item.stagesSummary[0];
    if (activeItemStage) {
      this.selectedStage = this.selectedBatch.stages.find(s => s.name === activeItemStage.stageName) || this.selectedBatch.stages[0];
    }

    // Map stage summary details from item to active execution form values
    const itemStageDetails = item.stagesSummary.find(s => s.stageName === this.selectedStage.name);

    this.activeExecution = {
      machine: this.selectedStage.machine,
      operator: 'Ramesh Kumar',
      assistant: 'Suresh',
      shift: 'A - Morning',
      startTime: this.selectedBatch.plannedStartDate,
      plannedQty: item.plannedQty,
      producedQty: itemStageDetails && itemStageDetails.goodQty ? itemStageDetails.goodQty + 200 : item.producedQty || 5200,
      goodQty: itemStageDetails ? itemStageDetails.goodQty : item.goodQty || 5000,
      rejectedQty: item.rejectedQty || 200,
      changeoverLoss: 50,
      downtime: this.selectedBatch.downtimeLogs.reduce((sum, l) => sum + l.durationMin, 0) || 25,
      speed: this.selectedStage.plannedSpeed.includes('Sheets') ? parseInt(this.selectedStage.plannedSpeed) : 80,
      remarks: 'Current stage execution details.'
    };
  }

  selectStage(stage: StageTracking): void {
    this.selectedStage = stage;
    if (this.selectedItem) {
      // Re-map without resetting stage select to preserve user stage click
      const itemStageDetails = this.selectedItem.stagesSummary.find(s => s.stageName === stage.name);
      this.activeExecution.machine = stage.machine;
      this.activeExecution.producedQty = itemStageDetails && itemStageDetails.goodQty ? itemStageDetails.goodQty + 200 : this.selectedItem.producedQty || 5200;
      this.activeExecution.goodQty = itemStageDetails ? itemStageDetails.goodQty : this.selectedItem.goodQty || 5000;
      this.activeExecution.speed = stage.plannedSpeed.includes('Sheets') ? parseInt(stage.plannedSpeed) : 80;
    }
  }

  getItemStageStatus(stageName: string): string {
    if (!this.selectedItem || !this.selectedItem.stagesSummary) return 'pending';
    const summary = this.selectedItem.stagesSummary.find(s => s.stageName === stageName);
    return summary ? summary.status : 'pending';
  }

  getBatchProgressPercent(): number {
    if (!this.selectedBatch || !this.selectedBatch.totalPlannedQty) return 0;
    const pct = (this.selectedBatch.totalProducedQty / this.selectedBatch.totalPlannedQty) * 100;
    return Math.min(Math.round(pct), 100);
  }

  switchTab(tab: string): void {
    this.activeTab = tab;
  }

  // ── priority override override feature request ────────────────
  expressPrioritize(batch: ProductionBatch): void {
    this.confirmationService.confirm({
      message: `Due date is close for batch ${batch.batchNo}. Prioritizing it will automatically place all other In Progress batches ON HOLD to clear the floor. Do you want to proceed?`,
      header: 'Express Route Authorization',
      icon: 'pi pi-exclamation-circle',
      acceptLabel: 'Yes, Prioritize',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-warning p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => {
        // Set all other active running batches to hold
        this.batches.forEach(b => {
          if (b.batchNo !== batch.batchNo && b.status === 'In Progress') {
            b.status = 'On Hold';
            // Also flag stages in items
            b.items.forEach(i => {
              if (i.status === 'In Progress') i.status = 'On Hold';
            });
            b.stages.forEach(s => {
              if (s.status === 'In Progress') s.status = 'On Hold';
            });
          }
        });

        // Set target batch to In Progress
        batch.status = 'In Progress';
        batch.items.forEach(i => {
          if (i.status === 'On Hold' || i.status === 'Pending') {
            i.status = 'In Progress';
          }
        });
        batch.stages.forEach(s => {
          if (s.status === 'On Hold') {
            s.status = 'In Progress';
          }
        });
        batch.lastUpdatedBy = 'GOPINATH';
        batch.lastUpdatedOn = new Date().toLocaleString();

        this.messageService.add({
          severity: 'warn',
          summary: 'Express Route Engaged',
          detail: `Prioritized ${batch.batchNo}. Conflicting runs placed on hold.`
        });
        this.selectBatch(batch);
      }
    });
  }

  // ── Stage Actions ───────────────────────────────────────
  pauseStage(): void {
    this.selectedStage.status = 'In Progress';
    this.messageService.add({
      severity: 'info',
      summary: 'Stage Paused',
      detail: `Current run of ${this.selectedStage.name} has been paused.`
    });
  }

  holdStage(): void {
    this.selectedStage.status = 'On Hold';
    if (this.selectedItem) {
      const itemSummary = this.selectedItem.stagesSummary.find(s => s.stageName === this.selectedStage.name);
      if (itemSummary) {
        itemSummary.status = 'hold';
      }
    }
    this.messageService.add({
      severity: 'error',
      summary: 'Floor Run Stopped',
      detail: `Stage ${this.selectedStage.name} placed on hold.`
    });
  }

  completeStage(): void {
    // Complete selected stage
    this.selectedStage.status = 'Completed';
    if (this.selectedItem) {
      const itemSummary = this.selectedItem.stagesSummary.find(s => s.stageName === this.selectedStage.name);
      if (itemSummary) {
        itemSummary.status = 'completed';
        itemSummary.goodQty = this.activeExecution.goodQty;
      }
      
      // Update item statistics
      this.selectedItem.producedQty = this.activeExecution.producedQty;
      this.selectedItem.goodQty = this.activeExecution.goodQty;
      this.selectedItem.rejectedQty = this.activeExecution.rejectedQty;
    }

    // Set next stage in progress automatically if there is one
    const currentIdx = this.selectedBatch.stages.findIndex(s => s.name === this.selectedStage.name);
    if (currentIdx !== -1 && currentIdx + 1 < this.selectedBatch.stages.length) {
      const nextStage = this.selectedBatch.stages[currentIdx + 1];
      nextStage.status = 'In Progress';
      this.selectedBatch.currentStage = nextStage.name;
      this.selectedBatch.nextStage = this.selectedBatch.stages[currentIdx + 2] ? this.selectedBatch.stages[currentIdx + 2].name : 'Done';
      this.selectedStage = nextStage;

      // Update item stage progress to running
      if (this.selectedItem) {
        const nextSummary = this.selectedItem.stagesSummary.find(s => s.stageName === nextStage.name);
        if (nextSummary && nextSummary.status === 'pending') {
          nextSummary.status = 'in-progress';
        }
      }
    } else {
      // Completed all stages
      this.selectedBatch.status = 'Completed';
      this.selectedBatch.currentStage = 'Completed';
      this.selectedBatch.nextStage = 'None';
      if (this.selectedItem) {
        this.selectedItem.status = 'Completed';
      }
    }

    // Update batch calculations
    this.selectedBatch.totalProducedQty = this.selectedBatch.items.reduce((sum, i) => sum + i.producedQty, 0);
    this.selectedBatch.goodQty = this.selectedBatch.items.reduce((sum, i) => sum + i.goodQty, 0);
    this.selectedBatch.rejectedQty = this.selectedBatch.items.reduce((sum, i) => sum + i.rejectedQty, 0);

    // Check if all stages for the selected item are completed
    if (this.selectedItem) {
      const allItemStagesDone = this.selectedItem.stagesSummary.every(s => s.status === 'completed');
      if (allItemStagesDone) {
        this.selectedItem.status = 'Completed';
        this.messageService.add({
          severity: 'info',
          summary: 'Item Output Finished',
          detail: `All stages completed for ${this.selectedItem.itemCode}! Ready to send for QC.`,
          life: 6000
        });
      } else {
        this.messageService.add({
          severity: 'success',
          summary: 'Stage Completed',
          detail: `Marked selected stage as completed successfully.`
        });
      }
      this.selectItem(this.selectedItem);
    }
  }

  sendToQC(): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Routing to Quality Control',
      detail: `Finished output for ${this.selectedItem.itemCode} queued to QC inspectors.`
    });
    this.router.navigate(['/transaction/qc-management']);
  }

  // ── Downtime Log Management ──────────────────────────────
  addDowntimeLog(): void {
    if (!this.newDowntime.duration) return;
    this.selectedBatch.downtimeLogs.unshift({
      downtimeReason: this.newDowntime.reason,
      durationMin: this.newDowntime.duration,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.activeExecution.downtime = this.selectedBatch.downtimeLogs.reduce((sum, l) => sum + l.durationMin, 0);
    this.messageService.add({
      severity: 'info',
      summary: 'Downtime Logged',
      detail: `${this.newDowntime.reason} (${this.newDowntime.duration} min) logged.`
    });
    this.newDowntime.duration = 0;
  }

  deleteDowntimeLog(index: number): void {
    this.selectedBatch.downtimeLogs.splice(index, 1);
    this.activeExecution.downtime = this.selectedBatch.downtimeLogs.reduce((sum, l) => sum + l.durationMin, 0);
    this.messageService.add({
      severity: 'warn',
      summary: 'Downtime Log Removed',
      detail: 'Downtime record deleted.'
    });
  }

  // ── Raw Materials Consumption ────────────────────────────
  addMaterialCons(): void {
    if (!this.newConsumption.qty) return;
    this.selectedBatch.materialConsumption.unshift({
      itemCode: this.newConsumption.itemCode,
      desc: this.newConsumption.desc,
      qtyConsumed: this.newConsumption.qty,
      reelNo: this.newConsumption.reelNo
    });
    this.messageService.add({
      severity: 'success',
      summary: 'Material Tracked',
      detail: `Allocated ${this.newConsumption.qty} Kgs from Reel ${this.newConsumption.reelNo}.`
    });
    this.newConsumption.qty = 0;
  }

  deleteMaterialCons(index: number): void {
    this.selectedBatch.materialConsumption.splice(index, 1);
    this.messageService.add({
      severity: 'warn',
      summary: 'Allocation Cleared',
      detail: 'Material consumption log deleted.'
    });
  }

  // ── Attachments ─────────────────────────────────────────
  triggerAttachmentUpload(): void {
    const fileSelector = document.createElement('input');
    fileSelector.type = 'file';
    fileSelector.multiple = true;
    fileSelector.onchange = (e: any) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          this.selectedBatch.attachments.push({
            name: file.name,
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
          });
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Files Attached',
          detail: `${files.length} document(s) uploaded successfully.`
        });
      }
    };
    fileSelector.click();
  }

  deleteAttachment(index: number): void {
    this.selectedBatch.attachments.splice(index, 1);
    this.messageService.add({
      severity: 'warn',
      summary: 'Attachment Deleted',
      detail: 'Document removed from list.'
    });
  }
}
