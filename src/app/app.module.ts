import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
//import { MdInputModule, MdButtonModule, MdToolbarModule, MdCardModule, MdRadioModule, MdDialogModule, MdProgressSpinnerModule, MdChipsModule } from '@angular/material';
import { MaterialModule } from '@angular/material';
import { AwsService } from '../app/aws.service';
import { AppComponent } from './app.component';
import { GoogleSigninComponent } from './google-signin-component';

@NgModule({
  declarations: [
    AppComponent,
    GoogleSigninComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    BrowserAnimationsModule,
    MaterialModule //.forRoot()
    //MdInputModule,MdButtonModule, MdToolbarModule, MdCardModule, MdRadioModule, MdDialogModule, MdProgressSpinnerModule, MdChipsModule
  ],
  providers: [
    AwsService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
