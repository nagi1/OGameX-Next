
/*
 *	allgemeiner Countdown
 */


function oldcountdown(leftoverTime, maxDigits, countValue) {
  if (maxDigits == null || maxDigits == "") {
    maxDigits = 2;
  }

  var thisObj = this;
  thisObj.countValue = parseInt(countValue) || -1; // config

  thisObj.timestamp = 0;
  thisObj.maxDigits = parseInt(maxDigits); // bei 2 werden keine Sekunden gezeigt, wenn der Zeitraum > 1 h ist

  thisObj.delimiter = " "; // Trennzeichen

  thisObj.approx = ""; // wird vor Zeitstring angefuegt

  thisObj.showunits = true; // Einheiten zeigen

  thisObj.zerofill = false; // nullen auffuellen

  var localTime = new Date();
  thisObj.startTime = localTime.getTime(); // Script-Startzeit

  thisObj.startLeftoverTime = parseInt(leftoverTime); // Sekunden Restzeit

  this.getCurrentTimestring = function () {
    return formatTimeWrapper(thisObj.getLeftoverTime(), thisObj.maxDigits, thisObj.showunits, thisObj.delimiter, thisObj.zerofill, thisObj.approx);
  };

  this.getLeftoverTime = function () {
    var currTime = new Date();
    return Math.round(thisObj.startLeftoverTime + (currTime.getTime() - thisObj.startTime) * thisObj.countValue / 1000);
  };
}
/*
* Countdown fuer die Eventliste
*/


function eventboxCountdown(htmlObj, leftoverTime, parentElement, checkEventsUrl, checkEventIds) {
  if (typeof htmlObj !== 'object') {
    return;
  }

  var thisObj = this; // diese elemente werden veraendert

  thisObj.timeHtmlObj = htmlObj;

  this.updateCountdown = function () {
    thisObj.countdown.getCurrentTimestring();
    var timestamp = thisObj.countdown.getLeftoverTime();
    var timestring = thisObj.countdown.getCurrentTimestring();

    if (timestamp > 0) {
      $(thisObj.timeHtmlObj).html(timestring);
    } else {
      timerHandler.removeCallback(thisObj.timer);
      $(thisObj.timeHtmlObj).html(LocalizationStrings.status.ready); // checkEvents NICHT spammen:

      if (!timerHandler.checkEventsAlreadyQueued) {
        timerHandler.checkEventsAlreadyQueued = true;
        setTimeout(function () {
          $.post(checkEventsUrl, {
            ids: checkEventIds
          }, function (data) {
            var rowIDs = $.parseJSON(data);

            for (var index in rowIDs["rows"]) {
              $(parentElement).find("#eventRow-" + rowIDs["rows"][index]).remove();
              $(".union" + rowIDs["rows"][index]).remove();
            }

            $('.eventFleet').removeClass('odd');
            $('.partnerInfo').removeClass('part-even');
            $('.eventFleet:odd').addClass('odd');
            $('.partnerInfo:even').addClass('part-even');
            timerHandler.checkEventsAlreadyQueued = false;
          });
        }, 2500);
      } // else: wir sind noch innerhalb der 2,5 Sekunden vom letzten Aufruf (durch anderes Event)

    }
  };

  if (thisObj.timeHtmlObj) {
    // oldcountdown objekt
    thisObj.countdown = new oldcountdown(leftoverTime, 3);
    thisObj.timer = timerHandler.appendCallback(thisObj.updateCountdown);
    thisObj.updateCountdown();
  }
}
/*
* Einfacher Countdown mit Funktionsaufruf nach Ende des Countdowns
*/


function simpleCountdown(htmlObj, leftoverTime, countdownDoneFunction, countdownTickFunction) {
  if (typeof htmlObj !== 'object') {
    return;
  }

  var thisObj = this; // diese elemente werden veraendert

  thisObj.timeHtmlObj = $(htmlObj)[0];

  this.updateCountdown = function () {
    var timestamp = thisObj.countdownObject.getLeftoverTime();
    var timestring = thisObj.countdownObject.getCurrentTimestring();

    if (timestamp > 0) {
      $('#' + thisObj.timeHtmlObj.id).text(timestring);

      if (typeof countdownTickFunction == "string" && $.isFunction(window[countdownTickFunction])) {
        window[countdownTickFunction]();
      } else if ($.isFunction(countdownTickFunction)) {
        countdownTickFunction();
      }
    } else {
      timerHandler.removeCallback(thisObj.timer);
      $('#' + thisObj.timeHtmlObj.id).text(LocalizationStrings.status.ready);

      if (typeof countdownDoneFunction == "string" && $.isFunction(window[countdownDoneFunction])) {
        window[countdownDoneFunction]();
      } else if ($.isFunction(countdownDoneFunction)) {
        countdownDoneFunction();
      }
    }
  };

  if (typeof thisObj.timer != 'undefined') {
    timerHandler.removeCallback(thisObj.timer);
  }

  if (thisObj.timeHtmlObj) {
    // oldcountdown objekt
    thisObj.countdownObject = new oldcountdown(leftoverTime, 3);
    thisObj.timer = timerHandler.appendCallback(thisObj.updateCountdown);
    thisObj.updateCountdown();
  }
}

function countdownWithTickFunction(htmlObj, leftoverTime, totalTime, countdownDoneFunction, countdownTickFunction, maxDigits) {
  if (typeof htmlObj !== 'object') {
    return;
  }

  var thisObj = this; // diese elemente werden veraendert

  thisObj.timeHtmlObj = htmlObj;

  if (typeof $(htmlObj).attr("data-oldcountdown") != 'undefined') {
    timerHandler.removeCallback($(htmlObj).attr("data-oldcountdown"));
  }

  this.updateCountdown = function () {
    timestamp = thisObj.countdown.getLeftoverTime();
    timestring = thisObj.countdown.getCurrentTimestring();

    if (timestamp > 0) {
      thisObj.timeHtmlObj.innerHTML = timestring;

      if (typeof countdownTickFunction == "string" && $.isFunction(window[countdownTickFunction])) {
        window[countdownTickFunction](timestamp, totalTime);
      } else if ($.isFunction(countdownTickFunction)) {
        countdownTickFunction(timestamp, totalTime);
      }
    } else {
      timerHandler.removeCallback(thisObj.timer);
      thisObj.timeHtmlObj.innerHTML = LocalizationStrings.status.ready;

      if (typeof countdownDoneFunction == "string" && $.isFunction(window[countdownDoneFunction])) {
        window[countdownDoneFunction]();
      } else if ($.isFunction(countdownDoneFunction)) {
        countdownDoneFunction();
      }
    }
  };

  if (thisObj.timeHtmlObj) {
    // oldcountdown objekt
    thisObj.countdown = new oldcountdown(leftoverTime, maxDigits);
    thisObj.timer = timerHandler.appendCallback(thisObj.updateCountdown);
    thisObj.updateCountdown();
    $(htmlObj).attr("data-oldcountdown", thisObj.timer);
  }

  return thisObj;
}

function movementImageCountdown(htmlObj, leftoverTime, duration, isReturn, isRTL, routeLength) {
  if (typeof htmlObj !== 'object') {
    return;
  }

  var thisObj = this; // diese elemente werden veraendert

  thisObj.timeHtmlObj = htmlObj;

  this.updateCountdown = function () {
    thisObj.countdown.getCurrentTimestring();
    var timestamp = thisObj.countdown.getLeftoverTime();
    var timestring = thisObj.countdown.getCurrentTimestring();

    if (timestamp > 0) {
      percent = clampFloat(timestamp / duration, 0.0, 1.0);

      if (!isReturn) {
        pixel = Math.abs(routeLength - routeLength * percent);
      } else {
        pixel = Math.abs(routeLength * percent);
      }

      pixel = clampInt(Math.round(pixel), 0, routeLength);

      if (isRTL) {
        thisObj.timeHtmlObj.style['marginRight'] = pixel + 'px';
      } else {
        thisObj.timeHtmlObj.style['marginLeft'] = pixel + 'px';
      }
    }
  };

  if (thisObj.timeHtmlObj) {
    // oldcountdown objekt
    thisObj.countdown = new oldcountdown(leftoverTime, 3);
    timerHandler.appendCallback(thisObj.updateCountdown);
    thisObj.updateCountdown();
  }
}