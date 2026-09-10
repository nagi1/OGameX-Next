

function subscribeUser() {
  var applicationServerKey = urlB64ToUint8Array(applicationServerPublicKey);
  swRegistration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey
  }).then(function (subscription) {
    // console.log('User is subscribed.');
    updateSubscriptionOnServer(subscription);
    isSubscribed = true;
    updateBtn();
  })['catch'](function (err) {
    // console.log('Failed to subscribe the user: ', err);
    updateBtn();
  });
}

function unsubscribeUser() {
  swRegistration.pushManager.getSubscription().then(function (subscription) {
    if (subscription) {
      return subscription.unsubscribe();
    }
  })['catch'](function (error) {// console.log('Error unsubscribing', error);
  }).then(function () {
    updateSubscriptionOnServer(null); // console.log('User is unsubscribed.');

    isSubscribed = false;
    updateBtn();
  });
}

function updateSubscriptionOnServer(subscription) {
  if (subscription) {
    $.post("?page=ajax&component=subscription&action=subscribe", {
      subscription: JSON.stringify(subscription)
    });
  }
}

function initSubscriptionSystem() {
  pushButton = document.querySelector('.onoffswitch-checkbox');
  console.log(pushButton);

  if ('serviceWorker' in navigator && 'PushManager' in window) {
    // console.log('Service Worker and Push is supported');
    pushButton.setAttribute('disabled', 'disabled');
    pushButton.classList.add('disabled');
    console.log(pushButton);
    navigator.serviceWorker.register('sw.js').then(function (swReg) {
      // console.log('Service Worker is registered', swReg);
      swRegistration = swReg;
      initializeUI();
    })['catch'](function (error) {// console.error('Service Worker Error', error);
    });
  } else {
    // console.warn('Push messaging is not supported');
    pushButton.textContent = 'Push Not Supported';
  }
}