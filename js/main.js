
function populateMyDmAddress()
{
  var dmAddressStarted = false;
  var chunk = '';

  var net = require('net');

  var client = net.connect({ port: 8881 }, function() {
    console.log('Connected (to get dm address)');
  });
  client.on('data', function(data) {

    chunk += data.toString();
    delimIndex = chunk.indexOf('\n');

    while (delimIndex > -1) {
      toProcess = chunk.substring(0, delimIndex);

      if (dmAddressStarted === true) {
        localStorage.dmAddress = toProcess;
        $('#dmAddress').val(localStorage.dmAddress);
        console.log("Got my DM address");
        client.end();
        return;
      }

      if (toProcess.startsWith('*100')) {
        client.write('me\n');
      } else if (toProcess.startsWith('*330')) {
        dmAddressStarted = true;
      }

      chunk = chunk.substring(delimIndex + 1);
      delimIndex = chunk.indexOf('\n');
    }

  });
  client.on('end', function() {
    console.log('Disconnected');
  });

}

function sendMessage(dmAddress, message)
{
  var chunk = '';

  var net = require('net');

  var client = net.connect({ port: 8881 }, function() {
    console.log('Connected (to send message)');
  });
  client.on('data', function(data) {

    chunk += data.toString();
    delimIndex = chunk.indexOf('\n');

    while (delimIndex > -1) {
      toProcess = chunk.substring(0, delimIndex);

      if (toProcess.startsWith('*100')) {
        client.write('send\n');
      } else if (toProcess.startsWith('*101')) {
        client.write(dmAddress+'\n');
      } else if (toProcess.startsWith('*103')) {
        client.write('DecentChat Private Message\n');
      } else if (toProcess.startsWith('*104')) {
        client.write(message+'\n');
        client.write('.\n');
      } else if (toProcess.startsWith('*300')) {
        client.end();
        return;
      }

      chunk = chunk.substring(delimIndex + 1);
      delimIndex = chunk.indexOf('\n');
    }

  });
  client.on('end', function() {
    console.log('Disconnected');
  });

}

function getPersonalMessage(id)
{
  console.log(id);
  var chunk = '';
  var messageStarted = false;

  var net = require('net');

  var client = net.connect({ port: 8881 }, function() {
    console.log('Connected (to get personal message by ID)');
  });
  client.on('data', function(data) {

    chunk += data.toString();
    delimIndex = chunk.indexOf('\n');

    while (delimIndex > -1) {
      toProcess = chunk.substring(0, delimIndex);

      if (toProcess.startsWith('*311')) {
        client.end();
        return;
      }

      if (messageStarted === true && toProcess.length) {
        console.log(toProcess);
      }

      if (toProcess.startsWith('*100')) {
        client.write('get\n');
      } else if (toProcess.startsWith('*111')) {
        client.write(id+'\n');
      } else if (toProcess.startsWith('*310')) {
        messageStarted = true;
      }

      chunk = chunk.substring(delimIndex + 1);
      delimIndex = chunk.indexOf('\n');
    }

  });
  client.on('end', function() {
    console.log('Disconnected');
  });
}

function getPersonalMessageIDs()
{
  var chunk = '';
  var listStarted = false;

  var net = require('net');

  var client = net.connect({ port: 8881 }, function() {
    console.log('Connected (to get personal message IDs)');
  });
  client.on('data', function(data) {

    chunk += data.toString();
    delimIndex = chunk.indexOf('\n');

    while (delimIndex > -1) {
      toProcess = chunk.substring(0, delimIndex);

      if (toProcess.startsWith('*321')) {
        client.end();
        return;
      }

      if (listStarted === true) {
        getPersonalMessage(toProcess);
      }

      if (toProcess.startsWith('*100')) {
        client.write('list\n');
      } else if (toProcess.startsWith('*121')) {
        client.write('0\n');
      } else if (toProcess.startsWith('*320')) {
        listStarted = true;
      }

      chunk = chunk.substring(delimIndex + 1);
      delimIndex = chunk.indexOf('\n');
    }

  });
  client.on('end', function() {
    console.log('Disconnected');
  });
}

function getContacts()
{
  var contacts = null;

  try {
    contacts = JSON.parse(localStorage.contacts);
  } catch (e) {
    contacts = [];
  }

  return contacts;
}

function saveContacts(contacts)
{
  localStorage.contacts = JSON.stringify(contacts);
}

function addContact(name, dmAddress)
{
  var contacts = getContacts();

  var contact = { "name": name, "dmAddress": dmAddress };

  contacts.push(contact);

  saveContacts(contacts);
  updateContactsUI();
}

function deleteContact(index)
{
  var contacts = getContacts();

  contacts.splice(index, 1);

  saveContacts(contacts);
  updateContactsUI();
}

function updateContactsUI()
{
  var contacts = getContacts();

  $('#contactsList').html($('#contactsListStart').html());

  for (var i = 0; i < contacts.length; i++) {
    var contact = contacts[i];

    var html = $('#contactsListTemplate').html();

    html = html.replaceAll("[[name]]", contact.name);
    html = html.replaceAll("[[index]]", i);

    $('#contactsList').append(html);
  }
}

$(document).on('click', '#dmAddress', function() {
  $(this).select();
});

$(document).on('click', '#addContactButton', function() {
  var name = $('#nameToAdd').val();
  var dmAddress = $('#dmAddressToAdd').val();

  if (name && dmAddress) {
    addContact(name, dmAddress);
  }

  $('#nameToAdd').val('');
  $('#dmAddressToAdd').val('');
});

$(document).on('click', '.contactDeleteButton', function() {
  var id = $(this).attr('id');
  var idParts = id.split('_');
  var index = idParts[1];

  var contacts = getContacts();

  if (confirm('Delete your contact \''+contacts[index].name+'\'?')) {
    deleteContact(index);
  }
});

$(document).on('click', '.contactChatButton', function() {
  var id = $(this).attr('id');
  var idParts = id.split('_');
  var index = idParts[1];

  if ($('#chatTab_'+index+' a').length) {
    $('#chatTab_'+index+' a').tab('show');
    return;
  }

  var contacts = getContacts();
  var contact = contacts[index];

  var html = $('#chatTabTemplate').html();

  html = html.replaceAll("[[name]]", contact.name);
  html = html.replaceAll("[[index]]", index);

  $('#tabs').append(html);

  html = $('#chatTabPanelTemplate').html();

  html = html.replaceAll("[[name]]", contact.name);
  html = html.replaceAll("[[index]]", index);

  $('#tabPanels').append(html);

  $('#chatTab_'+index+' a').tab('show');

});

$(document).on('click', '.chatSendButton', function() {
  var id = $(this).attr('id');
  var idParts = id.split('_');
  var index = idParts[1];

  var contacts = getContacts();
  var contact = contacts[index];

  var message = $('#chatTextBox_'+index).val();

  $('#chatTextBox_'+index).val('');

  sendMessage(contact.dmAddress, message);
});

$(document).ready(function() {
    populateMyDmAddress();
    updateContactsUI();
    getPersonalMessageIDs();
});

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
