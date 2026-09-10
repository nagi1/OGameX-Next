
})(jQuery);

function loadFleetTemplates() {
  // First, ensure we're looking for the table in the right place
  // The overlay system might have cloned the content, so we need to find it
  var $tbody = null;

  // Try multiple selectors to find the table
  var $table = $('.ui-dialog:visible #fleetTemplates, #zeuch666:visible #fleetTemplates, #fleetTemplates').first();

  if ($table.length === 0) {
    console.warn('Template table not found, will retry...');
    // Retry after a short delay
    setTimeout(function() {
      loadFleetTemplates();
    }, 300);
    return;
  }

  $tbody = $table.find('tbody');

  $.get('/ajax/fleet/templates', function(response) {
    var templates = response.templates || [];

    // Find the tbody again in case the dialog was re-created
    $table = $('.ui-dialog:visible #fleetTemplates, #zeuch666:visible #fleetTemplates, #fleetTemplates').first();
    if ($table.length === 0) {
      return;
    }
    $tbody = $table.find('tbody');

    // Keep only the header row
    $tbody.find('tr:not(.separator)').remove();

    if (templates.length === 0) {
      var $row = $('<tr><td colspan="6" style="text-align: center;">No templates saved yet.</td></tr>');
      $tbody.append($row);
      return;
    }

    // Split templates into two columns
    var $row = $('<tr></tr>');
    var cellCount = 0;
    var displayIndex = 1; // For sequential display numbering

    templates.forEach(function(template) {
      if (cellCount >= 2) {
        $tbody.append($row);
        $row = $('<tr></tr>');
        cellCount = 0;
      }

      var $cell = $('<td colspan="3" style="padding: 5px;"></td>');
      var $tableInner = $('<table class="list" style="width: 100%;"><tr>' +
        '<th class="textCenter fleet_id" style="width: 30px;">' + displayIndex + '</th>' +
        '<th class="fleet_name">' + template.name + '</th>' +
        '<th class="fleet_actions" style="width: 80px;">' +
          '<a href="javascript:void(0);" class="tooltip icon_link editTpl" data-id="' + template.id + '" data-name="' + template.name + '" data-ships=\'' + JSON.stringify(template.ships) + '\' title="Edit">' +
            '<span class="icon icon_edit"></span>' +
          '</a>' +
          '<a href="javascript:void(0);" class="tooltip icon_link deleteTpl" data-id="' + template.id + '" title="Delete">' +
            '<span class="icon icon_trash"></span>' +
          '</a>' +
        '</th>' +
      '</tr></table>');

      $cell.append($tableInner);
      $row.append($cell);
      cellCount++;
      displayIndex++;
    });

    // Fill remaining cells if any
    while (cellCount < 2) {
      $row.append('<td colspan="3"></td>');
      cellCount++;
    }

    $tbody.append($row);

    // Bind click events for edit and delete
    $('.editTpl').off('click').on('click', function() {
      var id = $(this).data('id');
      var name = $(this).data('name');
      var ships = $(this).data('ships');
      setShipsFleet(ships, name, id);
      // Open edit overlay using the overlay system
      var $editOverlay = $('#fleetTemplatesEdit');
      if ($editOverlay.length > 0) {
        // Trigger click on a button that would open this overlay
        $('#addNewTpl').click();
        // The click above resets the form, so we need to set our values again
        setTimeout(function() {
          setShipsFleet(ships, name, id);
        }, 50);
      } else {
        $editOverlay.show();
      }
    });

    $('.deleteTpl').off('click').on('click', function() {
      var id = $(this).data('id');
      errorBoxDecision(LocalizationStrings.attention, 'Are you sure you want to delete this template?', LocalizationStrings.yes, LocalizationStrings.no, function() {
        deleteTemplate(id);
      });
    });

    $(".list tr:even").addClass("alt");
  });
}

function deleteTemplate(id) {
  $.ajax({
    url: '/ajax/fleet/templates/' + id,
    type: 'DELETE',
    headers: {
      'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
    },
    success: function(response) {
      if (response.success) {
        loadFleetTemplates();
        loadStandardFleetDropdown();
      } else {
        alert(response.message || 'Failed to delete template.');
      }
    },
    error: function() {
      alert('Failed to delete template.');
    }
  });
}

function initStandardFleet() {
  // Use event delegation on document to catch when the dialog opens
  $(document).on('dialogopen', '.ui-dialog', function(e) {
    var $dialog = $(e.target);
    if ($dialog.find('#fleetTemplates').length > 0 || $dialog.attr('aria-describedby') === 'zeuch666') {
      // Use cached templates if available for instant display
      if (cachedTemplates && cachedTemplates.length > 0) {
        populateTemplatesTable(cachedTemplates);
      } else {
        // Fallback to loading via AJAX if cache is empty
        setTimeout(loadFleetTemplates, 50);
      }
    }
  });

  // Handle save button click directly via AJAX
  $(document).off('click', '.standardFleetSubmit').on('click', '.standardFleetSubmit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    var $form = $("#submit_std");
    var templateId = $("#template_id").val();
    var templateName = $("#template_name").val();

    // Validate name
    if (!templateName || templateName.trim() === '') {
      errorBoxDecision(LocalizationStrings.attention, 'Please enter a template name.', LocalizationStrings.yes, LocalizationStrings.no, function() {});
      return;
    }

    // Build ships object from form inputs
    var ships = {};
    var totalShips = 0;
    $('input[name^="ship["]').each(function() {
      var match = $(this).attr('name').match(/\[(\d+)\]/);
      if (match) {
        var shipId = match[1];
        var value = parseInt($(this).val()) || 0;
        ships[shipId] = value;
        totalShips += value;
      }
    });

    if (totalShips === 0) {
      errorBoxDecision(LocalizationStrings.attention, 'Please add at least one ship to the template.', LocalizationStrings.yes, LocalizationStrings.no, function() {});
      return;
    }

    // Prepare data for AJAX
    var data = {
      template_id: templateId,
      template_name: templateName.trim(),
      ship: ships
    };

    $.ajax({
      url: '/ajax/fleet/templates',
      type: 'POST',
      data: data,
      headers: {
        'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
      },
      success: function(response) {
        if (response.success) {
          // Close the edit overlay
          $('.ui-dialog:has(#fleetTemplatesEdit)').find('.ui-dialog-titlebar-close').click();
          // Reset form immediately
          $form[0].reset();
          $("#template_id").val(0);
          $("#template_name").val('');
          // Reset all ship inputs
          $('input[name^="ship["]').val(0);
          // Reload templates list and dropdown after a short delay
          setTimeout(function() {
            loadFleetTemplates();
            loadStandardFleetDropdown();
          }, 200);
        } else {
          errorBoxDecision(LocalizationStrings.attention, response.message || 'Failed to save template.', LocalizationStrings.yes, LocalizationStrings.no, function() {});
        }
      },
      error: function(xhr) {
        var message = 'Failed to save template.';
        if (xhr.responseJSON && xhr.responseJSON.message) {
          message = xhr.responseJSON.message;
        }
        errorBoxDecision(LocalizationStrings.attention, message, LocalizationStrings.yes, LocalizationStrings.no, function() {});
      }
    });
  });

  $(".standardFleetReset").unbind('click').bind('click', function () {
    $(this).parents('form')[0].reset();
  });
  $('.changeFleet').unbind('click').bind('click', function () {
    $('.combatunits').val($(this).attr('rel')).trigger('change');
    $(this).parents('.ui-dialog').find('.ui-dialog-titlebar-close').click();
  });
}