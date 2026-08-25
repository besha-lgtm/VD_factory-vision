import { Component, OnInit, OnDestroy } from '@angular/core';
import { MessageService } from 'primeng/api';
import { HeaderService } from '../../../layout/header/header.service';
import { Subscription } from 'rxjs';

interface Stage {
  stageNo: number;
  name: string;
  type: string;
  desc: string;
  active: boolean;
}

@Component({
  selector: 'app-machine-master',
  standalone: false,
  templateUrl: './machine-master.component.html',
  styleUrls: ['./machine-master.component.css']
})
export class MachineMasterComponent implements OnInit, OnDestroy {

  // =========================================================================
  // IMAGE PATH CONFIGURATION:
  // To change the machine photo displayed on this page, update the value below
  // to your preferred image path (e.g. 'assets/images/my-new-machine.jpg').
  // =========================================================================
  machinePhotoUrl: string = '/assets/images/Machinemaster.png';  // Default machine photo path

  // State Management
  isEditing = false;
  selectedTab = 'Technical Specifications';
  activePlant = 'VISIPAK - Plant 1';

  private plantSubscription!: Subscription;

  tabs: string[] = [
    'Technical Specifications',
    'Capabilities',
    'Process Stages',
    'Maintenance',
    'Documents',
    'Instruments Linked',
    'Spare Parts',
    'Notes'
  ];

  // Search/Filter binds
  filters = {
    category: 'All',
    type: 'All',
    codeOrName: '',
    status: 'All'
  };

  // Dropdown options
  categories: string[] = ['All', 'Corrugation', 'Printing', 'Cutting', 'Finishing'];
  types: string[] = ['All', 'Corrugation Line', 'Flexo Printer', 'Rotary Die Cutter', 'Folder Gluer'];
  statuses: string[] = ['All', 'Active', 'Inactive'];
  lines: string[] = ['Corrugation Line - 1', 'Corrugation Line - 2', 'Printing Line - 1'];
  plants: string[] = ['VISIPAK - Plant 1', 'VISIPAK - Plant 2', 'VISIPAK - Plant 3'];
  runningTypes: string[] = ['Available', 'Running', 'Maintenance', 'Idle'];

  // =========================================================================
  // 3 PLANTS DEMO DATASET
  // =========================================================================
  plantDataset: Record<string, { machineInfo: any; techSpecs: any[]; stages: Stage[]; flowSteps: any[]; photoUrl: string }> = {
    'VISIPAK - Plant 1': {
      photoUrl: '/assets/images/Machinemaster.png',
      machineInfo: {
        code: 'MC-2B-303',
        name: '5 Ply Corrugation Line - 1',
        category: 'Corrugation',
        type: 'Corrugation Line',
        brand: 'BHS Corrugated',
        model: 'SF-M 6 1.8m',
        serialNumber: 'BHS-3819-2121',
        installationDate: '2021-11-11',
        lineUnit: 'Corrugation Line - 1',
        plant: 'VISIPAK - Plant 1',
        location: 'Shop Floor',
        runningType: 'Available',
        ratedSpeed: '300 Mtrr / Min',
        effectiveWidth: '2200 mm',
        status: 'Active',
        remarks: 'Meat corrugation line for 2/5 Fly production',
        createdBy: 'Vinayak Admin',
        createdOn: '10/11/2021 10:35 AM',
        lastUpdatedBy: 'Vinayak Admin',
        lastUpdatedOn: '08/04/2021 11:45 AM'
      },
      techSpecs: [
        { label: 'Max Working Width', value: '2200 mm' },
        { label: 'Min Board Width', value: '600 mm' },
        { label: 'Max Mechanical Speed', value: '300 Mtrr / Min' },
        { label: 'Design Speed', value: '300 Mtrn / Min' },
        { label: 'Heating Type', value: 'Steam' },
        { label: 'Corrugation Type', value: 'Single Facer' },
        { label: 'Flute Types Supported', value: ['0 Flate', '5 Ficzo', '5 Ficer'], isBadges: true },
        { label: 'COM Range', value: '120 - 250 DSM' },
        { label: 'Power Requirement', value: '300 V, 3 Proos, 50 Hz' },
        { label: 'Installed Power (KW)', value: 'Rev kW' },
        { label: 'Air Pressure', value: '6 - 8 Bar' },
        { label: 'Steam Pressure', value: '1 - 12 Bar' },
        { label: 'Bridge Type', value: 'Briddle Bridge' },
        { label: 'Soli Biometer', value: '800 mm' },
        { label: 'Roller Face', value: 'Hard Diemme' },
        { label: 'Glue Type Supported', value: 'Storno / Polk' },
        { label: 'Proheater Time', value: '10 Zone' },
        { label: 'Afterheater Zone', value: 'T Zone' },
        { label: 'Sheet Cutting', value: 'Ridery Acker' },
        { label: 'Stacker Type', value: 'Auto Stacker' },
        { label: 'Stacker Nunker', value: 'FLC Board' },
        { label: 'Make Year', value: '2021' },
        { label: 'Country of Driger', value: 'Germany' }
      ],
      flowSteps: [
        { stepNo: 1, name: 'Reel Stand', colorClass: 'bg-green' },
        { stepNo: 2, name: 'Pre Heater', colorClass: 'bg-blue' },
        { stepNo: 3, name: 'Single Facer', colorClass: 'bg-purple' },
        { stepNo: 4, name: 'Glue Section', colorClass: 'bg-orange' },
        { stepNo: 5, name: 'After Heater', colorClass: 'bg-yellow' },
        { stepNo: 6, name: 'Shear Cut', colorClass: 'bg-lightblue' },
        { stepNo: 7, name: 'Slitter', colorClass: 'bg-red' }
      ],
      stages: [
        { stageNo: 1, name: 'Reel Stand', type: 'Input', desc: 'Paper-nal loading', active: true },
        { stageNo: 2, name: 'Pre Heater', type: 'Heating', desc: 'Pre heating of paper', active: true },
        { stageNo: 3, name: 'Single Facer', type: 'Forming', desc: 'Boxing and brorking', active: true },
        { stageNo: 4, name: 'Glue Sleoter', type: 'Application', desc: 'Glue application on flute', active: true },
        { stageNo: 5, name: 'After Heater', type: 'Heating', desc: 'Boxing and brorking', active: true },
        { stageNo: 6, name: 'Shear Cut', type: 'Cutting', desc: 'Sheet cutting to flue', active: true },
        { stageNo: 7, name: 'Stacker', type: 'Cutbring', desc: 'Aulrenote crosking', active: true }
      ]
    },
    'VISIPAK - Plant 2': {
      photoUrl: '/assets/images/Machinemaster.png',
      machineInfo: {
        code: 'MC-3A-404',
        name: '3 Ply Corrugation Line - 2',
        category: 'Corrugation',
        type: 'Corrugation Line',
        brand: 'Fosber Group',
        model: 'FOS-4.0 2.2m',
        serialNumber: 'FOS-8891-9981',
        installationDate: '2022-05-15',
        lineUnit: 'Corrugation Line - 2',
        plant: 'VISIPAK - Plant 2',
        location: 'Main Hall B',
        runningType: 'Running',
        ratedSpeed: '350 Mtrr / Min',
        effectiveWidth: '2400 mm',
        status: 'Active',
        remarks: 'High speed light board production line',
        createdBy: 'Vinayak Admin',
        createdOn: '15/05/2022 09:10 AM',
        lastUpdatedBy: 'Vinayak Admin',
        lastUpdatedOn: '12/03/2023 04:30 PM'
      },
      techSpecs: [
        { label: 'Max Working Width', value: '2400 mm' },
        { label: 'Min Board Width', value: '700 mm' },
        { label: 'Max Mechanical Speed', value: '350 Mtrr / Min' },
        { label: 'Design Speed', value: '350 Mtrn / Min' },
        { label: 'Heating Type', value: 'Steam' },
        { label: 'Corrugation Type', value: 'Double Facer' },
        { label: 'Flute Types Supported', value: ['A Flute', 'C Flute'], isBadges: true },
        { label: 'COM Range', value: '150 - 300 DSM' },
        { label: 'Power Requirement', value: '400 V, 3 Phase, 50 Hz' },
        { label: 'Installed Power (KW)', value: '315 kW' },
        { label: 'Air Pressure', value: '7 - 9 Bar' },
        { label: 'Steam Pressure', value: '2 - 14 Bar' },
        { label: 'Bridge Type', value: 'Double Bridge' },
        { label: 'Soli Biometer', value: '900 mm' },
        { label: 'Roller Face', value: 'Chrome Coated' },
        { label: 'Glue Type Supported', value: 'Starch Only' },
        { label: 'Proheater Time', value: '12 Zone' },
        { label: 'Afterheater Zone', value: 'S Zone' },
        { label: 'Sheet Cutting', value: 'Fosber Cut' },
        { label: 'Stacker Type', value: 'Downstacker' },
        { label: 'Stacker Nunker', value: 'FOS Board' },
        { label: 'Make Year', value: '2022' },
        { label: 'Country of Driger', value: 'Italy' }
      ],
      flowSteps: [
        { stepNo: 1, name: 'Mill Roll', colorClass: 'bg-green' },
        { stepNo: 2, name: 'Conditioner', colorClass: 'bg-blue' },
        { stepNo: 3, name: 'Double Facer', colorClass: 'bg-purple' },
        { stepNo: 4, name: 'Glue Unit', colorClass: 'bg-orange' },
        { stepNo: 5, name: 'Heating Section', colorClass: 'bg-yellow' },
        { stepNo: 6, name: 'Rotary Shear', colorClass: 'bg-lightblue' },
        { stepNo: 7, name: 'Slitter Scorer', colorClass: 'bg-red' }
      ],
      stages: [
        { stageNo: 1, name: 'Mill Roll', type: 'Input', desc: 'Unwinding board roll', active: true },
        { stageNo: 2, name: 'Conditioner', type: 'Heating', desc: 'Moisture conditioning', active: true },
        { stageNo: 3, name: 'Double Facer', type: 'Forming', desc: 'Laminating liner boards', active: true },
        { stageNo: 4, name: 'Glue Unit', type: 'Application', desc: 'Starch glue application', active: true },
        { stageNo: 5, name: 'Heating Section', type: 'Heating', desc: 'Drying board layers', active: true },
        { stageNo: 6, name: 'Rotary Shear', type: 'Cutting', desc: 'Order change cutting', active: false },
        { stageNo: 7, name: 'Slitter Scorer', type: 'Cutbring', desc: 'Precision slitting and scoring', active: true }
      ]
    },
    'VISIPAK - Plant 3': {
      photoUrl: '/assets/images/Machinemaster.png', // Uses copied machine image
      machineInfo: {
        code: 'MC-4C-505',
        name: 'Heavy Duty Flexo Printing Press',
        category: 'Printing',
        type: 'Flexo Printer',
        brand: 'Bobst Group',
        model: 'BOB-FLEX 160',
        serialNumber: 'BOB-5542-1244',
        installationDate: '2023-01-20',
        lineUnit: 'Printing Line - 1',
        plant: 'VISIPAK - Plant 3',
        location: 'Annex Section C',
        runningType: 'Maintenance',
        ratedSpeed: '250 Mtrr / Min',
        effectiveWidth: '1600 mm',
        status: 'Inactive',
        remarks: '6-color high precision flexo printing press',
        createdBy: 'Vinayak Admin',
        createdOn: '20/01/2023 11:15 AM',
        lastUpdatedBy: 'Vinayak Admin',
        lastUpdatedOn: '14/10/2024 10:00 AM'
      },
      techSpecs: [
        { label: 'Max Working Width', value: '1600 mm' },
        { label: 'Min Board Width', value: '400 mm' },
        { label: 'Max Mechanical Speed', value: '250 Mtrr / Min' },
        { label: 'Design Speed', value: '220 Mtrn / Min' },
        { label: 'Heating Type', value: 'Electric' },
        { label: 'Corrugation Type', value: 'N/A (Printing)' },
        { label: 'Flute Types Supported', value: ['All Flutes'], isBadges: true },
        { label: 'COM Range', value: '100 - 450 DSM' },
        { label: 'Power Requirement', value: '415 V, 3 Phase, 50 Hz' },
        { label: 'Installed Power (KW)', value: '180 kW' },
        { label: 'Air Pressure', value: '6 - 7 Bar' },
        { label: 'Steam Pressure', value: 'None' },
        { label: 'Bridge Type', value: 'Inline Feed' },
        { label: 'Soli Biometer', value: 'N/A' },
        { label: 'Roller Face', value: 'Anilox Rolls' },
        { label: 'Glue Type Supported', value: 'Water-based Ink' },
        { label: 'Proheater Time', value: 'Hot Air Dryers' },
        { label: 'Afterheater Zone', value: 'UV Curing' },
        { label: 'Sheet Cutting', value: 'Inline Die Cutter' },
        { label: 'Stacker Type', value: 'Bundle Stacker' },
        { label: 'Stacker Nunker', value: 'BOB Stack' },
        { label: 'Make Year', value: '2023' },
        { label: 'Country of Driger', value: 'Switzerland' }
      ],
      flowSteps: [
        { stepNo: 1, name: 'Feeder', colorClass: 'bg-green' },
        { stepNo: 2, name: 'Flexo Unit 1', colorClass: 'bg-blue' },
        { stepNo: 3, name: 'Flexo Unit 2', colorClass: 'bg-purple' },
        { stepNo: 4, name: 'Slotter', colorClass: 'bg-orange' },
        { stepNo: 5, name: 'Folder Gluer', colorClass: 'bg-yellow' },
        { stepNo: 6, name: 'Dryer Unit', colorClass: 'bg-lightblue' },
        { stepNo: 7, name: 'Counter Eject', colorClass: 'bg-red' }
      ],
      stages: [
        { stageNo: 1, name: 'Feeder', type: 'Input', desc: 'Automatic sheet feeding', active: true },
        { stageNo: 2, name: 'Flexo Unit 1', type: 'Printing', desc: 'Color 1 application', active: true },
        { stageNo: 3, name: 'Flexo Unit 2', type: 'Printing', desc: 'Color 2 application', active: true },
        { stageNo: 4, name: 'Slotter', type: 'Creasing', desc: 'Cardboard slotting/creasing', active: false },
        { stageNo: 5, name: 'Folder Gluer', type: 'Folding', desc: 'Folding and glue gluing', active: false },
        { stageNo: 6, name: 'Dryer Unit', type: 'Heating', desc: 'Ink drying curing', active: true },
        { stageNo: 7, name: 'Counter Eject', type: 'Cutbring', desc: 'Counting and packaging bundling', active: true }
      ]
    }
  };

  // Active view bindings
  machineInfo: any = {};
  techSpecs: any[] = [];
  flowSteps: any[] = [];
  stages: Stage[] = [];

  // Helper for holding input states when editing
  editableInfo: any = {};

  constructor(
    private messageService: MessageService,
    private headerService: HeaderService
  ) {}

  ngOnInit(): void {
    // Listen to shared selected plant from header
    this.plantSubscription = this.headerService.selectedPlant$.subscribe((plant: string) => {
      if (plant && this.plantDataset[plant]) {
        this.activePlant = plant;
        this.loadPlantData(plant);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.plantSubscription) {
      this.plantSubscription.unsubscribe();
    }
  }

  // Load specific plant data
  loadPlantData(plant: string): void {
    const data = this.plantDataset[plant];
    this.machineInfo = data.machineInfo;
    this.techSpecs = data.techSpecs;
    this.flowSteps = data.flowSteps;
    this.stages = data.stages;
    this.machinePhotoUrl = data.photoUrl;
    this.resetEditableInfo();
  }

  resetEditableInfo(): void {
    this.editableInfo = { ...this.machineInfo };
  }

  onPlantFilterChange(): void {
    if (this.activePlant && this.plantDataset[this.activePlant]) {
      this.loadPlantData(this.activePlant);
      this.headerService.changePlant(this.activePlant);
    }
  }

  // Edit action
  startEdit(): void {
    this.isEditing = true;
    this.resetEditableInfo();
    this.messageService.add({severity: 'info', summary: 'Edit Mode Enabled', detail: 'You can now update the machine details'});
  }

  saveEdit(): void {
    this.machineInfo = { ...this.editableInfo };
    this.machineInfo.lastUpdatedOn = new Date().toLocaleString();
    
    // Save back to dataset
    if (this.plantDataset[this.activePlant]) {
      this.plantDataset[this.activePlant].machineInfo = { ...this.machineInfo };
    }

    this.isEditing = false;
    this.messageService.add({severity: 'success', summary: 'Saved', detail: 'Machine information has been updated successfully'});
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.resetEditableInfo();
    this.messageService.add({severity: 'warn', summary: 'Cancelled', detail: 'Changes discarded'});
  }

  // Deactivate action
  toggleStatus(): void {
    if (this.machineInfo.status === 'Active') {
      this.machineInfo.status = 'Inactive';
      this.editableInfo.status = 'Inactive';
      this.messageService.add({severity: 'warn', summary: 'Status Updated', detail: 'Machine has been deactivated'});
    } else {
      this.machineInfo.status = 'Active';
      this.editableInfo.status = 'Active';
      this.messageService.add({severity: 'success', summary: 'Status Updated', detail: 'Machine has been activated'});
    }
    
    // Save status change back to dataset
    if (this.plantDataset[this.activePlant]) {
      this.plantDataset[this.activePlant].machineInfo.status = this.machineInfo.status;
    }
  }

  // Clone action
  cloneMachine(): void {
    this.messageService.add({
      severity: 'success', 
      summary: 'Cloned', 
      detail: `Cloned machine '${this.machineInfo.name}' as a new master record`
    });
  }

  // Search filter trigger
  onSearch(): void {
    // If search text matches another plant, trigger change dynamically for the demo
    const queryLower = this.filters.codeOrName.toLowerCase();
    let matchedPlant = '';
    
    if (queryLower.includes('plant 1') || queryLower.includes('303')) {
      matchedPlant = 'VISIPAK - Plant 1';
    } else if (queryLower.includes('plant 2') || queryLower.includes('404')) {
      matchedPlant = 'VISIPAK - Plant 2';
    } else if (queryLower.includes('plant 3') || queryLower.includes('505')) {
      matchedPlant = 'VISIPAK - Plant 3';
    }

    if (matchedPlant) {
      this.headerService.changePlant(matchedPlant);
      this.messageService.add({
        severity: 'success',
        summary: 'Machine Found',
        detail: `Found machine details in ${matchedPlant}`
      });
    } else {
      this.messageService.add({
        severity: 'info', 
        summary: 'Filtering', 
        detail: `Searching for category: ${this.filters.category}, type: ${this.filters.type}, query: "${this.filters.codeOrName}"`
      });
    }
  }

  onReset(): void {
    this.filters = {
      category: 'All',
      type: 'All',
      codeOrName: '',
      status: 'All'
    };
    this.messageService.add({severity: 'info', summary: 'Filters Reset', detail: 'Search filters returned to default values'});
  }

  // Tab switching
  selectTab(tab: string): void {
    this.selectedTab = tab;
  }

  // Toggle stage state
  toggleStage(stage: Stage): void {
    stage.active = !stage.active;
    this.messageService.add({
      severity: 'info', 
      summary: 'Stage Updated', 
      detail: `Stage ${stage.stageNo} (${stage.name}) set to ${stage.active ? 'Active' : 'Inactive'}`
    });
  }

  // Trigger file upload simulation
  changePhoto(): void {
    const newPath = prompt('Enter the local image path or URL for the machine photo:', this.machinePhotoUrl);
    if (newPath) {
      this.machinePhotoUrl = newPath;
      if (this.plantDataset[this.activePlant]) {
        this.plantDataset[this.activePlant].photoUrl = newPath;
      }
      this.messageService.add({severity: 'success', summary: 'Photo Updated', detail: 'Machine photo path updated successfully'});
    }
  }

  // Header quick buttons
  addMachine(): void {
    this.messageService.add({severity: 'success', summary: 'Add Machine', detail: 'Trigger Add New Machine form modal'});
  }

  handleFileImport(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').map((line: string) => line.trim()).filter((line: string) => line.length > 0);
        if (lines.length < 2) {
          throw new Error('CSV file must contain a header row and at least one data row.');
        }

        const headers = lines[0].split(',').map((h: string) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
        
        // Simple CSV parser for double quotes and commas
        const dataLine = lines[1];
        const values: string[] = [];
        let insideQuote = false;
        let currentValue = '';

        for (let i = 0; i < dataLine.length; i++) {
          const char = dataLine[i];
          if (char === '"') {
            insideQuote = !insideQuote;
          } else if (char === ',' && !insideQuote) {
            values.push(currentValue.replace(/^["']|["']$/g, '').trim());
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        values.push(currentValue.replace(/^["']|["']$/g, '').trim());

        // Map values by header index
        const getVal = (name: string) => {
          const idx = headers.indexOf(name.toLowerCase());
          return idx !== -1 ? values[idx] : '';
        };

        const importedInfo = {
          code: getVal('Code') || 'MC-IMPORTED',
          name: getVal('Name') || 'Imported Machine',
          category: getVal('Category') || 'Corrugation',
          type: getVal('Type') || 'Corrugation Line',
          brand: getVal('Brand') || 'Unknown Make',
          model: getVal('Model') || 'Model-X',
          serialNumber: getVal('SerialNumber') || 'SN-UNKNOWN',
          installationDate: getVal('InstallationDate') || new Date().toISOString().split('T')[0],
          lineUnit: getVal('LineUnit') || 'Corrugation Line - 1',
          plant: getVal('Plant') || this.activePlant,
          location: getVal('Location') || 'Shop Floor',
          runningType: getVal('RunningType') || 'Available',
          ratedSpeed: getVal('RatedSpeed') || '300 Mtrr / Min',
          effectiveWidth: getVal('EffectiveWidth') || '2200 mm',
          status: getVal('Status') || 'Active',
          remarks: getVal('Remarks') || 'Imported via CSV file upload',
          createdBy: 'System Import',
          createdOn: new Date().toLocaleString(),
          lastUpdatedBy: 'Vinayak Admin',
          lastUpdatedOn: new Date().toLocaleString()
        };

        // Update active values
        this.machineInfo = importedInfo;
        this.editableInfo = { ...importedInfo };
        
        // Update dataset for active plant
        if (this.plantDataset[this.activePlant]) {
          this.plantDataset[this.activePlant].machineInfo = { ...importedInfo };
        }

        // Show toast
        this.messageService.add({
          severity: 'success',
          summary: 'Import Complete',
          detail: `Imported machine '${importedInfo.name}' details successfully.`
        });
      } catch (err: any) {
        this.messageService.add({
          severity: 'error',
          summary: 'Import Failed',
          detail: err.message || 'Could not parse the CSV file format.'
        });
      }
      
      // Clear target so same file can be uploaded again
      event.target.value = '';
    };

    reader.readAsText(file);
  }

  exportData(): void {
    const headers = [
      'Code', 'Name', 'Category', 'Type', 'Brand', 'Model', 
      'SerialNumber', 'InstallationDate', 'LineUnit', 'Plant', 
      'Location', 'RunningType', 'RatedSpeed', 'EffectiveWidth', 
      'Status', 'Remarks'
    ];
    
    const row = [
      this.machineInfo.code,
      this.machineInfo.name,
      this.machineInfo.category,
      this.machineInfo.type,
      this.machineInfo.brand,
      this.machineInfo.model,
      this.machineInfo.serialNumber,
      this.machineInfo.installationDate,
      this.machineInfo.lineUnit,
      this.machineInfo.plant,
      this.machineInfo.location,
      this.machineInfo.runningType,
      this.machineInfo.ratedSpeed,
      this.machineInfo.effectiveWidth,
      this.machineInfo.status,
      this.machineInfo.remarks
    ];

    // Escape values and join by commas
    const escapedRow = row.map(val => `"${(val || '').replace(/"/g, '""')}"`);
    const csvContent = [headers.join(','), escapedRow.join(',')].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.machineInfo.code}_export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.messageService.add({
      severity: 'success', 
      summary: 'Data Exported', 
      detail: `Downloaded ${this.machineInfo.code}_export.csv successfully.`
    });
  }
}
