

function addUserToUnion() {
  $("#participantselect").append($("#buddyselect").find("li.ui-selected"));
}

function removeUserFromUnion() {
  $("#buddyselect").append($("#participantselect").find("li.ui-selected"));
}

function addUserToUnionByForm() {
  var user = $('#unionUserSearch').find('[name="addtogroup"]');
  var userName = user.val();
  var participant = $('#participantselect');

  if (participant.find('li[ref="' + userName + '"]').length == 0) {
    participant.append($(document.createElement('li')).attr('ref', userName).text(userName));
  }

  user.val('');
}

function setUnionUsers() {
  var unionUsers = '';
  $("#participantselect").find("li").each(function () {
    unionUsers += $(this).attr('ref') + ';';
  });
  unionUsers = unionUsers.substring(0, unionUsers.length - 1);
  $('#unionUsers').val(unionUsers);
}

function unionUser(response) {
  var data = $.parseJSON(response);

  if (data["status"]) {
    addUserToUnionByForm();
  } else {
    errorBoxAsArray(data["errorbox"]);
  }
}

function initFederationLayer() {
  $("#switch").click(function () {
    var searchFed = $("#searchFed");
    searchFed.find("> .wrap").toggle();
    searchFed.find("> #honorWarning").toggle();
  });
  $("#buddyselect, #participantselect").selectable({
    filter: "li:not(.undermark)"
  });
  $(document).undelegate('ul#buddyselect li', 'dblclick').delegate('ul#buddyselect li', 'dblclick', function () {
    addUserToUnion();
  }).undelegate('ul#participantselect li', 'dblclick').delegate('ul#participantselect li', 'dblclick', function () {
    removeUserFromUnion();
  });
}

function submit_unionform() {
  setUnionUsers();
  ajaxFormSubmit('unionform', $('form#unionform').attr('action'), unionEdit);
}