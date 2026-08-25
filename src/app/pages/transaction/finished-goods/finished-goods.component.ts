import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';


interface FGStock {
  fgId: string;
  fgDate: string;
  jobId?: string;
  customer: string;
  itemCode: string;
  boxType: string;

  // Type 1: FG Box
  jobQty?: number | null;
  qtyInStock?: number | null;
  qtyPerBundle?: number | null;
  totalBundles?: number;
  availableQty?: number;
  repairsQty?: number;

  // Type 2: Pads & Partitions
  padsSize?: string;
  partitionSize?: string;
  sleevesSize?: string;
  padsTotalBundle?: number;
  partitionTotalBundle?: number;
  sleevesTotalBundle?: number;
  padsQtyPerBundle?: number;
  partitionQtyPerBundle?: number;
  sleevesQtyPerBundle?: number;
  padsAvailableStock?: number;
  partitionAvailableStock?: number;
  sleevesAvailableStock?: number;

  // Type 3: Reels
  reelNo?: string;
  gsm?: number;
  size?: number;
  bf?: string;
  shade?: string;
  weight?: number;
  locationStatus?: string;

  remarks: string;
  status: string;
}

@Component({
  selector: 'app-finished-goods',
  standalone: false,
  templateUrl: './finished-goods.component.html',
  styleUrl: './finished-goods.component.css'
})


export class FinishedGoodsComponent implements OnInit {

  activeTab: 'FG' | 'Pads' | 'Reels' = 'FG';

  fgStocks: FGStock[] = [];
  filteredFgStocks: FGStock[] = [];

  // Search / filter state
  fgSearchTerm = '';
  reelGsmFilter: number | null = null;

  showUserModal = false;
  showViewModal = false;
  isEditMode = false;
  currentFG!: FGStock;
  viewStock: any = {};

  // ── KPI definitions (parallel to QC component) ──────────
  kpis = [
    { label: 'FG SKUs in Stock',    value: 0,   icon: 'pi pi-box',          colorClass: 'blue'   },
    { label: 'Total Available Pcs', value: '—', icon: 'pi pi-check-circle', colorClass: 'green'  },
    { label: 'Components / Pads',   value: 0,   icon: 'pi pi-clone',        colorClass: 'purple' },
    { label: 'Reels in Yard',       value: 0,   icon: 'pi pi-database',     colorClass: 'yellow' }
  ];

  // Summary footer computed values
  totalFgStock  = 0;
  totalFgAvail  = 0;
  totalReelWeight = 0;

  customerOptions  = ['Laurus', 'PMK', 'PIDILITE - 2', 'DODLA', 'Pepisi', 'Gland Pharma'];
  boxTypeOptions   = ['3PLY', '5PLY', '7PLY', 'Partition', 'Pad', 'Sleeve'];
  statusOptions    = ['Available', 'Partial', 'Dispatched'];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    
  ) {}


  ngOnInit(): void {
    this.currentFG = this.getEmptyFG();
    this.loadMockData();
    this.switchTab('FG');
    this.updateKPIs();
  }

  // ── Tab Navigation ───────────────────────────────────────
  switchTab(tab: 'FG' | 'Pads' | 'Reels'): void {
    this.activeTab = tab;
    this.fgSearchTerm   = '';
    this.reelGsmFilter  = null;
    this.applyFgFilter();
  }

  applyFgFilter(): void {
    let base: FGStock[];

    if (this.activeTab === 'FG') {
      base = this.fgStocks.filter(x => !x.padsSize && !x.gsm);
      if (this.fgSearchTerm?.trim()) {
        const q = this.fgSearchTerm.toLowerCase();
        base = base.filter(x =>
          x.customer.toLowerCase().includes(q) ||
          (x.jobId || '').toLowerCase().includes(q) ||
          x.itemCode.toLowerCase().includes(q)
        );
      }
    } else if (this.activeTab === 'Pads') {
      base = this.fgStocks.filter(x => x.padsSize || x.partitionSize);
    } else {
      base = this.fgStocks.filter(x => x.gsm);
      if (this.reelGsmFilter) {
        base = base.filter(x => x.gsm === this.reelGsmFilter);
      }
    }

    this.filteredFgStocks = base;
    this.computeSummaries();
  }

  // ── KPI computation (called on any data change) ──────────
  updateKPIs(): void {
    const fgRows     = this.fgStocks.filter(x => !x.padsSize && !x.gsm);
    const padsRows   = this.fgStocks.filter(x => x.padsSize || x.partitionSize);
    const reelRows   = this.fgStocks.filter(x => x.gsm);
    const totalAvail = fgRows.reduce((s, r) => s + (r.availableQty || 0), 0);

    this.kpis[0].value = fgRows.length;
    this.kpis[1].value = totalAvail.toLocaleString() + ' Pcs';
    this.kpis[2].value = padsRows.length;
    this.kpis[3].value = reelRows.length;
  }

  computeSummaries(): void {
    if (this.activeTab === 'FG') {
      this.totalFgStock = this.filteredFgStocks.reduce((s, r) => s + (r.qtyInStock || 0), 0);
      this.totalFgAvail = this.filteredFgStocks.reduce((s, r) => s + (r.availableQty || 0), 0);
    }
    if (this.activeTab === 'Reels') {
      this.totalReelWeight = this.filteredFgStocks.reduce((s, r) => s + (r.weight || 0), 0);
    }
  }

  // ── CRUD helpers ─────────────────────────────────────────
  getEmptyFG(): FGStock {
    return {
      fgId:        (this.activeTab === 'Reels' ? 'RL' : this.activeTab === 'Pads' ? 'PD' : 'FG') +
                   '-' + Math.floor(100 + Math.random() * 900),
      fgDate:      new Date().toISOString().substring(0, 10),
      customer:    '',
      itemCode:    '',
      boxType:     '5PLY',
      remarks:     '',
      status:      'Available',
      qtyInStock:  null,
      qtyPerBundle: null,
      totalBundles: 0,
      availableQty: 0,
      repairsQty:   0
    };
  }

  recalculateValues(): void {
    const qty     = this.currentFG.qtyInStock  || 0;
    const repairs = this.currentFG.repairsQty  || 0;
    const perBdl  = this.currentFG.qtyPerBundle || 0;

    this.currentFG.availableQty  = Math.max(0, qty - repairs);
    this.currentFG.totalBundles  = perBdl > 0 ? Math.floor(qty / perBdl) : 0;

    if (this.activeTab === 'Pads') {
      const pBdl  = this.currentFG.padsTotalBundle   || 0;
      const pQty  = this.currentFG.padsQtyPerBundle  || 0;
      const ptBdl = this.currentFG.partitionTotalBundle  || 0;
      const ptQty = this.currentFG.partitionQtyPerBundle || 0;

      this.currentFG.padsAvailableStock      = pBdl * pQty;
      this.currentFG.partitionAvailableStock = ptBdl * ptQty;
    }
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentFG  = this.getEmptyFG();

    if (this.activeTab === 'Pads') {
      this.currentFG.padsSize = ''; this.currentFG.partitionSize = '';
    } else if (this.activeTab === 'Reels') {
      this.currentFG.reelNo = ''; this.currentFG.gsm = 230;
    }
    this.showUserModal = true;
  }

  editEntry(stock: FGStock): void {
    this.isEditMode = true;
    this.currentFG  = { ...stock };
    this.showUserModal = true;
  }

  viewStockDetails(stock: FGStock): void {
    this.viewStock   = { ...stock };
    this.showViewModal = true;
  }

   showPadsPartitionViewModal = false;
   viewPadsPartition: any = {};

viewPadsPartitionDetails(row: any): void {
  this.viewPadsPartition = { ...row };
  this.showPadsPartitionViewModal = true;
}

showReelViewModal = false;
viewReel: any = {};

viewReelDetails(row: any): void {
  this.viewReel = { ...row };
  this.showReelViewModal = true;
}

  saveStockEntry(form: NgForm): void {
    if (form.invalid) return;
    this.recalculateValues();

    if (this.isEditMode) {
      const idx = this.fgStocks.findIndex(f => f.fgId === this.currentFG.fgId);
      if (idx !== -1) this.fgStocks[idx] = { ...this.currentFG };
    } else {
      this.fgStocks.unshift({ ...this.currentFG });
    }

    this.updateKPIs();
    this.switchTab(this.activeTab);
    this.showUserModal = false;

    this.messageService.add({
      severity: 'success',
      summary: 'Saved',
      detail: `Entry ${this.currentFG.fgId} committed to ledger.`
    });
  }

  confirmDelete(event: Event, stock: FGStock): void {
    this.confirmationService.confirm({
      target: event.target as EventTarget,
      message: `Remove ${stock.fgId} from ledger permanently?`,
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.fgStocks = this.fgStocks.filter(f => f.fgId !== stock.fgId);
        this.updateKPIs();
        this.switchTab(this.activeTab);
        this.messageService.add({ severity: 'warn', summary: 'Deleted', detail: `${stock.fgId} removed.` });
      }
    });
  }

  exportSheet(): void {
    // Placeholder — wire up actual export service here
    this.messageService.add({ severity: 'info', summary: 'Export', detail: 'Sheet export triggered.' });
  }

  // ── Mock Data ────────────────────────────────────────────
  private loadMockData(): void {
    this.fgStocks = [
      // Sheet 1 — FG
      {
        fgId: 'FG-001', fgDate: '2026-06-01', jobId: 'JC-081', customer: 'Laurus',
        itemCode: '1000X800 Core Box', boxType: '3PLY',
        qtyInStock: 550, qtyPerBundle: 25, totalBundles: 22,
        availableQty: 550, repairsQty: 0, remarks: '', status: 'Available'
      },
      {
        fgId: 'FG-002', fgDate: '2026-06-02', jobId: 'JC-092', customer: 'Pepisi',
        itemCode: 'Pepsi 1ltr CC Boxes', boxType: '3PLY',
        qtyInStock: 7200, qtyPerBundle: 300, totalBundles: 24,
        availableQty: 7200, repairsQty: 0, remarks: 'New Aquavees Pads', status: 'Available'
      },
      {
        fgId: 'FG-003', fgDate: '2026-06-10', jobId: 'JC-097', customer: 'Gland Pharma',
        itemCode: 'Pharma 5PLY Master Shipper', boxType: '5PLY',
        qtyInStock: 1200, qtyPerBundle: 50, totalBundles: 24,
        availableQty: 1100, repairsQty: 100, remarks: 'Rework batch — corner crush', status: 'Partial'
      },

      // Sheet 2 & 3 — Pads
      {
        fgId: 'PD-101', fgDate: '2026-06-03', customer: 'PMK', itemCode: 'MXOP 180ml Component',
        boxType: '3PLY', padsSize: '445X300', partitionSize: '435X285X123',
        padsTotalBundle: 10, padsQtyPerBundle: 100, padsAvailableStock: 1000,
        partitionTotalBundle: 5, partitionQtyPerBundle: 20, partitionAvailableStock: 100,
        remarks: 'P.M.K Pads Tab', status: 'Available'
      },
      {
        fgId: 'PD-102', fgDate: '2026-06-04', customer: 'DODLA', itemCode: 'Dodla 500ml internal layer',
        boxType: '5PLY', padsSize: 'None', partitionSize: '315X205X218',
        partitionTotalBundle: 20, partitionQtyPerBundle: 100, partitionAvailableStock: 2000,
        remarks: 'Dodla Partition', status: 'Available'
      },

      // Sheet 4 — Reels
      {
        fgId: 'RL-301', fgDate: '2026-06-05', customer: 'Warehouse Rolls',
        itemCode: 'GSM 250 Roll Yard', boxType: 'Reel',
        reelNo: '26C08913', gsm: 250, size: 77, bf: '28', shade: 'G', weight: 372,
        status: 'Available', remarks: 'Inside Main Storage Area'
      },
      {
        fgId: 'RL-302', fgDate: '2026-06-06', customer: 'Warehouse Rolls',
        itemCode: 'GSM 230 Roll Yard', boxType: 'Reel',
        reelNo: '26A08461', gsm: 230, size: 104, bf: '22', shade: 'W', weight: 285,
        status: 'Available', remarks: ''
      }
    ];
  }
}