

function formatTime(seconds) {
  var hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  var minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  if (minutes < 10) minutes = "0" + minutes;
  if (seconds < 10) seconds = "0" + seconds;
  return hours + ":" + minutes + ":" + seconds;
}

function round(x, n) {
  if (n < 1 || n > 14) return false;
  var e = Math.pow(10, n);
  var k = (Math.round(x * e) / e).toString();
  if (k.indexOf('.') == -1) k += '.';
  k += e.toString().substring(1);
  return k.substring(0, k.indexOf('.') + n + 1);
}

function show_hide_menus(element) {
  if ($(element).is(':visible')) {
    $(element).hide();
  } else {
    $(element).show();
  }
}

function change_class(ele) {
  if (document.getElementById(ele).className == "closed") {
    document.getElementById(ele).className = "opened";
  } else {
    document.getElementById(ele).className = "closed";
  }
}

function show_hide_tbl(id) {
  var el = document.getElementById(id);

  try {
    if (el) el.style.display = el.style.display == "none" ? "table-row" : "none";
  } catch (e) {
    // Der IE bis V7 kann kein table-row, deshalb Fallback auf 'Block'
    el.style.display = "block";
  }
}

function cntchar(inputField, m) {
  var $inputField = $(inputField);

  if ($inputField.val().length > m) {
    $inputField.val($inputField.val().substr(0, m));
  }

  $inputField.parents("form").find(".cntChars").text($inputField.val().length);
}