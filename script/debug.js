var tStart = new Date();
var oDebug = null;

function writeDebug(x,scrollIntoView) {
  if (!oDebug && document.body) {
    oDebug = document.createElement('div');
    with (oDebug.style) {
      display = 'none';
      position = 'absolute';
      width = '220px';
      height = '165px';
      right = '8px';
      top = '8px';
      overflow = 'auto';
      font = 'normal 9px/9px "small fonts","lucida console",system,arial,verdana';
      color = '#666';
      textAlign = 'left';
    }
    document.body.appendChild(oDebug);
  }
  var o = document.createElement('div');
  var t = document.createTextNode((new Date()-tStart)+': '+x);
  o.appendChild(t);
  try {
    var x = oDebug.appendChild(o);
    // if (scrollIntoView) x.scrollIntoView();
  } catch(e) {
    window.status = 'Warning: writeDebug failed.';
    setTimeout('window.status=""',1500);
  }
}

function debugErrorHandler(eMsg,eURL,eLine) {
  try {
    writeDebug('<b>Error</b>: '+eMsg+' | '+eURL+', line '+eLine);
  } catch(e) {
    // oh well
    return false;
  }
}

function enableDebugMode() {
  window.onerror = debugErrorHandler;
  writeDebug('Debug mode + error handling enabled');
  if (oDebug) oDebug.style.display = 'block';
}