
  $(document).ready(function () {
    $('#mainmenucomponent li.has-sub > a').on('click', function () {
      $(this).removeAttr('href');
      var element = $(this).parent('li');

      if (element.hasClass('open')) {
        element.removeClass('open');
        element.find('li').removeClass('open');
        element.find('ul').slideUp(50);
      } else {
        element.addClass('open');
        element.children('ul').slideDown(50);
        element.siblings('li').children('ul').slideUp(50);
        element.siblings('li').removeClass('open');
        element.siblings('li').find('li').removeClass('open');
        element.siblings('li').find('ul').slideUp(50);
      }
    });
  });