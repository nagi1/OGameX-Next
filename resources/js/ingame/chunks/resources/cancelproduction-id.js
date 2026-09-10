
var cancelProduction_id;
var production_listid;

function cancelProduction(id, listid, question) {
  cancelProduction_id = id;
  production_listid = listid;
  errorBoxDecision(loca.LOCA_ALL_NETWORK_ATTENTION, "" + question + "", loca.LOCA_ALL_YES, loca.LOCA_ALL_NO, cancelProductionStart);
}

function cancelProductionStart() {
  window.location.replace(urlCancleBuilding + '&techid=' + cancelProduction_id + '&listid=' + production_listid);
}