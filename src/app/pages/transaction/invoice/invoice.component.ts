import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

export interface InvoiceMasterRecord {
  // PO Identification
  poNumber: string;
  poDate: string;
  poType: string;
  poReceiptChannel: string;
  dateOfReceipt: string;         // auto system timestamp
  // Client
  clientName: string;
  clientGstin: string;
  // Item & Financial
  itemCode: string;
  hsnCode: string;
  itemDescription: string;
  orderedQty: number | null;
  unitOfMeasure: string;
  rate: number | null;
  paymentTerms: string;
  // Logistics
  requiredDeliveryDate: string;
  deliveryTerms: string;
  dispatchSchedule: string;
  shipToAddress: string;
  billToAddress: string;
  pmsReference: string;
  // Status & Invoicing
  poStatus: string;
  visipakInvoiceNo: string;
  specialInstructions: string;
}

@Component({
  selector: 'app-invoice',
  standalone: false,
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.css',
  providers: [MessageService, ConfirmationService]
})
export class InvoiceComponent implements OnInit {

  // Must be first — used by avatar helpers at field-init time
  private avatarColorMap: Record<string, string> = {};
  private avatarPalette = ['#2e90fa','#7a5af8','#12b76a','#f79009','#f04438','#0794ad','#ee46bc','#16b364'];

  invoices: InvoiceMasterRecord[] = [];
  filteredInvoices: InvoiceMasterRecord[] = [];
  activeStatusFilter = 'All';

  showFormModal = false;
  showViewModal = false;
  isEditMode = false;
  isProcessing = false;

  currentInvoice: InvoiceMasterRecord = this.getEmptyRecord();
  viewInvoice: InvoiceMasterRecord | null = null;

  clientOptions: string[] = [
    'Laurus Labs Unit-2',
    'Gland Pharma',
    'Pidilite',
    'Dodla Dairy',
    'Amore Rusk'
  ];

  poStatusOptions: string[] = [
    'Received',
    'Pending PMS',
    'Pending Spec Entry',
    'Released to Planning',
    'Closed'
  ];

  kpis = [
    { label: 'TOTAL POs',         value: 0,       icon: 'pi pi-file',          colorClass: 'blue'   },
    { label: 'FINANCIAL VALUE',   value: '₹0.00', icon: 'pi pi-indian-rupee',  colorClass: 'purple' },
    { label: 'PENDING BILLING',   value: 0,       icon: 'pi pi-clock',         colorClass: 'yellow' },
    { label: 'INVOICED',          value: 0,       icon: 'pi pi-check-circle',  colorClass: 'green'  }
  ];

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.invoices = [
      {
        poNumber: '1000131605',
        poDate: '2026-03-13',
        poType: 'New',
        poReceiptChannel: 'Email',
        dateOfReceipt: '2026-03-13 09:42',
        clientName: 'Laurus Labs Unit-2',
        clientGstin: '37AABCL1170C2ZZ',
        itemCode: '2000541',
        hsnCode: '48191010',
        itemDescription: '5 PLY SHIPPER (475 × 245 × 270 MM)',
        orderedQty: 5000,
        unitOfMeasure: 'NOS',
        rate: 42.50,
        paymentTerms: 'Net 45',
        requiredDeliveryDate: '2026-07-10',
        deliveryTerms: 'FOR Destination',
        dispatchSchedule: '10-Jul-26 / 5000 NOS',
        shipToAddress: 'Unit-2, Plot No 19, 20 and 21, Apsez, Gurajapalem Village, Anakapalli',
        billToAddress: 'Laurus Labs Ltd, 2nd Floor, Serene Chambers, Road No 7, Banjara Hills, Hyderabad - 500034',
        pmsReference: 'PMS/284',
        poStatus: 'Released to Planning',
        visipakInvoiceNo: '',
        specialInstructions: ''
      },
      {
        poNumber: '1000131830',
        poDate: '2026-03-27',
        poType: 'Repeat',
        poReceiptChannel: 'Email',
        dateOfReceipt: '2026-03-27 11:15',
        clientName: 'Pidilite',
        clientGstin: '27AAACP0541B1Z9',
        itemCode: '2001787',
        hsnCode: '48191010',
        itemDescription: '3PLY BOX (Roof Seal 6×1L)',
        orderedQty: 12000,
        unitOfMeasure: 'NOS',
        rate: 14.80,
        paymentTerms: 'Net 30',
        requiredDeliveryDate: '2026-06-25',
        deliveryTerms: 'FOR Vizag',
        dispatchSchedule: '25-Jun-26 / 12000 NOS',
        shipToAddress: 'Pidilite Industries, Plot No. 43, Sarigamam Industrial Estate, Silvassa',
        billToAddress: 'Same as Ship-To',
        pmsReference: 'PMS/311',
        poStatus: 'Closed',
        visipakInvoiceNo: 'VISI/26-27/179',
        specialInstructions: ''
      }
    ];
    this.filteredInvoices = [...this.invoices];
    this.updateKPIs();
  }

  // ─── Helpers ────────────────────────────────────────────────────────────

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }

  getAvatarColor(name: string): string {
    if (!this.avatarColorMap[name]) {
      const idx = Object.keys(this.avatarColorMap).length % this.avatarPalette.length;
      this.avatarColorMap[name] = this.avatarPalette[idx];
    }
    return this.avatarColorMap[name];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Closed':
      case 'Released to Planning': return 'status-active';
      case 'Received':
      case 'Pending PMS':
      case 'Pending Spec Entry':   return 'status-badge-warn';
      default:                     return 'status-inactive';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Closed':               return 'pi pi-check-circle';
      case 'Released to Planning': return 'pi pi-send';
      case 'Received':             return 'pi pi-inbox';
      case 'Pending PMS':          return 'pi pi-file-edit';
      case 'Pending Spec Entry':   return 'pi pi-pencil';
      default:                     return 'pi pi-clock';
    }
  }

  // ─── Filtering ──────────────────────────────────────────────────────────

  filterByStatus(status: string): void {
    this.activeStatusFilter = status;
    this.filteredInvoices = status === 'All'
      ? [...this.invoices]
      : this.invoices.filter(i => i.poStatus === status);
  }

  // ─── Modal controls ─────────────────────────────────────────────────────

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentInvoice = this.getEmptyRecord();
    this.showFormModal = true;
  }

  openEditModal(record: InvoiceMasterRecord): void {
    this.isEditMode = true;
    this.currentInvoice = { ...record };
    this.showFormModal = true;
  }

  openViewModal(record: InvoiceMasterRecord): void {
    this.viewInvoice = record;
    this.showViewModal = true;
  }

  // ─── CRUD ───────────────────────────────────────────────────────────────

  saveInvoiceRecord(form: NgForm): void {
    if (form.invalid) {
      Object.values(form.controls).forEach(c => c.markAsTouched());
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please fill all mandatory fields before saving.'
      });
      return;
    }

    this.isProcessing = true;
    setTimeout(() => {
      if (this.isEditMode) {
        const idx = this.invoices.findIndex(i => i.poNumber === this.currentInvoice.poNumber);
        if (idx !== -1) {
          this.invoices[idx] = { ...this.currentInvoice };
          this.messageService.add({ severity: 'success', summary: 'PO Updated', detail: `${this.currentInvoice.poNumber} has been updated.` });
        }
      } else {
        if (this.invoices.some(i => i.poNumber === this.currentInvoice.poNumber)) {
          this.messageService.add({ severity: 'error', summary: 'Duplicate PO', detail: 'A record with this PO Number already exists.' });
          this.isProcessing = false;
          return;
        }
        // Auto-set receipt timestamp
        this.currentInvoice.dateOfReceipt = new Date().toLocaleString('en-IN');
        this.invoices.unshift({ ...this.currentInvoice });
        this.messageService.add({ severity: 'success', summary: 'PO Saved', detail: `${this.currentInvoice.poNumber} has been logged.` });
      }

      this.filterByStatus(this.activeStatusFilter);
      this.updateKPIs();
      this.isProcessing = false;
      this.showFormModal = false;
    }, 350);
  }

  deleteRecord(record: InvoiceMasterRecord): void {
    this.confirmationService.confirm({
      message: `Delete PO record ${record.poNumber} for ${record.clientName}? This action cannot be undone.`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => {
        this.invoices = this.invoices.filter(i => i.poNumber !== record.poNumber);
        this.filterByStatus(this.activeStatusFilter);
        this.updateKPIs();
        this.messageService.add({ severity: 'success', summary: 'PO Deleted', detail: `${record.poNumber} has been removed.` });
      }
    });
  }

  updateKPIs(): void {
    let totalValue = 0;
    let pendingCount = 0;
    let invoicedCount = 0;

    this.invoices.forEach(i => {
      totalValue += (i.orderedQty || 0) * (i.rate || 0);
      if (i.poStatus !== 'Closed') pendingCount++;
      if (i.visipakInvoiceNo) invoicedCount++;
    });

    this.kpis[0].value = this.invoices.length;
    this.kpis[1].value = '₹' + totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    this.kpis[2].value = pendingCount;
    this.kpis[3].value = invoicedCount;
  }

  private getEmptyRecord(): InvoiceMasterRecord {
    return {
      poNumber: '',
      poDate: new Date().toISOString().split('T')[0],
      poType: 'New',
      poReceiptChannel: 'Email',
      dateOfReceipt: '',
      clientName: '',
      clientGstin: '',
      itemCode: '',
      hsnCode: '',
      itemDescription: '',
      orderedQty: null,
      unitOfMeasure: 'NOS',
      rate: null,
      paymentTerms: 'Net 30',
      requiredDeliveryDate: '',
      deliveryTerms: 'FOR Destination',
      dispatchSchedule: '',
      shipToAddress: '',
      billToAddress: '',
      pmsReference: '',
      poStatus: 'Received',
      visipakInvoiceNo: '',
      specialInstructions: ''
    };
  }
  printInvoiceSheet(): void {
    window.print();
  }
}