import { Component, OnInit } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';

interface AdditionalContact {
  name: string;
  designation: string;
  phone: string;
  email: string;
}

interface Supplier {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  unitName: string;
  materialCategory: string;
  gstin: string;
  pan: string;
  city: string;
  state: string;
  pinCode: string;
  contactPerson: string;
  contactPersonDesignation: string; // New Field
  phone: string;
  email: string;
  address: string;
  billTo: string;
  status: string;
  avatarColor?: string;
  additionalContacts: AdditionalContact[]; // New Field
}

@Component({
  selector: 'app-supplier-master',
  standalone: false,
  templateUrl: './supplier-master.component.html',
  styleUrl: './supplier-master.component.css'
})
export class SupplierMasterComponent implements OnInit {

  // Must be declared first — used by getEmptySupplier() at field-init time
  private avatarColors = [
    '#2e90fa', '#7a5af8', '#12b76a', '#f79009',
    '#f04438', '#0794ad', '#ee46bc', '#16b364'
  ];

  suppliers: Supplier[] = [];

  showSupplierModal = false;
  showViewModal = false;
  viewSupplier: Supplier = this.getEmptySupplier();

  activeSupplierTab = 'general';
  supplierTabs = [
    { key: 'general', label: 'General Details', icon: 'pi pi-info-circle' },
    { key: 'contacts', label: 'Additional Contacts', icon: 'pi pi-users' }
  ];

  materialCategories: string[] = [
    'Reels',
    'Glue',
    'Starch Powder',
    'Colors',
    'Gas',
    'Spares',
    'Stationery'
  ];

  kpis = [
    { label: 'TOTAL SUPPLIERS',      value: 0,     icon: 'pi pi-building',    colorClass: 'blue'   },
    { label: 'ACTIVE SUPPLIERS',     value: 0,     icon: 'pi pi-check-circle', colorClass: 'green'  },
    { label: 'MATERIAL CATEGORIES',  value: 0,     icon: 'pi pi-tags',         colorClass: 'purple' },
    { label: 'TOP CATEGORY',         value: 'N/A', icon: 'pi pi-star',         colorClass: 'yellow' }
  ];

  isEditMode = false;
  currentSupplier: Supplier = this.getEmptySupplier();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.suppliers = [
      {
        supplierId: 'SUP001',
        supplierCode: 'SUP001',
        supplierName: 'Rudra Paper Corporation',
        unitName: '',
        materialCategory: 'Reels',
        gstin: '37AAYCR1234F1Z0',
        pan: 'AAYCR1234F',
        city: 'Visakhapatnam',
        state: 'Andhra Pradesh',
        pinCode: '530012',
        contactPerson: 'Ravi Shankar',
        contactPersonDesignation: 'Managing Partner',
        phone: '9346382999',
        email: 'rudrapapercorporation@gmail.com',
        address: 'Plot No. 27, Block E, Industrial Development Area, Visakhapatnam',
        billTo: 'Plot No. 27, Block E, Industrial Development Area, Visakhapatnam - 530012',
        status: 'Active',
        avatarColor: '#2e90fa',
        additionalContacts: [
          { name: 'K. Ramesh', designation: 'Dispatch Executive', phone: '9346382901', email: 'dispatch@rudrapaper.com' }
        ]
      },
      {
        supplierId: 'SUP002',
        supplierCode: 'SUP002',
        supplierName: 'Blue Ocean Biotech',
        unitName: '',
        materialCategory: 'Starch Powder',
        gstin: '37AAACB4567A1Z1',
        pan: 'AAACB4567A',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pinCode: '382330',
        contactPerson: 'Dr. Amit Patel',
        contactPersonDesignation: 'Director',
        phone: '9848022338',
        email: 'info@blueocean.com',
        address: 'Phase 3, GIDC, Ahmedabad',
        billTo: '',
        status: 'Active',
        avatarColor: '#12b76a',
        additionalContacts: []
      },
      {
        supplierId: 'SUP003',
        supplierCode: 'SUP003',
        supplierName: 'Supreme Adhesive Industries',
        unitName: '',
        materialCategory: 'Glue',
        gstin: '27AABCS7890C1Z2',
        pan: 'AABCS7890C',
        city: 'Thane',
        state: 'Maharashtra',
        pinCode: '400604',
        contactPerson: 'Sanjay Shah',
        contactPersonDesignation: 'Sales Head',
        phone: '9123456789',
        email: 'sales@supremeglue.com',
        address: 'Wagle Estate, Thane',
        billTo: '',
        status: 'Active',
        avatarColor: '#7a5af8',
        additionalContacts: []
      },
      {
        supplierId: 'SUP004',
        supplierCode: 'SUP004',
        supplierName: 'Vibrant Colors Ltd',
        unitName: '',
        materialCategory: 'Colors',
        gstin: '19AACCV4321D2Z3',
        pan: 'AACCV4321D',
        city: 'Kolkata',
        state: 'West Bengal',
        pinCode: '700091',
        contactPerson: 'Debashis Roy',
        contactPersonDesignation: 'Quality Manager',
        phone: '9876543210',
        email: 'contact@vibrantcolors.com',
        address: 'Salt Lake, Sector V, Kolkata',
        billTo: '',
        status: 'Inactive',
        avatarColor: '#f79009',
        additionalContacts: []
      }
    ];
    this.updateKPIs();
    this.currentSupplier = this.getEmptySupplier();
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

  getEmptySupplier(): Supplier {
    const nextCode = this.generateNextSupplierCode();
    return {
      supplierId:       nextCode,
      supplierCode:     nextCode,
      supplierName:     '',
      unitName:         '',
      materialCategory: 'Reels',
      gstin:            '',
      pan:              '',
      city:             '',
      state:            '',
      pinCode:          '',
      contactPerson:    '',
      contactPersonDesignation: '',
      phone:            '',
      email:            '',
      address:          '',
      billTo:           '',
      status:           'Active',
      avatarColor:      this.getRandomAvatarColor(),
      additionalContacts: []
    };
  }

  generateNextSupplierCode(): string {
    if (!this.suppliers || this.suppliers.length === 0) return 'SUP001';
    const codes = this.suppliers.map(s => {
      const num = parseInt(s.supplierCode.substring(3));
      return isNaN(num) ? 0 : num;
    });
    return 'SUP' + (Math.max(...codes) + 1).toString().padStart(3, '0');
  }

  // ─── Modal controls ────────────────────────────────────────────────────────

  // ─── Contact Person Helpers ────────────────────────────────────────────────
  addAdditionalContact(): void {
    if (!this.currentSupplier.additionalContacts) {
      this.currentSupplier.additionalContacts = [];
    }
    this.currentSupplier.additionalContacts.push({
      name: '',
      designation: '',
      phone: '',
      email: ''
    });
  }

  removeAdditionalContact(index: number): void {
    if (this.currentSupplier.additionalContacts) {
      this.currentSupplier.additionalContacts.splice(index, 1);
    }
  }

  // ─── Modal controls ────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.isEditMode = false;
    this.activeSupplierTab = 'general';
    this.currentSupplier = this.getEmptySupplier();
    this.showSupplierModal = true;
  }

  closeModal(form?: any): void {
    this.showSupplierModal = false;
    this.resetForm(form);
  }

  onModalHide(form?: any): void {
    this.resetForm(form);
  }

  viewSupplierDetails(supplier: Supplier): void {
    this.viewSupplier = { 
      ...supplier,
      additionalContacts: supplier.additionalContacts 
        ? supplier.additionalContacts.map(c => ({ ...c })) 
        : []
    };
    this.showViewModal = true;
  }

  editFromView(): void {
    this.showViewModal = false;
    this.editSupplier(this.viewSupplier);
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  editSupplier(supplier: Supplier): void {
    this.isEditMode = true;
    this.activeSupplierTab = 'general';
    this.currentSupplier = { 
      ...supplier,
      additionalContacts: supplier.additionalContacts 
        ? supplier.additionalContacts.map(c => ({ ...c })) 
        : []
    };
    this.showSupplierModal = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Mode Active',
      detail: `Editing details for ${supplier.supplierName} (${supplier.supplierCode})`
    });
  }

  confirmDelete(event: Event, supplier: Supplier): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${supplier.supplierName} (${supplier.supplierCode})?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => this.deleteSupplier(supplier)
    });
  }

  deleteSupplier(supplier: Supplier): void {
    this.suppliers = this.suppliers.filter(s => s.supplierId !== supplier.supplierId);
    this.updateKPIs();
    this.messageService.add({
      severity: 'success',
      summary: 'Supplier Deleted',
      detail: `${supplier.supplierName} has been removed.`
    });
    if (this.currentSupplier.supplierId === supplier.supplierId) {
      this.resetForm();
    }
  }

  saveSupplier(form?: any): void {
    if (form && form.invalid) {
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please check the form for missing or invalid values.'
      });
      return;
    }

    // Duplicate GSTIN check (Business Rule 2 & 6)
    const duplicate = this.suppliers.find(s =>
      s.gstin === this.currentSupplier.gstin &&
      s.supplierId !== this.currentSupplier.supplierId
    );
    if (duplicate) {
      this.messageService.add({
        severity: 'error',
        summary: 'Duplicate GSTIN',
        detail: `GSTIN ${this.currentSupplier.gstin} is already registered under ${duplicate.supplierName}.`
      });
      return;
    }

    // Prepare API-friendly payload shape: ensure additionalContacts is copy-safe
    const supplierPayload = {
      ...this.currentSupplier,
      additionalContacts: this.currentSupplier.additionalContacts 
        ? this.currentSupplier.additionalContacts.map(c => ({ ...c })) 
        : []
    };

    if (this.isEditMode) {
      const index = this.suppliers.findIndex(s => s.supplierId === this.currentSupplier.supplierId);
      if (index !== -1) {
        this.suppliers[index] = supplierPayload;
        this.messageService.add({
          severity: 'success',
          summary: 'Supplier Updated',
          detail: `${this.currentSupplier.supplierName} has been updated.`
        });
      }
    } else {
      if (this.suppliers.some(s => s.supplierId === this.currentSupplier.supplierId)) {
        const nextCode = this.generateNextSupplierCode();
        this.currentSupplier.supplierId = nextCode;
        this.currentSupplier.supplierCode = nextCode;
        supplierPayload.supplierId = nextCode;
        supplierPayload.supplierCode = nextCode;
      }
      this.suppliers.unshift(supplierPayload);
      this.messageService.add({
        severity: 'success',
        summary: 'Supplier Created',
        detail: `${this.currentSupplier.supplierName} has been created.`
      });
    }

    this.updateKPIs();
    this.closeModal(form);
  }

  resetForm(form?: any): void {
    this.isEditMode = false;
    this.activeSupplierTab = 'general';
    this.currentSupplier = this.getEmptySupplier();
    if (form) form.resetForm(this.currentSupplier);
  }

  updateKPIs(): void {
    this.kpis[0].value = this.suppliers.length;
    this.kpis[1].value = this.suppliers.filter(s => s.status === 'Active').length;
    this.kpis[2].value = new Set(this.suppliers.map(s => s.materialCategory)).size;

    // Top category by supplier count
    if (this.suppliers.length > 0) {
      const counts: Record<string, number> = {};
      this.suppliers.forEach(s => {
        counts[s.materialCategory] = (counts[s.materialCategory] || 0) + 1;
      });
      this.kpis[3].value = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    } else {
      this.kpis[3].value = 'N/A';
    }
  }

  nextTab() {
    const idx = this.supplierTabs.findIndex(t => t.key === this.activeSupplierTab);
    if (idx < this.supplierTabs.length - 1) {
      this.activeSupplierTab = this.supplierTabs[idx + 1].key;
    }
  }

  prevTab() {
    const idx = this.supplierTabs.findIndex(t => t.key === this.activeSupplierTab);
    if (idx > 0) {
      this.activeSupplierTab = this.supplierTabs[idx - 1].key;
    }
  }
}