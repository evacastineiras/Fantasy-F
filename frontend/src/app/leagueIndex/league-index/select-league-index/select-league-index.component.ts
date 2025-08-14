import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-select-league-index',
  templateUrl: './select-league-index.component.html',
  styleUrls: ['./select-league-index.component.css']
})
export class SelectLeagueIndexComponent implements OnInit {

  constructor() { }

   @Output() ligaPrivadaShow = new EventEmitter<void>();
   @Output() crearLigaShow = new EventEmitter<void>();

  ngOnInit(): void {
  }

  addToRandomLeague()
  {
    console.log('random league')
  }

  addToPrivateLeague()
  {
    this.ligaPrivadaShow.emit();
  }

  createLeague()
  {
    this.crearLigaShow.emit();
  }

}
