import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PoDataService } from '../../../services/po-data.service';
import { LineItem, PurchaseOrder } from '../../../models/po.models';

@Component({
  selector: 'app-customer-po',
  standalone: false,
  templateUrl: './customer-po.component.html',
  styleUrls: ['./customer-po.component.css']
})
export class CustomerPoComponent implements OnInit, OnDestroy {
  purchaseOrders: PurchaseOrder[] = [];
  selectedPO: PurchaseOrder | null = null;
  viewingPO: PurchaseOrder | null = null;
  viewingPOTotal = 0;

  showPOModal = false;
  isEditMode = false;

  // Form Templates
  currentPO!: PurchaseOrder;
  newLineItem!: LineItem;

  // Dropdown Domain Reference Sets
  customerOptions: string[] = ['Laurus Labs Limited', 'Aurobindo Pharma', 'Hetero Drugs', 'Dr. Reddy\'s'];
  poTypeOptions: string[] = ['New', 'Amended', 'Supplementary'];

  // Summary KPIs
  kpis = [
    { label: 'Total Ingested Orders', value: '0', icon: 'pi pi-file', colorClass: 'kpi-blue' },
    { label: 'Active Drafts State', value: '0', icon: 'pi pi-pencil', colorClass: 'kpi-amber' },
    { label: 'Aggregate Ledger Quantity', value: '0', icon: 'pi pi-box', colorClass: 'kpi-green' }
  ];

  private sub = new Subscription();

  constructor(
    private poDataService: PoDataService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.resetFormState();

    // First visit: seed the shared service with mock data.
    // Every visit after that just reads whatever is already there.
    if (this.poDataService.purchaseOrders.length === 0) {
      this.loadMockPurchaseOrders();
    }

    this.sub.add(
      this.poDataService.purchaseOrders$.subscribe(list => {
        this.purchaseOrders = list;
        this.recomputeKpis();
        this.maybeOpenRequestedPO();
      })
    );
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  // If Approvals sent us here with ?po=<poNo> (from "view" on a request),
  // pop that PO's detail viewer open automatically.
  private requestedPoNo: string | null = null;
  private hasOpenedRequestedPO = false;

  private maybeOpenRequestedPO(): void {
    if (this.requestedPoNo === null) {
      this.requestedPoNo = this.route.snapshot.queryParamMap.get('po');
    }
    if (!this.requestedPoNo || this.hasOpenedRequestedPO) return;
    const match = this.purchaseOrders.find(p => p.poNo === this.requestedPoNo);
    if (match) {
      this.viewPOLines(match);
      this.hasOpenedRequestedPO = true;
    }
  }

  resetFormState() {
    this.currentPO = {
      poNo: '',
      poDate: new Date().toISOString().split('T')[0],
      customer: '',
      poType: 'New',
      suppliersRef: 'EMAIL QUOTE',
      deliveryTerms: 'FOR - Inclusive FOR Vizag',
      paymentTerms: '45 days credit from date of GRN',
      buyerGstin: '37AAAAA0000A1Z0',
      buyerPan: 'AAAAA0000A',
      buyerIec: '0500011122',
      tdsClause: 'TDS applicable as per 194Q',
      buyerCommissionerate: 'NA-SEZ UNIT',
      buyerDivision: 'NA-SEZ UNIT',
      buyerRange: 'NA-SEZ UNIT',
      buyerStateCode: '37',
      buyerStateName: 'Andhra Pradesh',
      customerLocation: '',
      instructions: '',
      quantity: 0,
      status: 'Pending', // Defaults to 'Pending' so it goes to approvals immediately
      lineItems: []
    };
    this.resetLineItemInput();
  }

  resetLineItemInput() {
    this.newLineItem = {
      itemCode: '',
      description: '',
      pmsRef: '',
      make: '',
      hsnCode: '',
      deliveryDate: '',
      orderedQty: 0,
      rate: 0,
      igstPercent: 0,
      amount: 0
    };
  }

  loadMockPurchaseOrders() {
    this.poDataService.setPurchaseOrders([
      {
        poNo: '1000131998',
        poDate: '2026-04-08',
        customer: 'Laurus Labs Limited',
        poType: 'New',
        suppliersRef: 'EMAIL QUOTE',
        deliveryTerms: 'FOR - Inclusive FOR Vizag',
        paymentTerms: '45 days credit from date of GRN',
        buyerGstin: '37AASCS9881L2Z2',
        buyerPan: 'AASCS9881L',
        buyerIec: '0501102948',
        tdsClause: 'TDS applicable as per 194Q of IT Act',
        buyerCommissionerate: 'NA-SEZ UNIT',
        buyerDivision: 'NA-SEZ UNIT',
        buyerRange: 'NA-SEZ UNIT',
        buyerStateCode: '37',
        buyerStateName: 'Andhra Pradesh',
        customerLocation: 'Laurus Labs Limited-Unit 2, Plot 19,20 & 21 Western Sector, APSEZ Atchutapuram, Visakhapatnam',
        quantity: 4650,
        status: 'Pending', // Set to 'Pending' so it immediately shows up in approvals!
        lineItems: [
          { itemCode: '2000289', description: '5 Ply Shipper (410x215x225) mm', pmsRef: 'PMS/202 VER. 0.0', make: 'VISIPAK PVT LTD', hsnCode: '48191010', deliveryDate: '2026-04-20', orderedQty: 500, rate: 45.00, igstPercent: 0, amount: 22500 }
        ]
      }
    ]);
  }

  private recomputeKpis(): void {
    const activeDrafts = this.purchaseOrders.filter(p => p.status === 'Draft').length;
    const totalQty = this.purchaseOrders.reduce((acc, curr) => acc + (curr.quantity || 0), 0);

    this.kpis = [
      { label: 'Total Ingested Orders', value: this.purchaseOrders.length.toString(), icon: 'pi pi-file', colorClass: 'kpi-blue' },
      { label: 'Active Drafts State', value: activeDrafts.toString(), icon: 'pi pi-pencil', colorClass: 'kpi-amber' },
      { label: 'Aggregate Ledger Quantity', value: totalQty.toLocaleString('en-IN'), icon: 'pi pi-box', colorClass: 'kpi-green' }
    ];
  }

  // ─────────────────────────────────────────────────────────────
  // CRUD & LEDGER FUNCTIONALITIES
  // ─────────────────────────────────────────────────────────────
  calculateLineAmount() {
    this.newLineItem.amount = (this.newLineItem.orderedQty || 0) * (this.newLineItem.rate || 0);
  }

  addLineItem() {
    if (!this.newLineItem.itemCode || !this.newLineItem.orderedQty || !this.newLineItem.deliveryDate) {
      alert('Please fill out Item Code, Quantity, and Delivery Date before committing lines.');
      return;
    }
    this.currentPO.lineItems.push({ ...this.newLineItem });
    this.recalculatePOTotals();
    this.resetLineItemInput();
  }

  removeLineItem(index: number) {
    this.currentPO.lineItems.splice(index, 1);
    this.recalculatePOTotals();
  }

  recalculatePOTotals() {
    this.currentPO.quantity = this.currentPO.lineItems.reduce((acc, curr) => acc + (curr.orderedQty || 0), 0);
  }

  openCreateModal() {
    this.isEditMode = false;
    this.resetFormState();
    this.showPOModal = true;
  }

  editPO(po: PurchaseOrder) {
    this.isEditMode = true;
    this.currentPO = JSON.parse(JSON.stringify(po));
    this.showPOModal = true;
  }

  confirmDeletePO(event: Event, po: PurchaseOrder) {
    if (confirm(`Are you sure you want to delete PO ${po.poNo}?`)) {
      this.poDataService.removePurchaseOrder(po.poNo);
      if (this.viewingPO?.poNo === po.poNo) this.closePOViewer();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SAVE + REDIRECT TO APPROVALS
  // ─────────────────────────────────────────────────────────────
  savePODraft(form: NgForm) {
    if (form.invalid) return;

    if (this.isEditMode) {
      this.poDataService.updatePurchaseOrder({ ...this.currentPO });
      this.showPOModal = false;
      return;
    }

    // New PO ingestion puts it into a "Pending" state, then routes
    // the user straight to the Approvals screen to review it.
    this.currentPO.status = 'Pending';
    this.poDataService.addPurchaseOrder({ ...this.currentPO });
    this.showPOModal = false;
    this.router.navigate(['/transaction/po-approval']);
  }

  viewPOLines(po: PurchaseOrder) {
    this.viewingPO = po;
    this.viewingPOTotal = po.lineItems.reduce((acc, curr) => acc + curr.amount, 0);
  }

  closePOViewer() {
    this.viewingPO = null;
  }

  closeModal() {
    this.showPOModal = false;
  }

  getStatusClass(status: string): string {
    return 'po-status-' + (status || 'draft').toLowerCase();
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Released': return 'pi pi-check-circle';
      case 'Closed': return 'pi pi-times-circle';
      case 'Pending': return 'pi pi-exclamation-triangle';
      default: return 'pi pi-file';
    }
  }
}