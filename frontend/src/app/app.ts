import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { AgeGateComponent } from './shared/components/age-gate.component';
import { CountdownTimerComponent } from './shared/components/countdown-timer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AgeGateComponent, CountdownTimerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  // Track whether user has passed age verification
  ageVerified = signal(false);

  ngOnInit() {
    // Check localStorage for existing verification
    this.ageVerified.set(AgeGateComponent.isVerified());
  }

  onAgeVerified() {
    this.ageVerified.set(true);
  }
}
