import { Component, OnInit } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';

interface AdditionalContact {
  name: string;
  designation: string;
  phone: string;
  email: string;
}

interface Customer {
  customerId: string;
  companyName: string;
  unitName: string;
  gstin: string;
  pan: string;
  city: string;
  state: string;
  pinCode: string;
  email: string;
  contactPerson: string;
  contactPersonDesignation: string; // New Field
  phone: string;
  altPhone?: string;
  billTo: string;
  shipTo: string;
  status: string;
  avatarColor?: string;
  additionalContacts: AdditionalContact[]; // New Field
}

@Component({
  selector: 'app-customer-master',
  standalone: false,
  templateUrl: './customer-master.component.html',
  styleUrl: './customer-master.component.css'
})
export class CustomerMasterComponent implements OnInit {

  // Must be declared first — used by getEmptyCustomer() which runs at field-init time
  private avatarColors = [
    '#2e90fa', '#7a5af8', '#12b76a', '#f79009',
    '#f04438', '#0794ad', '#ee46bc', '#16b364'
  ];

  customers: Customer[] = [];

  showCustomerModal = false;
  showViewModal = false;
  viewCustomer: Customer = this.getEmptyCustomer();

  // Tab definitions
  activeCustomerTab = 'general';
  customerTabs = [
    { key: 'general', label: 'General Details', icon: 'pi pi-info-circle' },
    { key: 'contacts', label: 'Additional Contacts', icon: 'pi pi-users' }
  ];

  kpis = [
    { label: 'TOTAL CUSTOMERS', value: 2, icon: 'pi pi-building',    colorClass: 'blue'   },
    { label: 'ACTIVE',          value: 2, icon: 'pi pi-check-circle', colorClass: 'green'  },
    { label: 'UNITS',           value: 3, icon: 'pi pi-sitemap',      colorClass: 'purple' },
    { label: 'INACTIVE',        value: 0, icon: 'pi pi-ban',          colorClass: 'yellow' }
  ];

  isEditMode = false;
  currentCustomer: Customer = this.getEmptyCustomer();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.customers = [
      {
        customerId: 'C001',
        companyName: 'Laurus Labs',
        unitName: 'Parawada Unit-2',
        gstin: '37AACCH...',
        pan: 'AACCH1234A',
        city: 'Vizag',
        state: 'Andhra Pradesh',
        pinCode: '531021',
        email: 'ramesh@lauruslabs.com',
        contactPerson: 'Ramesh Kumar',
        contactPersonDesignation: 'Procurement Manager',
        phone: '9876543210',
        billTo: 'Plot No. 5, Parawada Industrial Area, Vizag, AP - 531021',
        shipTo: 'Plot No. 5, Parawada Industrial Area, Vizag, AP - 531021',
        status: 'Active',
        avatarColor: '#2e90fa',
        additionalContacts: [
          { name: 'K. Srinivasa Rao', designation: 'Store In-charge', phone: '9876543220', email: 'ksrao@lauruslabs.com' }
        ]
      },
      {
        customerId: 'C002',
        companyName: 'Gland Pharma',
        unitName: 'Unit-1',
        gstin: '37AABCG...',
        pan: 'AABCG5678B',
        city: 'Vizag',
        state: 'Andhra Pradesh',
        pinCode: '502307',
        email: 'suresh@glandpharma.com',
        contactPerson: 'Suresh Reddy',
        contactPersonDesignation: 'QC Incharge',
        phone: '9876543211',
        billTo: 'Survey No. 143, IDA Pashamylaram, Vizag, AP - 502307',
        shipTo: 'Survey No. 143, IDA Pashamylaram, Vizag, AP - 502307',
        status: 'Active',
        avatarColor: '#12b76a',
        additionalContacts: []
      }
    ];
    this.updateKPIs();
    this.currentCustomer = this.getEmptyCustomer();
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

  getEmptyCustomer(): Customer {
    return {
      customerId:    this.generateNextCustomerId(),
      companyName:   '',
      unitName:      '',
      gstin:         '',
      pan:           '',
      city:          '',
      state:         '',
      pinCode:       '',
      email:         '',
      contactPerson: '',
      contactPersonDesignation: '',
      phone:         '',
      altPhone:      '',
      billTo:        '',
      shipTo:        '',
      status:        'Active',
      avatarColor:   this.getRandomAvatarColor(),
      additionalContacts: []
    };
  }

  generateNextCustomerId(): string {
    if (!this.customers || this.customers.length === 0) return 'C001';
    const ids = this.customers.map(c => {
      const num = parseInt(c.customerId.substring(1));
      return isNaN(num) ? 0 : num;
    });
    return 'C' + (Math.max(...ids) + 1).toString().padStart(3, '0');
  }

  // ─── Modal controls ────────────────────────────────────────────────────────

  // ─── Contact Person Helpers ────────────────────────────────────────────────
  addAdditionalContact(): void {
    if (!this.currentCustomer.additionalContacts) {
      this.currentCustomer.additionalContacts = [];
    }
    this.currentCustomer.additionalContacts.push({
      name: '',
      designation: '',
      phone: '',
      email: ''
    });
  }

  removeAdditionalContact(index: number): void {
    if (this.currentCustomer.additionalContacts) {
      this.currentCustomer.additionalContacts.splice(index, 1);
    }
  }

  // ─── Modal controls ────────────────────────────────────────────────────────

  openCreateModal(): void {
    this.isEditMode = false;
    this.activeCustomerTab = 'general';
    this.currentCustomer = this.getEmptyCustomer();
    this.showCustomerModal = true;
  }

  closeModal(form?: any): void {
    this.showCustomerModal = false;
    this.resetForm(form);
  }

  onModalHide(form?: any): void {
    this.resetForm(form);
  }

  viewCustomerDetails(customer: Customer): void {
    this.viewCustomer = { 
      ...customer,
      additionalContacts: customer.additionalContacts 
        ? customer.additionalContacts.map(c => ({ ...c })) 
        : []
    };
    this.showViewModal = true;
  }

  editFromView(): void {
    this.showViewModal = false;
    this.editCustomer(this.viewCustomer);
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  editCustomer(customer: Customer): void {
    this.isEditMode = true;
    this.activeCustomerTab = 'general';
    this.currentCustomer = { 
      ...customer,
      additionalContacts: customer.additionalContacts 
        ? customer.additionalContacts.map(c => ({ ...c })) 
        : []
    };
    this.showCustomerModal = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Mode Active',
      detail: `Editing ${customer.companyName} (${customer.customerId})`
    });
  }

  confirmDelete(event: Event, customer: Customer): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${customer.companyName} – ${customer.unitName} (${customer.customerId})?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => this.deleteCustomer(customer)
    });
  }

  deleteCustomer(customer: Customer): void {
    this.customers = this.customers.filter(c => c.customerId !== customer.customerId);
    this.updateKPIs();
    this.messageService.add({
      severity: 'success',
      summary: 'Customer Deleted',
      detail: `${customer.companyName} has been removed.`
    });
    if (this.currentCustomer.customerId === customer.customerId) {
      this.resetForm();
    }
  }

  saveCustomer(form?: any): void {
    if (form && form.invalid) {
      Object.keys(form.controls).forEach(key => form.controls[key].markAsTouched());
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please check the form for missing or invalid values.'
      });
      return;
    }

    // Prepare API-friendly payload shape: ensure additionalContacts is copy-safe
    const customerPayload = {
      ...this.currentCustomer,
      additionalContacts: this.currentCustomer.additionalContacts 
        ? this.currentCustomer.additionalContacts.map(c => ({ ...c })) 
        : []
    };

    if (this.isEditMode) {
      const index = this.customers.findIndex(c => c.customerId === this.currentCustomer.customerId);
      if (index !== -1) {
        this.customers[index] = customerPayload;
        this.messageService.add({
          severity: 'success',
          summary: 'Customer Updated',
          detail: `${this.currentCustomer.companyName} has been updated.`
        });
      }
    } else {
      if (this.customers.some(c => c.customerId === this.currentCustomer.customerId)) {
        this.currentCustomer.customerId = this.generateNextCustomerId();
        customerPayload.customerId = this.currentCustomer.customerId;
      }
      this.customers.unshift(customerPayload);
      this.messageService.add({
        severity: 'success',
        summary: 'Customer Created',
        detail: `${this.currentCustomer.companyName} has been created.`
      });
    }

    this.updateKPIs();
    this.closeModal(form);
  }

  resetForm(form?: any): void {
    this.isEditMode = false;
    this.activeCustomerTab = 'general';
    this.currentCustomer = this.getEmptyCustomer();
    if (form) form.resetForm(this.currentCustomer);
  }

  updateKPIs(): void {
    this.kpis[0].value = this.customers.length;
    this.kpis[1].value = this.customers.filter(c => c.status === 'Active').length;
    this.kpis[2].value = new Set(this.customers.map(c => c.unitName)).size;
    this.kpis[3].value = this.customers.filter(c => c.status === 'Inactive').length;
  }

  nextTab() {
    const idx = this.customerTabs.findIndex(t => t.key === this.activeCustomerTab);
    if (idx < this.customerTabs.length - 1) {
      this.activeCustomerTab = this.customerTabs[idx + 1].key;
    }
  }

  prevTab() {
    const idx = this.customerTabs.findIndex(t => t.key === this.activeCustomerTab);
    if (idx > 0) {
      this.activeCustomerTab = this.customerTabs[idx - 1].key;
    }
  }
}