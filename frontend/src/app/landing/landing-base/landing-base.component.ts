import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-landing-base',
  templateUrl: './landing-base.component.html',
  styleUrls: ['./landing-base.component.css']
})
export class LandingBaseComponent implements OnInit, AfterViewInit {

  @ViewChild('videoPlayer') videoPlayer!:ElementRef<HTMLVideoElement>;

  showPlayButton: boolean = false;
  showLogin: boolean = true;

  constructor() { }

  ngOnInit(): void {}

  ngAfterViewInit() {
    const video = this.videoPlayer.nativeElement;
    video.muted = true;
    video.play().catch(() => {
      console.log('Autoplay falló, el usuario debe iniciar el video');
    });
  }

  onPlay() {
    this.showPlayButton = false;
    this.showLogin = true;
    
  }
}
