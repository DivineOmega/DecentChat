
function populateMyDmAddress()
{
  var net = require('net');

  var client = net.connect({ port: 8881 }, function() {
    console.log('Connected (to get my DM address)');

  });
  client.on('data', function(data) {
    data = data.toString();

    if (data.startsWith('*')) {
      if (data.startsWith('*100')) {
        client.write('me\n');
      } else if (data.startsWith('*330')) {
        var dataParts = data.split('\n');
        localStorage.dmAddress = dataParts[1];
        $('#dmAddress').val(localStorage.dmAddress);
        console.log("Got my DM address");
        client.end();
      }
      return;
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

$(document).ready(function() {
    populateMyDmAddress();
    updateContactsUI();
});

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
