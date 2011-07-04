var isIE = navigator.appName.toLowerCase().indexOf('internet explorer')+1;
var isMac = navigator.appVersion.toLowerCase().indexOf('mac')+1;

function SoundManager(container) {
  // DHTML-controlled sound via Flash
  var self = this;
  this.movies = []; // movie references
  this.container = container;
  this.unsupported = 0; // assumed to be supported
  this.defaultName = 'default'; // default movie
  
  this.FlashObject = function(url) {
    var me = this;
    this.o = null;
    this.loaded = false;
    this.mC = document.createElement('div');
    this.mC.className = 'movieContainer';
    this.destructor = function() {
      me.mC.removeChild(me.o);
      me.o = null;
      document.getElementsByTagName('div')[0].removeChild(me.mC);
      me.mC = null;
    }
    this.isLoaded = function() {
      if (me.loaded) return true;
      if (!me.o) return false;
      me.loaded = ((typeof(me.o.readyState)!='undefined' && me.o.readyState == 4) || (typeof(me.o.PercentLoaded)!='undefined' && me.o.PercentLoaded() == 100));
      return me.loaded;
    }
    with (this.mC.style) {
      // "hide" flash movie
      position = 'absolute';
      left = '-256px';
      width = '64px';
      height = '64px';
    }
    var html = ['<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,0,0"><param name="movie" value="'+url+'"><param name="quality" value="high"></object>','<embed src="'+url+'" width="1" height="1" quality="high" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash"></embed>'];
    if (navigator.appName.toLowerCase().indexOf('microsoft')+1) {
      this.mC.innerHTML = html[0];
      this.o = this.mC.getElementsByTagName('object')[0];
    } else {
      // this.mC.innerHTML = html[1];
      var oEmbed = document.createElement('embed');
      oEmbed.src = url;
      oEmbed.quality = 'high';
      oEmbed.width = 1;
      oEmbed.height = 1;
      oEmbed.pluginspage = 'http://www.macromedia.com/go/getflashplayer';
      oEmbed.type = 'application/x-shockwave-flash';
      this.mC.appendChild(oEmbed);
      this.o = this.mC.getElementsByTagName('embed')[0];
    }
    document.getElementsByTagName('div')[0].appendChild(this.mC);
  }

  this.addMovie = function(movieName,url) {
    self.movies[movieName] = new self.FlashObject(url);
  }

  this.checkMovie = function(movieName) {
    movieName = movieName||self.defaultName;
    if (!self.movies[movieName]) {
      self.errorHandler('checkMovie','Exception: Could not find movie',arguments);
      return false;
    } else {
      return (self.movies[movieName].isLoaded())?self.movies[movieName]:false;
    }
  }

  this.errorHandler = function(methodName,message,oArguments,e) {
    writeDebug('<div class="error">soundManager.'+methodName+'('+self.getArgs(oArguments)+'): '+message+(e?' ('+e.name+' - '+(e.message||e.description||'no description'):'')+'.'+(e?')':'')+'</div>');
  }

  this.play = function(soundID,loopCount,noDebug,movieName) {
    if (self.unsupported) return false;
    movie = self.checkMovie(movieName);
    if (!movie) return false;
    if (typeof(movie.o.TCallLabel)!='undefined') {
      try {
        self.setVariable(soundID,'loopCount',loopCount||1,movie);
        movie.o.TCallLabel('/'+soundID,'start');
        if (!noDebug) writeDebug('soundManager.play('+self.getArgs(arguments)+')');
      } catch(e) {
        self.errorHandler('play','Failed: Flash unsupported / undefined sound ID (check XML)',arguments,e);
      }
    }
  }

  this.stop = function(soundID,movieName) {
    if (self.unsupported) return false;
    movie = self.checkMovie(movieName);
    if (!movie) return false;
    try {
      movie.o.TCallLabel('/'+soundID,'stop');
      writeDebug('soundManager.stop('+self.getArgs(arguments)+')');
    } catch(e) {
      // Something blew up. Not supported?
      self.errorHandler('stop','Failed: Flash unsupported / undefined sound ID (check XML)',arguments,e);
    }
  }

  this.getArgs = function(params) {
    var x = params?params.length:0;
    if (!x) return '';
    var result = '';
    for (var i=0; i<x; i++) {
      result += (i&&i<x?', ':'')+(params[i].toString().toLowerCase().indexOf('object')+1?typeof(params[i]):params[i]);
    }
    return result
  }

  this.setVariable = function(soundID,property,value,oMovie) {
    // set Flash variables within a specific movie clip
    if (!oMovie) return false;
    try {
      oMovie.o.SetVariable('/'+soundID+':'+property,value);
      // writeDebug('soundManager.setVariable('+self.getArgs(arguments)+')');
    } catch(e) {
      // d'oh
      self.errorHandler('setVariable','Failed',arguments,e);
    }
  }

  this.setVariableExec = function(soundID,fromMethodName,oMovie) {
    try {
      oMovie.o.TCallLabel('/'+soundID,'setVariable');
    } catch(e) {
      self.errorHandler(fromMethodName||'undefined','Failed',arguments,e);
    }
  }

  this.callMethodExec = function(soundID,fromMethodName,oMovie) {
    try {
      oMovie.o.TCallLabel('/'+soundID,'callMethod');
    } catch(e) {
      // Something blew up. Not supported?
      self.errorHandler(fromMethodName||'undefined','Failed',arguments,e);
    }
  }

  this.callMethod = function(soundID,methodName,methodParam,movieName) {
    movie = self.checkMovie(movieName||self.defaultName);
    if (!movie) return false;
    self.setVariable(soundID,'jsProperty',methodName,movie);
    self.setVariable(soundID,'jsPropertyValue',methodParam,movie);
    self.callMethodExec(soundID,methodName,movie);
  }

  this.setPan = function(soundID,pan,movieName) {
    self.callMethod(soundID,'setPan',pan,movieName);
  }

  this.setVolume = function(soundID,volume,movieName) {
    self.callMethod(soundID,'setVolume',volume,movieName);
  }

  this.destructor = function() {
    for (var i=self.movies.length; i--;) {
      self.movies[i].destructor();
      self.movies[i] = null;
    }
  }

  // constructor - create flash objects

  if (isMac) {
    this.unsupported = 1;
  }

  if (!this.unsupported) {
    this.addMovie(this.defaultName,'soundcontroller.swf');
  }

}

function SoundManagerNull() {
  // Null object for unsupported case
  this.movies = []; // movie references
  this.container = null;
  this.unsupported = 1;
  this.FlashObject = function(url) {}
  this.addMovie = function(name,url) {}
  this.setPan = function() {}
  this.setVolume = function() {}
  this.play = function(movieName,soundID) {
    return false;
  }
  this.stop = function() {}
  this.destructor = function() {}
  this.defaultName = 'default';
}

var soundManager = null;

function soundManagerInit() {
  if (isMac) {
    soundManager = new SoundManagerNull();
  } else {
    soundManager = new SoundManager();
  }
}