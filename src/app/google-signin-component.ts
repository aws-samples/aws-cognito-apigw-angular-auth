import {Component, ElementRef, AfterViewInit} from '@angular/core';
import { AwsService } from '../app/aws.service';
import { Callback } from '../app/aws.service';

declare const gapi: any;

@Component({
  selector: 'google-signin',
  template: '<md-radio-button class="radio-button" id="google" value="google">Google</md-radio-button>'
})
export class GoogleSigninComponent implements AfterViewInit {
  //private clientId:string = '738519485992-fte4vuk3jeu03mme7lr93i69htgluq1e.apps.googleusercontent.com';
  clientId:string = this.awsService.googleId;
  private scope = [
    'profile',
    'email',
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/admin.directory.user.readonly'
  ].join(' ');

  public auth2: any;

  public googleInit() {        
    gapi.load('auth2', () => {
      this.auth2 = gapi.auth2.init({
        client_id: this.clientId,
        cookiepolicy: 'single_host_origin',
        scope: this.scope
      });
      this.attachSignin(this.element.nativeElement.firstChild);
    });
  }

  public attachSignin(element) {
    this.auth2.attachClickHandler(element, {},
      (googleUser) => {
        let profile = googleUser.getBasicProfile();
        //console.log('Token || ' + googleUser.getAuthResponse().id_token);
        let authResponse = googleUser.getAuthResponse();
        //console.log(authResponse);
        console.log("Authenticated to Google!")
        //console.log('ID: ' + JSON.stringify(profile));
        this.awsService.authenticateGoogle(authResponse,this.awsService.region,profile,this);
        this.awsService.authenticateGoogle(authResponse,this.awsService.region,profile,this);
      }, function (error) {
        console.log(JSON.stringify(error, undefined, 2));
      });
  }

  constructor(private element: ElementRef, public awsService:AwsService) {
    //console.log('ElementRef: ', this.element);
  }

  ngAfterViewInit() {
    this.googleInit();
  }

  googleCallback(creds: any, profile: any) {
    this.awsService.setGoogleCreds(creds);
    this.awsService.setGoogleProfile(profile);
  }
}