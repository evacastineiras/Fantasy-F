import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetBoxComponent } from './budget-box.component';

describe('BudgetBoxComponent', () => {
  let component: BudgetBoxComponent;
  let fixture: ComponentFixture<BudgetBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BudgetBoxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BudgetBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
