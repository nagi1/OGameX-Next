
function HappyEdit(cfg) {
  this.tab = cfg.tab || '';
  this.urlSubmitPlayer = cfg.urlSubmitPlayer;
  this.urlSubmitBuildings = cfg.urlSubmitBuildings;
  this.urlSubmitResearch = cfg.urlSubmitResearch;
  this.urlSubmitShips = cfg.urlSubmitShips;
  this.urlSubmitDefense = cfg.urlSubmitDefense;
  this.urlSubmitPlanet = cfg.urlSubmitPlanet;
  this.urlSubmitWreckfield = cfg.urlSubmitWreckfield;
  this.urlSubmitFleet = cfg.urlSubmitFleet;
  this.urlSubmitRewards = cfg.urlSubmitRewards;
  this.urlRestartEventHandler = cfg.urlRestartEventHandler;
  this.urlTriggerNews = cfg.urlTriggerNews;
  this.urlSubmitBuffs = cfg.urlSubmitBuffs;
  this.tabs = {
    player: cfg.urlFetchPlayerData || null,
    buildings: cfg.urlFetchBuildingsData || null,
    research: cfg.urlFetchResearchData || null,
    ships: cfg.urlFetchShipsData || null,
    defenses: cfg.urlFetchDefensesData || null,
    wreckfield: cfg.urlFetchWreckfieldData || null,
    rewards: cfg.urlFetchRewardsData || null,
    trader: cfg.urlFetchTraderData || null,
    planet: cfg.urlFetchPlanetData || null,
    fleet: cfg.urlFetchFleetData || null,
    eventHandler: cfg.urlFetchEventHandlerData || null,
    lifeform: cfg.urlFetchLifeformData || null,
    lfbuilding: cfg.urlFetchLifeformBuildingData || null,
    lfresearch: cfg.urlFetchLifeformResearchData || null,
    buffs: cfg.urlFetchBuffData || null,
    ipi: cfg.urlFetchIpiData || null
  };
  this.initItemsCommon(cfg);
  this.fetchData(this.tab);
}