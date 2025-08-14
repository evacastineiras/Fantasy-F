import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectLeagueIndexComponent } from './select-league-index.component';

describe('SelectLeagueIndexComponent', () => {
  let component: SelectLeagueIndexComponent;
  let fixture: ComponentFixture<SelectLeagueIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectLeagueIndexComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectLeagueIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
