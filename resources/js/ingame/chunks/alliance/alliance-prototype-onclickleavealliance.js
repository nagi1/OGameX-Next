

Alliance.prototype.onClickLeaveAlliance = function (e) {
  e.preventDefault();
  let params = {
    _token: this.token
  };
  let that = this;
  this.loadingIndicator.show();
  errorBoxDecision(this.loca.LOCA_ALL_NETWORK_ATTENTION, this.loca.locaAllyLeaveQuestion, this.loca.LOCA_ALL_YES, this.loca.LOCA_ALL_NO, function () {
    $.post(this.urlLeaveAlliance, params, that.handleResponse.bind(that)).done(that.onAjaxDone.bind(that));
  }, function () {
    that.loadingIndicator.hide();
  });
};

Alliance.prototype.onClickKickMember = function (e) {
  e.preventDefault();
  $('#kickMemberReasonText').val("");
  let data = $(e.currentTarget).attr('id').split('-');
  let id = data[1];
  $('#kickMemberId').val(id);
};

Alliance.prototype.onClickKickMemberCancel = function (e) {
  e.preventDefault();
  $('#kickMemberReason').dialog('destroy');
};

Alliance.prototype.onClickKickMemberSubmit = function (e) {
  e.preventDefault();
  let playerId = $('#kickMemberId').val();
  let reasonText = $('#kickMemberReasonText').val();
  this.submitKickMember(playerId, reasonText);
  $('#kickMemberReason').dialog('destroy');
};

Alliance.prototype.onClickAssignRankSubmit = function (e) {
  e.preventDefault();
  let memberRanks = {};
  $('select[name^="memberRanks"]').each(function () {
    memberRanks[$(this).attr('id')] = $(this).val();
  });
  this.submitRanks(memberRanks);
};

Alliance.prototype.submitRanks = function (memberRanks) {
  let params = {
    _token: this.token,
    memberRanks: memberRanks
  };
  this.loadingIndicator.show();
  $.post(this.urlSubmitRanks, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickCreateAlliance = function () {
  let createTag = $('#allyTagField').val();
  let createName = $('#allyNameField').val();
  let params = {
    tag: createTag,
    name: createName,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlCreateAlliance, params, this.handleResponse.bind(this))
    .done(this.onAjaxDone.bind(this))
    .fail(this.handleResponse.bind(this))
    .always(function() {
      this.loadingIndicator.hide();
    }.bind(this));
};

Alliance.prototype.onClickSendApplication = function (e) {
  e.preventDefault();
  let text = $('#writeapplication .alliancetexts').val();
  let params = {
    allianceId: this.appliedAllyId,
    applicationText: text,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlSendApplication, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickCancelApplication = function (e) {
  e.preventDefault();
  let params = {
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlCancelApplication, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.submitKickMember = function (playerId, reasonText) {
  let params = {
    playerId: playerId,
    reasonText: reasonText,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlKickMember, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickNewAlly = function (e) {
  e.preventDefault();

  if ($(e.currentTarget).parent().attr('disabled') !== 'disabled') {
    this.fetchNewAlliance();
  }
};

Alliance.prototype.onClickTab = function (e) {
  e.preventDefault();

  if ($(e.currentTarget).parent().attr('disabled') !== 'disabled') {
    this.tab = $(e.currentTarget).data('tab');
    this.fetch(this.tab);
  }
};

Alliance.prototype.fetchNewApplication = function () {
  this.tab = 'handleApplication';
  this.loadingIndicator.show();
  let data = {
    _token: this.token,
    appliedAllyId: this.appliedAllyId
  };
  let url = $('#alliancecomponent #isNewApplication').attr('rel');
  $.getJSON(url, data, this.onFetch.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.fetchNewAlliance = function () {
  this.tab = 'createNewAlliance';
  this.loadingIndicator.show();
  let data = {
    _token: this.token
  };
  let url = $('#alliancecomponent .createNewAlliance').attr('rel');
  $.getJSON(url, data, this.onFetch.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.fetch = function (targetTab) {
  let target = $('#alliancecomponent .' + targetTab);

  if (target.attr('rel') !== '') {
    this.loadingIndicator.show();
    let data = {
      _token: this.token
    };
    $.getJSON(target.attr('rel'), data, this.onFetch.bind(this)).done(this.onAjaxDone.bind(this));
    this.tabs.forEach(function (item) {
      let element = $('#alliancecomponent #tab-ally .' + item).parent();
      element.removeClass('aktiv');

      if (item === targetTab) {
        element.addClass('aktiv');
      }
    });
  }
};

Alliance.prototype.onFetch = function (data) {
  let htmlItems = data.content[data.target];
  this.updateToken(data.newAjaxToken);
  this.refreshContent(htmlItems);

  // Set URLs from AJAX response if available
  if (data.urlCreateAlliance) {
    this.urlCreateAlliance = data.urlCreateAlliance;
  }
  if (data.urlSendApplication) {
    this.urlSendApplication = data.urlSendApplication;
  }
  if (data.urlCancelApplication) {
    this.urlCancelApplication = data.urlCancelApplication;
  }
  // Overview tab URLs
  if (data.urlKickMember) {
    this.urlKickMember = data.urlKickMember;
  }
  if (data.urlSubmitRanks) {
    this.urlSubmitRanks = data.urlSubmitRanks;
  }
  if (data.urlLeaveAlliance) {
    this.urlLeaveAlliance = data.urlLeaveAlliance;
  }
  // Management tab URLs
  if (data.urlCreateRank) {
    this.urlCreateRank = data.urlCreateRank;
  }
  if (data.urlUpdateRank) {
    this.urlUpdateRank = data.urlUpdateRank;
  }
  if (data.urlDeleteRank) {
    this.urlDeleteRank = data.urlDeleteRank;
  }
  if (data.urlUpdateAllianceText) {
    this.urlUpdateAllianceText = data.urlUpdateAllianceText;
  }
  if (data.urlUpdateSettings) {
    this.urlUpdateSettings = data.urlUpdateSettings;
  }
  if (data.urlUpdateTag) {
    this.urlUpdateTag = data.urlUpdateTag;
  }
  if (data.urlUpdateName) {
    this.urlUpdateName = data.urlUpdateName;
  }
  if (data.urlDissolve) {
    this.urlDissolve = data.urlDissolve;
  }
  if (data.urlTransferLeadership) {
    this.urlTransferLeadership = data.urlTransferLeadership;
  }
  if (data.urlTakeoverLeadership) {
    this.urlTakeoverLeadership = data.urlTakeoverLeadership;
  }
  // Applications tab URLs
  if (data.urlAccept) {
    this.urlAccept = data.urlAccept;
  }
  if (data.urlDeny) {
    this.urlDeny = data.urlDeny;
  }
  if (data.urlReport) {
    this.urlReport = data.urlReport;
  }
  // Broadcast tab URLs
  if (data.urlSend) {
    this.urlSend = data.urlSend;
  }
};

Alliance.prototype.updateToken = function (newtoken) {
  this.token = newtoken;
  token = newtoken;
};

Alliance.prototype.refreshTabs = function (tabsObj) {
  if (tabsObj.applications.applicationCount >= 1) {
    $('.' + tabsObj.applications.tab + ' #applicationTab').removeClass('undermark').addClass('undermark');
    $('.' + tabsObj.applications.tab + ' #applicationTab span').removeClass('undermark').addClass('undermark').html("(" + tabsObj.applications.applicationCount + ")");
  } else {
    $('.' + tabsObj.applications.tab + ' #applicationTab').removeClass('undermark');
    $('.' + tabsObj.applications.tab + ' #applicationTab span').removeClass('undermark').html("");
  }
};

Alliance.prototype.onClickDenyApplication = function (e) {
  e.preventDefault();
  let playerId = $(e.currentTarget).data('playerid');
  this.submitDenyApplication(playerId);
};

Alliance.prototype.submitDenyApplication = function (playerId) {
  let params = {
    playerId: playerId,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlDeny, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onFormClickDenyApplication = function (e) {
  e.preventDefault();
  let playerId = $(e.currentTarget).data('playerid');
  let reasonText = $(e.currentTarget).closest("form").find('.alliancetexts').val();
  let params = {
    playerId: playerId,
    reasonText: reasonText,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlDeny, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickAcceptApplication = function (e) {
  e.preventDefault();
  let playerId = $(e.currentTarget).data('playerid');
  this.submitAcceptApplication(playerId);
};

Alliance.prototype.submitAcceptApplication = function (playerId) {
  let params = {
    playerId: playerId,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlAccept, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onFormClickAcceptApplication = function (e) {
  e.preventDefault();
  let playerId = $(e.currentTarget).data('playerid');
  let reasonText = $(e.currentTarget).closest("form").find('.alliancetexts').val();
  let params = {
    playerId: playerId,
    reasonText: reasonText,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlAccept, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.handleResponse = function (response) {
  // Handle both success and error callbacks
  let data;

  // If called from error callback (jqXHR object)
  if (response && response.responseJSON) {
    data = response.responseJSON;
    console.log('Alliance Error Response:', data);
  } else {
    // Handle both string and object responses
    data = typeof response === 'string' ? JSON.parse(response) : response;
  }

  let status = data.status || 'failure';

  if (data.newAjaxToken) {
    this.updateToken(data.newAjaxToken);
  }

  if (status === 'success') {
    if (data.redirectUrl !== undefined) {
      window.location = data.redirectUrl;
    } else {
      if (data.tabs !== undefined) {
        this.refreshTabs(data.tabs);
      }

      fadeBox(data.message, false);
      getAjaxEventbox();
      // Don't call getAjaxResourcebox() - alliance operations don't affect resources
      this.fetch(this.tab);
    }
  } else {
    console.log('Alliance operation failed:', {
      message: data.message,
      errors: data.errors,
      fullResponse: data
    });

    if (data.tabs !== undefined) {
      this.refreshTabs(data.tabs);
    }

    this.displayErrors(data.errors);
  }
};

Alliance.prototype.onFormClickBroadcastButton = function (e) {
  e.preventDefault();
  let rankIds = $('#selectNew').val();
  let broadcastText = $("#allianceBroadCast").find('.alliancetexts').val();
  let params = {
    rankIds: rankIds,
    broadcastText: broadcastText,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlSend, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};