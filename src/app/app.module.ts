import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { HttpClientModule } from '@angular/common/http'; // <-- IMPORT THIS
import { MainLayoutComponent } from "./layout/main-layout/main-layout.component";
import { HeaderComponent } from "./layout/header/header.component";
import { SidebarComponent } from "./layout/sidebar/sidebar.component";

import { DashboardComponent } from "./pages/dashboard/dashboard.component";
import { DialogModule } from 'primeng/dialog';
import { UsersAndRolesComponent } from "./pages/master/users-and-roles/users-and-roles.component";
import { CustomerMasterComponent } from "./pages/master/customer-master/customer-master.component";
import { SupplierMasterComponent } from "./pages/master/supplier-master/supplier-master.component";
import { ItemPmsMasterComponent } from "./pages/master/item-pms-master/item-pms-master.component";
import { LayerSpecsComponent } from "./pages/master/layer-specs/layer-specs.component";
import{ MachineMasterComponent } from "./pages/machine/machine-master/machine-master.component";

import { CustomerPoComponent } from "./pages/transaction/customer-po/customer-po.component";
import { DailyJobsComponent } from "./pages/transaction/daily-jobs/daily-jobs.component";
import { StockVerificationComponent } from "./pages/transaction/stock-verification/stock-verification.component";
import { ProductionPlanningComponent } from "./pages/transaction/production-planning/production-planning.component";
import { ProductionExecutionComponent } from "./pages/transaction/production-execution/production-execution.component";
import { QcManagementComponent } from "./pages/transaction/qc-management/qc-management.component";
import { FinishedGoodsComponent } from "./pages/transaction/finished-goods/finished-goods.component";
import { DispatchComponent } from "./pages/transaction/dispatch/dispatch.component";

import { ReportsAndDashboardsComponent } from "./pages/reports/reports-and-dashboards/reports-and-dashboards.component";

import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
import { CalendarModule } from 'primeng/calendar';
import { InputSwitchModule } from 'primeng/inputswitch';

import { CardModule } from 'primeng/card';
import { BadgeModule } from 'primeng/badge';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { LoginComponent } from './login/login.component';
import { ModuleLayoutComponent } from './layout/module-layout/module-layout.component';
import { FileUploadModule } from 'primeng/fileupload';
import { EmployeeMasterComponent } from "./pages/master/employee-master/employee-master.component";
import { InvoiceComponent } from './pages/transaction/invoice/invoice.component';
import { PoApprovalsComponent } from './pages/transaction/po-approvals/po-approvals.component';
import { StagewiseQcManagementComponent } from './pages/transaction/stagewise-qc-management/stagewise-qc-management.component';
@NgModule({
  declarations: [
    AppComponent,
    MainLayoutComponent,
    HeaderComponent,
    SidebarComponent,
    DashboardComponent,
    UsersAndRolesComponent,
    CustomerMasterComponent,
    SupplierMasterComponent,
    ItemPmsMasterComponent,
    LayerSpecsComponent,
    MachineMasterComponent,
    CustomerPoComponent,
    DailyJobsComponent,
    StockVerificationComponent,
    ProductionPlanningComponent,
    ProductionExecutionComponent,
    QcManagementComponent,
    FinishedGoodsComponent,
    DispatchComponent,
   EmployeeMasterComponent,
    ReportsAndDashboardsComponent,
         LoginComponent,
         ModuleLayoutComponent,
         InvoiceComponent,
         PoApprovalsComponent,
          StagewiseQcManagementComponent
      
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    TabViewModule,
     CardModule,
    BadgeModule,
    CheckboxModule,
    TooltipModule,
      DialogModule,
    PaginatorModule,
    CalendarModule,
    InputSwitchModule,
    TagModule,
    ConfirmDialogModule ,
    FileUploadModule,
    ToastModule,
    HttpClientModule   // <-- ADD HERE
  ],
  providers: [ConfirmationService, MessageService],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class AppModule {}