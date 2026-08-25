import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductionExecutionComponent } from './production-execution.component';

describe('ProductionExecutionComponent', () => {
  let component: ProductionExecutionComponent;
  let fixture: ComponentFixture<ProductionExecutionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProductionExecutionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductionExecutionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
