
function closeDetails(id, expireTime) {
  var elem = $("#fleet" + id);
  elem.children(".openDetails").children().children().attr("src", "/img/icons/de1e5f629d9e47d283488eee0c0ede.gif");
  elem.children(".quantity").show();
  elem.removeClass("detailsOpened");
  elem.addClass("detailsClosed");
  currentMovementTabExtensionStates[id] = [0, expireTime]; // set to 0 == closed

  updateCookieStatus(currentMovementTabExtensionStates);
}

function openDetails(id, expireTime) {
  var elem = $("#fleet" + id);
  elem.children(".openDetails").children().children().attr("src", "/img/icons/577565fadab7780b0997a76d0dca9b.gif");
  elem.children(".quantity").hide();
  elem.removeClass("detailsClosed");
  elem.addClass("detailsOpened");
  currentMovementTabExtensionStates[id] = [1, expireTime]; // set to 0 == closed

  updateCookieStatus(currentMovementTabExtensionStates);
}

function updateCookieStatus(tabStates) {
  var stringifiedState = JSON.stringify(tabStates);
  var stringifiedOptions = JSON.stringify({
    expires: Math.round(new Date().getTime() / 1000) + 7 * 86400
  });
  $.cookie("tabBoxFleets", stringifiedState, stringifiedOptions);
}

function openCloseDetails(id, expireTime) {
  if ($("#fleet" + id).attr("class") == "fleetDetails detailsOpened") {
    closeDetails(id, expireTime);
  } else {
    openDetails(id, expireTime);
  }
}