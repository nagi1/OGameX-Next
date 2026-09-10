
ogame.retrieveEmail = {
  send: function () {
    $.ajax({
      type: "POST",
      url: window.location.href + '&' + $.param({
        action: 'get'
      }),
      data: {
        username: $('#username').val(),
        password: $('#password').val()
      },
      dataType: "json",
      success: function (data) {
        $('#response').html(data.response).removeClass().addClass(data.type);
      }
    });
  }
};
$(document).ready(function () {
  $('#retrieveEmailComponent #username').off().keypress(function (event) {
    if (event.which == 13) {
      event.preventDefault();
      $('#retrieveEmailComponent #password').focus();
    }
  });
  $('#retrieveEmailComponent #password').off().keypress(function (event) {
    if (event.which == 13) {
      event.preventDefault();
      ogame.retrieveEmail.send();
    }
  });
  $('#retrieve').off().on('click', function () {
    ogame.retrieveEmail.send();
  });
});