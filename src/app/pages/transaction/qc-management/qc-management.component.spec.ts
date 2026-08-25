import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QcManagementComponent } from './qc-management.component';

describe('QcManagementComponent', () => {
  let component: QcManagementComponent;
  let fixture: ComponentFixture<QcManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QcManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QcManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
