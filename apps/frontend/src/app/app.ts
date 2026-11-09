import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <main>
      <img [src]="logoUrl" alt="Flick logo served by the CDN" width="72" height="72">
      <p class="eyebrow">ANGULAR + EXPRESS + NGINX</p>
      <h1>Welcome to Flick.</h1>
      <p>A simple monorepo. Three independent containers.</p>
      <section aria-label="Service status">
        <div><span>Frontend</span><strong>Angular is running</strong></div>
        <div><span>Backend</span><strong role="status">{{ status() }}</strong></div>
        <div><span>CDN</span><a [href]="logoUrl">View static asset →</a></div>
      </section>
      <button type="button" (click)="checkBackend()">Check backend</button>
    </main>
  `,
})
export class App {
  private readonly http = inject(HttpClient);
  readonly logoUrl = `${environment.cdnUrl}/flick.svg`;
  readonly status = signal('Connecting…');

  constructor() {
    this.checkBackend();
  }

  checkBackend(): void {
    this.status.set('Connecting…');
    this.http.get<{ message: string }>(`${environment.apiUrl}/hello`).subscribe({
      next: ({ message }) => this.status.set(message),
      error: () => this.status.set('Backend unavailable'),
    });
  }
}
