import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-budget-box',
  templateUrl: './budget-box.component.html',
  styleUrls: ['./budget-box.component.css']
})
export class BudgetBoxComponent implements OnChanges {
  @Input() presupuesto: number = 0;
  @Input() valorTotal: number = 0;
  
  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
      if(changes['presupuesto'])
      {
        console.log('Presupuesto recibido'+ this.presupuesto)
      }
      if(changes['valorTotal'])
      {
        console.log('Valor total recibido'+ this.valorTotal)
      }
  }
}