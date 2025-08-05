import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-landing-base',
  templateUrl: './landing-base.component.html',
  styleUrls: ['./landing-base.component.css']
})
export class LandingBaseComponent implements OnInit, AfterViewInit {

  @ViewChild('videoPlayer') videoPlayer!:ElementRef<HTMLVideoElement>;

  showPlayButton: boolean = true;
  showLogin: boolean = false;
  showRegister: boolean = false;

  constructor() { }

  ngOnInit(): void {}

  ngAfterViewInit() {
    const video = this.videoPlayer.nativeElement;
    video.muted = true;
    video.play().catch(() => {
      
    });
  }

  onPlay() {
    this.showPlayButton = false;
    this.showLogin = true;
    this.showRegister = false;
    
  }

  displayRegister()
  {
    this.showPlayButton = false;
    this.showLogin = false;
    this.showRegister = true;
  }
}
