export type ApprovalPriority = 'High' | 'Medium' | 'Low';

export interface LineItem {
  itemCode: string;
  description: string;
  pmsRef: string;
  make: string;
  hsnCode: string;
  deliveryDate: string;
  orderedQty: number;
  rate: number;
  igstPercent: number;
  amount: number;
}

export interface PurchaseOrder {
  poNo: string;
  poDate: string;
  customer: string;
  poType: string;
  suppliersRef?: string;
  deliveryTerms?: string;
  paymentTerms?: string;
  buyerGstin?: string;
  buyerPan?: string;
  buyerIec?: string;
  tdsClause?: string;
  buyerCommissionerate?: string;
  buyerDivision?: string;
  buyerRange?: string;
  buyerStateCode?: string;
  buyerStateName?: string;
  customerLocation?: string;
  instructions?: string;
  quantity: number;
  status: string;
  lineItems: LineItem[];
}

export interface ApprovalRequest {
  id: string;             // Request ID shown in the table, e.g. PO No.
  type: string;            // Category tag, e.g. 'Purchase'
  title: string;            // Short title, e.g. 'Customer PO Approval'
  itemLabel: string;        // Sub-line under the title, e.g. customer name
  requestedBy: string;
  requestedOn: string;      // ISO date/time string
  priority: ApprovalPriority;
  dueDate: string;          // ISO date string
  raw?: any;                 // Reference back to the source record (e.g. the PurchaseOrder)
}

export interface ApprovalDecision {
  request: ApprovalRequest;
  remarks: string;
}