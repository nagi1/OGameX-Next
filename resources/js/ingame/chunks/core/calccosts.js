
/* ******** Code from Old Trader = Resource Trader ******* */


function calcCosts(id, amount) {
  return Math.ceil(amount * factor[offer_id] / factor[id]);
}

function calcInputFromCosts(id, amount) {
  return Math.max(Math.floor(amount / factor[offer_id] * factor[id]), 0);
}