var socket = io();

  var form = document.getElementById('form');
  var addressbar = document.getElementById('addressbar');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (addressbar.value) {
      socket.emit('control', {
        type: 'goto',
        data: {'url': addressbar.value}
      });
      addressbar.value = '';
    }
  });

  function loadPage(data){
    data = LZUTF8.decompress(new Uint8Array(data)); // string compression for shrinking the transferred data.
    let screen = document.getElementById('screen');

    screen.contentWindow.document.body.innerHTML = data;

    screen.contentWindow.document.body.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log("ahoj!")
    },true);

    console.log("Page Loaded!");
  }

  socket.on('DOMDiff', loadPage);