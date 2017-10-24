
var localPort = 23500;
var peerPort = 23501;

function populateMyDmAddress()
{
  if ($('#dmAddress').val().length>0) {
    return;
  }

  $.get('http://localhost:'+localPort+'/api/v1/address', function(data) {
    
    data = JSON.parse(data);

    if (data.address) {
      $('#dmAddress').val(data.address);
    }
  });

  setTimeout(function() { populateMyDmAddress(); }, 1000);
}

function addDmNode(hostname, port)
{
  $.post('http://localhost:'+localPort+'/api/v1/nodes', { host: hostname, port: port }, function(data) {
    
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
  var postData = {recipientAddress: dmAddress, body: message, subject: 'DecentChat Private Message'};

  $.post('http://localhost:'+localPort+'/api/v1/messages', postData, function(data) {
    
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
  $.post('http://localhost:'+localPort+'/api/v1/personal-messages', {delete: id});
}

function getPersonalMessage(id)
{

  $.get('http://localhost:'+localPort+'/api/v1/personal-messages', {id: id}, function(data) {
    
    data = JSON.parse(data);
    processPersonalMessage(id, data.datetime, data.from, data.subject, data.body);
  });

}

function getPersonalMessageIDs()
{
  $.get('http://localhost:'+localPort+'/api/v1/personal-messages', function(data) {
    
    data = JSON.parse(data);
    for (var i = 0; i < data.ids.length; i++) {
      getPersonalMessage(data.ids[i]);      
    }
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

  $(window).trigger('resize');

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
    exec('java -jar ./resources/app/dist/DecentMessaging.jar --local-server-port '+localPort+' --peer-server-port '+peerPort+' --portable --hidden');

    populateMyDmAddress();
    addBootstrapDmNodes();
    updateContactsUI();
    getPersonalMessageIDs();

    setInterval( function() { $(window).trigger('resize'); }, 1000 );
});

$(window).resize(function() {

  var height = $(document).height() - $('.chatTextBox').height() - $('.tabs').height() - 120;

  $('.chatTransactions').height(height);

});

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
