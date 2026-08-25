import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

interface ItemMaster {
  itemCode: string;
  description: string;
  plyType: number;
}

interface LayerSpec {
  layerId: string;
  itemCode: string;
  layerNo: string;
  material: string;
  size: number | null;
  gsm: number | null;
  bf: number | null;
  flute: string;
  shade: string;
  remarks: string;
  status: string;
}

@Component({
  selector: 'app-layer-specs',
  standalone: false,
  templateUrl: './layer-specs.component.html',
  styleUrl: './layer-specs.component.css'
})
export class LayerSpecsComponent implements OnInit {

  layers: LayerSpec[] = [];
  filteredLayers: LayerSpec[] = [];
  activeItemFilter = 'All';
  formSubmitted = false;

  /** Controls modal visibility */
  showLayerModal = false;
  showViewModal = false;

  // ── Item Master (AS-IS source: PMS) ──────────────────────────────
  // Drives auto-sequencing of Layer No and the Ply-based layer cap (Business Rules #2–#5)
  itemMasterList: ItemMaster[] = [
    { itemCode: '2000541', description: 'Corrugated Box – 5 Ply', plyType: 5 },
    { itemCode: '2000542', description: 'Corrugated Box – 3 Ply', plyType: 3 },
    { itemCode: '2000543', description: 'Export Carton – 7 Ply',  plyType: 7 },
    { itemCode: '2000544', description: 'Mono Carton – 3 Ply',    plyType: 3 }
  ];
  itemCodeOptions: string[] = this.itemMasterList.map(i => i.itemCode);
  itemFilterOptions: string[] = ['All', ...this.itemCodeOptions];

  // ── Dropdown options ──────────────────────────────────────────────
  materialOptions: string[] = ['Kraft', 'Medium', 'Duplex', 'Test Liner', 'SC'];
  fluteOptions: string[] = ['A', 'B', 'C', 'E', 'NA'];
  shadeOptions: string[] = ['VR', 'Natural', 'White', 'Cream'];
  statusOptions: string[] = ['Active', 'Inactive'];

  kpis = [
    { label: 'TOTAL LAYERS',  value: 0, icon: 'pi pi-list',         colorClass: 'blue'   },
    { label: 'ITEMS COVERED', value: 0, icon: 'pi pi-box',          colorClass: 'purple' },
    { label: 'ACTIVE LAYERS', value: 0, icon: 'pi pi-check-circle', colorClass: 'green'  },
    { label: 'AVG GSM',       value: 0, icon: 'pi pi-chart-bar',    colorClass: 'yellow' }
  ];

  isEditMode = false;
  currentLayer: LayerSpec = this.getEmptyLayer();
  viewingLayer: LayerSpec = this.getEmptyLayer();

  /** Ply Type of the item currently selected in the form (auto-pulled from Item Master) */
  selectedPlyType: number | null = null;
  /** True when the selected item already has all Ply-configured layers defined */
  maxLayersReached = false;

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.layers = [
      { layerId: 'LS001', itemCode: '2000541', layerNo: 'L1', material: 'Kraft',      size: 180, gsm: 250, bf: 22, flute: 'NA', shade: 'VR',      remarks: 'Outer liner',     status: 'Active' },
      { layerId: 'LS002', itemCode: '2000541', layerNo: 'L2', material: 'Medium',     size: 125, gsm: 120, bf: 18, flute: 'B',  shade: 'Natural', remarks: 'Flute applicable', status: 'Active' },
      { layerId: 'LS003', itemCode: '2000541', layerNo: 'L3', material: 'Kraft',      size: 150, gsm: 150, bf: 16, flute: 'NA', shade: 'VR',      remarks: '',                status: 'Active' },
      { layerId: 'LS004', itemCode: '2000541', layerNo: 'L4', material: 'Medium',     size: 100, gsm: 110, bf: 16, flute: 'B',  shade: 'Natural', remarks: 'Flute applicable', status: 'Active' },
      { layerId: 'LS005', itemCode: '2000541', layerNo: 'L5', material: 'Kraft',      size: 170, gsm: 220, bf: 20, flute: 'NA', shade: 'VR',      remarks: 'Inner liner',     status: 'Active' },

      { layerId: 'LS006', itemCode: '2000542', layerNo: 'L1', material: 'Kraft',      size: 160, gsm: 200, bf: 20, flute: 'NA', shade: 'VR',      remarks: '',                status: 'Active' },
      { layerId: 'LS007', itemCode: '2000542', layerNo: 'L2', material: 'Medium',     size: 115, gsm: 100, bf: 16, flute: 'C',  shade: 'Natural', remarks: 'Flute applicable', status: 'Active' },
      { layerId: 'LS008', itemCode: '2000542', layerNo: 'L3', material: 'Kraft',      size: 140, gsm: 180, bf: 18, flute: 'NA', shade: 'White',   remarks: '',                status: 'Inactive' },

      { layerId: 'LS009', itemCode: '2000543', layerNo: 'L1', material: 'Test Liner', size: 165, gsm: 230, bf: 24, flute: 'NA', shade: 'White',   remarks: '',                status: 'Active' },
      { layerId: 'LS010', itemCode: '2000543', layerNo: 'L2', material: 'Medium',     size: 120, gsm: 110, bf: 16, flute: 'B',  shade: 'Natural', remarks: 'Flute applicable', status: 'Active' },
      { layerId: 'LS011', itemCode: '2000543', layerNo: 'L3', material: 'Duplex',     size: 145, gsm: 190, bf: 20, flute: 'NA', shade: 'Cream',   remarks: '',                status: 'Active' }
    ];

    this.filteredLayers = [...this.layers];
    this.updateKPIs();
    this.currentLayer = this.getEmptyLayer();
  }

  // ── Item Master helpers ────────────────────────────────────────────
  getItemMaster(code: string): ItemMaster | undefined {
    return this.itemMasterList.find(i => i.itemCode === code);
  }

  getPlyType(code: string): number | null {
    const item = this.getItemMaster(code);
    return item ? item.plyType : null;
  }

  getLayerNumber(layerNo: string | null | undefined): number {
    const n = parseInt((layerNo || '').replace(/[^0-9]/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }

  /** Business Rule #6: Flute applicable only for corrugated medium (typically even-numbered) layers */
  isFluteApplicable(layerNo?: string): boolean {
    const n = this.getLayerNumber(layerNo ?? this.currentLayer.layerNo);
    return n > 0 && n % 2 === 0;
  }

  /** Business Rules #2–#5: auto-generate next Layer No based on the item's configured Ply Type */
  onItemCodeChange(event: any): void {
    this.applySequenceForItem(event.value);
  }

  private applySequenceForItem(code: string): void {
    const item = this.getItemMaster(code);
    this.selectedPlyType = item ? item.plyType : null;

    if (!item) {
      this.currentLayer.layerNo = '';
      this.maxLayersReached = false;
      return;
    }

    if (!this.isEditMode) {
      const used = this.layers.filter(l => l.itemCode === code).map(l => this.getLayerNumber(l.layerNo));
      const nextNum = used.length ? Math.max(...used) + 1 : 1;

      if (nextNum > item.plyType) {
        this.maxLayersReached = true;
        this.currentLayer.layerNo = '';
        this.messageService.add({
          severity: 'warn',
          summary: 'Max Layers Reached',
          detail: `All ${item.plyType} layers already exist for ${item.plyType}-Ply item ${code}.`
        });
      } else {
        this.maxLayersReached = false;
        this.currentLayer.layerNo = 'L' + nextNum;
      }
    }

    this.currentLayer.flute = this.isFluteApplicable(this.currentLayer.layerNo)
      ? (this.currentLayer.flute === 'NA' ? 'B' : this.currentLayer.flute)
      : 'NA';
  }

  // ── Item filter pills ───────────────────────────────────────────────
  filterByItem(code: string): void {
    this.activeItemFilter = code;
    this.filteredLayers = code === 'All'
      ? [...this.layers]
      : this.layers.filter(l => l.itemCode === code);
  }

  // ── Empty template ───────────────────────────────────────────────────
  getEmptyLayer(): LayerSpec {
    return {
      layerId: this.generateNextLayerId(),
      itemCode: '',
      layerNo: '',
      material: 'Kraft',
      size: null,
      gsm: null,
      bf: null,
      flute: 'NA',
      shade: 'VR',
      remarks: '',
      status: 'Active'
    };
  }

  generateNextLayerId(): string {
    if (!this.layers || this.layers.length === 0) return 'LS001';
    const ids = this.layers.map(l => parseInt(l.layerId.substring(2)) || 0);
    return 'LS' + (Math.max(...ids) + 1).toString().padStart(3, '0');
  }

  // ── Open modal (Create) ──────────────────────────────────────────────
  openCreateModal(): void {
    this.isEditMode = false;
    this.formSubmitted = false;
    this.selectedPlyType = null;
    this.maxLayersReached = false;
    this.currentLayer = this.getEmptyLayer();
    this.showLayerModal = true;
  }

  closeModal(): void {
    this.showLayerModal = false;
    this.resetForm();
  }

  /** Called when the p-dialog overlay is dismissed via the X button */
  onModalHide(): void {
    this.resetForm();
  }

  // ── View (read-only) ──────────────────────────────────────────────────
  viewLayer(layer: LayerSpec): void {
    this.viewingLayer = { ...layer };
    this.showViewModal = true;
  }

  editFromView(): void {
    this.showViewModal = false;
    this.editLayer(this.viewingLayer);
  }

  // ── Edit ────────────────────────────────────────────────────────────────
  editLayer(layer: LayerSpec): void {
    this.isEditMode = true;
    this.formSubmitted = false;
    this.currentLayer = { ...layer };
    this.selectedPlyType = this.getPlyType(layer.itemCode);
    this.maxLayersReached = false;
    this.showLayerModal = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Mode Active',
      detail: `Editing ${layer.itemCode} – ${layer.layerNo}`
    });
  }

  // ── Delete ──────────────────────────────────────────────────────────────
  confirmDelete(event: Event, layer: LayerSpec): void {
    this.confirmationService.confirm({
      message: `Delete layer ${layer.layerNo} for item ${layer.itemCode}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => this.deleteLayer(layer)
    });
  }

  deleteLayer(layer: LayerSpec): void {
    this.layers = this.layers.filter(l => l.layerId !== layer.layerId);
    this.filterByItem(this.activeItemFilter);
    this.updateKPIs();
    this.messageService.add({
      severity: 'success',
      summary: 'Layer Deleted',
      detail: `${layer.itemCode} – ${layer.layerNo} removed.`
    });
    if (this.currentLayer.layerId === layer.layerId) this.resetForm();
  }

  // ── Save ────────────────────────────────────────────────────────────────
  saveLayer(form?: NgForm): void {
    this.formSubmitted = true;

    if (!this.currentLayer.itemCode) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Item Code is required.' });
      return;
    }
    if (!this.currentLayer.layerNo) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Layer No could not be generated. Select an Item Code with available Ply slots.' });
      return;
    }
    // Business Rule #7: GSM, BF, Material, Size and Shade are mandatory for every layer
    if (!this.currentLayer.material || !this.currentLayer.gsm || !this.currentLayer.size || !this.currentLayer.bf || !this.currentLayer.shade) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Material, GSM, Size, BF and Shade are mandatory.' });
      return;
    }

    // Business Rule #6: enforce Flute only on even-numbered (medium) layers
    if (!this.isFluteApplicable(this.currentLayer.layerNo)) this.currentLayer.flute = 'NA';

    if (this.isEditMode) {
      const index = this.layers.findIndex(l => l.layerId === this.currentLayer.layerId);
      if (index !== -1) {
        this.layers[index] = { ...this.currentLayer };
        this.messageService.add({ severity: 'success', summary: 'Layer Updated', detail: `${this.currentLayer.itemCode} – ${this.currentLayer.layerNo} updated.` });
      }
    } else {
      const item = this.getItemMaster(this.currentLayer.itemCode);

      // Business Rule #8: Layer sequence cannot be duplicated for the same Item Code
      const duplicate = this.layers.some(l => l.itemCode === this.currentLayer.itemCode && l.layerNo === this.currentLayer.layerNo);
      if (duplicate) {
        this.messageService.add({ severity: 'error', summary: 'Duplicate Layer', detail: `${this.currentLayer.layerNo} already exists for item ${this.currentLayer.itemCode}.` });
        return;
      }

      // Business Rules #2–#5: cannot exceed the item's configured Ply Type
      if (item) {
        const count = this.layers.filter(l => l.itemCode === this.currentLayer.itemCode).length;
        if (count >= item.plyType) {
          this.messageService.add({ severity: 'error', summary: 'Max Layers Reached', detail: `${item.plyType}-Ply item ${this.currentLayer.itemCode} already has all ${item.plyType} layers defined.` });
          return;
        }
      }

      if (this.layers.some(l => l.layerId === this.currentLayer.layerId)) {
        this.currentLayer.layerId = this.generateNextLayerId();
      }
      this.layers.unshift({ ...this.currentLayer });
      this.messageService.add({ severity: 'success', summary: 'Layer Added', detail: `${this.currentLayer.itemCode} – ${this.currentLayer.layerNo} added.` });
    }

    this.filterByItem(this.activeItemFilter);
    this.updateKPIs();
    this.closeModal();
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  resetForm(): void {
    this.isEditMode = false;
    this.formSubmitted = false;
    this.selectedPlyType = null;
    this.maxLayersReached = false;
    this.currentLayer = this.getEmptyLayer();
  }

  // ── KPIs ─────────────────────────────────────────────────────────────────
  updateKPIs(): void {
    this.kpis[0].value = this.layers.length;
    this.kpis[1].value = new Set(this.layers.map(l => l.itemCode)).size;
    this.kpis[2].value = this.layers.filter(l => l.status === 'Active').length;
    const gsmVals = this.layers.map(l => l.gsm ?? 0).filter(g => g > 0);
    this.kpis[3].value = gsmVals.length ? Math.round(gsmVals.reduce((a, b) => a + b, 0) / gsmVals.length) : 0;
  }
}