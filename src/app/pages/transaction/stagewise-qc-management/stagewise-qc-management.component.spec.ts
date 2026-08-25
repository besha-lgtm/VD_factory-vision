import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StagewiseQcManagementComponent } from './stagewise-qc-management.component';

describe('StagewiseQcManagementComponent', () => {
  let component: StagewiseQcManagementComponent;
  let fixture: ComponentFixture<StagewiseQcManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StagewiseQcManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StagewiseQcManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
