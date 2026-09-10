

function Alliance(cfg) {
  this.tab = cfg.tab || '';
  this.token = cfg.token;
  this.loca = cfg.loca;
  this.tabs = ['overview', 'management', 'broadcast', 'applications', 'classselection', 'createNewAlliance', 'handleApplication', 'allianceOverview', 'allianceMembers'];
  this.initMap = {
    'overview': this.initOverview.bind(this),
    'management': this.initManagement.bind(this),
    'applications': this.initApplication.bind(this),
    'broadcast': this.initBroadcast.bind(this),
    'classselection': this.initClasses.bind(this),
    'createNewAlliance': this.initCreateAlliance.bind(this),
    'handleApplication': this.initHandleApplication.bind(this),
    'allianceOverview': this.initAllianceOverview.bind(this),
    'allianceMembers': this.initAllianceMembers.bind(this)
  };

  if (this.initMap[this.tab]) {
    this.initMap[this.tab](cfg);
  }
} // general


Alliance.prototype.displayErrors = function (errors) {
  // only display the first error
  if (!errors || !Array.isArray(errors) || errors.length === 0) {
    fadeBox('An error occurred', true);
    return;
  }

  let error = errors[0];
  if (error && error.message) {
    fadeBox(error.message, true);
  } else {
    fadeBox('An error occurred', true);
  }
};

Alliance.prototype.initCommon = function (cfg) {
  this.taskWrapper = $('#alliancecomponent .alliance_wrapper');
  this.loadingIndicator = this.taskWrapper.ogameLoadingIndicator();
  this.allianceContent = $('#alliancecomponent .allianceContent');
  this.titlebar = $('#alliancecomponent #tab-ally');
  this.titlebar.on('click', '.overview', this.onClickTab.bind(this));
  this.titlebar.on('click', '.management', this.onClickTab.bind(this));
  this.titlebar.on('click', '.broadcast', this.onClickTab.bind(this));
  this.titlebar.on('click', '.applications', this.onClickTab.bind(this));
  this.titlebar.on('click', '.classselection', this.onClickTab.bind(this));
};

Alliance.prototype.initCommonWithout = function (cfg) {
  this.taskWrapper = $('#alliancecomponent .alliance_wrapper');
  this.loadingIndicator = this.taskWrapper.ogameLoadingIndicator();
  this.allianceContent = $('#alliancecomponent .allianceContent');
  this.titlebar = $('#alliancecomponent #tab-ally');
  this.titlebar.on('click', '#isNewApplication', this.onClickTab.bind(this));
};

Alliance.prototype.refreshContent = function (htmlItems) {
  this.allianceContent.html(htmlItems);
};

Alliance.prototype.onAjaxDone = function () {
  this.loadingIndicator.hide();
  let that = this;

  switch (this.tab) {
    case 'createNewAlliance':
      $('#form_createAlly .createAlly').bind('click', that.onClickCreateAlliance.bind(that));
      // URL is now set in onFetch from AJAX response
      break;

    case 'handleApplication':
      // URLs are now set in onFetch from AJAX response
      $('#writeapplication .sendNewApplication').bind('click', that.onClickSendApplication.bind(that));
      $('.bewerbung .cancelApplication').bind('click', that.onClickCancelApplication.bind(that));
      break;

    case 'overview':
      $('.kickMemberButton').each(function () {
        $(this).bind('click', that.onClickKickMember.bind(that));
      });
      $('#kickMemberForm .cancel').bind('click', that.onClickKickMemberCancel.bind(that));
      $('#kickMemberForm .submit').bind('click', that.onClickKickMemberSubmit.bind(that));
      $('#form_assignRank .assignRank').bind('click', that.onClickAssignRankSubmit.bind(that));
      $('#leaveAlly .leaveAlly').bind('click', that.onClickLeaveAlliance.bind(that));
      // URLs are now set in onFetch from AJAX response
      break;

    case 'management':
      $('#form_newRank .createRank').bind('click', that.onClickCreateRank.bind(that));
      $('#form_allyRankRights .editRank').bind('click', that.onClickUpdateRank.bind(that));
      $('.delete-rank .deleteRank').each(function () {
        $(this).bind('click', that.onClickDeleteRank.bind(that));
      });
      $('#form_internAllyText .submitText').bind('click', that.onClickUpdateAllianceText.bind(that));
      $('#form_externAllyText .submitText').bind('click', that.onClickUpdateAllianceText.bind(that));
      $('#form_candidacyText .submitText').bind('click', that.onClickUpdateAllianceText.bind(that));
      $('#allySettings .saveSetting').bind('click', that.onClickUpdateSettings.bind(that));
      $('#form_newTag .newTag').bind('click', that.onClickSubmitTag.bind(that));
      $('#form_newName .newName').bind('click', that.onClickSubmitName.bind(that));
      $('#dissolveally .dissolve').bind('click', that.onClickSubmitDisolve.bind(that));
      $('#assignally .transferLeadership').bind('click', that.onClickSubmitTransferLeadership.bind(that));
      $('#assignally .takeoverLeadership').bind('click', that.onClickSubmitTakeoverLeadership.bind(that));
      // URLs are now set in onFetch from AJAX response
      break;

    case 'applications':
      $('.action_icons .action').each(function () {
        switch ($(this).data('type')) {
          case 'deny':
            $(this).bind('click', that.onClickDenyApplication.bind(that));
            break;

          case 'accept':
            $(this).bind('click', that.onClickAcceptApplication.bind(that));
            break;
        }
      });
      $(".members form").each(function () {
        $(this).find('.accept').bind('click', that.onFormClickAcceptApplication.bind(that));
        $(this).find('.deny').bind('click', that.onFormClickDenyApplication.bind(that));
      });
      // URLs are now set in onFetch from AJAX response
      break;

    case 'broadcast':
      $("#submitMail").bind('click', that.onFormClickBroadcastButton.bind(that));
      // URLs are now set in onFetch from AJAX response
      break;
  }
};

Alliance.prototype.initCreateAlliance = function (cfg) {
  this.initCommonWithout(cfg);
  this.urlCreateAlliance = cfg.urlCreateAlliance;
  this.fetchNewAlliance();
};

Alliance.prototype.initHandleApplication = function (cfg) {
  this.initCommonWithout(cfg);
  this.appliedAllyId = cfg.appliedAllyId;
  this.urlSendApplication = cfg.urlSendApplication;
  this.urlCancelApplication = cfg.urlCancelApplication;
  this.fetchNewApplication();
};

Alliance.prototype.initAllianceOverview = function (cfg) {
  this.initCommon(cfg);
  this.fetch(this.tab);
};

Alliance.prototype.initAllianceMembers = function (cfg) {
  this.initCommon(cfg);
  this.fetch(this.tab);
};

Alliance.prototype.initOverview = function (cfg) {
  this.initCommon(cfg);
  this.urlKickMember = cfg.urlKickMember;
  this.urlSubmitRanks = cfg.urlSubmitRanks;
  this.urlLeaveAlliance = cfg.urlLeaveAlliance;
  this.fetch(this.tab);
};

Alliance.prototype.initManagement = function (cfg) {
  this.initCommon(cfg);
  this.urlCreateRank = cfg.urlCreateRank;
  this.urlUpdateRank = cfg.urlUpdateRank;
  this.urlDeleteRank = cfg.urlDeleteRank;
  this.urlUpdateAllianceText = cfg.urlUpdateAllianceText;
  this.urlUpdateSettings = cfg.urlUpdateSettings;
  this.urlUpdateTag = cfg.urlUpdateTag;
  this.urlUpdateName = cfg.urlUpdateName;
  this.urlDissolve = cfg.urlDissolve;
  this.urlTransferLeadership = cfg.urlTransferLeadership;
  this.urlTakeoverLeadership = cfg.urlTakeoverLeadership;
  this.fetch(this.tab);
};

Alliance.prototype.initApplication = function (cfg) {
  this.initCommon(cfg);
  this.urlAccept = cfg.urlAccept;
  this.urlDeny = cfg.urlDeny;
  this.urlReport = cfg.urlReport;
  this.fetch(this.tab);
};

Alliance.prototype.initBroadcast = function (cfg) {
  this.initCommon(cfg);
  this.urlSend = cfg.urlSend;
  this.fetch(this.tab);
};

Alliance.prototype.initClasses = function (cfg) {
  this.initCommon(cfg);
  this.fetch(this.tab);
};

Alliance.prototype.onClickCreateRank = function (e) {
  e.preventDefault();
  let rankName = $('#form_newRank #newRankName').val();
  let params = {
    rankName: rankName,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlCreateRank, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickUpdateRank = function (e) {
  e.preventDefault();
  let params = {
    _token: this.token
  };
  $('#form_allyRankRights input[type="checkbox"]').each(function () {
    if ($(this).prop('checked')) {
      if (typeof params['rankId_' + $(this).data('rankid')] === 'undefined') {
        params['rankId_' + $(this).data('rankid')] = 0;
      }

      params['rankId_' + $(this).data('rankid')] = params['rankId_' + $(this).data('rankid')] + $(this).data('rankvalue');
    }
  });
  this.loadingIndicator.show();
  $.post(this.urlUpdateRank, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickDeleteRank = function (e) {
  e.preventDefault();
  let rankId = $(e.currentTarget).data('rankid');
  let params = {
    rankId: rankId,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlDeleteRank, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickUpdateAllianceText = function (e) {
  e.preventDefault();
  let allianceText = $(e.currentTarget).closest('form').find('.alliancetexts').val();
  let submitType = $(e.currentTarget).data('type');
  let params = {
    allianceText: allianceText,
    submitType: submitType,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlUpdateAllianceText, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickUpdateSettings = function (e) {
  e.preventDefault();
  let homepageUrl = $('#allySettings #homepageUrl').val();
  let logoUrl = $('#allySettings #logoUrl').val();
  let state = $('#allySettings #state').val();
  let foundername = $('#allySettings #foundername').val();
  let newcomerrankname = $('#allySettings #newcomerrankname').val();
  let language = $('#allySettings #languageSelectionDropdown').val();
  let params = {
    homepageUrl: homepageUrl,
    logoUrl: logoUrl,
    state: state,
    foundername: foundername,
    newcomerrankname: newcomerrankname,
    language: language,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlUpdateSettings, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickSubmitTag = function (e) {
  e.preventDefault();
  let newTag = $('#form_newTag #newTag').val();
  let params = {
    newTag: newTag,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlUpdateTag, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickSubmitName = function (e) {
  e.preventDefault();
  let newName = $('#form_newName #newName').val();
  let params = {
    newName: newName,
    _token: this.token
  };
  this.loadingIndicator.show();
  $.post(this.urlUpdateName, params, this.handleResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

Alliance.prototype.onClickSubmitDisolve = function (e) {
  e.preventDefault();
  let params = {
    _token: this.token
  };
  let that = this;
  this.loadingIndicator.show();
  errorBoxDecision(this.loca.LOCA_ALL_NETWORK_ATTENTION, this.loca.LOCA_NETWORK_ALLY_GIVEUP, this.loca.LOCA_ALL_YES, this.loca.LOCA_ALL_NO, function () {
    $.post(this.urlDissolve, params, that.handleResponse.bind(that)).done(that.onAjaxDone.bind(that));
  }, function () {
    that.loadingIndicator.hide();
  });
};