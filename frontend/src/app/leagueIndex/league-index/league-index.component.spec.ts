import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueIndexComponent } from './league-index.component';

describe('LeagueIndexComponent', () => {
  let component: LeagueIndexComponent;
  let fixture: ComponentFixture<LeagueIndexComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeagueIndexComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueIndexComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
