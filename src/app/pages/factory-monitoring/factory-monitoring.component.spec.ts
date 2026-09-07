import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FactoryMonitoringComponent } from './factory-monitoring.component';

describe('FactoryMonitoringComponent', () => {
  let component: FactoryMonitoringComponent;
  let fixture: ComponentFixture<FactoryMonitoringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FactoryMonitoringComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FactoryMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
