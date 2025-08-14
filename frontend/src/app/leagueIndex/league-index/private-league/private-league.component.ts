import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-private-league',
  templateUrl: './private-league.component.html',
  styleUrls: ['./private-league.component.css']
})
export class PrivateLeagueComponent implements OnInit {
  @Output() volverAtrasEvent = new EventEmitter<void>();
  constructor() { }

  ngOnInit(): void {
  }
  volverAtras()
  {
    this.volverAtrasEvent.emit();
  }
}
