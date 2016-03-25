
var localPort = 23500;
var peerPort = 23501;

function populateMyDmAddress()
{
  if ($('#dmAddress').val().length>0) {
    return;
  }

  var dmAddressStarted = false;
  var chunk = '';

  var net = require('net');

  var client = net.connect({ port: localPort }, function() {
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
        client.destroy();
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
  client.on('close', function() {
    console.log('Disconnected');
  });

  setTimeout(function() { populateMyDmAddress(); }, 5000);
}

function addDmNode(hostname, port)
{
  var chunk = '';

  var net = require('net');

  var client = net.connect({ port: localPort }, function() {
    console.log('Connected (to add bootstrap nodes)');
  });
  client.on('data', function(data) {

    chunk += data.toString();
    delimIndex = chunk.indexOf('\n');

    while (delimIndex > -1) {
      toProcess = chunk.substring(0, delimIndex);

      if (toProcess.startsWith('*100')) {
        client.write('node\n');
      } else if (toProcess.startsWith('*151')) {
        client.write(hostname+'\n');
      } else if (toProcess.startsWith('*152')) {
        client.write(port+'\n');
      } else if (toProcess.startsWith('*350')) {
        localStorage.bootstrapNodesAdded += hostname+':'+port+' ';
        console.log('Added bootstrap node: '+hostname+':'+port);
        client.destroy();
      }

      chunk = chunk.substring(delimIndex + 1);
      delimIndex = chunk.indexOf('\n');
    }

  });
  client.on('close', function() {
    console.log('Disconnected');
  });
}

function addBootstrapDmNodes()
{
  var bootstrapNodes = ['81.108.218.180:9991',
                        '82.69.78.184:9991',
                        '81.108.218.180:23501',
                        '82.69.78.184:23501'];

  for (var i = 0; i < bootstrapNodes.length; i++) {

    var bootstrapNode = bootstrapNodes[i];

    var bootstrapNodeParts = bootstrapNode.split(':');

    var hostname = bootstrapNodeParts[0];
    var port = bootstrapNodeParts[1];

    if (typeof localStorage.bootstrapNodesAdded != 'undefined') {
      if (localStorage.bootstrapNodesAdded.indexOf(hostname+':'+port) > -1) {
        continue;
      }
    } else {
      localStorage.bootstrapNodesAdded = '';
    }

    addDmNode(hostname, port);

  }

  setTimeout(function() { addBootstrapDmNodes(); }, 15000);

}

function sendMessage(dmAddress, message)
{
  var chunk = '';

  var net = require('net');

  var client = net.connect({ port: localPort }, function() {
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
        client.destroy();
        return;
      }

      chunk = chunk.substring(delimIndex + 1);
      delimIndex = chunk.indexOf('\n');
    }

  });
  client.on('close', function() {
    console.log('Disconnected');
  });

}

function processPersonalMessage(id, timestamp, dmAddress, subject, message)
{
  if (subject != 'DecentChat Private Message') {
    return;
  }

  deletePersonalMessage(id);

  if (message.trim() === '') {
    return;
  }

  var contacts = getContacts();
  var index = null;
  var contact = null;

  for (var i = 0; i < contacts.length; i++) {
    if (contacts[i].dmAddress == dmAddress) {
      contact = contacts[i];
      index = i;
      break;
    }
  }

  if (contact===null) {
    return;
  }

  addChatTabForContact(index);
  addChatTransaction(index, timestamp, contact.name, message);

}

function deletePersonalMessage(id)
{
  var chunk = '';

  var net = require('net');

  var client = net.connect({ port: localPort }, function() {
    console.log('Connected (to get delete personal message)');
  });
  client.on('data', function(data) {

    chunk += data.toString();
    delimIndex = chunk.indexOf('\n');

    while (delimIndex > -1) {
      toProcess = chunk.substring(0, delimIndex);

      if (toProcess.startsWith('*100')) {
        client.write('delete\n');
      } else if (toProcess.startsWith('*141')) {
        client.write(id+'\n');
      } else if (toProcess.startsWith('*340')) {
        client.destroy();
      }

      chunk = chunk.substring(delimIndex + 1);
      delimIndex = chunk.indexOf('\n');
    }

  });
  client.on('close', function() {
    console.log('Disconnected');
  });
}

function getPersonalMessage(id)
{
  var chunk = '';
  var messageStarted = false;
  var messagePartCount = 0;
  var timestamp = null;
  var dmAddress = null;
  var subject = null;
  var message = '';

  var net = require('net');

  var client = net.connect({ port: localPort }, function() {
    console.log('Connected (to get personal message by ID)');
  });
  client.on('data', function(data) {

    chunk += data.toString();
    delimIndex = chunk.indexOf('\n');

    while (delimIndex > -1) {
      toProcess = chunk.substring(0, delimIndex);

      if (toProcess.startsWith('*311')) {
        processPersonalMessage(id, timestamp, dmAddress, subject, message);
        client.destroy();
        return;
      }

      if (messageStarted === true && toProcess.length) {
        if (messagePartCount === 0) {
          timestamp = toProcess;
        } else if (messagePartCount === 1) {
          dmAddress = toProcess;
        } else if (messagePartCount === 2) {
          subject = toProcess;
        } else if (messagePartCount >= 3) {
          message += toProcess + '\n';
        }
        messagePartCount++;
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
  client.on('close', function() {
    console.log('Disconnected');
  });
}

function getPersonalMessageIDs()
{
  var chunk = '';
  var listStarted = false;

  var net = require('net');

  var client = net.connect({ port: localPort }, function() {
    console.log('Connected (to get personal message IDs)');
  });
  client.on('data', function(data) {

    chunk += data.toString();
    delimIndex = chunk.indexOf('\n');

    while (delimIndex > -1) {
      toProcess = chunk.substring(0, delimIndex);

      if (toProcess.startsWith('*321')) {
        client.destroy();
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
  client.on('close', function() {
    console.log('Disconnected');
  });

  setTimeout(function() { getPersonalMessageIDs(); }, 1000);
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

    html = html.replaceAll("[[name]]", htmlEntities(contact.name));
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

  addChatTabForContact(index);

  $('#chatTab_'+index+' a').tab('show');
  $('#chatTextBox_'+index).focus();

});

$(document).on('click', '.chatTab', function() {
  var id = $(this).attr('id');
  var idParts = id.split('_');
  var index = idParts[1];

  $('#chatTextBox_'+index).focus();
});

function addChatTabForContact(index) {

  var contacts = getContacts();
  var contact = contacts[index];

  if ($('#chatTab_'+index+' a').length) {
    $('#chatTab_'+index+' a').tab('show');
    return;
  }

  var html = $('#chatTabTemplate').html();

  html = html.replaceAll("[[name]]", htmlEntities(contact.name));
  html = html.replaceAll("[[index]]", index);

  $('#tabs').append(html);

  html = $('#chatTabPanelTemplate').html();

  html = html.replaceAll("[[name]]", htmlEntities(contact.name));
  html = html.replaceAll("[[index]]", index);

  $('#tabPanels').append(html);

}

$(document).on('keypress', '.chatTextBox', function(e) {
  if (e.keyCode == 13) {
    var id = $(this).attr('id');
    var idParts = id.split('_');
    var index = idParts[1];

     $('#chatSendButton_'+index).trigger('click');
   }
});

$(document).on('click', '.chatSendButton', function() {
  var id = $(this).attr('id');
  var idParts = id.split('_');
  var index = idParts[1];

  var contacts = getContacts();
  var contact = contacts[index];

  var message = $('#chatTextBox_'+index).val();

  if (message.trim() === '') {
    return;
  }

  $('#chatTextBox_'+index).val('');

  sendMessage(contact.dmAddress, message);
  addChatTransaction(index, Date.now(), "Me", message);

});

function htmlEntities(rawStr)
{
  var encodedStr = rawStr.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
     return '&#'+i.charCodeAt(0)+';';
  });

  return encodedStr;
}

function addChatTransaction(index, timestamp, name, message)
{
  var datetime = new Date(parseInt(timestamp));
  var datetimeString = datetime.toLocaleTimeString() + ' ' + datetime.toLocaleDateString();

  var html = $('#chatTransactionTemplate').html();

  html = html.replaceAll("[[datetime]]", htmlEntities(datetimeString));
  html = html.replaceAll("[[name]]", htmlEntities(name));
  html = html.replaceAll("[[message]]", htmlEntities(message));

  $('#chatTransactions_'+index).append(html);

  $('#chatTransactions_'+index).animate({ scrollTop: $('#chatTransactions_'+index)[0].scrollHeight}, 1000);
}

$(document).ready(function() {

    var exec = require('child_process').exec;

    exec('java -jar ./dist/DecentMessaging.jar --local-server-port '+localPort+' --peer-server-port '+peerPort+' --portable --hidden');
    exec('java -jar ./resources/app/DecentMessaging.jar --local-server-port '+localPort+' --peer-server-port '+peerPort+' --portable --hidden');

    populateMyDmAddress();
    addBootstrapDmNodes();
    updateContactsUI();
    getPersonalMessageIDs();
});

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
