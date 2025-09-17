import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { initFirebase } from './app/firebase.init';
initFirebase();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
