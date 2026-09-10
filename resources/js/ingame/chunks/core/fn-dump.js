
/*!
 * jQuery Cookie Plugin v1.3.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as anonymous module.
    define(['jquery'], factory);
  } else {
    // Browser globals.
    factory(jQuery);
  }
})(function ($) {
  var pluses = /\+/g;

  function raw(s) {
    return s;
  }

  function decoded(s) {
    return decodeURIComponent(s.replace(pluses, ' '));
  }

  function converted(s) {
    if (s.indexOf('"') === 0) {
      // This is a quoted cookie as according to RFC2068, unescape
      s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }

    try {
      return config.json ? JSON.parse(s) : s;
    } catch (er) {}
  }

  var config = $.cookie = function (key, value, options) {
    // write
    if (value !== undefined) {
      options = $.extend({}, config.defaults, options);

      if (typeof options.expires === 'number') {
        var days = options.expires,
            t = options.expires = new Date();
        t.setDate(t.getDate() + days);
      }

      value = config.json ? JSON.stringify(value) : String(value);
      return document.cookie = [config.raw ? key : encodeURIComponent(key), '=', config.raw ? value : encodeURIComponent(value), options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
      options.path ? '; path=' + options.path : '', options.domain ? '; domain=' + options.domain : '', options.secure ? '; secure' : ''].join('');
    } // read


    var decode = config.raw ? raw : decoded;
    var cookies = document.cookie.split('; ');
    var result = key ? undefined : {};

    for (var i = 0, l = cookies.length; i < l; i++) {
      var parts = cookies[i].split('=');
      var name = decode(parts.shift());
      var cookie = decode(parts.join('='));

      if (key && key === name) {
        result = converted(cookie);
        break;
      }

      if (!key) {
        result[name] = converted(cookie);
      }
    }

    return result;
  };

  config.defaults = {};

  $.removeCookie = function (key, options) {
    if ($.cookie(key) !== undefined) {
      // Must not alter options, thus extending a fresh object...
      $.cookie(key, '', $.extend({}, options, {
        expires: -1
      }));
      return true;
    }

    return false;
  };
});
/**
 * jquery.dump.js
 * @author Torkild Dyvik Olsen
 * @version 1.0
 *
 * A simple debug function to gather information about an object.
 * Returns a nested tree with information.
 *
 */
(function ($) {
  $.fn.dump = function () {
    return $.dump(this);
  };

  $.dump = function (object) {
    var recursion = function (obj, level) {
      if (!level) level = 0;
      var dump = '',
          p = '';

      for (i = 0; i < level; i++) p += "\t";

      t = type(obj);

      switch (t) {
        case "string":
          return '"' + obj + '"';
          break;

        case "number":
          return obj.toString();
          break;

        case "boolean":
          return obj ? 'true' : 'false';

        case "date":
          return "Date: " + obj.toLocaleString();

        case "array":
          dump += 'Array ( \n';
          $.each(obj, function (k, v) {
            dump += p + '\t' + k + ' => ' + recursion(v, level + 1) + '\n';
          });
          dump += p + ')';
          break;

        case "object":
          dump += 'Object { \n';
          $.each(obj, function (k, v) {
            dump += p + '\t' + k + ': ' + recursion(v, level + 1) + '\n';
          });
          dump += p + '}';
          break;

        case "jquery":
          dump += 'jQuery Object { \n';
          $.each(obj, function (k, v) {
            dump += p + '\t' + k + ' = ' + recursion(v, level + 1) + '\n';
          });
          dump += p + '}';
          break;

        case "regexp":
          return "RegExp: " + obj.toString();

        case "error":
          return obj.toString();

        case "document":
        case "domelement":
          dump += 'DOMElement [ \n' + p + '\tnodeName: ' + obj.nodeName + '\n' + p + '\tnodeValue: ' + obj.nodeValue + '\n' + p + '\tinnerHTML: [ \n';
          $.each(obj.childNodes, function (k, v) {
            if (k < 1) var r = 0;

            if (type(v) == "string") {
              if (v.textContent.match(/[^\s]/)) {
                dump += p + '\t\t' + (k - (r || 0)) + ' = String: ' + trim(v.textContent) + '\n';
              } else {
                r--;
              }
            } else {
              dump += p + '\t\t' + (k - (r || 0)) + ' = ' + recursion(v, level + 2) + '\n';
            }
          });
          dump += p + '\t]\n' + p + ']';
          break;

        case "function":
          var match = obj.toString().match(/^(.*)\(([^\)]*)\)/im);
          match[1] = trim(match[1].replace(new RegExp("[\\s]+", "g"), " "));
          match[2] = trim(match[2].replace(new RegExp("[\\s]+", "g"), " "));
          return match[1] + "(" + match[2] + ")";

        case "window":
        default:
          dump += 'N/A: ' + t;
          break;
      }

      return dump;
    };

    var type = function (obj) {
      var type = typeof obj;

      if (type != "object") {
        return type;
      }

      switch (obj) {
        case null:
          return 'null';

        case window:
          return 'window';

        case document:
          return 'document';

        case window.event:
          return 'event';

        default:
          break;
      }

      if (obj.jquery) {
        return 'jquery';
      }

      switch (obj.constructor) {
        case Array:
          return 'array';

        case Boolean:
          return 'boolean';

        case Date:
          return 'date';

        case Object:
          return 'object';

        case RegExp:
          return 'regexp';

        case ReferenceError:
        case Error:
          return 'error';

        case null:
        default:
          break;
      }

      switch (obj.nodeType) {
        case 1:
          return 'domelement';

        case 3:
          return 'string';

        case null:
        default:
          break;
      }

      return 'Unknown';
    };

    return recursion(object);
  };

  function trim(str) {
    return ltrim(rtrim(str));
  }

  function ltrim(str) {
    return str.replace(new RegExp("^[\\s]+", "g"), "");
  }

  function rtrim(str) {
    return str.replace(new RegExp("[\\s]+$", "g"), "");
  }
})(jQuery);
/*
 * jQuery plugin: fieldSelection - v0.1.1 - last change: 2006-12-16
 * (c) 2006 Alex Brem <alex@0xab.cd> - http://blog.0xab.cd
 */
(function () {
  var fieldSelection = {
    getSelection: function () {
      var e = this.jquery ? this[0] : this;
      return (
      /* mozilla / dom 3.0 */
      'selectionStart' in e && function () {
        var l = e.selectionEnd - e.selectionStart;
        return {
          start: e.selectionStart,
          end: e.selectionEnd,
          length: l,
          text: e.value.substr(e.selectionStart, l)
        };
      } || document.selection && function () {
        e.focus();
        var r = document.selection.createRange();

        if (r === null) {
          return {
            start: 0,
            end: e.value.length,
            length: 0
          };
        }

        var re = e.createTextRange();
        var rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);
        return {
          start: rc.text.length,
          end: rc.text.length + r.text.length,
          length: r.text.length,
          text: r.text
        };
      } ||
      /* browser not supported */
      function () {
        return null;
      })();
    },
    setSelection: function () {
      var e = this.jquery ? this[0] : this;
      var args = arguments[0] || {};
      return (
      /* mozilla / dom 3.0 */
      'selectionStart' in e && function () {
        var start = typeof args == 'object' ? args.start : args;

        if (start != undefined) {
          e.selectionStart = start;
        }

        if (args.end != undefined) {
          e.selectionEnd = args.end;
        }

        e.focus();
        return this;
      } || document.selection && function () {
        e.focus();
        var r = document.selection.createRange();

        if (r === null) {
          return this;
        }

        var start = typeof args == 'object' ? args.start : args;

        if (start != undefined) {
          r.moveStart('character', -e.value.length);
          r.moveStart('character', start);
          r.collapse();
        }

        if (args.end != undefined) {
          r.moveEnd('character', args.end - start);
        }

        r.select();
        return this;
      } ||
      /* browser not supported */
      function () {
        e.focus();
        return jQuery(e);
      })();
    },
    replaceSelection: function () {
      var e = this.jquery ? this[0] : this;
      var text = arguments[0] || '';
      return (
      /* mozilla / dom 3.0 */
      'selectionStart' in e && function () {
        e.value = e.value.substr(0, e.selectionStart) + text + e.value.substr(e.selectionEnd, e.value.length);
        return this;
      } || document.selection && function () {
        e.focus();
        document.selection.createRange().text = text;
        return this;
      } ||
      /* browser not supported */
      function () {
        e.value += text;
        return jQuery(e);
      })();
    }
  };
  jQuery.each(fieldSelection, function (i) {
    jQuery.fn[i] = this;
  });
})();
/**
* hoverIntent is similar to jQuery's built-in "hover" function except that
* instead of firing the onMouseOver event immediately, hoverIntent checks
* to see if the user's mouse has slowed down (beneath the sensitivity
* threshold) before firing the onMouseOver event.
*
* hoverIntent r6 // 2011.02.26 // jQuery 1.5.1+
* <http://cherne.net/brian/resources/jquery.hoverIntent.html>
*
* hoverIntent is currently available for use in all personal or commercial
* projects under both MIT and GPL licenses. This means that you can choose
* the license that best suits your project, and use it accordingly.
*
* // basic usage (just like .hover) receives onMouseOver and onMouseOut functions
* $("ul li").hoverIntent( showNav , hideNav );
*
* // advanced usage receives configuration object only
* $("ul li").hoverIntent({
*	sensitivity: 7, // number = sensitivity threshold (must be 1 or higher)
*	interval: 100,   // number = milliseconds of polling interval
*	over: showNav,  // function = onMouseOver callback (required)
*	timeout: 0,   // number = milliseconds delay before onMouseOut function call
*	out: hideNav    // function = onMouseOut callback (required)
* });
*
* @param  f  onMouseOver function || An object with configuration options
* @param  g  onMouseOut function  || Nothing (use configuration options object)
* @author    Brian Cherne brian(at)cherne(dot)net
*/
(function ($) {
  $.fn.hoverIntent = function (f, g) {
    // default configuration options
    var cfg = {
      sensitivity: 7,
      interval: 100,
      timeout: 0
    }; // override configuration options with user supplied object

    cfg = $.extend(cfg, g ? {
      over: f,
      out: g
    } : f); // instantiate variables
    // cX, cY = current X and Y position of mouse, updated by mousemove event
    // pX, pY = previous X and Y position of mouse, set by mouseover and polling interval

    var cX, cY, pX, pY; // A private function for getting mouse position

    var track = function (ev) {
      cX = ev.pageX;
      cY = ev.pageY;
    }; // A private function for comparing current and previous mouse position


    var compare = function (ev, ob) {
      ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t); // compare mouse positions to see if they've crossed the threshold

      if (Math.abs(pX - cX) + Math.abs(pY - cY) < cfg.sensitivity) {
        $(ob).unbind("mousemove", track); // set hoverIntent state to true (so mouseOut can be called)

        ob.hoverIntent_s = 1;
        return cfg.over.apply(ob, [ev]);
      } else {
        // set previous coordinates for next time
        pX = cX;
        pY = cY; // use self-calling timeout, guarantees intervals are spaced out properly (avoids JavaScript timer bugs)

        ob.hoverIntent_t = setTimeout(function () {
          compare(ev, ob);
        }, cfg.interval);
      }
    }; // A private function for delaying the mouseOut function


    var delay = function (ev, ob) {
      ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
      ob.hoverIntent_s = 0;
      return cfg.out.apply(ob, [ev]);
    }; // A private function for handling mouse 'hovering'


    var handleHover = function (e) {
      // copy objects to be passed into t (required for event object to be passed in IE)
      var ev = jQuery.extend({}, e);
      var ob = this; // cancel hoverIntent timer if it exists

      if (ob.hoverIntent_t) {
        ob.hoverIntent_t = clearTimeout(ob.hoverIntent_t);
      } // if e.type == "mouseenter"


      if (e.type == "mouseenter") {
        // set "previous" X and Y position based on initial entry point
        pX = ev.pageX;
        pY = ev.pageY; // update "current" X and Y position based on mousemove

        $(ob).bind("mousemove", track); // start polling interval (self-calling timeout) to compare mouse coordinates over time

        if (ob.hoverIntent_s != 1) {
          ob.hoverIntent_t = setTimeout(function () {
            compare(ev, ob);
          }, cfg.interval);
        } // else e.type == "mouseleave"

      } else {
        // unbind expensive mousemove event
        $(ob).unbind("mousemove", track); // if hoverIntent state is true, then call the mouseOut function after the specified delay

        if (ob.hoverIntent_s == 1) {
          ob.hoverIntent_t = setTimeout(function () {
            delay(ev, ob);
          }, cfg.timeout);
        }
      }
    }; // bind the function to the two event listeners


    return this.bind('mouseenter', handleHover).bind('mouseleave', handleHover);
  };
})(jQuery);
/*
 * jQuery JSONP Core Plugin 2.4.0 (2012-08-21)
 *
 * https://github.com/jaubourg/jquery-jsonp
 *
 * Copyright (c) 2012 Julian Aubourg
 *
 * This document is licensed as free software under the terms of the
 * MIT License: http://www.opensource.org/licenses/mit-license.php
 */
(function ($) {
  // ###################### UTILITIES ##
  // Noop
  function noop() {} // Generic callback


  function genericCallback(data) {
    lastValue = [data];
  } // Call if defined


  function callIfDefined(method, object, parameters) {
    return method && method.apply(object.context || object, parameters);
  } // Give joining character given url


  function qMarkOrAmp(url) {
    return /\?/.test(url) ? "&" : "?";
  }

  var // String constants (for better minification)
  STR_ASYNC = "async",
      STR_CHARSET = "charset",
      STR_EMPTY = "",
      STR_ERROR = "error",
      STR_INSERT_BEFORE = "insertBefore",
      STR_JQUERY_JSONP = "_jqjsp",
      STR_ON = "on",
      STR_ON_CLICK = STR_ON + "click",
      STR_ON_ERROR = STR_ON + STR_ERROR,
      STR_ON_LOAD = STR_ON + "load",
      STR_ON_READY_STATE_CHANGE = STR_ON + "readystatechange",
      STR_READY_STATE = "readyState",
      STR_REMOVE_CHILD = "removeChild",
      STR_SCRIPT_TAG = "<script>",
      STR_SUCCESS = "success",
      STR_TIMEOUT = "timeout",
      // Window
  win = window,
      // Deferred
  Deferred = $.Deferred,
      // Head element
  head = $("head")[0] || document.documentElement,
      // Page cache
  pageCache = {},
      // Counter
  count = 0,
      // Last returned value
  lastValue,
      // ###################### DEFAULT OPTIONS ##
  xOptionsDefaults = {
    //beforeSend: undefined,
    //cache: false,
    callback: STR_JQUERY_JSONP,
    //callbackParameter: undefined,
    //charset: undefined,
    //complete: undefined,
    //context: undefined,
    //data: "",
    //dataFilter: undefined,
    //error: undefined,
    //pageCache: false,
    //success: undefined,
    //timeout: 0,
    //traditional: false,
    url: location.href
  },
      // opera demands sniffing :/
  opera = win.opera,
      // IE < 10
  oldIE = !!$("<div>").html("<!--[if IE]><i><![endif]-->").find("i").length; // ###################### MAIN FUNCTION ##

  function jsonp(xOptions) {
    // Build data with default
    xOptions = $.extend({}, xOptionsDefaults, xOptions); // References to xOptions members (for better minification)

    var successCallback = xOptions.success,
        errorCallback = xOptions.error,
        completeCallback = xOptions.complete,
        dataFilter = xOptions.dataFilter,
        callbackParameter = xOptions.callbackParameter,
        successCallbackName = xOptions.callback,
        cacheFlag = xOptions.cache,
        pageCacheFlag = xOptions.pageCache,
        charset = xOptions.charset,
        url = xOptions.url,
        data = xOptions.data,
        timeout = xOptions.timeout,
        pageCached,
        // Abort/done flag
    done = 0,
        // Life-cycle functions
    cleanUp = noop,
        // Support vars
    supportOnload,
        supportOnreadystatechange,
        // Request execution vars
    firstChild,
        script,
        scriptAfter,
        timeoutTimer; // If we have Deferreds:
    // - substitute callbacks
    // - promote xOptions to a promise

    Deferred && Deferred(function (defer) {
      defer.done(successCallback).fail(errorCallback);
      successCallback = defer.resolve;
      errorCallback = defer.reject;
    }).promise(xOptions); // Create the abort method

    xOptions.abort = function () {
      !done++ && cleanUp();
    }; // Call beforeSend if provided (early abort if false returned)


    if (callIfDefined(xOptions.beforeSend, xOptions, [xOptions]) === !1 || done) {
      return xOptions;
    } // Control entries


    url = url || STR_EMPTY;
    data = data ? typeof data == "string" ? data : $.param(data, xOptions.traditional) : STR_EMPTY; // Build final url

    url += data ? qMarkOrAmp(url) + data : STR_EMPTY; // Add callback parameter if provided as option

    callbackParameter && (url += qMarkOrAmp(url) + encodeURIComponent(callbackParameter) + "=?"); // Add anticache parameter if needed

    !cacheFlag && !pageCacheFlag && (url += qMarkOrAmp(url) + "_" + new Date().getTime() + "="); // Replace last ? by callback parameter

    url = url.replace(/=\?(&|$)/, "=" + successCallbackName + "$1"); // Success notifier

    function notifySuccess(json) {
      if (!done++) {
        cleanUp(); // Pagecache if needed

        pageCacheFlag && (pageCache[url] = {
          s: [json]
        }); // Apply the data filter if provided

        dataFilter && (json = dataFilter.apply(xOptions, [json])); // Call success then complete

        callIfDefined(successCallback, xOptions, [json, STR_SUCCESS, xOptions]);
        callIfDefined(completeCallback, xOptions, [xOptions, STR_SUCCESS]);
      }
    } // Error notifier


    function notifyError(type) {
      if (!done++) {
        // Clean up
        cleanUp(); // If pure error (not timeout), cache if needed

        pageCacheFlag && type != STR_TIMEOUT && (pageCache[url] = type); // Call error then complete

        callIfDefined(errorCallback, xOptions, [xOptions, type]);
        callIfDefined(completeCallback, xOptions, [xOptions, type]);
      }
    } // Check page cache


    if (pageCacheFlag && (pageCached = pageCache[url])) {
      pageCached.s ? notifySuccess(pageCached.s[0]) : notifyError(pageCached);
    } else {
      // Install the generic callback
      // (BEWARE: global namespace pollution ahoy)
      win[successCallbackName] = genericCallback; // Create the script tag

      script = $(STR_SCRIPT_TAG)[0];
      script.id = STR_JQUERY_JSONP + count++; // Set charset if provided

      if (charset) {
        script[STR_CHARSET] = charset;
      }

      opera && opera.version() < 11.60 ? (scriptAfter = $(STR_SCRIPT_TAG)[0]).text = "document.getElementById('" + script.id + "')." + STR_ON_ERROR + "()" : script[STR_ASYNC] = STR_ASYNC; // Internet Explorer: event/htmlFor trick

      if (oldIE) {
        script.htmlFor = script.id;
        script.event = STR_ON_CLICK;
      } // Attached event handlers


      script[STR_ON_LOAD] = script[STR_ON_ERROR] = script[STR_ON_READY_STATE_CHANGE] = function (result) {
        // Test readyState if it exists
        if (!script[STR_READY_STATE] || !/i/.test(script[STR_READY_STATE])) {
          try {
            script[STR_ON_CLICK] && script[STR_ON_CLICK]();
          } catch (_) {}

          result = lastValue;
          lastValue = 0;
          result ? notifySuccess(result[0]) : notifyError(STR_ERROR);
        }
      }; // Set source


      script.src = url; // Re-declare cleanUp function

      cleanUp = function (i) {
        timeoutTimer && clearTimeout(timeoutTimer);
        script[STR_ON_READY_STATE_CHANGE] = script[STR_ON_LOAD] = script[STR_ON_ERROR] = null;
        head[STR_REMOVE_CHILD](script);
        scriptAfter && head[STR_REMOVE_CHILD](scriptAfter);
      }; // Append main script


      head[STR_INSERT_BEFORE](script, firstChild = head.firstChild); // Append trailing script if needed

      scriptAfter && head[STR_INSERT_BEFORE](scriptAfter, firstChild); // If a timeout is needed, install it

      timeoutTimer = timeout > 0 && setTimeout(function () {
        notifyError(STR_TIMEOUT);
      }, timeout);
    }

    return xOptions;
  } // ###################### SETUP FUNCTION ##


  jsonp.setup = function (xOptions) {
    $.extend(xOptionsDefaults, xOptions);
  }; // ###################### INSTALL in jQuery ##


  $.jsonp = jsonp;
})(jQuery);
// ----------------------------------------------------------------------------
// markItUp! Universal MarkUp Engine, JQuery plugin
// v 1.1.x
// Dual licensed under the MIT and GPL licenses.
// ----------------------------------------------------------------------------
// Copyright (C) 2007-2012 Jay Salvat
// http://markitup.jaysalvat.com/
// ----------------------------------------------------------------------------
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
// ----------------------------------------------------------------------------
(function ($) {
  $.fn.markItUp = function (settings, extraSettings) {
    var method, params, options, ctrlKey, shiftKey, altKey;
    ctrlKey = shiftKey = altKey = false;

    if (typeof settings == 'string') {
      method = settings;
      params = extraSettings;
    }

    options = {
      id: '',
      nameSpace: '',
      root: '',
      previewHandler: false,
      previewInWindow: '',
      // 'width=800, height=600, resizable=yes, scrollbars=yes'
      previewInElement: '',
      previewAutoRefresh: true,
      previewPosition: 'after',
      previewTemplatePath: '~/templates/preview.html',
      previewParser: false,
      previewParserPath: '',
      previewParserVar: 'data',
      resizeHandle: true,
      beforeInsert: '',
      afterInsert: '',
      onEnter: {},
      onShiftEnter: {},
      onCtrlEnter: {},
      onTab: {},
      markupSet: [{
        /* set */
      }] // changed to Obj Array to allow for distinction between basic and advanced set

    };
    $.extend(options, settings, extraSettings); // compute markItUp! path

    if (!options.root) {
      $('script').each(function (a, tag) {
        miuScript = $(tag).get(0).src.match(/(.*)jquery\.markitup(\.pack)?\.js$/);

        if (miuScript !== null) {
          options.root = miuScript[1];
        }
      });
    } // Quick patch to keep compatibility with jQuery 1.9


    var uaMatch = function (ua) {
      ua = ua.toLowerCase();
      var match = /(chrome)[ \/]([\w.]+)/.exec(ua) || /(webkit)[ \/]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
      return {
        browser: match[1] || "",
        version: match[2] || "0"
      };
    };

    var matched = uaMatch(navigator.userAgent);
    var browser = {};

    if (matched.browser) {
      browser[matched.browser] = true;
      browser.version = matched.version;
    }

    if (browser.chrome) {
      browser.webkit = true;
    } else if (browser.webkit) {
      browser.safari = true;
    }

    return this.each(function () {
      var $$, textarea, levels, scrollPosition, caretPosition, caretOffset, clicked, hash, header, footer, previewWindow, template, iFrame, abort;
      $$ = $(this);
      textarea = this;
      levels = [];
      abort = false;
      scrollPosition = caretPosition = 0;
      caretOffset = -1;
      options.previewParserPath = localize(options.previewParserPath);
      options.previewTemplatePath = localize(options.previewTemplatePath);

      if (method) {
        switch (method) {
          case 'remove':
            remove();
            break;

          case 'insert':
            markup(params);
            break;

          default:
            $.error('Method ' + method + ' does not exist on jQuery.markItUp');
        }

        return;
      } // apply the computed path to ~/


      function localize(data, inText) {
        if (inText) {
          return data.replace(/("|')~\//g, "$1" + options.root);
        }

        return data.replace(/^~\//, options.root);
      } // init and build editor


      function init() {
        id = '';
        nameSpace = '';

        if (options.id) {
          id = 'id="' + options.id + '"';
        } else if ($$.attr("id")) {
          id = 'id="markItUp' + $$.attr("id").substr(0, 1).toUpperCase() + $$.attr("id").substr(1) + '"';
        }

        if (options.nameSpace) {
          nameSpace = 'class="' + options.nameSpace + '"';
        }

        $$.wrap('<div ' + nameSpace + '></div>');
        $$.wrap('<div ' + id + ' class="markItUp"></div>');
        $$.wrap('<div class="markItUpContainer"></div>');
        $$.addClass("markItUpEditor"); // add the header before the textarea

        header = $('<div class="markItUpHeader"></div>').insertBefore($$); // $(dropMenus(options.markupSet)).appendTo(header);
        // basic

        var $basicSet = $(dropMenus(options.markupSet[0], 'miu_basic'));
        $basicSet.append('<li class="txt_link fright li_miu_advanced"><span class="toggle_miu_advanced show_miu_advanced awesome-button" role="button">' + locaKeys.moreopts + '</span></li>');
        $basicSet.appendTo(header); // advanced

        var $advancedSet = $(dropMenus(options.markupSet[1], 'miu_advanced'));
        $advancedSet.appendTo(header).hide();
        footer = $('<div class="markItUpFooter"></div>').insertAfter($$); // add the resize handle after textarea

        if (options.resizeHandle === true && browser.safari !== true) {
          resizeHandle = $('<div class="markItUpResizeHandle"></div>').insertAfter($$).bind("mousedown.markItUp", function (e) {
            var h = $$.height(),
                y = e.clientY,
                mouseMove,
                mouseUp;

            mouseMove = function (e) {
              $$.css("height", Math.max(20, e.clientY + h - y) + "px");
              return false;
            };

            mouseUp = function (e) {
              $("html").unbind("mousemove.markItUp", mouseMove).unbind("mouseup.markItUp", mouseUp);
              return false;
            };

            $("html").bind("mousemove.markItUp", mouseMove).bind("mouseup.markItUp", mouseUp);
          });
          footer.append(resizeHandle);
        } // listen key events


        $$.bind('keydown.markItUp', keyPressed).bind('keyup', keyPressed); // bind an event to catch external calls

        $$.bind("insertion.markItUp", function (e, settings) {
          if (settings.target !== false) {
            get();
          }

          if (textarea === $.markItUp.focused) {
            markup(settings);
          }
        }); // remember the last focus

        $$.bind('focus.markItUp', function () {
          $.markItUp.focused = this;
        });

        if (options.previewInElement) {
          refreshPreview();
        }
      } // recursively build header with dropMenus from markupset


      function dropMenus(markupSet, mSetClass) {
        if (!mSetClass) mSetClass = '';
        var ul = $('<ul class="' + mSetClass + '"></ul>'),
            i = 0; //$('li:hover > ul', ul).css('display', 'block');

        $.each(markupSet, function () {
          var button = this,
              t = '',
              title,
              li,
              j;
          title = button.key ? (button.name || '') + ' [Ctrl+' + button.key + ']' : button.name || '';
          key = button.key ? 'accesskey="' + button.key + '"' : '';

          if (button.separator) {
            li = $('<li class="markItUpSeparator">' + (button.separator || '') + '</li>').appendTo(ul);
          } else {
            i++;

            for (j = levels.length - 1; j >= 0; j--) {
              t += levels[j] + "-";
            }

            li = $('<li class="markItUpButton markItUpButton' + t + i + ' ' + (button.className || '') + '"><a href="" ' + key + ' title="' + title + '">' + (button.name || '') + '</a></li>').bind("contextmenu.markItUp", function () {
              // prevent contextmenu on mac and allow ctrl+click
              return false;
            }).appendTo(ul);

            if (!isMobile) {
              li.unbind('click.markItUp').bind('click.markItUp', function () {
                if (button.call) {
                  eval(button.call)();
                } else {
                  // beim 1. Aufruf verschieben... an body haengen
                  var $innerUL = $('>ul', li);

                  if ($innerUL.length > 0) {
                    // ausblenden wenn parent ausgeblendet wird
                    $innerUL.parents('.ui-dialog').find('.ui-dialog-titlebar-close').on('click', function () {
                      $innerUL.hide();
                    });
                    $innerUL.addClass('markItUpOutpost');
                    $('body').append($innerUL);
                    var randomId = Math.ceil(Math.random() * 10000);
                    li.attr('id', 'markitUpDropdown' + randomId);
                    $innerUL.attr('rel', 'markitUpDropdown' + randomId); // eine Auswahl darin soll das UL auch wieder schliessen

                    $innerUL.find('>li').bind('click.markItUp', function () {
                      $innerUL.hide();
                      li.attr('data-opened', 0);
                    });
                    $(window).on('resize', function (e) {
                      // nicht huebsch, aber benoetigt fuer allyrundmails + zoom<1
                      repositionDropdowns($innerUL, li);
                    });
                  } else {
                    // nicht erster aufruf - unterelement von body holen
                    $innerUL = $('body>ul[rel="' + li.attr('id') + '"]');
                  }

                  $('html').one('click.markItUp2', function () {
                    $innerUL.hide();
                    li.attr('data-opened', 0);
                  }); // bei jedem klick neu positionieren

                  repositionDropdowns($innerUL, li); // Sichtbarkeit toggeln

                  if ($innerUL.filter(':visible').length) {
                    $innerUL.hide();
                    li.attr('data-opened', 0);
                  } else {
                    $innerUL.show();
                    li.attr('data-opened', 1);
                  }
                }

                setTimeout(function () {
                  markup(button);
                }, 1);
                return false;
              }).bind("focusin.markItUp", function () {
                $$.focus();
              });
            } else {
              li.bind('click.markItUp', function () {
                $(header).find('ul ul').hide();

                if ($(this).find('> ul').length) {
                  $(this).find('> ul').show();
                } else {
                  if (button.call) {
                    eval(button.call)();
                  }

                  setTimeout(function () {
                    markup(button);
                  }, 1);
                }

                return false;
              });
            }

            if (button.dropMenu) {
              levels.push(i);
              $(li).addClass('markItUpDropMenu').append(dropMenus(button.dropMenu));
              var dropDownArr = $('<span class="dropdown_arr"></span>');
              $(li).append(dropDownArr);
            }
          }
        });
        levels.pop();
        return ul;
      }

      function repositionDropdowns($innerUL, li) {
        // bei jedem klick neu positionieren
        var ulHeight = $innerUL.outerHeight();
        var top;
        var dropDownTop = Math.ceil(li.offset().top);

        if (dropDownTop + li.height() + ulHeight + $('#siteFooter').outerHeight() >= $(window).innerHeight() + $(window).scrollTop()) {
          top = dropDownTop - ulHeight - 2;
        } else {
          top = dropDownTop + 29;
        }

        $innerUL.css({
          'top': top,
          'left': Math.floor(li.offset()['left'])
        });
      } // markItUp! markups


      function magicMarkups(string) {
        if (string) {
          string = string.toString();
          string = string.replace(/\(\!\(([\s\S]*?)\)\!\)/g, function (x, a) {
            var b = a.split('|!|');

            if (altKey === true) {
              return b[1] !== undefined ? b[1] : b[0];
            } else {
              return b[1] === undefined ? "" : b[0];
            }
          }); // [![prompt]!], [![prompt:!:value]!]

          string = string.replace(/\[\!\[([\s\S]*?)\]\!\]/g, function (x, a) {
            var b = a.split(':!:');

            if (abort === true) {
              return false;
            }

            value = prompt(b[0], b[1] ? b[1] : '');

            if (value === null) {
              abort = true;
            }

            return value;
          });
          return string;
        }

        return "";
      } // prepare action


      function prepare(action) {
        if ($.isFunction(action)) {
          action = action(hash);
        }

        return magicMarkups(action);
      } // build block to insert


      function build(string) {
        var openWith = prepare(clicked.openWith);
        var placeHolder = prepare(clicked.placeHolder);
        var replaceWith = prepare(clicked.replaceWith);
        var closeWith = prepare(clicked.closeWith);
        var openBlockWith = prepare(clicked.openBlockWith);
        var closeBlockWith = prepare(clicked.closeBlockWith);
        var multiline = clicked.multiline;

        if (replaceWith !== "") {
          block = openWith + replaceWith + closeWith;
        } else if (selection === '' && placeHolder !== '') {
          block = openWith + placeHolder + closeWith;
        } else {
          string = string || selection;
          var lines = [string],
              blocks = [];

          if (multiline === true) {
            lines = string.split(/\r?\n/);
          }

          for (var l = 0; l < lines.length; l++) {
            line = lines[l];
            var trailingSpaces;

            if (trailingSpaces = line.match(/ *$/)) {
              blocks.push(openWith + line.replace(/ *$/g, '') + closeWith + trailingSpaces);
            } else {
              blocks.push(openWith + line + closeWith);
            }
          }

          block = blocks.join("\n");
        }

        block = openBlockWith + block + closeBlockWith;
        return {
          block: block,
          openBlockWith: openBlockWith,
          openWith: openWith,
          replaceWith: replaceWith,
          placeHolder: placeHolder,
          closeWith: closeWith,
          closeBlockWith: closeBlockWith
        };
      } // define markup to insert


      function markup(button) {
        var len, j, n, i;
        hash = clicked = button;
        get();
        $.extend(hash, {
          line: "",
          root: options.root,
          textarea: textarea,
          selection: selection || '',
          caretPosition: caretPosition,
          ctrlKey: ctrlKey,
          shiftKey: shiftKey,
          altKey: altKey
        }); // callbacks before insertion

        prepare(options.beforeInsert);
        prepare(clicked.beforeInsert);

        if (ctrlKey === true && shiftKey === true || button.multiline === true) {
          prepare(clicked.beforeMultiInsert);
        }

        $.extend(hash, {
          line: 1
        });

        if (ctrlKey === true && shiftKey === true) {
          lines = selection.split(/\r?\n/);

          for (j = 0, n = lines.length, i = 0; i < n; i++) {
            if ($.trim(lines[i]) !== '') {
              $.extend(hash, {
                line: ++j,
                selection: lines[i]
              });
              lines[i] = build(lines[i]).block;
            } else {
              lines[i] = "";
            }
          }

          string = {
            block: lines.join('\n')
          };
          start = caretPosition;
          len = string.block.length + (browser.opera ? n - 1 : 0);
        } else if (ctrlKey === true) {
          string = build(selection);
          start = caretPosition + string.openWith.length;
          len = string.block.length - string.openWith.length - string.closeWith.length;
          len = len - (string.block.match(/ $/) ? 1 : 0);
          len -= fixIeBug(string.block);
        } else if (shiftKey === true) {
          string = build(selection);
          start = caretPosition;
          len = string.block.length;
          len -= fixIeBug(string.block);
        } else {
          string = build(selection);
          start = caretPosition + string.block.length;
          len = 0;
          start -= fixIeBug(string.block);
        }

        if (selection === '' && string.replaceWith === '') {
          caretOffset += fixOperaBug(string.block);
          start = caretPosition + string.openBlockWith.length + string.openWith.length;
          len = string.block.length - string.openBlockWith.length - string.openWith.length - string.closeWith.length - string.closeBlockWith.length;
          caretOffset = $$.val().substring(caretPosition, $$.val().length).length;
          caretOffset -= fixOperaBug($$.val().substring(0, caretPosition));
        }

        $.extend(hash, {
          caretPosition: caretPosition,
          scrollPosition: scrollPosition
        });

        if (string.block !== selection && abort === false) {
          insert(string.block);
          set(start, len);
        } else {
          caretOffset = -1;
        }

        get();
        $.extend(hash, {
          line: '',
          selection: selection
        }); // callbacks after insertion

        if (ctrlKey === true && shiftKey === true || button.multiline === true) {
          prepare(clicked.afterMultiInsert);
        }

        prepare(clicked.afterInsert);
        prepare(options.afterInsert); // refresh preview if opened

        if (previewWindow && options.previewAutoRefresh) {
          refreshPreview();
        } // reinit keyevent


        shiftKey = altKey = ctrlKey = abort = false;
      } // Substract linefeed in Opera


      function fixOperaBug(string) {
        if (browser.opera) {
          return string.length - string.replace(/\n*/g, '').length;
        }

        return 0;
      } // Substract linefeed in IE


      function fixIeBug(string) {
        if (browser.msie) {
          return string.length - string.replace(/\r*/g, '').length;
        }

        return 0;
      } // add markup


      function insert(block) {
        if (document.selection) {
          var newSelection = document.selection.createRange();
          newSelection.text = block;
        } else {
          textarea.value = textarea.value.substring(0, caretPosition) + block + textarea.value.substring(caretPosition + selection.length, textarea.value.length);
        }
      } // set a selection


      function set(start, len) {
        if (textarea.createTextRange) {
          // quick fix to make it work on Opera 9.5
          if (browser.opera && browser.version >= 9.5 && len == 0) {
            return false;
          }

          range = textarea.createTextRange();
          range.collapse(true);
          range.moveStart('character', start);
          range.moveEnd('character', len);
          range.select();
        } else if (textarea.setSelectionRange) {
          textarea.setSelectionRange(start, start + len);
        }

        textarea.scrollTop = scrollPosition;
        textarea.focus();
      } // get the selection


      function get() {
        textarea.focus();
        scrollPosition = textarea.scrollTop;

        if (document.selection) {
          selection = document.selection.createRange().text;

          if (browser.msie) {
            // ie
            var range = document.selection.createRange(),
                rangeCopy = range.duplicate();
            rangeCopy.moveToElementText(textarea);
            caretPosition = -1;

            while (rangeCopy.inRange(range)) {
              rangeCopy.moveStart('character');
              caretPosition++;
            }
          } else {
            // opera
            caretPosition = textarea.selectionStart;
          }
        } else {
          // gecko & webkit
          caretPosition = textarea.selectionStart;
          selection = textarea.value.substring(caretPosition, textarea.selectionEnd);
        }

        return selection;
      } // open preview window


      function preview() {
        if (typeof options.previewHandler === 'function') {
          previewWindow = true;
        } else if (options.previewInElement) {
          previewWindow = $(options.previewInElement);
        } else if (!previewWindow || previewWindow.closed) {
          if (options.previewInWindow) {
            previewWindow = window.open('', 'preview', options.previewInWindow);
            $(window).unload(function () {
              previewWindow.close();
            });
          } else {
            iFrame = $('<iframe class="markItUpPreviewFrame"></iframe>');

            if (options.previewPosition == 'after') {
              iFrame.insertAfter(footer);
            } else {
              iFrame.insertBefore(header);
            }

            previewWindow = iFrame[iFrame.length - 1].contentWindow || frame[iFrame.length - 1];
          }
        } else if (altKey === true) {
          if (iFrame) {
            iFrame.remove();
          } else {
            previewWindow.close();
          }

          previewWindow = iFrame = false;
        }

        if (!options.previewAutoRefresh) {
          refreshPreview();
        }

        if (options.previewInWindow) {
          previewWindow.focus();
        }
      } // refresh Preview window


      function refreshPreview() {
        renderPreview();
      }

      function renderPreview() {
        var phtml;

        if (options.previewHandler && typeof options.previewHandler === 'function') {
          options.previewHandler($$.val());
        } else if (options.previewParser && typeof options.previewParser === 'function') {
          var data = options.previewParser($$.val());
          writeInPreview(localize(data, 1));
        } else if (options.previewParserPath !== '') {
          $.ajax({
            type: 'POST',
            dataType: 'text',
            global: false,
            url: options.previewParserPath,
            data: options.previewParserVar + '=' + encodeURIComponent($$.val()),
            success: function (data) {
              writeInPreview(localize(data, 1));
            }
          });
        } else {
          if (!template) {
            $.ajax({
              url: options.previewTemplatePath,
              dataType: 'text',
              global: false,
              success: function (data) {
                writeInPreview(localize(data, 1).replace(/<!-- content -->/g, $$.val()));
              }
            });
          }
        }

        return false;
      }

      function writeInPreview(data) {
        if (options.previewInElement) {
          $(options.previewInElement).html(data);
        } else if (previewWindow && previewWindow.document) {
          try {
            sp = previewWindow.document.documentElement.scrollTop;
          } catch (e) {
            sp = 0;
          }

          previewWindow.document.open();
          previewWindow.document.write(data);
          previewWindow.document.close();
          previewWindow.document.documentElement.scrollTop = sp;
        }
      } // set keys pressed


      function keyPressed(e) {
        shiftKey = e.shiftKey;
        altKey = e.altKey;
        ctrlKey = !(e.altKey && e.ctrlKey) ? e.ctrlKey || e.metaKey : false;

        if (e.type === 'keydown') {
          if (ctrlKey === true) {
            li = $('a[accesskey="' + (e.keyCode == 13 ? '\\n' : String.fromCharCode(e.keyCode)) + '"]', header).parent('li');

            if (li.length !== 0) {
              ctrlKey = false;
              setTimeout(function () {
                li.triggerHandler('mouseup');
              }, 1);
              return false;
            }
          }

          if (e.keyCode === 13 || e.keyCode === 10) {
            // Enter key
            if (ctrlKey === true) {
              // Enter + Ctrl
              ctrlKey = false;
              markup(options.onCtrlEnter);
              return options.onCtrlEnter.keepDefault;
            } else if (shiftKey === true) {
              // Enter + Shift
              shiftKey = false;
              markup(options.onShiftEnter);
              return options.onShiftEnter.keepDefault;
            } else {
              // only Enter
              markup(options.onEnter);
              return options.onEnter.keepDefault;
            }
          }

          if (e.keyCode === 9) {
            // Tab key
            if (shiftKey == true || ctrlKey == true || altKey == true) {
              return false;
            }

            if (caretOffset !== -1) {
              get();
              caretOffset = $$.val().length - caretOffset;
              set(caretOffset, 0);
              caretOffset = -1;
              return false;
            } else {
              markup(options.onTab);
              return options.onTab.keepDefault;
            }
          }
        }
      }

      function remove() {
        $$.unbind(".markItUp").removeClass('markItUpEditor');
        $$.parent('div').parent('div.markItUp').parent('div').replaceWith($$);
        $$.data('markItUp', null);
      }

      init();
    });
  };

  $.fn.markItUpRemove = function () {
    return this.each(function () {
      $(this).markItUp('remove');
    });
  };

  $.markItUp = function (settings) {
    var options = {
      target: false
    };
    $.extend(options, settings);

    if (options.target) {
      return $(options.target).each(function () {
        $(this).focus();
        $(this).trigger('insertion', [options]);
      });
    } else {
      $('textarea').trigger('insertion', [options]);
    }
  };
})(jQuery);
/*!
 * jQuery Mousewheel 3.1.13
 *
 * Copyright 2015 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */
!function (a) {
  "function" == typeof define && define.amd ? define(["jquery"], a) : "object" == typeof exports ? module.exports = a : a(jQuery);