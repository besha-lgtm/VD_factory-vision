import { Component, OnInit } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';

interface ReelReading {
  visipakGsm: number | null;
  actualBs: number | null;
  actBf: number;
}

interface ReelRecord {
  reelNo: string;
  size: number | null;
  readings: ReelReading[];
  avgBf: number;
  avgGsm: number;
  result: string;
  recordDate: string; 
}

interface RMHeader {
  ordGsm: number | null;
  ordBf: number | null;
}

interface RMSupplierBatch extends RMHeader {
  supplierName: string;
  reelRecords: ReelRecord[];
}

interface ChemParam {
  paramName: string;
  specification: string;
  vendorResult: string;
  visipakResult: string;
  status: string;
  recordDate: string; // Tracks execution run dates per parameter item
}

interface ChemHeader {
  supplierName: string;
  material: string;
}

interface ChemSupplierBatch extends ChemHeader {
  chemParams: ChemParam[];
}

interface QCRecord {
  qcId: string;
  qcDate: string;
  jobId: string;
  qcType: string;
  gsm: number | null;
  bf: number | null;
  bct: number | null;
  moisture: number | null;
  cobbTest: number | null;
  inspector: string;
  result: string;
  approvedBy: string;
  remarks: string;
}

@Component({
  selector: 'app-qc-management',
  standalone: false,
  templateUrl: './qc-management.component.html',
  styleUrl: './qc-management.component.css'
})
export class QcManagementComponent implements OnInit {

  activeModule: 'rawmaterial' | 'chemical' | 'stagefinal' = 'rawmaterial';

  // Filters
  rmFilterDate: string = '';
  chemFilterDate: string = ''; // New chemical date filter match

  kpis = [
    { label: 'REELS INSPECTED',  value: 0, icon: 'pi pi-inbox',        colorClass: 'blue'   },
    { label: 'REEL PASS RATE',   value: '—', icon: 'pi pi-percentage', colorClass: 'green'  },
    { label: 'STAGE/FINAL PASS', value: 0, icon: 'pi pi-check-circle', colorClass: 'purple' },
    { label: 'PENDING / FAIL',   value: 0, icon: 'pi pi-exclamation-triangle', colorClass: 'yellow' }
  ];
  
  showUserModal = false;
  showViewModal = false;
  viewQC: any = {}; 

  // MODULE 1 – RAW MATERIAL
  rmSuppliers: RMSupplierBatch[] = [];
  selectedRmSupplier: string = '';

  get currentRmBatch(): RMSupplierBatch {
    return (
      this.rmSuppliers.find(s => s.supplierName === this.selectedRmSupplier) ||
      this.rmSuppliers[0] ||
      { supplierName: '', ordGsm: null, ordBf: null, reelRecords: [] }
    );
  }

  get filteredReelRecords(): ReelRecord[] {
    if (!this.rmFilterDate) {
      return this.currentRmBatch.reelRecords;
    }
    return this.currentRmBatch.reelRecords.filter(r => r.recordDate === this.rmFilterDate);
  }

  get rmSupplierNames(): string[] {
    return this.rmSuppliers.map(s => s.supplierName);
  }

  switchRmSupplier(name: string): void {
    this.selectedRmSupplier = name;
  }

  addReel(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.currentRmBatch.reelRecords.push({
      reelNo: '',
      size: null,
      readings: [this.emptyReading()],
      avgBf: 0,
      avgGsm: 0,
      result: 'Pass',
      recordDate: this.rmFilterDate || todayStr
    });
  }

  emptyReading(): ReelReading {
    return { visipakGsm: null, actualBs: null, actBf: 0 };
  }

  addReading(reel: ReelRecord): void {
    reel.readings.push(this.emptyReading());
  }

  removeLastReading(reel: ReelRecord): void {
    if (reel.readings.length > 1) {
      reel.readings.pop();
      this.recalcReel(reel);
    }
  }

  recalcReel(reel: ReelRecord): void {
    const ordGsm = this.currentRmBatch.ordGsm || 1;

    reel.readings.forEach(r => {
      if (r.actualBs != null && r.visipakGsm != null) {
        r.actBf = parseFloat((r.actualBs * (r.visipakGsm / ordGsm)).toFixed(2));
      } else {
        r.actBf = 0;
      }
    });

    const validBf  = reel.readings.filter(r => r.actBf  > 0).map(r => r.actBf);
    const validGsm = reel.readings.filter(r => r.visipakGsm != null).map(r => r.visipakGsm as number);

    reel.avgBf  = validBf.length  ? parseFloat((validBf.reduce((a, b)  => a + b, 0) / validBf.length).toFixed(2))  : 0;
    reel.avgGsm = validGsm.length ? parseFloat((validGsm.reduce((a, b) => a + b, 0) / validGsm.length).toFixed(2)) : 0;

    this.updateKPIs();
  }

  confirmDeleteReel(event: Event, index: number): void {
    this.confirmationService.confirm({
      message: `Remove reel #${index + 1} and all its readings?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Remove',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => {
        const targetRecord = this.filteredReelRecords[index];
        const realIndex = this.currentRmBatch.reelRecords.indexOf(targetRecord);
        if (realIndex !== -1) {
          this.currentRmBatch.reelRecords.splice(realIndex, 1);
        }
        this.updateKPIs();
      }
    });
  }

  saveReelQC(): void {
    if (this.currentRmBatch.reelRecords.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Nothing to Save', detail: 'Please add at least one reel.' });
      return;
    }
    this.messageService.add({ severity: 'success', summary: 'Reel QC Saved', detail: `${this.currentRmBatch.reelRecords.length} reel(s) recorded successfully for ${this.currentRmBatch.supplierName}.` });
    this.updateKPIs();
  }

  // MODULE 2 – CHEMICAL / STARCH QC
  chemSuppliers: ChemSupplierBatch[] = [];
  selectedChemSupplier: string = '';
  chemStatusOptions: string[] = ['Complies', 'Does Not Comply', 'Under Review'];

  get currentChemBatch(): ChemSupplierBatch {
    return (
      this.chemSuppliers.find(s => s.supplierName === this.selectedChemSupplier) ||
      this.chemSuppliers[0] ||
      { supplierName: '', material: '', chemParams: [] }
    );
  }

  // Reactive parsing filter execution matched to currentRm logic
  get filteredChemParams(): ChemParam[] {
    if (!this.chemFilterDate) {
      return this.currentChemBatch.chemParams;
    }
    return this.currentChemBatch.chemParams.filter(p => p.recordDate === this.chemFilterDate);
  }

  get chemSupplierNames(): string[] {
    return this.chemSuppliers.map(s => s.supplierName);
  }

  switchChemSupplier(name: string): void {
    this.selectedChemSupplier = name;
  }

  addChemParameter(): void {
    const todayStr = new Date().toISOString().split('T')[0];
    this.currentChemBatch.chemParams.push({
      paramName: '',
      specification: '',
      vendorResult: '',
      visipakResult: '',
      status: 'Complies',
      recordDate: this.chemFilterDate || todayStr // Matches current filter state context
    });
  }

  confirmDeleteChemParam(event: Event, index: number): void {
    this.confirmationService.confirm({
      message: `Remove this chemical verification parameter?`,
      header: 'Confirm Parameter Removal',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Remove',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => {
        const targetParam = this.filteredChemParams[index];
        const realIndex = this.currentChemBatch.chemParams.indexOf(targetParam);
        if (realIndex !== -1) {
          this.currentChemBatch.chemParams.splice(realIndex, 1);
        }
      }
    });
  }

  saveChemQC(): void {
    if (this.filteredChemParams.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Nothing to Save', detail: 'Add or display at least one parameter.' });
      return;
    }
    this.messageService.add({ severity: 'success', summary: 'Chemical QC Saved', detail: `${this.filteredChemParams.length} parameter(s) updated for ${this.currentChemBatch.supplierName}.` });
  }

  // MODULE 3 – STAGE & FINAL QC
  qcRecords: QCRecord[] = [];
  sfQcTypeOptions: string[] = ['Stage QC', 'Final QC'];
  resultOptions: string[] = ['Pass', 'Fail', 'Rework'];

  isEditMode = false;
  currentQC: QCRecord = this.getEmptyQC();

  getEmptyQC(): QCRecord {
    return {
      qcId: this.generateNextQCId(),
      qcDate: new Date().toISOString().split('T')[0],
      jobId: '',
      qcType: 'Final QC',
      gsm: null,
      bf: null,
      bct: null,
      moisture: null,
      cobbTest: null,
      inspector: '',
      result: 'Pass',
      approvedBy: '',
      remarks: ''
    };
  }

  generateNextQCId(): string {
    if (!this.qcRecords || this.qcRecords.length === 0) return 'QC001';
    const ids = this.qcRecords.map(q => parseInt(q.qcId.replace(/\D/g, '')) || 0);
    return 'QC' + (Math.max(...ids) + 1).toString().padStart(3, '0');
  }

  confirmDelete(event: Event, qc: QCRecord): void {
    this.confirmationService.confirm({
      message: `Delete QC record ${qc.qcId} for ${qc.jobId}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => this.deleteQC(qc)
    });
  }

  deleteQC(qc: QCRecord): void {
    this.qcRecords = this.qcRecords.filter(q => q.qcId !== qc.qcId);
    this.updateKPIs();
    this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${qc.qcId} removed.` });
    if (this.currentQC.qcId === qc.qcId) this.resetForm();
  }

  resetForm(form?: any): void {
    this.isEditMode = false;
    this.currentQC = this.getEmptyQC();
    if (form) form.resetForm(this.currentQC);
  }

  switchModule(mod: 'rawmaterial' | 'chemical' | 'stagefinal'): void {
    this.activeModule = mod;
  }

  updateKPIs(): void {
    const allReels = this.rmSuppliers.reduce<ReelRecord[]>((acc, s) => acc.concat(s.reelRecords), []);
    const totalReels = allReels.length;
    const passReels  = allReels.filter(r => r.result === 'Pass').length;

    this.kpis[0].value = totalReels;
    this.kpis[1].value = totalReels > 0 ? `${Math.round((passReels / totalReels) * 100)}%` : '—';
    this.kpis[2].value = this.qcRecords.filter(q => q.result === 'Pass').length;
    this.kpis[3].value = this.qcRecords.filter(q => q.result === 'Fail' || q.result === 'Rework').length;
  }

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    
    // Instantiate component initial filter dates
    this.rmFilterDate = today;
    this.chemFilterDate = today;
    [
  
]

    this.rmSuppliers = [
      { supplierName: 'Vijaynagar Biotech Pvt Ltd', ordGsm: 180, ordBf: 18, reelRecords: [] },
      { supplierName: 'Rudra Paper Corporation', ordGsm: 220, ordBf: 20, reelRecords: [] },
      { supplierName: 'Blue Ocean Biotech', ordGsm: 220, ordBf: 20, reelRecords: [] },
        { supplierName: 'Supreme Adhesive Industries', ordGsm: 180, ordBf: 18, reelRecords: [] },
      { supplierName: 'Vibrant Colors Ltd', ordGsm: 180, ordBf: 18, reelRecords: [] },
      

    ];
    this.selectedRmSupplier = this.rmSuppliers[0].supplierName;

    const seedReels = [
      { reelNo: '26A08461', size: 104, date: today, readings: [{ gsm: 216, bs: 4.8 }, { gsm: 218, bs: 4.9 }] },
      { reelNo: '26A08442', size: 104, date: today, readings: [{ gsm: 212, bs: 4.2 }] }
    ];

    this.rmSuppliers[0].reelRecords = seedReels.map(s => {
      const reel: ReelRecord = {
        reelNo: s.reelNo,
        size: s.size,
        readings: s.readings.map(r => ({ visipakGsm: r.gsm, actualBs: r.bs, actBf: 0 })),
        avgBf: 0,
        avgGsm: 0,
        result: 'Pass',
        recordDate: s.date
      };
      this.recalcReel(reel);
      return reel;
    });

    this.chemSuppliers = [
      {
        supplierName: 'Vijaynagar Biotech Pvt Ltd',
        material: 'Native Starch',
        chemParams: [
          { paramName: 'APPEARANCE',      specification: 'Free Flowing Powder', vendorResult: 'COMPLIES',  visipakResult: 'As Per Spec ok', status: 'Complies', recordDate: today },
          { paramName: 'MOISTURE',        specification: '13.0 %',              vendorResult: '11.04 %',   visipakResult: '10.6 %',         status: 'Complies', recordDate: today },
          { paramName: 'Thickness',        specification: '13.0 %',              vendorResult: '11.04 %',   visipakResult: '10.6 %',         status: 'Complies', recordDate: today }
        ]
      },
      {
        supplierName: 'Rudra Paper Corporation',
        material: 'Modified Starch',
        chemParams: []
      },
       {
        supplierName: 'Supreme Adhesive Industries',
        material: 'Modified Starch',
        chemParams: []
      },
        {
        supplierName: 'Blue Ocean Biotech',
        material: 'Modified Starch',
        chemParams: []
      },
        {
        supplierName: 'Vibrant Colors Ltd',
        material: 'Modified Starch',
        chemParams: []
      },

    ];
    this.selectedChemSupplier = this.chemSuppliers[0].supplierName;

    this.qcRecords = [
      {
        qcId: 'QC001', qcDate: today, jobId: 'JC-001', qcType: 'Stage QC',
        gsm: 216, bf: 22.1, bct: 445, moisture: 11.0, cobbTest: 78,
        inspector: 'QC User', result: 'Pass', approvedBy: 'Suresh', remarks: ''
      }
    ];

    this.updateKPIs();
    this.currentQC = this.getEmptyQC();
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentQC = this.getEmptyQC();
    this.showUserModal = true;
  }

  viewQCDetails(qc: any): void {
    this.viewQC = { ...qc };
    this.showViewModal = true;
  }

  editFromView(): void {
    this.showViewModal = false;
    this.editQC(this.viewQC);
  }

  closeModal(form?: any): void {
    this.showUserModal = false;
    this.resetForm(form);
  }

  onModalHide(form?: any): void {
    this.resetForm(form);
  }

  editQC(qc: any): void {
    this.isEditMode = true;
    this.currentQC = { ...qc };
    this.showUserModal = true;
  }

  saveQC(form?: any): void {
    if (form && form.invalid) {
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      return;
    }

    if (this.isEditMode) {
      const index = this.qcRecords.findIndex(q => q.qcId === this.currentQC.qcId);
      if (index !== -1) {
        this.qcRecords[index] = { ...this.currentQC };
      }
    } else {
      if (this.qcRecords.some(q => q.qcId === this.currentQC.qcId)) {
        this.currentQC.qcId = this.generateNextQCId(); 
      }
      this.qcRecords.unshift({ ...this.currentQC });
    }

    this.updateKPIs();
    this.closeModal(form);
  }
}