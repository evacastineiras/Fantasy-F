import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrivateLeagueComponent } from './private-league.component';

describe('PrivateLeagueComponent', () => {
  let component: PrivateLeagueComponent;
  let fixture: ComponentFixture<PrivateLeagueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrivateLeagueComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrivateLeagueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
