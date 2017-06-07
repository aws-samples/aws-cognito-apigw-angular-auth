import { Injectable } from '@angular/core';
import {Http, Headers, Response} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import * as AWS from 'aws-sdk';
//import * as AWSCognito from 'amazon-cognito-identity-js';

//declare let AWS: any;
declare let AWSCognito: any;
declare let apigClientFactory: any;

export interface Callback {
  cognitoCallback(message: string, result: any):void;
  cognitoCallbackWithCreds(message: string, result: any, creds: any, data:any):void;
  googleCallback(creds: any, profile: any);
  googleCallbackWithData(data: any);
  testCallback(result:any, err:any);
}

@Injectable()
export class AwsService {
  token:any;
  googleCreds:any;
  googleProfile:any;
  googleData:any;
  userData:any;

 /************ RESOURCE IDENTIFIERS *************/

  googleId:string = 'XXXXXXXXXXXXXXXXXXXXXXXX.apps.googleusercontent.com';
  poolData = { 
        UserPoolId : 'XXXXXXXXXXXXXXXXXXXXXXXXXXX', //CognitoUserPool
        ClientId : 'XXXXXXXXXXXXXXXXXXXXXXXXXXX', //CognitoUserPoolClient 
        Paranoia : 7
    };
  identityPool:string = 'XXXXXXXXXXXXXXXXXXXXXXXXXXX'; //CognitoIdentityPool 
  apiURL:string = 'XXXXXXXXXXXXXXXXXXXXXXXXXXX';  //ApiUrl
  region:string = 'us-east-1'; //Region Matching CognitoUserPool region

 /*********************************************/

  constructor(private _http:Http) {
    AWS.config.update({
      region: this.region,
      credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: ''
      })
    });
    AWSCognito.config.region = this.region;
    AWSCognito.config.update({accessKeyId: 'null', secretAccessKey: 'null'});
   }

  setGoogleCreds(googleCreds){
    this.googleCreds=googleCreds;
  }

  getgoogleCreds(callback){
    callback.googleCallback(this.googleCreds);
    return this.googleCreds;
  }

  setGoogleProfile(googleProfile){
    this.googleProfile=googleProfile;
  }

  getgoogleProfile(callback){
    callback.googleCallback(this.googleProfile);
    return this.googleProfile;
  }

  getgoogleData(callback){
    callback.googleCallback(this.googleCreds,this.getgoogleProfile);
    let googleData = {
        awsCreds : this.googleCreds,
        googleProfile : this.getgoogleProfile
      };
    return googleData;
  }
  

  authenticateGoogle(authResult,region,profile,callback){
    // Add the Google access token to the Cognito credentials login map.
     AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: this.identityPool,
        Logins: {
           'accounts.google.com': authResult['id_token']
        }
     });

     // Obtain AWS credentials
     AWS.config.getCredentials(function(){
        // Access AWS resources here.
        let creds = {
          accessKey: AWS.config.credentials.accessKeyId,
          secretKey: AWS.config.credentials.secretAccessKey,
          sessionToken: AWS.config.credentials.sessionToken
        };
        let googleData = {
          awsCreds : creds,
          googleProfile : profile
        };
        callback.googleCallback(creds,profile);
      });

  }

  userInfoApiGoogle(accessKey,secretKey,sessionToken,name,surname,email,region,callback){
    let body = {
      name : name,
      surname : surname,
      email: email
    };

    let userData;

    let apigClient = apigClientFactory.newClient({
        accessKey: accessKey,
        secretKey: secretKey,
        sessionToken: sessionToken,
        region: region // The region where the API is deployed
    });
    apigClient.googlePost({},body,{})
      .then(function(response) {
        console.log("Send user data to API");
      }).catch(function (response) {
        console.log(response);
    });
    apigClient.googleGet({},{})
      .then(function(response) {
        console.log("Retrieve data from API");
        userData = response.data.Items[0];
        callback.googleCallbackWithData(userData);
      }).catch(function (response) {
        console.log(response);
      });
  }

  authenticateUserPool(user,password,callback){
    let authenticationData = {
      Username : user,
      Password : password,
      };
    let authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
    let userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
    let userData = {
        Username : user,
        Pool : userPool
    };
    let cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        let cognitoGetUser = userPool.getCurrentUser();
        callback.cognitoCallback(null, result);
        if (cognitoGetUser != null) {
          cognitoGetUser.getSession(function(err, result) {
            if (result) {
              console.log ("Authenticated to Cognito User Pools!");               
            }
          });
        }
      },
      onFailure: function(err) {
          callback.cognitoCallback(err, null);
      }
    });
  }

  getInfoApiUserPools(token):Observable<any>{
    let headers = new Headers();
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', token);
    return this._http.get(this.apiURL+"/cup", {headers: headers})
        .map(res => res.json().Items[0])
        .catch(this._serverError);

  }

  postInfoApiUserPools(token):Observable<any>{
    let headers = new Headers();
    let body = {};
    headers.append('Content-Type', 'application/json');
    headers.append('Authorization', token);
    return this._http.post(this.apiURL+"/cup",JSON.stringify(body), {headers: headers})
            .map(res => res.json())
            .catch(this._serverError);
  }

  authenticateIdentityPool(user,password,region,callback){
    let authenticationData = {
      Username : user,
      Password : password,
      };
    let authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
    let userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(this.poolData);
    let userData = {
        Username : user,
        Pool : userPool
    };
    let cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    let cognitoParams = {
      IdentityPoolId: this.identityPool,
      Logins: {}
    };
    let poolId = this.poolData.UserPoolId;
    
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        let cognitoGetUser = userPool.getCurrentUser();
        if (cognitoGetUser != null) {
          cognitoGetUser.getSession(function(err, result) {
            if (result) {
              console.log ("Authenticated to Cognito User and Identity Pools!");  
              let token = result.getIdToken().getJwtToken();
              cognitoParams.Logins["cognito-idp."+region+".amazonaws.com/"+poolId] = token;
              AWS.config.credentials = new AWS.CognitoIdentityCredentials(cognitoParams);
        
              // Obtain AWS credentials
              AWS.config.getCredentials(function(){
                  // Access AWS resources here.
                  let creds = {
                    accessKey: AWS.config.credentials.accessKeyId,
                    secretKey: AWS.config.credentials.secretAccessKey,
                    sessionToken: AWS.config.credentials.sessionToken
                  };
                  let additionalParams = {
                    headers: {
                      Authorization: token
                    }
                  };
                  let params = {};
                  let body = {};
                  let apigClient = apigClientFactory.newClient({
                      accessKey: AWS.config.credentials.accessKeyId,
                      secretKey: AWS.config.credentials.secretAccessKey,
                      sessionToken: AWS.config.credentials.sessionToken,
                      region: region // The region where the API is deployed
                  });
                  let apigClientJWT = apigClientFactory.newClient();
                  apigClientJWT.cipInfoGet({},{},additionalParams)
                    .then(function(response) {
                      body = response.data.Item;
                      console.log("Retrieving User Attributes from User Pool");
                      if (body != null){
                        apigClient.cipPost({},body,{})
                          .then(function(response) {
                            console.log("Send user data to API");
                          }).catch(function (response) {
                            console.log(response);
                        });
                      }
                    }).catch(function (response) {
                      console.log(response);
                    });

                  apigClient.cipGet(params,{})
                    .then(function(response) {
                      console.log("Retrieve data from API");
                      let data = response.data.Items[0];
                      callback.cognitoCallbackWithCreds(null, result, creds, data);
                    }).catch(function (response) {
                      console.log(response);
                    });
                  });             
            }
          });
        }
      },
      onFailure: function(err) {
          callback.cognitoCallback(err, null);
      }
    });

  }

  testAccess(data,provider,region,callback){
    let apigClient = apigClientFactory.newClient({
        accessKey: data.accessKey,
        secretKey: data.secretKey,
        sessionToken: data.sessionToken,
        region: region // The region where the API is deployed
    });
  
    if (provider=="google"){
      apigClient.googleGet({},{})
      .then(function(response) {
        console.log(response);
        console.log("Access to /google API Resource with current credentials GRANTED");
        callback.testCallback(response,null);
      }).catch(function (response) {
        console.log(response);
        console.log("Access to /google API Resource with current credentials DENIED");
        callback.testCallback(null,response);
      });
    }
    
    if (provider=="cup"){
      let apigClient = apigClientFactory.newClient();
      let additionalParams = {
        headers: {
          Authorization: data.token
        }
      };
      apigClient.cupGet({},{})
        .then(function(response) {
          console.log(response);
          console.log("Access to /cup API Resource with current credentials GRANTED");
          callback.testCallback(response,null);
        }).catch(function (response) {
          console.log(response);
          console.log("Access to /cup API Resource with current credentials DENIED");
          callback.testCallback(null,response);
        });
    }

    if (provider=="cip"){
      apigClient.cipGet({},{})
        .then(function(response) {
          console.log(response);
          console.log("Access to /cip API Resource with current credentials GRANTED");
          callback.testCallback(response,null);
        }).catch(function (response) {
          console.log(response);
          console.log("Access to /cip API Resource with current credentials DENIED");
          callback.testCallback(null,response);
        });
    }
  }

  private _serverError(err: any) {
        console.log('sever error:', JSON.stringify(err));  // debug
        if(err.status === 0){
            return Observable.throw(err.json().error || 'UNAUTHORIZED!!!');
        }
        if(err instanceof Response) {
          return Observable.throw(err.json().error || 'Backend Server Error');
        }
        // return Observable.throw(err || 'Backend Server Error');
    }

}
