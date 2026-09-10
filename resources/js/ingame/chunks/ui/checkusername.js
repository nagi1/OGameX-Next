

function checkUsername() {
  var username = document.forms['new'].elements['username'].value;

  if (username.length < 3 || username.length >= 20) {
    display_error("username");
  } else {
    hide_error();
  }
}

function checkEmail() {
  var email = document.forms['new'].elements['email'].value;
  validate = email.match(/[a-zA-Z0-9]+@+[a-zA-Z0-9]+[.]+[a-zA-Z0-9]{2,4}/);

  if (email.length < 3 || email.length >= 64 || !validate) {
    display_error("email");
  } else {
    hide_error();
  }
}