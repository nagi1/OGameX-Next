
function display_info(type) {
  if (document.getElementById("infoInput").innerHTML == "" || document.getElementById("infoInput").innerHTML != get_displayText(type)) {
    document.getElementById("infoInput").innerHTML = get_displayText(type);
  }
}

function display_error(type) {
  if (document.getElementById("errorInput").innerHTML == "" || document.getElementById("errorInput").innerHTML != get_errorText(type)) {
    document.getElementById("errorInput").innerHTML = get_errorText(type);
    document.getElementById("error").style.display = "block";
  }
}

function hide_error(type) {
  document.getElementById("errorInput").innerHTML = "";
  document.getElementById("error").style.display = "none";
}