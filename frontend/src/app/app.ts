import { Component, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar.component';
import { IntroComponent } from './shared/components/intro.component';
import { AgeGateComponent } from './shared/components/age-gate.component';
import { GeoGateComponent } from './shared/components/geo-gate.component';
import { RetroFooterComponent } from './shared/components/retro-footer.component';
import { IntroService } from './core/services/intro.service';
import { AgeVerificationService } from './core/services/age-verification.service';
import { GeoFenceService } from './core/services/geo-fence.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, IntroComponent, AgeGateComponent, GeoGateComponent, RetroFooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private introService = inject(IntroService);
  private ageVerificationService = inject(AgeVerificationService);
  private geoFenceService = inject(GeoFenceService);

  // Bind directly to service signals for reactive updates
  introSeen = this.introService.introSeen;
  ageVerified = this.ageVerificationService.ageVerified;
  geoVerified = this.geoFenceService.geoVerified;
  geoFenceEnabled = this.geoFenceService.isEnabled();

  // Show app only when all gates are passed
  showApp = computed(() => {
    const introOk = this.introSeen();
    const ageOk = this.ageVerified();
    const geoOk = !this.geoFenceEnabled || this.geoVerified() === true;
    return introOk && ageOk && geoOk;
  });

  onIntroDismissed() {
    // Signal is already updated by the service
  }

  onAgeVerified() {
    // Signal is already updated by the service
  }

  onGeoVerified() {
    // Signal is already updated by the service
  }
}
