import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

interface SecuritySettings {
  mfaEnabled: boolean;
  authMethod: string; // 'Password Only', 'Password + Email OTP', 'Password + SMS OTP', 'SSO'
}

interface ModulePermissions {
  // Masters
  employeeMaster: boolean;
  customerMaster: boolean;
  supplierMaster: boolean;
  itemPmsMaster: boolean;
  layerSpecs: boolean;
  usersAndRoles: boolean;
  // Transactions
  customerPo: boolean;
  dailyJobs: boolean;
  productionPlanning: boolean;
  productionExecution: boolean;
  qcManagement: boolean;
  finishedGoods: boolean;
  stockVerification: boolean;
  dispatch: boolean;
  invoice: boolean;
  // Reports
  dashboard: boolean;
  reportsAndAnalytics: boolean;
}

interface User {
  userId: string;
  employeeCode: string;      // EMP001
  employeeName: string;
  email: string;
  mobileNo: string;
  department: string;
  designation: string;
  reportingManager: string;
  role: string;
  status: string;
  avatarColor?: string;
  security: SecuritySettings;
  permissions: ModulePermissions;
}

@Component({
  selector: 'app-users-and-roles',
  standalone: false,
  templateUrl: './users-and-roles.component.html',
  styleUrl: './users-and-roles.component.css'
})
export class UsersAndRolesComponent implements OnInit {
  @ViewChild('userForm') userForm!: NgForm;
  users: User[] = [];
  filteredUsers: User[] = [];
  activeDeptFilter = 'All';

  // Controls modal visibility
  showUserModal = false;
  
  // Tab configuration
  formTabs = [
    { key: 'profile', label: 'User Profile', icon: 'pi pi-user' },
    { key: 'security', label: 'Security & Access', icon: 'pi pi-shield' },
    { key: 'permissions', label: 'Permissions', icon: 'pi pi-lock' }
  ];
  activeFormTab = 'profile';
  activeViewTab = 'profile';

  // Dropdown Options
  roles: string[] = [
    'A/C Team',
    'Production Supervisor',
    'QC',
    'Store In-charge',
    'Others'
  ];
  
  departments: string[] = [
    'Accounts',
    'Production',
    'QC',
    'Stores',
    'Others'
  ];

  deptFilterOptions = ['All', 'Accounts', 'Production', 'QC', 'Stores', 'Others'];

  authMethodOptions = [
    'Password Only',
    'Password + Email OTP',
    'Password + SMS OTP',
    'SSO'
  ];


  kpis = [
    { label: 'TOTAL USERS', value: 2, icon: 'pi pi-user', colorClass: 'blue' },
    { label: 'ROLES', value: 2, icon: 'pi pi-shield', colorClass: 'purple' },
    { label: 'APPROVALS', value: 1, icon: 'pi pi-check-circle', colorClass: 'green' },
    { label: 'PENDING ACCESS', value: 0, icon: 'pi pi-lock', colorClass: 'yellow' }
  ];

  private avatarColors = [
    '#2e90fa', '#7a5af8', '#12b76a', '#f79009',
    '#f04438', '#0794ad', '#ee46bc', '#16b364'
  ];

  isEditMode = false;
  currentUser: User = this.getEmptyUser();

  showViewModal = false;
  viewUser: User = this.getEmptyUser();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.users = [
      { 
        userId: 'U001', 
        employeeCode: 'EMP001', 
        employeeName: 'Suresh', 
        email: 'suresh@company.com', 
        mobileNo: '9876543210', 
        department: 'Production', 
        designation: 'Production Supervisor', 
        reportingManager: 'Plant Manager', 
        role: 'Production Supervisor', 
        status: 'Active',
        avatarColor: '#2e90fa',
        security: {
          mfaEnabled: true,
          authMethod: 'Password + Email OTP'
        },
        permissions: {
          employeeMaster: true,
          customerMaster: false,
          supplierMaster: false,
          itemPmsMaster: true,
          layerSpecs: true,
          usersAndRoles: false,
          customerPo: true,
          dailyJobs: true,
          productionPlanning: true,
          productionExecution: true,
          qcManagement: true,
          finishedGoods: true,
          stockVerification: true,
          dispatch: true,
          invoice: true,
          dashboard: true,
          reportsAndAnalytics: true
        }
      },
      { 
        userId: 'U002', 
        employeeCode: 'EMP002', 
        employeeName: 'QC User', 
        email: 'qc@company.com', 
        mobileNo: '9876543211', 
        department: 'QC', 
        designation: 'QC Analyst', 
        reportingManager: 'QC Incharge', 
        role: 'QC', 
        status: 'Active',
        avatarColor: '#12b76a',
        security: {
          mfaEnabled: false,
          authMethod: 'Password Only'
        },
        permissions: {
          employeeMaster: false,
          customerMaster: false,
          supplierMaster: false,
          itemPmsMaster: false,
          layerSpecs: false,
          usersAndRoles: false,
          customerPo: false,
          dailyJobs: false,
          productionPlanning: false,
          productionExecution: false,
          qcManagement: true,
          finishedGoods: false,
          stockVerification: false,
          dispatch: false,
          invoice: false,
          dashboard: true,
          reportsAndAnalytics: true
        }
      }
    ];
    this.filteredUsers = [...this.users];
    this.filterByDept(this.activeDeptFilter);
    this.updateKPIs();
    this.currentUser = this.getEmptyUser();
  }

  viewUserDetails(user: User): void {
    this.viewUser = { 
      ...user, 
      security: { ...user.security }, 
      permissions: { ...user.permissions } 
    };
    this.activeViewTab = 'profile';
    this.showViewModal = true;
  }

  editFromView(): void {
    this.showViewModal = false;
    this.editUser(this.viewUser);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }

  filterByDept(dept: string): void {
    this.activeDeptFilter = dept;
    this.filteredUsers = dept === 'All'
      ? [...this.users]
      : this.users.filter(u => u.department === dept);
  }

  switchFormTab(key: string): void {
    this.activeFormTab = key;
  }

  nextTab(): void {
    const idx = this.formTabs.findIndex(t => t.key === this.activeFormTab);
    if (idx < this.formTabs.length - 1) this.activeFormTab = this.formTabs[idx + 1].key;
  }

  prevTab(): void {
    const idx = this.formTabs.findIndex(t => t.key === this.activeFormTab);
    if (idx > 0) this.activeFormTab = this.formTabs[idx - 1].key;
  }

  /** Open modal in Create mode */
  openCreateModal(): void {
    this.isEditMode = false;
    this.activeFormTab = 'profile';
    this.currentUser = this.getEmptyUser();
    this.showUserModal = true;
  }

  /** Close modal and reset form */
  closeModal(form?: any): void {
    this.showUserModal = false;
    this.resetForm(form);
  }

  /** Called when the p-dialog overlay is dismissed via X button */
  onModalHide(form?: any): void {
    this.resetForm(form);
  }

  getEmptyUser(): User {
    return {
      userId: this.generateNextUserId(),
      employeeCode: '',
      employeeName: '',
      email: '',
      mobileNo: '',
      department: 'Production',
      designation: '',
      reportingManager: '',
      role: 'Production Supervisor',
      status: 'Active',
      avatarColor: this.getRandomAvatarColor(),
      security: {
        mfaEnabled: false,
        authMethod: 'Password Only'
      },
      permissions: {
        employeeMaster: false,
        customerMaster: false,
        supplierMaster: false,
        itemPmsMaster: false,
        layerSpecs: false,
        usersAndRoles: false,
        customerPo: false,
        dailyJobs: false,
        productionPlanning: false,
        productionExecution: false,
        qcManagement: false,
        finishedGoods: false,
        stockVerification: false,
        dispatch: false,
        invoice: false,
        dashboard: true,
        reportsAndAnalytics: false
      }
    };
  }

  getRandomAvatarColor(): string {
    return this.avatarColors[
      Math.floor(Math.random() * this.avatarColors.length)
    ];
  }

  generateNextUserId(): string {
    if (!this.users || this.users.length === 0) return 'U001';
    const ids = this.users.map(u => {
      const num = parseInt(u.userId.substring(1));
      return isNaN(num) ? 0 : num;
    });
    const maxId = Math.max(...ids);
    const nextNum = maxId + 1;
    return 'U' + nextNum.toString().padStart(3, '0');
  }

  editUser(user: User): void {
    this.isEditMode = true;
    this.activeFormTab = 'profile';
    this.currentUser = { 
      ...user, 
      security: { ...user.security }, 
      permissions: { ...user.permissions } 
    };
    this.showUserModal = true;
    this.messageService.add({
      severity: 'info',
      summary: 'Edit Mode Active',
      detail: `Editing details for user ${user.userId}`
    });
  }

  confirmDelete(event: Event, user: User): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete ${user.employeeName} (${user.userId})?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => {
        this.deleteUser(user);
      }
    });
  }

  deleteUser(user: User): void {
    this.users = this.users.filter(u => u.userId !== user.userId);
    this.filterByDept(this.activeDeptFilter);
    this.updateKPIs();
    this.messageService.add({
      severity: 'success',
      summary: 'User Deleted',
      detail: `${user.employeeName} has been deleted successfully.`
    });
    if (this.currentUser.userId === user.userId) {
      this.resetForm();
    }
  }

  saveUser(form?: any): void {
    const f = form || this.userForm;
    if (f && f.invalid) {
      Object.keys(f.controls).forEach(key => {
        f.controls[key].markAsTouched();
      });
      this.activeFormTab = 'profile';
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please check the form for invalid or missing values.'
      });
      return;
    }

    if (!this.currentUser.employeeCode || !this.currentUser.employeeName || !this.currentUser.email) {
      this.activeFormTab = 'profile';
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Employee Code, Employee Name and Email are required fields.'
      });
      return;
    }

    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailPattern.test(this.currentUser.email)) {
      this.activeFormTab = 'profile';
      this.messageService.add({
        severity: 'error',
        summary: 'Validation Error',
        detail: 'Please enter a valid email address.'
      });
      return;
    }

    if (this.isEditMode) {
      const index = this.users.findIndex(u => u.userId === this.currentUser.userId);
      if (index !== -1) {
        this.users[index] = { 
          ...this.currentUser,
          security: { ...this.currentUser.security },
          permissions: { ...this.currentUser.permissions }
        };
        this.messageService.add({
          severity: 'success',
          summary: 'User Updated',
          detail: `${this.currentUser.employeeName} has been updated successfully.`
        });
      }
    } else {
      if (this.users.some(u => u.userId === this.currentUser.userId)) {
        this.currentUser.userId = this.generateNextUserId();
      }
      this.users.unshift({ 
        ...this.currentUser,
        security: { ...this.currentUser.security },
        permissions: { ...this.currentUser.permissions }
      });
      this.messageService.add({
        severity: 'success',
        summary: 'User Created',
        detail: `${this.currentUser.employeeName} has been created successfully.`
      });
    }

    this.filterByDept(this.activeDeptFilter);
    this.updateKPIs();
    this.closeModal(f);
  }

  resetForm(form?: any): void {
    this.isEditMode = false;
    this.activeFormTab = 'profile';
    this.currentUser = this.getEmptyUser();
    const f = form || this.userForm;
    if (f) {
      f.resetForm(this.currentUser);
    }
  }

  updateKPIs(): void {
    this.kpis[0].value = this.users.length;
    const uniqueRoles = new Set(this.users.map(u => u.role));
    this.kpis[1].value = uniqueRoles.size;
    const approvalsCount = this.users.filter(u => u.role === 'Production Supervisor').length;
    this.kpis[2].value = approvalsCount;
    const inactiveCount = this.users.filter(u => u.status === 'Inactive').length;
    this.kpis[3].value = inactiveCount;
  }
}