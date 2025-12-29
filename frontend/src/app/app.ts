import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { AgeGateComponent } from './shared/components/age-gate.component';
import { GeoGateComponent } from './shared/components/geo-gate.component';
import { RetroFooterComponent } from './shared/components/retro-footer.component';
import { AgeVerificationService } from './core/services/age-verification.service';
import { GeoFenceService } from './core/services/geo-fence.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AgeGateComponent, GeoGateComponent, RetroFooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private ageVerificationService = inject(AgeVerificationService);
  private geoFenceService = inject(GeoFenceService);

  // Bind directly to service signals for reactive updates
  ageVerified = this.ageVerificationService.ageVerified;
  geoVerified = this.geoFenceService.geoVerified;
  geoFenceEnabled = this.geoFenceService.isEnabled();

  // Show app only when all gates are passed
  showApp = computed(() => {
    const ageOk = this.ageVerified();
    const geoOk = !this.geoFenceEnabled || this.geoVerified() === true;
    return ageOk && geoOk;
  });

  onAgeVerified() {
    // Signal is already updated by the service
  }

  onGeoVerified() {
    // Signal is already updated by the service
  }
}
