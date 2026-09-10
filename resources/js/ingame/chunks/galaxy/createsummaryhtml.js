
/**
 * Generates the summary column for the imperium overview table
 *
 * @see createImperiumHtml()
 * @param array data
 * @return string
 */


function createSummaryHtml(data) {
  // Some variables we use
  var content = '';
  var planet = null;
  var value = 0;
  var i = 0;
  var key = '';
  content = content + '<div class="planetHead">' + '<div class="planetname">' + data.translations.summary + '</div>' + '<div class="planetImg"><img src="/img/icons/7efb2e73ca11d2344bbed43668da10.jpg"/></div>' + '<div class="planetData">' + '<ul>' + '<li class="coords textLeft"></li>' + '<li class="fields textRight"></li>' + '</ul>' + '</div>' + '<div class="clearfloat"></div>' + '</div>'; // Generate the content

  for (group in data.groups) {
    content = content + '<div class="row"></div>' + '<div class="values ' + group + ' group' + group + '">';

    for (i = 0; key = data.groups[group][i]; i++) {
      if (data.translations.planets[key] == null) {
        continue;
      }

      var production = {
        hourly: 0,
        daily: 0,
        weekly: 0
      };

      if (key == 'name') {
        value = data.translations.summary;
      } else {
        value = 0;

        if (group == "research") {
          if (!isNaN(data.planets[0][key])) {
            value = data.planets[0][key];
          }
        } else {
          $.each(data.planets, function () {
            planet = this;

            if (!isNaN(planet[key])) {
              value = value + parseInt(planet[key]);

              if (group == "supply" && !isNaN(planet['production']['hourly'][key - 1])) {
                production.hourly += planet['production']['hourly'][key - 1];
                production.daily += planet['production']['daily'][key - 1];
                production.weekly += planet['production']['weekly'][key - 1];
              }
            }
          });
        }
      }

      if (group == "supply" || group == "station") {
        value = "&#x00F8; " + tsdpkt(round(value / data.planets.length, 1));
      } else if (group == "items") {
        value = "&nbsp;";
      } else {
        value = tsdpkt(value);
      }

      if (group == "supply" && key != "name" && production.hourly > 0) {
        var tooltip = '<table>' + "<tr><td>" + data.translations.production.hourly + ':</td><td style=&quot;text-align: right;&quot;>' + tsdpkt(production.hourly) + "</td></tr>" + "<tr><td>" + data.translations.production.daily + ':</td><td style=&quot;text-align: right;&quot;>' + tsdpkt(production.daily) + "</td></tr>" + "<tr><td>" + data.translations.production.weekly + ':</td><td style=&quot;text-align: right;&quot;>' + tsdpkt(production.weekly) + "</td></tr></table>";
        tooltip = tooltip.replace(/</, "&lt;").replace(/>/, "&gt;");
        content = content + '<div class="tooltipRight ' + key + '" title="' + tooltip + '">' + value + '</div>';
      } else {
        content = content + '<div class="' + key + '">' + value + '</div>';
      }
    }

    content = content + '</div>';
  } // Add the outer div to the output


  content = '<div id="planet0" class="planet summary">' + content + '</div>';
  return content;
}
/**
 * Generates the first header column for the imperium table
 *
 * @see createImerpiumHtml()
 * @param array data
 * @return string
 */


function createHeaderHtml(data) {
  // Some variables we use
  var content = '';
  var i = 0;
  var key = '';
  content = content + '<div id="wrapTL">' + '<div id="tab-left">' + '<a id="planetsTab" href="javascript:void(0);" class="active" title="">' + '<span>' + data.translations['planetsTab'] + '</span>' + '</a>' + '<a id="moonsTab" href="javascript:void(0);" title="" class="">' + '<span>' + data.translations['moonsTab'] + '</span>' + '</a>' + '</div>' + '</div>'; // Generate the content

  for (group in data.groups) {
    content = content + '<div id="' + group + '" class="firstCat headers ' + group + ' headers' + group + '" group="' + group + '">' + '<h3 class="open">' + '<span>' + data.translations.groups[group] + '</span>' + '</h3>' + '<ul class="secondCat ' + group + ' group' + group + '">';

    for (i = 0; key = data.groups[group][i]; i++) {
      if (data.translations.planets[key] == null) {
        continue;
      }

      content += '<li class="' + key + '">';

      if (data.translations.planets[key + '_full'] != data.translations.planets[key]) {
        content += '<span class="tooltipLeft" title="' + data.translations.planets[key + '_full'] + '">' + data.translations.planets[key] + '</span>';
      } else {
        content += '<span>' + data.translations.planets[key] + '</span>';
      }

      content += '</li>';
    }

    content = content + '</ul>' + '</div>';
  } // Add the outer div to the output


  content = '<div id="empireTab">' + '<div class="wrapTab">' + '<div class="tab-part01"></div>' + '<h2>' + data.translations.header + '</h2>' + '<span class="reset"><img src="/img/icons/f805c477d15ae3131b7c39c7d70e48.gif" width="16" height="16"><a href="javascript:void(0);" onClick="clearImperiumOrder(); return false;">' + data.translations.reset + '</a></span>' + '<div class="wrapCorner"></div>' + '<br class="clearfloat"/>' + '</div>' + '</div>' + '<div class="header">' + content + '</div>'; // Return the content

  return content;
}
/**
 * Generates all the planet columns for the imperium overview table
 *
 * @see createImperiumHtml()
 * @param array data
 * @return string
 */


function createPlanetsHtml(data) {
  // Some basic variables we use
  var planet = '';
  var shortname = '';
  var content = '';
  var headerKey = '';
  var newContent = '';
  var i = 0;
  var key = ''; // Iterate over the planets

  $.each(data.planets, function () {
    planet = this;
    content = '';
    headerKey = '';
    shortname = planet.name.length > 13 ? planet.name.substr(0, 11) + '...' : planet.name;
    content += '<div class="planetHead">';

    if (planet.name != shortname) {
      content += '<div class="planetname tooltip" title="' + planet.name + '">' + shortname + '</div>';
    } else {
      content += '<div class="planetname">' + shortname + '</div>';
    }

    if (isMobile) {
      content += '<div class="planetImg"><img class="' + planet.border + '" src="' + planet.image + '"/></div>' + '<div class="planetData">' + '<div class="planetDataTop odd">' + '<ul>' + '<li class="coords textLeft"><a class="dark_highlight_tablet" href="' + planet.coordinatesLink + '" >' + planet.coordinates + '</a></li>' + '<li class="coords">' + '<span class="dark_highlight_tablet energy tooltipRight" title="' + (planet.type == 3 ? planet.diameterTooltip : planet.energyTooltip) + '">' + (planet.type == 3 ? "\u2300: " + planet.diameter : planet.energyDescr + planet.energy) + '</span>' + '</li>' + '</ul>' + '</div>' + '<div class="planetDataTop">' + '<ul class="planet_data_2">' + '<li class="fields textLeft">' + planet.fieldUsed + '/' + planet.fieldMax + '</li>' + '<li class="fields textLeft">' + planet.temperature + '</li>' + '</ul>' + '</div>' + '</div>' + '<div class="clearfloat"></div>' + '</div>';
    } else {
      content += '<div class="planetImg"><img class="' + planet.border + '" src="' + planet.image + '"/></div>' + '<div class="planetData">' + '<div class="planetDataTop odd">' + '<ul>' + '<li class="coords textLeft"><a href="' + planet.coordinatesLink + '" >' + planet.coordinates + '</a></li>' + '<li class="fields textRight">' + planet.fieldUsed + '/' + planet.fieldMax + '</li>' + '</ul>' + '</div>' + '<div class="planetDataTop">' + '<ul>' + '<li class="coords textLeft">' + (planet.type == 3 ? planet.diameterDescr : planet.energyDescr) + '</li>' + '<li class="coords textRight">' + (planet.type == 3 ? planet.diameter : planet.energy) + '</li>' + '</ul>' + '</div>' + '<div class="planetDataBottom odd">' + '<ul>' + '<li class="fields textCenter">' + planet.temperature + '</li>' + '</ul>' + '</div>' + '</div>' + '<div class="clearfloat"></div>' + '</div>';
    } // Generate the content


    for (var group in data.groups) {
      content = content + '<div class="row"></div>' + '<div class="values ' + group + ' group' + group + '">';

      for (i = 0; key = data.groups[group][i]; i++) {
        key = String(key); // We have some special html for this!

        if (planet[key + '_html'] != null) {
          key = key + '_html';
        } // Define the header key


        headerKey = key;

        if (key.substring(key.length - 5) == '_html') {
          headerKey = key.substring(0, key.length - 5);
        }

        content = content + '<div class="' + headerKey + '">' + planet[key] + '</div>';
      }

      content = content + '</div>';
    } // And add the planet to the planetlist


    newContent = newContent + '<div id="planet' + this.id + '" class="planet">' + content + '</div>';
  });
  return newContent;
}