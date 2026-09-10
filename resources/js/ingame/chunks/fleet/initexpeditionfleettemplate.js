

function initExpeditionFleetTemplate() {
  $(".list tr:even").addClass("alt");
  $("#expeditionFleetTemplateResetForm").on('click', function (event) {
    event.preventDefault();
    resetExpedtionFleetTemplateForm();
  });
}

function selectShipsPerFleet(templateId) {
  $('#expeditionFleetTemplateSelect').ogameDropDown('destroy');
  $('#expeditionFleetTemplateSelect').ogameDropDown();
  $('#expeditionFleetTemplateSelect').ogameDropDown('select', templateId);
  $('#expeditionFleetTemplateSelect').val(templateId).trigger('change');
  $('#expeditionFleetTemplates').parents('.ui-dialog').find('.ui-dialog-titlebar-close').click();
}

var editingTemplate = false;

function saveExpeditionFleetTemplate(event) {
  event.preventDefault();

  if (editingTemplate) {
    return;
  }

  editingTemplate = true;
  let expeditionFleetTemplateData = $('#expeditionFleetTemplateForm').serialize();
  expeditionFleetTemplateData += `&token=${token}`;
  expeditionFleetTemplateData += `&action=saveExpeditionTemplate`;
  $.ajax({
    url: fleetTemplateUrl,
    type: 'POST',
    data: expeditionFleetTemplateData,
    dataType: "json",
    success: function (response) {
      if (response.status === 'success') {
        showNotification(response.message, 'success');
        $('#expeditionFleetTemplateForm').parents('.ui-dialog').find('.ui-dialog-titlebar-close').click();
        $('div.ui-dialog[aria-describedby="expeditionFleetTemplatesEdit"]').remove();
        updateExpeditionFleetTemplates(response.expeditionFleetTemplates);
        reloadComponent('expeditionfleettemplate');
      } else {
        showNotification(response.errors[0].message, 'error');
      }

      token = response.newAjaxToken;
      editingTemplate = false;
    },
    error: function (e) {
      window.location.reload();
    }
  });
}

function deleteExpeditionFleetTemplate(id) {
  if (editingTemplate) {
    return;
  }

  editingTemplate = true;
  $.ajax({
    url: fleetTemplateUrl,
    type: 'POST',
    data: {
      "action": 'deleteExpeditionTemplate',
      "expeditionFleetTemplateId": id,
      "_token": token
    },
    dataType: "json",
    success: function (response) {
      if (response.status === 'success') {
        showNotification(response.message, 'success');

        if ($('div.ui-dialog[aria-describedby="expeditionFleetTemplatesEdit"]').length) {
          $('#expeditionFleetTemplateForm').parents('.ui-dialog').find('.ui-dialog-titlebar-close').click();
          $('div.ui-dialog[aria-describedby="expeditionFleetTemplatesEdit"]').remove();
        }

        updateExpeditionFleetTemplates(response.expeditionFleetTemplates);
        reloadComponent('expeditionfleettemplate');
      } else {
        showNotification(response.errors[0].message, 'error');
      }

      token = response.newAjaxToken;
      editingTemplate = false;
    },
    error: function (e) {
      window.location.reload();
    }
  });
}

function updateExpeditionFleetTemplates(newExpeditionFleetTemplates) {
  expeditionFleetTemplates = newExpeditionFleetTemplates;
  $('#expeditionFleetTemplateSelect').ogameDropDown('destroy');
  $('#expeditionFleetTemplateSelect option').each((idx, option) => {
    if (option.value !== '0') {
      $(option).remove();
    }
  });
  newExpeditionFleetTemplates.map(fleetTemplate => {
    $('#expeditionFleetTemplateSelect').append(`<option value="${fleetTemplate.id}">${fleetTemplate.name}</option>`);
  });
  $('#expeditionFleetTemplateSelect').ogameDropDown();
  $('#expeditionFleetTemplateSelect').val('0').trigger('change');
}

function resetExpedtionFleetTemplateForm() {
  $('#expeditionFleetTemplateForm')[0].reset();
  $('#expeditionFleetTemplateHoldingTimeSelect').val("1").ogameDropDown('select', "1");
  $('#expeditionFleetTemplateSpeedSelect').val("100").ogameDropDown('select', "100");
}

function setExpeditionFleetTemplateShips(ships, tempName, templateId, selectedExpeditionTime, selectedSpeed) {
  $('#expeditionFleetTemplateForm')[0].reset();
  $("#expeditionFleetTemplateId").val(templateId);
  $("#expeditionFleetTemplateName").val(tempName);

  for (let shipId in ships) {
    $("#expeditionFleetTemplateShip_" + shipId).val(ships[shipId]);
  }

  $('#expeditionFleetTemplateHoldingTimeSelect').val(selectedExpeditionTime.toString()).ogameDropDown('select', selectedExpeditionTime.toString());
  $('#expeditionFleetTemplateSpeedWarning').css({
    'display': 'none'
  });

  if (allowedSpeedsInExpeditionTemplate.indexOf(selectedSpeed) === -1) {
    $('#expeditionFleetTemplateSpeedWarning').css({
      'display': 'flex'
    });
  }

  let speedToSelect = allowedSpeedsInExpeditionTemplate.find(speed => speed >= selectedSpeed);
  $('#expeditionFleetTemplateSpeedSelect').val(speedToSelect.toString()).ogameDropDown('select', speedToSelect.toString());
}

function reinitializeExpeditionFleetTemplateOGameDropdown() {
  $('#expeditionFleetTemplateForm select').ogameDropDown('destroy');
  $('#expeditionFleetTemplateForm span.dropdown.currentlySelected').remove();
  $('#expeditionFleetTemplateForm select').ogameDropDown();
}
const FLEET_DISPATCH_PAGE1 = 'fleet1';
const FLEET_DISPATCH_PAGE2 = 'fleet2';