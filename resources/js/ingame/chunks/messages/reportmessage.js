

function reportMessage(id, fromPlayer, toPlayer) {
  $.ajax({
    type: 'POST',
    url: '?page=reportSpam_ajax',
    dataType: 'json',
    data: {
      messageId: id,
      from: fromPlayer,
      to: toPlayer
    },
    success: function (data) {
      fadeBox(data.message, !data.result);
    },
    error: function () {}
  });
}

function reportAllyMessage(id, fromPlayer) {
  $.ajax({
    type: 'POST',
    url: '?page=reportSpam_ajax',
    dataType: 'json',
    data: {
      messageId: id,
      from: fromPlayer
    },
    success: function (data) {
      fadeBox(data.message, !data.result);
    },
    error: function () {}
  });
}

var elem, messageId, senderId;

function reportAllyRoundMessage(_elem, _messageId, _senderId, _question) {
  elem = _elem;
  messageId = _messageId;
  senderId = _senderId;
  errorBoxDecision(LocalizationStrings.attention, _question, LocalizationStrings.yes, LocalizationStrings.no, reportMessageCallback);
}

function reportMessageCallback() {
  elem.hide();
  reportAllyMessage(messageId, senderId);
}

function requestsReady() {
  $(document).on('click', '.acceptRequest', acceptRequest);
  $(document).on('click', '.rejectRequest', rejectRequest);
  $(document).on('click', '.cancelRequest', cancelRequest);
  $(document).on('click', '.reportRequest', reportRequest);
}