

HappyEdit.prototype.onAjaxDone = function () {
  this.loadingIndicator.hide();
  let that = this;
  let lvlOfAll = $('#lvlOfAllBuilding');

  switch (this.tab) {
    case 'player':
      $('.triggerNews').bind('click', that.triggerNews.bind(that));
      $('.playerSubmit').bind('click', that.onClickSavePlayerData.bind(that));
      break;

    case 'buildings':
      $('.buildingsSubmit').bind('click', that.onClickSaveBuildingsData.bind(that));
      break;

    case 'research':
      $('.researchSubmit').bind('click', that.onClickSaveResearchData.bind(that));
      break;

    case 'ships':
      $('.shipsSubmit').bind('click', that.onClickSaveShipsData.bind(that));
      break;

    case 'defenses':
      $('.defenseSubmit').bind('click', that.onClickSaveDefensesData.bind(that));
      break;

    case 'planet':
      $('.planetSubmit').bind('click', that.onClickSavePlanetData.bind(that));
      $('#resetBashing .ajax').bind('click', that.onClickResetBashing.bind(that));
      break;

    case 'wreckfield':
      $('.wreckfieldSubmit').bind('click', that.onClickSaveWreckfieldData.bind(that));
      break;

    case 'rewards':
      $('.rewardsSubmit').bind('click', that.onClickSaveRewardsData.bind(that));
      break;

    case 'trader':
      $('#traderEdit .ajax').each(function () {
        $(this).bind('click', that.onItemClick.bind(that));
      });
      break;

    case 'fleet':
      $('.finishFleet').bind('click', that.onClickFinishFleet.bind(that));
      break;

    case 'lifeform':
      $('#lifeformSettings .lfdiscover').bind('click', that.submitDiscoverData.bind(that));
      $('.lifeformSettingsSubmit').bind('click', that.onClickSaveLifeformData.bind(that));
      break;

    case 'lfbuilding':
      lvlOfAll.bind('focus', function (e) {
        $(this).val('');
      });
      lvlOfAll.bind('keyup', function (e) {
        let that = this;
        let inputVal = $(that).val();

        if ($.isNumeric(inputVal) === false) {
          $(that).val('level of all');
        } else {
          $("#lfbuilding input.textInput").each(function () {
            $(this).val(inputVal);
          });
        }
      });
      $('.lifeformBuildingSubmit').bind('click', that.onClickSaveLifeformBuildingData.bind(that));
      break;

    case 'lfresearch':
      lvlOfAll.bind('focus', function (e) {
        $(this).val('');
      });
      lvlOfAll.bind('keyup', function (e) {
        let that = this;
        let inputVal = $(that).val();

        if ($.isNumeric(inputVal) === false) {
          $(that).val('level of all');
        } else {
          $("#lfresearch input.textInput").each(function () {
            $(this).val(inputVal);
          });
        }
      });
      $('#lfresearch .radioResearch').bind('focus', that.onClickSelectResearch.bind(that));
      $('#lfresearch .classSelector').bind('click', that.onClickSelectAllResearch.bind(that));
      $('.lifeformResearchSubmit').bind('click', that.onClickSaveLifeformResearchData.bind(that));
      break;

    case 'eventHandler':
      $('#eventHandlerSubmit').bind('click', that.onClickRestartEventHandler.bind(that));
      break;

    case 'buffs':
      $('#buffEditForm button.submit').bind('click', that.onClickSaveBuffs.bind(that));
      $('#buffEditForm input[type="datetime-local"]').bind('change', that.onChangeBuffTime.bind(that));
      break;

    case 'ipi':
      $('#ipiEdit .ajax').bind('click', that.onItemClick.bind(that));
      break;
  }
};