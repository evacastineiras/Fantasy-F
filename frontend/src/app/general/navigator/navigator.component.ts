import { Component, EventEmitter, OnInit, Output, Input } from '@angular/core';

@Component({
  selector: 'app-navigator',
  templateUrl: './navigator.component.html',
  styleUrls: ['./navigator.component.css']
})
export class NavigatorComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  
@Input() activeItem: string = 'inicio';
@Output() visualNav = new EventEmitter<string>();

setActive(item: string) {
  this.activeItem = item;
  this.visualNav.emit(item);
}
}
