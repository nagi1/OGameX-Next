
/*
 *
 *  Push Notifications codelab
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

/* eslint-env browser, es6 */
'use strict';

var pushButton = null;
var applicationServerPublicKey = 'BA_ADqzYuy45TlLLbSQcBmOwbjYYaU1snQM8UtO6ZLgUon7HAOELOS_Wnwyv4kAIARi2jrLmXxtDTnx7htApqyc';
var isSubscribed = false;
var swRegistration = null;

function urlB64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function initializeUI() {
  pushButton.addEventListener('click', function () {
    pushButton.disabled = true;

    if (isSubscribed) {
      unsubscribeUser();
    } else {
      subscribeUser();
    }
  }); // Set the initial subscription value

  swRegistration.pushManager.getSubscription().then(function (subscription) {
    isSubscribed = !(subscription === null);
    updateSubscriptionOnServer(subscription); // if (isSubscribed) {
    //     console.log('User IS subscribed.');
    // } else {
    //     console.log('User is NOT subscribed.');
    // }

    updateBtn();
  });
}