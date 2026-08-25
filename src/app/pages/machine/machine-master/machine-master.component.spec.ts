import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MachineMasterComponent } from './machine-master.component';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';

describe('MachineMasterComponent', () => {
  let component: MachineMasterComponent;
  let fixture: ComponentFixture<MachineMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MachineMasterComponent ],
      imports: [ FormsModule ],
      providers: [ MessageService ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MachineMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
