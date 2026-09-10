 //
// Item tabs general
//


HappyEdit.prototype.onClickTab = function (e) {
  e.preventDefault();

  if ($(e.currentTarget).parent().attr('disabled') !== 'disabled') {
    this.loadingIndicator.show();
    this.tab = $(e.currentTarget).data('tab');
    this.fetch(this.tab);
  }
};

HappyEdit.prototype.onFetch = function (data) {
  let htmlItems = data.content[data.target];
  this.refreshItems(htmlItems);
};

HappyEdit.prototype.fetch = function (targetTab) {
  const target = $('#happyeditcomponent .tabs .' + targetTab);

  if (target.attr('rel') !== '') {
    $.getJSON(target.attr('rel'), {}, this.onFetch.bind(this)).done(this.onAjaxDone.bind(this));
    Object.keys(this.tabs).forEach(item => {
      const element = $('#happyeditcomponent .tabs .' + item).parent();
      element.removeClass('active');

      if (item === targetTab) {
        element.addClass('active');
      }
    });
  }
};

HappyEdit.prototype.initItemsCommon = function (cfg) {
  this.itemsWrapper = $('#happyeditcomponent .wrapper');
  this.loadingIndicator = this.itemsWrapper.ogameLoadingIndicator();
  this.happyeditContent = $('#happyeditcomponent .content');
  this.titlebar = $('#happyeditcomponent .tabs');
  Object.keys(this.tabs).forEach(initTab => this.titlebar.on('click', '.' + initTab, this.onClickTab.bind(this)));
};