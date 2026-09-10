
/**
 * @see http://obvcode.blogspot.de/2007/11/easiest-way-to-check-ie-version-with.html
 * @return {Number}
 */


function getIEVersion() {
  var version = 999;
  if (navigator.appVersion.indexOf("MSIE") != -1) version = parseFloat(navigator.appVersion.split("MSIE")[1]);
  return version;
}

ogame.tools = {
  /**
   * adds a hover effect to given selectors
   * @param {String} selector - selector with elements to apply the style to
   * @returns {undefined}
   */
  addHover: function (selector) {
    $(selector).on({
      mouseenter: function () {
        $(this).addClass("over");
      },
      mouseleave: function () {
        $(this).removeClass("over");
      }
    });
  },

  /**
   * shows a "to top" button on long pages
   *
   * @returns {undefined}
   */
  scrollToTop: function () {
    var $scrollToTop = $('.scroll_to_top');
    $(window).on('scroll.scrollToTop', function () {
      $('.scroll_to_top').css({
        visibility: $scrollToTop.offset().top > window.innerHeight ? 'visible' : 'hidden'
      }, 600);
    });
    $scrollToTop.on('click.scrollToTop', function () {
      $('body, html').animate({
        scrollTop: 0
      }, 600);
    });
  }
};
/**
 * Common UI Components, that are reused across the Game
 *
 **/

/**
 * Fill level bar display for storage rooms and cargo space
 *
 * @param barContainerClass
 * @param barClass
 * @param premiumBarClass - if additional premium bar is wanted
 *
 **/

function refreshBars(barContainerClass, barClass, premiumBarClass) {
  var $barContainer = $('.' + barContainerClass);
  $barContainer.each(function () {
    var $this = $(this),
        amountFull = $this.data('currentAmount'),
        capacity = $this.data('capacity'),
        wPercent = amountFull / capacity * 100,
        $bar = $this.find('.' + barClass);

    if (wPercent > 100) {
      wPercent = 100;
    } else if (wPercent == 0) {
      wPercent = 0;
    } else if (wPercent < 1.3) {
      wPercent = 1.3;
    }

    $bar.css('width', wPercent + '%');

    if (wPercent < 90) {
      $bar.attr('class', barClass + ' filllevel_undermark');
    } else if (wPercent > 90 && wPercent < 100) {
      $bar.attr('class', barClass + ' filllevel_middlemark');
    } else {
      $bar.attr('class', barClass + ' filllevel_overmark');
    }

    if (premiumBarClass) {
      var $premiumBar = $this.find('.' + premiumBarClass),
          wPercentPremium = $premiumBar.data('premiumPercent');

      if (wPercent + wPercentPremium > 100) {
        wPercentPremium = 100 - wPercent;
      }

      $premiumBar.css('width', wPercentPremium + '%');
    }
  });
}