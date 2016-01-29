
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

$('#dmAddress').on('click', function() {
  $(this).select();
});

$(document).ready(function() {
    populateMyDmAddress();
});
