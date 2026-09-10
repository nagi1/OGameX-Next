

function getFilterClass(filterId) {
  let filterClass;

  switch (filterId) {
    case 'filter_empty':
      filterClass = '.empty_filter';
      break;

    case 'filter_inactive':
      filterClass = '.inactive_filter';
      break;

    case 'filter_vacation':
      filterClass = '.vacation_filter';
      break;

    case 'filter_strong':
      filterClass = '.strong_filter';
      break;

    case 'filter_newbie':
      filterClass = '.newbie_filter';
      break;
  }

  return filterClass;
}

function filterToggle(event) {
  let filterTarget = event.target;
  let filterClass = getFilterClass(filterTarget.id);
  filterTarget = $(filterTarget);

  if (filterTarget.hasClass('filter_active')) {
    filterTarget.removeClass('filter_active');
    $(filterClass).each(function (i, obj) {
      $(this).removeClass('filtered_' + $(event.target)[0].id);
    });
    sendFilterToggle($(event.target)[0].id, 0);
    event.stopPropagation();
  } else {
    filterTarget.addClass('filter_active');
    $(filterClass).each(function (i, obj) {
      $(this).addClass('filtered_' + $(event.target)[0].id);
    });
    sendFilterToggle($(event.target)[0].id, 1);
    event.stopPropagation();
  }
}

function sendFilterToggle(id, state) {
  $.ajax({
    type: 'POST',
    url: '?page=togglefilter',
    dataType: 'json',
    data: {
      id: id,
      state: state
    },
    success: function (data) {},
    error: function () {}
  });
}