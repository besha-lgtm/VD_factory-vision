import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface FGStock {
  customerName: string;
  itemCode: string;
  boxType: string;
  jobQty: number;
  qtyInStock: number;
  totalBundles: number;
  qtyPerBundle: number;
  availableStock: number;
  repairsPendingDays: number;
  comments: string;
  stockStatus: 'Available' | 'Shortfall' | 'Repair Pending';
}

export interface ReelStock {
  reelNumber: string;
  gsm: number;
  size: number;
  bf: string;
  shade: string;
  weight: number;
  availability: 'Inside' | 'Outside';
  matchingLayer: boolean;
  stockStatus: 'Available' | 'Reorder Required';
}

export interface OtherMaterialStock {
  materialName: string;
  availableQty: number;
  unit: string;
  reorderLevel: number;
  stockStatus: 'OK' | 'Low' | 'Reorder';
}

export interface JobOption {
  jobId: string;
  label: string;
  value: string;
  customer: string;
  itemCode: string;
  jobDate: string;
  reqQty: number;
  availableQty: number;
  priority: string;
}

export interface MaterialShortage {
  material: string;
  required: number;
  available: number;
  shortage: number;
}

// ── Component ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-stock-verification',
  standalone: false,
  templateUrl: './stock-verification.component.html',
  styleUrl: './stock-verification.component.css'
})
export class StockVerificationComponent implements OnInit {

  tabs: string[] = ['FG Stock', 'Reels', 'Glue', 'Starch', 'Colors'];
  selectedTab: string = 'FG Stock';

  // Job selector
  selectedJobId: string = 'JC-001';
  activeJob: JobOption | null = null;

  jobOptions: JobOption[] = [
    { label: 'JC-001 — Laurus Labs (2000541)', value: 'JC-001', jobId: 'JC-001', customer: 'Laurus Labs Unit-2', itemCode: '2000541', jobDate: new Date().toISOString().split('T')[0], reqQty: 5000, availableQty: 2000, priority: 'P1' },
    { label: 'JC-002 — Gland Pharma (2000542)', value: 'JC-002', jobId: 'JC-002', customer: 'Gland Pharma',      itemCode: '2000542', jobDate: new Date().toISOString().split('T')[0], reqQty: 2000, availableQty: 2000, priority: 'P2' },
    { label: 'JC-003 — Pidilite (2000543)',     value: 'JC-003', jobId: 'JC-003', customer: 'Pidilite',           itemCode: '2000543', jobDate: new Date().toISOString().split('T')[0], reqQty: 1000, availableQty: 200,  priority: 'P3' }
  ];

  // Stock lists
  fgStockList: FGStock[] = [];
  reelsStockList: ReelStock[] = [];
  otherMaterialStock: OtherMaterialStock[] = [];

  // Material shortages for decision panel
  materialShortages: MaterialShortage[] = [];

  // Decision Summary
  decisionSummary = {
    jobCode:        'JC-001',
    customer:       'Laurus Labs Unit-2',
    itemCode:       '2000541',
    requiredQty:    5000,
    availableQty:   2000,
    shortfall:      3000,
    recommendation: 'Full Production',
    note:           'FG stock insufficient. Production required to meet demand.',
    status:         'Production Required'
  };

  kpis = [
    { label: 'ACTIVE JOBS',     value: 3,    icon: 'pi pi-calendar',          colorClass: 'blue'   },
    { label: 'FG SHORTFALL',    value: 3000, icon: 'pi pi-exclamation-circle', colorClass: 'yellow' },
    { label: 'REELS IN STOCK',  value: 4,    icon: 'pi pi-box',                colorClass: 'purple' },
    { label: 'REORDER ALERTS',  value: 1,    icon: 'pi pi-bell',               colorClass: 'green'  }
  ];

  constructor(
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAllStockData();
    // Auto-select first job
    this.activeJob = this.jobOptions[0];
    this.computeDecision(this.jobOptions[0]);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }

  recommendationIcon(rec: string): string {
    switch (rec) {
      case 'Direct Dispatch':    return 'pi pi-send';
      case 'Partial Production': return 'pi pi-sliders-h';
      case 'Full Production':    return 'pi pi-cog';
      case 'Procurement Required': return 'pi pi-shopping-cart';
      default: return 'pi pi-info-circle';
    }
  }

  // ─── Tab & Job selection ──────────────────────────────────────────────────

  selectTab(tab: string): void {
    this.selectedTab = tab;
    if (tab !== 'FG Stock' && tab !== 'Reels') {
      this.loadOtherMaterial(tab);
    }
  }

  onJobSelect(event: any): void {
    const job = this.jobOptions.find(j => j.value === event.value);
    if (job) {
      this.activeJob = job;
      this.computeDecision(job);
    }
  }

  runVerification(): void {
    if (!this.activeJob) {
      this.messageService.add({ severity: 'warn', summary: 'No Job Selected', detail: 'Please select a daily job first.' });
      return;
    }
    this.computeDecision(this.activeJob);
    this.messageService.add({ severity: 'success', summary: 'Verification Complete', detail: `Stock verified for ${this.activeJob.jobId}.` });
  }

  // ─── Decision logic (Business Rules) ─────────────────────────────────────

  computeDecision(job: JobOption): void {
    const shortfall = Math.max(0, job.reqQty - job.availableQty);

    let recommendation: string;
    let note: string;

    if (shortfall === 0) {
      recommendation = 'Direct Dispatch';
      note = 'Sufficient FG stock available. Allocate directly for dispatch.';
    } else if (job.availableQty > 0) {
      recommendation = 'Partial Production';
      note = `${job.availableQty.toLocaleString()} units available for dispatch. Produce ${shortfall.toLocaleString()} units to fulfil balance.`;
    } else {
      recommendation = 'Full Production';
      note = 'FG stock insufficient. Full production required to meet demand.';
    }

    this.decisionSummary = {
      jobCode:        job.value,
      customer:       job.customer,
      itemCode:       job.itemCode,
      requiredQty:    job.reqQty,
      availableQty:   job.availableQty,
      shortfall,
      recommendation,
      note,
      status: recommendation
    };

    // Simulate raw material shortage check
    this.materialShortages = shortfall > 0
      ? [
          { material: 'Reel (120 GSM / 180)', required: 40, available: 35, shortage: 5  },
          { material: 'Glue',                  required: 20, available: 25, shortage: 0  },
          { material: 'Starch Powder',          required: 15, available: 10, shortage: 5  },
        ]
      : [];

    // If raw materials are also short, upgrade recommendation
    const hasMaterialShortage = this.materialShortages.some(m => m.shortage > 0);
    if (hasMaterialShortage && recommendation !== 'Direct Dispatch') {
      this.decisionSummary.recommendation = 'Procurement Required';
      this.decisionSummary.note = 'Raw material shortages detected. Procurement required before production.';
    }
  }

  // ─── Data loaders ─────────────────────────────────────────────────────────

  loadAllStockData(): void {
    // FG Stock
    this.fgStockList = [
      {
        customerName: 'Laurus Labs Unit-2',
        itemCode: '2000541',
        boxType: '3 Ply',
        jobQty: 5000,
        qtyInStock: 550,
        totalBundles: 22,
        qtyPerBundle: 25,
        availableStock: 550,
        repairsPendingDays: 0,
        comments: 'Bundling Running',
        stockStatus: 'Shortfall'
      },
      {
        customerName: 'Gland Pharma',
        itemCode: '2000542',
        boxType: '5 Ply',
        jobQty: 2000,
        qtyInStock: 2000,
        totalBundles: 80,
        qtyPerBundle: 25,
        availableStock: 2000,
        repairsPendingDays: 0,
        comments: '',
        stockStatus: 'Available'
      },
      {
        customerName: 'Pidilite',
        itemCode: '2000543',
        boxType: '7 Ply',
        jobQty: 1000,
        qtyInStock: 120,
        totalBundles: 6,
        qtyPerBundle: 20,
        availableStock: 100,
        repairsPendingDays: 5,
        comments: 'Old Boxes — Repair Pending',
        stockStatus: 'Repair Pending'
      }
    ];

    // Reel Stock
    this.reelsStockList = [
      { reelNumber: 'Reel-001', gsm: 250, size: 180, bf: '18',     shade: 'VR',      weight: 1200, availability: 'Inside',  matchingLayer: true,  stockStatus: 'Available'       },
      { reelNumber: 'Reel-002', gsm: 120, size: 110, bf: 'Duplex', shade: 'White',   weight: 300,  availability: 'Outside', matchingLayer: false, stockStatus: 'Reorder Required' },
      { reelNumber: 'Reel-003', gsm: 150, size: 180, bf: '16',     shade: 'Natural', weight: 850,  availability: 'Inside',  matchingLayer: true,  stockStatus: 'Available'       },
      { reelNumber: 'Reel-004', gsm: 120, size: 150, bf: '14',     shade: 'VR',      weight: 620,  availability: 'Inside',  matchingLayer: true,  stockStatus: 'Available'       }
    ];
  }

  loadOtherMaterial(category: string): void {
    const mock: Record<string, OtherMaterialStock[]> = {
      Glue: [
        { materialName: 'White Glue (Standard)', availableQty: 250, unit: 'KG', reorderLevel: 100, stockStatus: 'OK'     },
        { materialName: 'Cold Glue',              availableQty: 80,  unit: 'KG', reorderLevel: 100, stockStatus: 'Low'    }
      ],
      Starch: [
        { materialName: 'Maize Starch Powder',   availableQty: 45,  unit: 'KG', reorderLevel: 100, stockStatus: 'Reorder' },
        { materialName: 'Modified Starch',        availableQty: 200, unit: 'KG', reorderLevel: 50,  stockStatus: 'OK'      }
      ],
      Colors: [
        { materialName: 'Black Ink',             availableQty: 12, unit: 'LTR', reorderLevel: 10, stockStatus: 'OK'    },
        { materialName: 'Red Ink',               availableQty: 5,  unit: 'LTR', reorderLevel: 10, stockStatus: 'Low'   },
        { materialName: 'Blue Ink',              availableQty: 8,  unit: 'LTR', reorderLevel: 10, stockStatus: 'Low'   }
      ]
    };
    this.otherMaterialStock = mock[category] ?? [];
  }

  // ─── Action buttons ────────────────────────────────────────────────────────

  createProductionPlan(): void {
    this.router.navigate(['/transaction/production-planning'], {
      queryParams: {
        job:       this.decisionSummary.jobCode,
        shortfall: this.decisionSummary.shortfall
      }
    });
  }

  dispatchDirect(): void {
    this.router.navigate(['/transaction/dispatch'], {
      queryParams: { job: this.decisionSummary.jobCode }
    });
  }
}