import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

interface BankDetails {
  accountHolder: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  accountType: string;
  branch: string;
}

interface StatutoryDetails {
  pfNo: string;
  esiNo: string;
  uan: string;
  pfApplicable: string;
  esiApplicable: string;
  gratuityApplicable: string;
}

interface Employee {
  empId: string;
  empCode: string;
  empName: string;
  fatherName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  aadhaar: string;
  pan: string;
  address: string;
  doj: string;
  employeeType: string;
  department: string;
  designation: string;
  shift: string;
  reportingManager: string;
  skill: string;
  machineAssigned: string;
  basicSalary: number | null;
  attendanceType: string;
  workLocation: string;
  status: string;
  bankDetails: BankDetails;
  statutory: StatutoryDetails;
  avatarColor: string;

  // New Fields
  altMobile: string;
  resAddress: string;
  permAddress: string;
  bloodGroup: string;
  education: string;
  prevExperience: boolean;
  yearsWorked: number | null;
  resumeFile: any;
  educationDocs: any;
}

interface FormTab {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-employee-master',
  standalone: false,
  templateUrl: './employee-master.component.html',
  styleUrl: './employee-master.component.css'
})
export class EmployeeMasterComponent implements OnInit {

  employees: Employee[] = [];
  filteredEmployees: Employee[] = [];
  activeDeptFilter = 'All';
  formSubmitted = false;

  /** Controls modal visibility */
  showEmpModal = false;

  // ── Form tab config ──────────────────────────────────
  formTabs: FormTab[] = [
    { key: 'personal',   label: 'Personal',           icon: 'pi pi-user' },
    { key: 'experience', label: 'Career & Education', icon: 'pi pi-graduation-cap' },
    { key: 'job',        label: 'Job Details',        icon: 'pi pi-briefcase' },
    { key: 'bank',       label: 'Bank & Statutory',   icon: 'pi pi-credit-card' }
  ];
  activeFormTab = 'personal';

  // ── Address sync and file upload states ───────────────
  isSameAddress = false;

  // ── Dropdown options ─────────────────────────────────
  genderOptions         = ['Male', 'Female', 'Other'];
  bloodGroupOptions     = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  educationOptions      = ['High School', 'Diploma', 'Bachelor’s', 'Master’s', 'Others'];
  employeeTypeOptions   = ['Permanent', 'Contractual', 'Trainee', 'Casual'];
  statusOptions         = ['Active', 'Inactive', 'On Leave', 'Terminated'];
  shiftOptions          = ['General', 'A', 'B', 'C'];
  attendanceTypeOptions = ['Biometric', 'Manual', 'App-based'];
  workLocationOptions   = ['Factory – Line 1', 'Factory – Line 2', 'Office', 'Stores', 'QC Lab'];
  machineOptions        = ['RS Machine', 'RD Machine', 'Auto Cutting', 'Manual', 'N/A'];

  departmentOptions = [
    'Production', 'QC', 'Stores', 'Accounts', 'Dispatch', 'Maintenance', 'HR/Admin'
  ];

  deptFilterOptions = ['All', 'Production', 'QC', 'Stores', 'Accounts', 'Dispatch', 'Maintenance', 'HR/Admin'];

  designationOptions: string[] = [];

  private designationMap: Record<string, string[]> = {
    'Production':  ['Production Supervisor', 'Machine Operator', 'Helper', 'Line Incharge', 'Pasting Operator', 'Cutting Operator'],
    'QC':          ['QC Incharge', 'QC Analyst', 'QC Assistant'],
    'Stores':      ['Store In-charge', 'Store Keeper', 'Material Handler'],
    'Accounts':    ['Accounts Manager', 'Accounts Executive', 'A/C Team'],
    'Dispatch':    ['Dispatch Supervisor', 'Dispatch Executive', 'Loader'],
    'Maintenance': ['Maintenance Engineer', 'Electrician', 'Mechanic', 'Fitter'],
    'HR/Admin':    ['HR Manager', 'HR Executive', 'Admin Executive', 'Security Guard']
  };

  skillOptions = [
    'Machine Operation', 'Sheet Cutting', 'Fluting', 'Pasting', 'Printing',
    'Bundling', 'QC Inspection', 'Forklift Operation', 'Electrical Maintenance',
    'General Labour', 'N/A'
  ];

  private avatarColors = [
    '#2e90fa', '#7a5af8', '#12b76a', '#f79009',
    '#f04438', '#0794ad', '#ee46bc', '#16b364'
  ];
  private colorIndex = 0;

  kpis = [
    { label: 'TOTAL EMPLOYEES', value: 0, icon: 'pi pi-users',       colorClass: 'blue'   },
    { label: 'ACTIVE',          value: 0, icon: 'pi pi-check-circle', colorClass: 'green'  },
    { label: 'DEPARTMENTS',     value: 0, icon: 'pi pi-sitemap',      colorClass: 'purple' },
    { label: 'CONTRACTUAL',     value: 0, icon: 'pi pi-file-edit',    colorClass: 'yellow' }
  ];
  showViewModal = false;
activeViewTab = 'personal';
viewEmp: Employee = this.getEmptyEmployee();

  isEditMode = false;
  currentEmp: Employee = this.getEmptyEmployee();

  constructor(
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.employees = [
      this.makeEmployee('E001','EMP001','Suresh Kumar','Ramaiah Kumar','1985-06-15','Male','9876543210','suresh@visipak.com','1234 5678 9012','ABCDE1234F','Plot 12, Kondapalli, Vizag','2020-01-10','Permanent','Production','Production Supervisor','General','Plant Manager','Machine Operation','RS Machine',28000,'Biometric','Factory – Line 1','Active'),
      this.makeEmployee('E002','EMP002','Raju Naidu','Venkat Naidu','1990-03-22','Male','9876543211','','','','House 4B, Gajuwaka, Vizag','2021-05-01','Permanent','Production','Machine Operator','A','Suresh Kumar','Sheet Cutting','Auto Cutting',18000,'Biometric','Factory – Line 1','Active'),
      this.makeEmployee('E003','EMP003','QC Analyst','Krishnamurthy','1988-11-30','Male','9876543212','qc@visipak.com','','','','2022-03-15','Permanent','QC','QC Analyst','General','QC Incharge','QC Inspection','N/A',22000,'Biometric','QC Lab','Active'),
      this.makeEmployee('E004','EMP004','Lakshmi Devi','Ravi Prasad','1995-07-19','Female','9876543213','','','','','2023-01-20','Contractual','Stores','Store Keeper','General','Store In-charge','General Labour','N/A',15000,'Manual','Stores','Active'),
      this.makeEmployee('E005','EMP005','Mahesh Rao','Srinivas Rao','1982-09-05','Male','9876543214','mahesh@visipak.com','','','','2019-06-01','Permanent','Accounts','Accounts Manager','General','Director','N/A','N/A',35000,'App-based','Office','Active'),
      this.makeEmployee('E006','EMP006','Pavan Kumar','Naga Rao','1993-12-10','Male','9876543215','','','','','2022-08-01','Contractual','Production','Helper','B','Raju Naidu','Pasting','Manual',12000,'Biometric','Factory – Line 2','Active'),
      this.makeEmployee('E007','EMP007','Anitha Reddy','Bala Reddy','1991-04-28','Female','9876543216','','','','','2021-11-01','Permanent','Dispatch','Dispatch Supervisor','General','Plant Manager','N/A','N/A',20000,'Biometric','Factory – Line 1','Active'),
    ];

    this.filteredEmployees = [...this.employees];
    this.updateKPIs();
    this.currentEmp = this.getEmptyEmployee();
    this.designationOptions = this.designationMap['Production'];
  }
  viewEmployee(emp: Employee): void {
  this.viewEmp = { ...emp, bankDetails: { ...emp.bankDetails }, statutory: { ...emp.statutory } };
  this.activeViewTab = 'personal';
  this.showViewModal = true;
}

editFromView(): void {
  this.showViewModal = false;
  this.editEmployee(this.viewEmp);
}

  // ── Open modal (Create) ───────────────────────────────
  openCreateModal(): void {
    this.isEditMode = false;
    this.formSubmitted = false;
    this.activeFormTab = 'personal';
    this.designationOptions = this.designationMap['Production'];
    this.currentEmp = this.getEmptyEmployee();
    this.showEmpModal = true;
  }

  /** Close modal and reset state */
  closeModal(): void {
    this.showEmpModal = false;
    this.resetForm();
  }

  /** Called when the p-dialog overlay is dismissed via X button */
  onModalHide(): void {
    this.resetForm();
  }

  // ── Helper: build a full employee from flat args ──────
  private makeEmployee(
    empId: string, empCode: string, empName: string, fatherName: string,
    dob: string, gender: string, mobile: string, email: string,
    aadhaar: string, pan: string, address: string, doj: string,
    employeeType: string, department: string, designation: string,
    shift: string, reportingManager: string, skill: string,
    machineAssigned: string, basicSalary: number, attendanceType: string,
    workLocation: string, status: string,
    altMobile = '', resAddress = '', permAddress = '',
    bloodGroup = '', education = '', prevExperience = false, yearsWorked: number | null = null
  ): Employee {
    const color = this.avatarColors[this.colorIndex++ % this.avatarColors.length];
    return {
      empId, empCode, empName, fatherName, dob, gender, mobile, email,
      aadhaar, pan, address: address || resAddress, doj, employeeType, department, designation,
      shift, reportingManager, skill, machineAssigned, basicSalary,
      attendanceType, workLocation, status, avatarColor: color,
      bankDetails: { accountHolder: '', bankName: '', accountNo: '', ifsc: '', accountType: 'Savings', branch: '' },
      statutory: { pfNo: '', esiNo: '', uan: '', pfApplicable: 'Yes', esiApplicable: 'Yes', gratuityApplicable: 'No' },
      
      // New Fields
      altMobile,
      resAddress: resAddress || address,
      permAddress,
      bloodGroup,
      education,
      prevExperience,
      yearsWorked,
      resumeFile: null,
      educationDocs: null
    };
  }

  // ── Empty template ─────────────────────────────────────
  getEmptyEmployee(): Employee {
    return {
      empId: this.generateNextEmpId(),
      empCode: '', empName: '', fatherName: '', dob: '', gender: 'Male',
      mobile: '', email: '', aadhaar: '', pan: '', address: '',
      doj: new Date().toISOString().split('T')[0],
      employeeType: 'Permanent', department: 'Production',
      designation: 'Production Supervisor', shift: 'General',
      reportingManager: '', skill: 'Machine Operation',
      machineAssigned: 'RS Machine', basicSalary: null,
      attendanceType: 'Biometric', workLocation: 'Factory – Line 1',
      status: 'Active', avatarColor: this.avatarColors[0],
      bankDetails: { accountHolder: '', bankName: '', accountNo: '', ifsc: '', accountType: 'Savings', branch: '' },
      statutory: { pfNo: '', esiNo: '', uan: '', pfApplicable: 'Yes', esiApplicable: 'Yes', gratuityApplicable: 'No' },

      // New Fields
      altMobile: '',
      resAddress: '',
      permAddress: '',
      bloodGroup: '',
      education: '',
      prevExperience: false,
      yearsWorked: null,
      resumeFile: null,
      educationDocs: null
    };
  }

  generateNextEmpId(): string {
    if (!this.employees || this.employees.length === 0) return 'E001';
    const ids = this.employees.map(e => parseInt(e.empId.substring(1)) || 0);
    return 'E' + (Math.max(...ids) + 1).toString().padStart(3, '0');
  }

  // ── Initials for avatar ────────────────────────────────
  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].substring(0, 2).toUpperCase();
  }

  // ── Department filter pills ────────────────────────────
  filterByDept(dept: string): void {
    this.activeDeptFilter = dept;
    this.filteredEmployees = dept === 'All'
      ? [...this.employees]
      : this.employees.filter(e => e.department === dept);
  }

  // ── Department change → update designation list ────────
  onDepartmentChange(event: any): void {
    const dept = event.value;
    this.designationOptions = this.designationMap[dept] || [];
    this.currentEmp.designation = this.designationOptions[0] || '';
  }

  // ── Form tab navigation ────────────────────────────────
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

   // ── Address sync and file upload helpers ────────────────
  onSameAddressChange(event: any): void {
    const checked = event.target ? event.target.checked : event;
    this.isSameAddress = checked;
    if (checked) {
      this.currentEmp.permAddress = this.currentEmp.resAddress;
    }
  }

  onResAddressChange(): void {
    if (this.isSameAddress) {
      this.currentEmp.permAddress = this.currentEmp.resAddress;
    }
  }

  onFileSelected(event: any, type: string): void {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        this.messageService.add({ severity: 'error', summary: 'File Too Large', detail: 'File size must be less than 5MB.' });
        return;
      }
      if (type === 'resume') {
        this.currentEmp.resumeFile = file;
        this.messageService.add({ severity: 'info', summary: 'Resume Selected', detail: file.name });
      } else {
        this.currentEmp.educationDocs = file;
        this.messageService.add({ severity: 'info', summary: 'Education Docs Selected', detail: file.name });
      }
    }
  }

  removeFile(type: string): void {
    if (type === 'resume') {
      this.currentEmp.resumeFile = null;
    } else {
      this.currentEmp.educationDocs = null;
    }
  }

  getFileName(file: any): string {
    if (!file) return '';
    if (file instanceof File) return file.name;
    if (typeof file === 'string') return file.split('/').pop() || file;
    return 'Attached File';
  }

  // ── Edit ───────────────────────────────────────────────
  editEmployee(emp: Employee): void {
    this.isEditMode = true;
    this.formSubmitted = false;
    this.activeFormTab = 'personal';
    this.designationOptions = this.designationMap[emp.department] || [];
    this.currentEmp = {
      ...emp,
      bankDetails: { ...emp.bankDetails },
      statutory:   { ...emp.statutory }
    };
    this.isSameAddress = !!(emp.resAddress && emp.resAddress === emp.permAddress);
    this.showEmpModal = true;
    this.messageService.add({ severity: 'info', summary: 'Edit Mode', detail: `Editing ${emp.empName}` });
  }

  // ── Save ───────────────────────────────────────────────
  saveEmployee(form: NgForm): void {
    this.formSubmitted = true;

    if (!this.currentEmp.empCode || !this.currentEmp.empName || !this.currentEmp.mobile || !this.currentEmp.resAddress) {
      this.activeFormTab = 'personal';
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Emp Code, Name, Mobile and Residential Address are required (Personal tab).' });
      return;
    }
    if (!this.currentEmp.education) {
      this.activeFormTab = 'experience';
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Education is required (Career & Education tab).' });
      return;
    }
    if (this.currentEmp.prevExperience && (this.currentEmp.yearsWorked == null || this.currentEmp.yearsWorked < 0)) {
      this.activeFormTab = 'experience';
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Years Worked is required and must be non-negative (Career & Education tab).' });
      return;
    }
    if (!this.currentEmp.doj || !this.currentEmp.department || !this.currentEmp.designation) {
      this.activeFormTab = 'job';
      this.messageService.add({ severity: 'error', summary: 'Validation Error', detail: 'Date of Joining, Department and Designation are required (Job Details tab).' });
      return;
    }

    if (this.isSameAddress) {
      this.currentEmp.permAddress = this.currentEmp.resAddress;
    }

    // Sync old address field for compatibility
    this.currentEmp.address = this.currentEmp.resAddress;

    if (this.isEditMode) {
      const idx = this.employees.findIndex(e => e.empId === this.currentEmp.empId);
      if (idx !== -1) {
        this.employees[idx] = {
          ...this.currentEmp,
          bankDetails: { ...this.currentEmp.bankDetails },
          statutory:   { ...this.currentEmp.statutory }
        };
        this.messageService.add({ severity: 'success', summary: 'Employee Updated', detail: `${this.currentEmp.empName} updated.` });
      }
    } else {
      if (this.employees.some(e => e.empCode === this.currentEmp.empCode)) {
        this.messageService.add({ severity: 'error', summary: 'Duplicate Emp Code', detail: `${this.currentEmp.empCode} already exists.` });
        return;
      }
      const color = this.avatarColors[this.colorIndex++ % this.avatarColors.length];
      this.employees.unshift({
        ...this.currentEmp,
        avatarColor: color,
        bankDetails: { ...this.currentEmp.bankDetails },
        statutory:   { ...this.currentEmp.statutory }
      });
      this.messageService.add({ severity: 'success', summary: 'Employee Added', detail: `${this.currentEmp.empName} registered.` });
    }

    this.filterByDept(this.activeDeptFilter);
    this.updateKPIs();
    this.closeModal();
  }

  // ── Delete ─────────────────────────────────────────────
  confirmDelete(event: Event, emp: Employee): void {
    this.confirmationService.confirm({
      message: `Delete employee ${emp.empName} (${emp.empId})?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Yes, Delete',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-text p-button-secondary p-button-sm',
      accept: () => {
        this.employees = this.employees.filter(e => e.empId !== emp.empId);
        this.filterByDept(this.activeDeptFilter);
        this.updateKPIs();
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `${emp.empName} removed.` });
        if (this.currentEmp.empId === emp.empId) this.resetForm();
      }
    });
  }

  // ── Reset ──────────────────────────────────────────────
  resetForm(): void {
    this.isEditMode = false;
    this.formSubmitted = false;
    this.activeFormTab = 'personal';
    this.designationOptions = this.designationMap['Production'];
    this.currentEmp = this.getEmptyEmployee();
  }

  // ── KPIs ───────────────────────────────────────────────
  updateKPIs(): void {
    this.kpis[0].value = this.employees.length;
    this.kpis[1].value = this.employees.filter(e => e.status === 'Active').length;
    this.kpis[2].value = new Set(this.employees.map(e => e.department)).size;
    this.kpis[3].value = this.employees.filter(e => e.employeeType === 'Contractual').length;
  }
}