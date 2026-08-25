import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

interface KPICard {
  label: string;
  value: string | number;
  icon: string;
  colorClass: string;
}

interface FormTab {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-item-pms-master',
  standalone:false,
  templateUrl: './item-pms-master.component.html',
  styleUrls: ['./item-pms-master.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class ItemPmsMasterComponent implements OnInit {
  @ViewChild('dt') table!: Table;

  // Raw PMS data items
  itemsList: any[] = [];
  filteredItems: any[] = [];

  // Dropdown options
  customerOptions: any[] = [];
  statusOptions: any[] = [];
  productTypes: any[] = [];
  plyOptions: any[] = [];
  fluteOptions: any[] = [];
  bindingTypes: any[] = [];
  dimensionRefOptions: any[] = [];
  creasingTypes: any[] = [];
  edgeTreatmentOptions: any[] = [];
  packingModes: any[] = [];

  // Search filter model
  searchFilters = {
    customer: null,
    itemQuery: '',
    status: null
  };

  // KPIs
  kpis: KPICard[] = [];

  // Modal Control Flags
  showViewModal: boolean = false;
  showItemModal: boolean = false;
  isEditMode: boolean = false;
  formSubmitted: boolean = false;

  // Active Tab Controls
  activeViewTab: string = 'basic';
  activeFormTab: string = 'basic';

  // Configured Tabs
  formTabs: FormTab[] = [
    { key: 'basic', label: 'Basic Info & Specs', icon: 'pi pi-info-circle' },
    { key: 'dimensions', label: 'Dimensions & Quality', icon: 'pi pi-arrows-alt' },
    { key: 'packing', label: 'Packing & System', icon: 'pi pi-box' }
  ];

  // Selected Item for reading
  viewItem_data: any = {};

  // Form Model
  currentItem: any = {};

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.initializeDropdowns();
    this.loadSampleData();
    this.updateKPIs();
    this.applyFilters();
  }

  private initializeDropdowns(): void {
    this.customerOptions = [
      { label: 'Glands Pharma', value: 'Glands Pharma' },
   
      { label: 'Apex Logistics', value: 'Apex Logistics' }
    ];

    this.statusOptions = [
      { label: 'Active', value: 'Active' },
      { label: 'Approved', value: 'Approved' },
      { label: 'Draft', value: 'Draft' },
      { label: 'Deactivated', value: 'Deactivated' },
      { label: 'Obsolete', value: 'Obsolete' }
    ];

    this.productTypes = [
      { label: 'Shipper Box', value: 'Shipper Box' },
      { label: 'Duplex Carton', value: 'Duplex Carton' },
      { label: 'Partition Sheet', value: 'Partition Sheet' }
    ];

    this.plyOptions = [
      { label: '3 Ply', value: 3 },
      { label: '5 Ply', value: 5 },
      { label: '7 Ply', value: 7 }
    ];

    this.fluteOptions = [
      { label: 'A Flute', value: 'A' },
      { label: 'B Flute', value: 'B' },
      { label: 'C Flute', value: 'C' },
      { label: 'E Flute', value: 'E' },
      { label: 'BC Flute', value: 'BC' }
    ];

    this.bindingTypes = [
      { label: 'Stitched / Stapled', value: 'Stitched' },
      { label: 'Glued', value: 'Glued' }
    ];

    this.dimensionRefOptions = [
      { label: 'Outer Dimensions (OD)', value: 'OD' },
      { label: 'Inner Dimensions (ID)', value: 'ID' }
    ];

    this.creasingTypes = [
      { label: 'Standard Creasing', value: 'Standard' },
      { label: 'Matrix Creasing', value: 'Matrix' }
    ];

    this.edgeTreatmentOptions = [
      { label: 'Straight Cut', value: 'Straight Cut' },
      { label: 'Scalloped / Punch Cut', value: 'Scalloped' }
    ];

    this.packingModes = [
      { label: 'Bundle with Stripping', value: 'Bundle with Stripping' },
      { label: 'Palletized', value: 'Palletized' },
      { label: 'Shrink Wrapped Bundle', value: 'Shrink Wrapped' }
    ];
  }

  private loadSampleData(): void {
    // Real-world dummy data matching the user schema
    this.itemsList = [
      {
        id: 1,
        itemCode: 'ITEM-2000300',
        customerName: 'Glands Pharma',
        pmsRef: 'PMS/GP/284',
        version: 'VER 1.2',
        productType: 'Shipper Box',
        ply: 5,
        flute: 'BC',
        variantDesc: '5 Ply Shipper (410x215x225)',
        hsnCode: '48191010',
        grade: 'Premium Kraft',
        type: 'Standard Box',
        effectiveDate: '15/05/2026',
        bindingType: 'Stitched',
        dimensionRef: 'ID',
        artworkFileName: 'glands_shipper_v1.2.pdf',
        status: 'Approved',
        length: 410,
        width: 215,
        height: 225,
        tolerance: '±3%',
        closingFlapGap: 2,
        creasingType: 'Standard',
        edgeTreatment: 'Straight Cut',
        weight: '1.24 KG',
        joint: 'Inside Joint',
        partitions: 'None',
        line: 'Line A',
        colour: 'Golden Yellow',
        printing: '2 Color Print',
        bf: 32,
        boardGsm: 180,
        grammageMin: 175,
        grammageMax: 185,
        grammagePerPly: 150,
        burstingStrength: 12.5,
        bctStrength: 320,
        rctStrength: 210,
        moisture: 7.5,
        cobbTest: 32,
        packingMode: 'Bundle with Stripping',
        qtyPerBundle: 25,
        createdBy: 'Admin',
        updatedOn: '14/06/2026',
        avatarColor: '#4f46e5'
      },
      {
        id: 2,
        itemCode: 'ITEM-204232323',
        customerName: 'Apex Logistics',
        pmsRef: 'PMS/DE/044',
        version: 'VER 2.0',
        productType: 'Duplex Carton',
        ply: 3,
        flute: 'E',
        variantDesc: '3 Ply Smart Kit Box (320x240x80)',
        hsnCode: '48191020',
        grade: 'Duplex Board',
        type: 'Folding Carton',
        effectiveDate: '10/06/2026',
        bindingType: 'Glued',
        dimensionRef: 'OD',
        artworkFileName: 'dizi_kit_v2.0.ai',
        status: 'Active',
        length: 320,
        width: 240,
        height: 80,
        tolerance: '±2%',
        closingFlapGap: 0,
        creasingType: 'Matrix',
        edgeTreatment: 'Straight Cut',
        weight: '0.45 KG',
        joint: 'Glue Lap',
        partitions: '4-Way Divider',
        line: 'Line B',
        colour: 'Multi-Color',
        printing: '4 Color Offset',
        bf: 24,
        boardGsm: 280,
        grammageMin: 275,
        grammageMax: 285,
        grammagePerPly: 120,
        burstingStrength: 8.2,
        bctStrength: 180,
        rctStrength: 140,
        moisture: 6.8,
        cobbTest: 28,
        packingMode: 'Shrink Wrapped',
        qtyPerBundle: 50,
        createdBy: 'Satya',
        updatedOn: '02/07/2026',
        avatarColor: '#06b6d4'
      }
    ];
  }

  private updateKPIs(): void {
    const total = this.itemsList.length;
    const active = this.itemsList.filter(i => i.status === 'Approved' || i.status === 'Active').length;
    const draft = this.itemsList.filter(i => i.status === 'Draft').length;

    this.kpis = [
      { label: 'Total Items', value: total, icon: 'pi pi-box', colorClass: 'bg-primary-soft' },
      { label: 'Active Items', value: active, icon: 'pi pi-check-circle', colorClass: 'bg-success-soft' },
      { label: 'Draft Master Sheets', value: draft, icon: 'pi pi-clock', colorClass: 'bg-warning-soft' },
      { label: 'Distinct Customerss', value: new Set(this.itemsList.map(i => i.customerName)).size, icon: 'pi pi-users', colorClass: 'bg-info-soft' }
    ];
  }

  // Initial generation fallback UI matching customer initials
  getItemInitials(productType: string): string {
    if (!productType) return 'IT';
    return productType.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  // Filter Logics
  applyFilters(): void {
    this.filteredItems = this.itemsList.filter(item => {
      const matchCustomer = !this.searchFilters.customer || item.customerName === this.searchFilters.customer;
      const matchStatus = !this.searchFilters.status || item.status === this.searchFilters.status;
      
      let matchQuery = true;
      if (this.searchFilters.itemQuery) {
        const query = this.searchFilters.itemQuery.toLowerCase();
        matchQuery = item.itemCode.toLowerCase().includes(query) || 
                     (item.variantDesc && item.variantDesc.toLowerCase().includes(query));
      }

      return matchCustomer && matchStatus && matchQuery;
    });
  }

  resetFilters(): void {
    this.searchFilters = {
      customer: null,
      itemQuery: '',
      status: null
    };
    this.applyFilters();
  }

  // Global Excel Export Trigger Placeholder
  exportExcel(): void {
    this.messageService.add({ severity: 'success', summary: 'Export Started', detail: 'Exporting PMS records to Excel...' });
  }

  // Modal Setup Functions
  openCreateModal(): void {
    this.isEditMode = false;
    this.formSubmitted = false;
    this.activeFormTab = 'basic';
    this.currentItem = {
      productType: 'Shipper Box',
      ply: 5,
      flute: 'BC',
      bindingType: 'Stitched',
      dimensionRef: 'ID',
      status: 'Draft',
      closingFlapGap: 2,
      creasingType: 'Standard',
      edgeTreatment: 'Straight Cut',
      qtyPerBundle: 25
    };
    this.showItemModal = true;
  }

  viewItem(item: any): void {
    this.viewItem_data = { ...item };
    this.activeViewTab = 'basic';
    this.showViewModal = true;
  }

  editItem(item: any): void {
    this.isEditMode = true;
    this.formSubmitted = false;
    this.activeFormTab = 'basic';
    this.currentItem = { ...item };
    this.showItemModal = true;
  }

  editFromView(): void {
    const backup = { ...this.viewItem_data };
    this.showViewModal = false;
    this.editItem(backup);
  }

  confirmDelete(event: Event, item: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete item ${item.itemCode}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-sm',
      accept: () => {
        this.itemsList = this.itemsList.filter(i => i.id !== item.id);
        this.applyFilters();
        this.updateKPIs();
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Item deleted successfully' });
      }
    });
  }

  // Form tab handling navigation
  switchFormTab(tabKey: string): void {
    this.activeFormTab = tabKey;
  }

  nextTab(): void {
    const currentIndex = this.formTabs.findIndex(t => t.key === this.activeFormTab);
    if (currentIndex < this.formTabs.length - 1) {
      this.activeFormTab = this.formTabs[currentIndex + 1].key;
    }
  }

  prevTab(): void {
    const currentIndex = this.formTabs.findIndex(t => t.key === this.activeFormTab);
    if (currentIndex > 0) {
      this.activeFormTab = this.formTabs[currentIndex - 1].key;
    }
  }

  // Artwork helper logic
  onArtworkSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.currentItem.artworkFileName = file.name;
    }
  }

  clearArtwork(): void {
    this.currentItem.artworkFileName = null;
  }

  // Save/Update Function
  saveItem(form: NgForm): void {
    this.formSubmitted = true;
    
    if (form.invalid) {
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Please fill in all mandatory fields before saving.' });
      return;
    }

    if (this.isEditMode) {
      const index = this.itemsList.findIndex(i => i.id === this.currentItem.id);
      if (index !== -1) {
        this.itemsList[index] = { ...this.currentItem, updatedOn: '17/07/2026' };
      }
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Item specifications updated' });
    } else {
      const newItem = {
        ...this.currentItem,
        id: this.itemsList.length + 1,
        createdBy: 'Current User',
        updatedOn: '17/07/2026',
        avatarColor: '#10b981'
      };
      this.itemsList.push(newItem);
      this.messageService.add({ severity: 'success', summary: 'Success', detail: 'New item added successfully' });
    }

    this.showItemModal = false;
    this.applyFilters();
    this.updateKPIs();
  }

  closeModal(): void {
    this.showItemModal = false;
  }

  onModalHide(): void {
    this.formSubmitted = false;
  }
}