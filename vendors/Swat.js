(function (global) {
  var process = function () {
      var cwd = '/';
      return {
        title: 'browser',
        version: 'v0.8.22',
        browser: true,
        env: {},
        argv: [],
        nextTick: function (fn) {
          setTimeout(fn, 0);
        },
        cwd: function () {
          return cwd;
        },
        chdir: function (dir) {
          cwd = dir;
        }
      };
    }();
  function require(file, parentModule) {
    if ({}.hasOwnProperty.call(require.cache, file))
      return require.cache[file];
    var resolved = require.resolve(file);
    if (!resolved)
      throw new Error('Failed to resolve module ' + file);
    var module$ = {
        id: file,
        require: require,
        filename: file,
        exports: {},
        loaded: false,
        parent: parentModule,
        children: []
      };
    if (parentModule)
      parentModule.children.push(module$);
    var dirname = file.slice(0, file.lastIndexOf('/') + 1);
    require.cache[file] = module$.exports;
    resolved.call(module$.exports, module$, module$.exports, dirname, file);
    module$.loaded = true;
    return require.cache[file] = module$.exports;
  }
  require.modules = {};
  require.cache = {};
  require.resolve = function (file) {
    return {}.hasOwnProperty.call(require.modules, file) ? require.modules[file] : void 0;
  };
  require.define = function (file, fn) {
    require.modules[file] = fn;
  };
  require.define('/../manifest.js', function (module, exports, __dirname, __filename) {
    exports.thread = {};
    exports.time = {};
    exports.math = {};
    exports.Event = require('/../src/Event.js', module).Event;
    exports.screen = require('/../src/screen.js', module).screen;
    exports.thread.Pool = require('/../src/thread/Pool.js', module).Pool;
    exports.thread.Solo = require('/../src/thread/Solo.js', module).Solo;
    exports.thread.Multi = require('/../src/thread/Multi.js', module).Multi;
    exports.ticker = require('/../src/ticker.js', module).ticker;
    exports.time.Timeout = require('/../src/time/Timeout.js', module).Timeout;
    exports.time.AnimationFrame = require('/../src/time/AnimationFrame.js', module).AnimationFrame;
    exports.math.Vector3 = require('/../src/math/Vector3.js', module).Vector3;
    exports.Application = require('/../src/Application.js', module).Application;
  });
  require.define('/../src/Application.js', function (module, exports, __dirname, __filename) {
    var Application = exports.Application = function () {
      };
    Application.prototype.engineUpdate = function () {
    };
    Application.prototype.drawUpdate = function () {
    };
    Application.prototype.render = function () {
    };
  });
  require.define('/../src/math/Vector3.js', function (module, exports, __dirname, __filename) {
    var Three = require('/three.js', module);
    var Vector3 = exports.Vector3 = function () {
        this._vector3 = new Three.Vector3;
      };
  });
  require.define('/three.js', function (module, exports, __dirname, __filename) {
    exports.three = THREE;
  });
  require.define('/../src/time/AnimationFrame.js', function (module, exports, __dirname, __filename) {
    var Window = require('/window.js', module).window;
    var AnimationFrame = exports.AnimationFrame = function (callback) {
        this._callback = callback;
        this._timer = null;
      };
    AnimationFrame.prototype.fire = function () {
      this.disarm();
      this._callback.call(null);
    };
    AnimationFrame.prototype.rearm = function () {
      if (this._timer !== null)
        return;
      this._timer = Window.requestAnimationFrame(this.fire.bind(this));
    };
    AnimationFrame.prototype.disarm = function () {
      if (this._timer === null)
        return;
      Window.cancelAnimationFrame(this._timer);
      this._timer = null;
    };
  });
  require.define('/window.js', function (module, exports, __dirname, __filename) {
    exports.window = window;
  });
  require.define('/../src/time/Timeout.js', function (module, exports, __dirname, __filename) {
    var Window = require('/window.js', module).window;
    var Timeout = exports.Timeout = function (callback, delay) {
        this._callback = callback;
        this._delay = delay;
        this._timer = null;
      };
    Timeout.prototype.fire = function () {
      this.disarm();
      this._callback.call(null);
    };
    Timeout.prototype.rearm = function () {
      if (this._timer !== null)
        return;
      this._timer = Window.setTimeout(this.fire.bind(this), this._delay);
    };
    Timeout.prototype.disarm = function () {
      if (this._timer === null)
        return;
      Window.clearTimeout(this._timer);
      this._timer = null;
    };
  });
  require.define('/../src/ticker.js', function (module, exports, __dirname, __filename) {
    var AnimationFrame = require('/../src/time/AnimationFrame.js', module).AnimationFrame;
    var Timeout = require('/../src/time/Timeout.js', module).Timeout;
    var Ticker = function () {
      this._states = [];
      this._engineTimeout = new Timeout(this._engineUpdate.bind(this), 1e3 / 60);
      this._drawTimeout = new AnimationFrame(this._drawUpdate.bind(this));
    };
    Ticker.prototype.start = function () {
      if (this._run)
        return this;
      this._run = true;
      this._engineTimeout.fire();
      this._drawTimeout.fire();
      return this;
    };
    Ticker.prototype.stop = function () {
      if (!this._run)
        return this;
      this._run = false;
      this._engineTimeout.disarm();
      this._drawTimeout.disarm();
      return this;
    };
    Ticker.prototype.add = function (state) {
      if (this._states.indexOf(state) !== -1)
        return this;
      this._states.push(state);
      return this;
    };
    Ticker.prototype.remove = function (state) {
      this._states.splice(this._states.indexOf(state), 1);
      return this;
    };
    Ticker.prototype._engineUpdate = function () {
      this._engineTimeout.rearm();
      this._states.forEach(function (state) {
        if (state.engineUpdate) {
          state.engineUpdate();
        }
      });
    };
    Ticker.prototype._drawUpdate = function () {
      this._drawTimeout.rearm();
      this._states.forEach(function (state) {
        if (state.drawUpdate) {
          state.drawUpdate();
        }
      });
    };
    var ticker = exports.ticker = new Ticker;
  });
  require.define('/../src/thread/Multi.js', function (module, exports, __dirname, __filename) {
    var window = require('/window.js', module).window;
    var Multi = exports.Multi = function (sources) {
        this._sources = sources;
      };
    Multi.script = [
      '( function ( ) {',
      '    var origin, dirname;',
      '',
      '    var realImportScripts = self.importScripts;',
      '    self.importScripts = function ( ) {',
      '        return realImportScripts.apply( this, Array.prototype.map.call( arguments, function ( source ) {',
      '            source = source.toString( );',
      '',
      "            if ( source.indexOf( ':' ) !== - 1 )",
      '                return source;',
      '',
      "            if ( source[ 0 ] === '/' )",
      '                source = origin + source;',
      '',
      '            return origin + dirname + source;',
      '',
      '        } ) );',
      '    };',
      '',
      '    var fn = function ( e ) {',
      "        self.removeEventListener( 'message', fn );",
      '        origin = e.data.origin, dirname = e.data.dirname;',
      '        self.importScripts.apply( self, e.data.sources );',
      '    };',
      '',
      "    self.addEventListener( 'message', fn );",
      '',
      '} )( );'
    ];
    Multi.url = function () {
      if (!Multi._url)
        Multi._url = window.URL.createObjectURL(new window.Blob([Multi.script.join('\n')], { type: 'text/javascript' }));
      return Multi._url;
    };
    Multi.prototype.build = function () {
      var worker = new window.Worker(Multi.url());
      var origin = window.location.origin;
      var dirname = window.location.pathname.substr(0, window.location.pathname.lastIndexOf('/')) + '/';
      worker.postMessage({
        origin: origin,
        dirname: dirname,
        sources: this._sources
      });
      return worker;
    };
  });
  require.define('/../src/thread/Solo.js', function (module, exports, __dirname, __filename) {
    var window = require('/window.js', module).window;
    var Solo = exports.Solo = function (source) {
        this._source = source;
      };
    Solo.prototype.build = function () {
      return new window.Worker(this._source);
    };
  });
  require.define('/../src/thread/Pool.js', function (module, exports, __dirname, __filename) {
    var Event = require('/../src/Event.js', module).Event;
    var Pool = exports.Pool = function (builder, count) {
        Event.initialize(this);
        this._tasks = [];
        this._instances = [];
        this._availableInstances = [];
        for (var t = 0; t < count; ++t) {
          var worker = builder.build();
          worker.addEventListener('message', this._complete.bind(this, t));
          worker.addEventListener('error', this._error.bind(this, t));
          this._instances.push({
            worker: worker,
            task: null
          });
          this._availableInstances.push(t);
        }
      };
    Event.install(Pool.prototype, [
      'push',
      'shift',
      'complete',
      'error'
    ]);
    Pool.prototype.broadcast = function (data) {
      this._instances.forEach(function (instance) {
        instance.worker.postMessage(data);
      });
      return this;
    };
    Pool.prototype.push = function (task) {
      this._tasks.push(task);
      this.dispatchEvent('push', { task: task });
      this.shift();
      return this;
    };
    Pool.prototype.shift = function () {
      if (this._tasks.length === 0 || this._availableInstances.length === 0)
        return this;
      var task = this._tasks.shift();
      var instance = this._instances[this._availableInstances.shift()];
      instance.worker.postMessage(instance.task = task);
      this.dispatchEvent('shift', { task: task });
      return this;
    };
    Pool.prototype.steady = function () {
      return this._tasks.length === 0 && this._instances.length === this._availableInstances.length;
    };
    Pool.prototype._extractTask = function (id) {
      var task = this._instances[id].task;
      this._instances[id].task = null;
      return task;
    };
    Pool.prototype._complete = function (id, e) {
      if (e.data instanceof Array) {
        console.log.apply(console, e.data);
        return;
      }
      this._availableInstances.push(id);
      this.dispatchEvent('complete', {
        task: this._extractTask(id),
        data: e.data
      });
      this.shift();
    };
    Pool.prototype._error = function (id, e) {
      this._availableInstances.push(id);
      this.dispatchEvent('error', {
        task: this._extractTask(id),
        event: e
      });
      this.shift();
    };
  });
  require.define('/../src/Event.js', function (module, exports, __dirname, __filename) {
    var Event = exports.Event = {
        install: function (prototype, events) {
          prototype._events = events;
          prototype.addEventListener = Event.addEventListener;
          prototype.removeEventListener = Event.removeEventListener;
          prototype.dispatchEvent = Event.dispatchEvent;
          prototype.nextEventListener = Event.nextEventListener;
        },
        initialize: function (instance) {
          instance._handlers = Object.create(null);
        },
        split: function (events, expectedEvents) {
          return events.split(/(?:, *)|(?:,? +)/g).map(function (event) {
            if (expectedEvents.indexOf(event) === -1)
              throw new Error('Unexpected event "' + event + '", expected one of "' + expectedEvents.join('", "') + '"');
            return event;
          });
        },
        bind: function (instance, event, callback, context, persists) {
          if (!instance._handlers[event])
            instance._handlers[event] = [];
          instance._handlers[event].push({
            callback: callback,
            context: context,
            persists: persists
          });
        },
        unbind: function (instance, event, callback, context) {
          if (!instance._handlers[event])
            return;
          var handlers = instance._handlers[event];
          for (var t = 0, T = handlers.length; t < T; ++t)
            if (handlers[t].callback === callback && handlers[t].context === context)
              break;
          handlers.splice(t, 1);
        },
        call: function (instance, event, data) {
          var on = 'on' + event[0].toUpperCase() + event.substr(1);
          instance[on] && instance[on](data);
          if (!instance._handlers[event])
            return;
          instance._handlers[event].slice().forEach(function (trigger) {
            trigger.callback.call(trigger.context, data);
            if (!trigger.persists)
              Event.unbind(instance, trigger.callback, trigger.context);
          });
        },
        addEventListener: function (events, callback, context) {
          if (typeof context === 'undefined')
            context = this;
          Event.split(events, this._events).forEach(function (event) {
            Event.bind(this, event, callback, context, true);
          }, this);
          return this;
        },
        nextEventListener: function (events, callback, context) {
          if (typeof context === 'undefined')
            context = this;
          Event.split(events, this._events).forEach(function (event) {
            Event.bind(this, event, callback, context, false);
          }, this);
          return this;
        },
        removeEventListener: function (events, callback) {
          if (typeof context === 'undefined')
            context = this;
          Event.split(events, this._events).forEach(function (event) {
            Event.unbind(this, event, callback, context);
          });
          return this;
        },
        dispatchEvent: function (events, data) {
          Event.split(events, this._events).forEach(function (event) {
            Event.call(this, event, data);
          }, this);
          return this;
        }
      };
  });
  require.define('/../src/screen.js', function (module, exports, __dirname, __filename) {
    var window = require('/window.js', module).window;
    var three = require('/three.js', module).three;
    var screen = exports.screen = new three.WebGLRenderer;
    var append = function () {
      screen.domElement.style.position = 'absolute';
      screen.domElement.style.left = '0';
      screen.domElement.style.top = '0';
      document.body.appendChild(screen.domElement);
      resize();
    };
    var resize = function () {
      screen.setSize(window.innerWidth, window.innerHeight);
    };
    if (document.readyState !== 'complete') {
      window.addEventListener('load', append);
    } else {
      append();
    }
    window.addEventListener('resize', resize);
  });
  global.SWAT = require('/../manifest.js');
}.call(this, this));
