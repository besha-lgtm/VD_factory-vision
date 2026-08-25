import { Component, OnInit } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';

interface DispatchRecord {
  dispatchId: string;
  dispatchDate: string;
  poNo: string;
  customer: string;
  itemCode: string;
  fgRefId: string;
  dispatchQty: number | null;
  bundles: number | null;
  vehicleNo: string;
  driverContact: string;
  ewayBill: string;
  status: string;
  remarks: string;
}

@Component({
  selector: 'app-dispatch',
  standalone: false,
  templateUrl: './dispatch.component.html',
  styleUrl: './dispatch.component.css'
})
export class DispatchComponent implements OnInit {
  dispatches: DispatchRecord[] = [];

  customerOptions: string[] = ['Laurus Labs Unit-2', 'Gland Pharma', 'Pidilite'];
  statusOptions: string[] = ['Planned', 'In Transit', 'Closed', 'Cancelled'];
showUserModal = false; // Controls create/edit entry modal wrapper visibility
showViewModal = false; // Controls read-only detailed view popup visibility
viewDispatch: any = {};
  kpis = [
    { label: 'TOTAL DISPATCHES', value: 1, icon: 'pi pi-truck', colorClass: 'blue' },
    { label: 'CLOSED', value: 1, icon: 'pi pi-check-circle', colorClass: 'green' },
    { label: 'IN TRANSIT', value: 0, icon: 'pi pi-send', colorClass: 'purple' },
    { label: 'PLANNED', value: 0, icon: 'pi pi-calendar', colorClass: 'yellow' }
  ];

  isEditMode = false;
  currentDispatch: DispatchRecord = this.getEmptyDispatch();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const today = new Date().toISOString().split('T')[0];
    this.dispatches = [
      {
        dispatchId: 'D-001',
        dispatchDate: today,
        poNo: '1000131605',
        customer: 'Laurus Labs Unit-2',
        itemCode: '2000541',
        fgRefId: 'FG001',
        dispatchQty: 5000,
        bundles: 50,
        vehicleNo: 'AP39WQ2299',
        driverContact: '9876500001',
        ewayBill: 'EWB-123456789',
        status: 'Closed',
        remarks: ''
      }
    ];
    this.updateKPIs();
    this.currentDispatch = this.getEmptyDispatch();
  }

  getEmptyDispatch(): DispatchRecord {
    return {
      dispatchId: this.generateNextDispatchId(),
      dispatchDate: new Date().toISOString().split('T')[0],
      poNo: '',
      customer: 'Laurus Labs Unit-2',
      itemCode: '',
      fgRefId: '',
      dispatchQty: null,
      bundles: null,
      vehicleNo: '',
      driverContact: '',
      ewayBill: '',
      status: 'Planned',
      remarks: ''
    };
  }

  generateNextDispatchId(): string {
    if (!this.dispatches || this.dispatches.length === 0) return 'D-001';
    const ids = this.dispatches.map(d => {
      const parts = d.dispatchId.split('-');
      return parts.length > 1 ? parseInt(parts[1]) || 0 : 0;
    });
    return 'D-' + (Math.max(...ids) + 1).toString().padStart(3, '0');
  }



  confirmDelete(event: Event, dispatch: DispatchRecord): void {
    this.confirmationService.confirm({
      message: `Delete Dispatch ${dispatch.dispatchId} for ${dispatch.customer}?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => this.deleteDispatch(dispatch)
    });
  }

  deleteDispatch(dispatch: DispatchRecord): void {
    this.dispatches = this.dispatches.filter(d => d.dispatchId !== dispatch.dispatchId);
    this.updateKPIs();
    this.messageService.add({
      severity: 'success',
      summary: 'Dispatch Deleted',
      detail: `${dispatch.dispatchId} removed.`
    });
    if (this.currentDispatch.dispatchId === dispatch.dispatchId) this.resetForm();
  }

 
  resetForm(form?: any): void {
    this.isEditMode = false;
    this.currentDispatch = this.getEmptyDispatch();
    if (form) form.resetForm(this.currentDispatch);
  }

  updateKPIs(): void {
    this.kpis[0].value = this.dispatches.length;
    this.kpis[1].value = this.dispatches.filter(d => d.status === 'Closed').length;
    this.kpis[2].value = this.dispatches.filter(d => d.status === 'In Transit').length;
    this.kpis[3].value = this.dispatches.filter(d => d.status === 'Planned').length;
  }
  /** Open modal in Close Dispatch / Create Mode */
openCreateModal(): void {
  this.isEditMode = false;
  this.currentDispatch = this.getEmptyDispatch();
  this.showUserModal = true;
}

/** Open read-only view details popup overlay layout */
viewDispatchDetails(record: any): void {
  this.viewDispatch = { ...record };
  this.showViewModal = true;
}

/** Trigger edit modal immediately from within the active view popup contextual frame */
editFromView(): void {
  this.showViewModal = false;
  this.editDispatch(this.viewDispatch);
}

/** Safely close form structural overlay panels and clean model states */
closeModal(form?: any): void {
  this.showUserModal = false;
  this.resetForm(form);
}

/** Triggers cleanup hooks if the p-dialog frame is dismissed via top corner Close (X) icon */
onModalHide(form?: any): void {
  this.resetForm(form);
}

/** Modify your existing editDispatch to launch directly inside the modal configuration */
editDispatch(record: DispatchRecord): void {
  this.isEditMode = true;
  this.currentDispatch = { ...record };
  this.showUserModal = true; // Displays form dialog panel
  this.messageService.add({
    severity: 'info',
    summary: 'Edit Mode Active',
    detail: `Editing details for Dispatch record ${record.dispatchId}`
  });
}

/** Modify your existing saveDispatch to dismiss modals upon successful completion */
saveDispatch(form?: any): void {
  if (form && form.invalid) {
    Object.keys(form.controls).forEach(key => {
      form.controls[key].markAsTouched();
    });
    this.messageService.add({
      severity: 'error',
      summary: 'Validation Error',
      detail: 'Please review and fill out all mandatory dispatch parameters.'
    });
    return;
  }

  if (this.isEditMode) {
    const index = this.dispatches.findIndex(d => d.dispatchId === this.currentDispatch.dispatchId);
    if (index !== -1) {
      this.dispatches[index] = { ...this.currentDispatch };
      this.messageService.add({ 
        severity: 'success', 
        summary: 'Dispatch Updated', 
        detail: `${this.currentDispatch.dispatchId} parameters have been updated.` 
      });
    }
  } else {
    if (this.dispatches.some(d => d.dispatchId === this.currentDispatch.dispatchId)) {
      this.currentDispatch.dispatchId = this.generateNextDispatchId();
    }
    this.dispatches.unshift({ ...this.currentDispatch });
    this.messageService.add({ 
      severity: 'success', 
      summary: 'Dispatch Created', 
      detail: `${this.currentDispatch.dispatchId} logs closed successfully.` 
    });
  }

  this.updateKPIs();
  this.closeModal(form); // Safely closes the modal frame and clears active forms
}
}
