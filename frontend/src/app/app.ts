import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { AgeGateComponent } from './shared/components/age-gate.component';
import { AgeVerificationService } from './core/services/age-verification.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AgeGateComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private ageVerificationService = inject(AgeVerificationService);

  // Bind directly to service's signal for reactive updates
  ageVerified = this.ageVerificationService.ageVerified;

  onAgeVerified() {
    // Signal is already updated by the service
    // This handler can be used for additional actions if needed
  }
}
