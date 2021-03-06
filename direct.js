(function(win) {
    'use strict';

    var listeners = [],
    mainDoc = win.document,
    MutationObserver = win.MutationObserver || win.WebKitMutationObserver,
    observer;
    
    function ready(selector, fn) {
        // Store the selector and callback to be monitored
        listeners.push({
            selector: selector,
            fn: fn
        });
        if (!observer) {
            // Watch for changes in the document
            observer = new MutationObserver(check);
            observer.observe(mainDoc.documentElement, {
                childList: true,
                subtree: true
            });
        }
        // Check if the element is currently in the DOM
        check();
    }

    function check(mutationsList, observer, doc = mainDoc) {
        // Check the DOM for elements matching a stored selector
        for (var i = 0, len = listeners.length, listener, elements; i < len; i++) {
            listener = listeners[i];
            // Query for elements matching the specified selector
            elements = doc.querySelectorAll(listener.selector);
            for (var j = 0, jLen = elements.length, element; j < jLen; j++) {
                element = elements[j];
                // Make sure the callback isn't invoked with the
                // same element more than once
                if (!element.ready) {
                    element.ready = true;
                    // Invoke the callback with the element
                    listener.fn.call(element, element);
                }
            }
        }
    }

    // Expose `ready`
    win.ready = ready;

  ready('a', function (element) {
    // Second level more aggressive
    let updateElement = function() {
      let uri = cleanup();
      var clean = true;
      
      if( uri !== '' ) {
        // Strip all the parameters in URL
        uri = new URL(uri);
        var domainfilter= ['facebook.com', 'facebookwww.onion'];
        domainfilter.forEach(function(element) {
            if (uri.hostname.toString().indexOf(element) === -1) {
            clean = false;
            }
        });

        if (clean) {
            uri = uri.protocol + '//' + uri.hostname + uri.pathname;
            element.href = uri;
        }
      }
    };

    // First level of cleanup
    let cleanup = function() {
      let uri = element.href;
      if( uri !== '' ) {
        if (/^https?:\/\/lm?.facebook.com/i.test(uri)) {
            uri = uri.match(/u=([^&#$]+)/i)[1];
        }

        uri = decodeURIComponent(uri);
        uri = uri.replace(/&?fbclid=[^&#$/]*/gi, '');
        uri = uri.replace(/&?ref=[^&#$/]*/gi, '');
        uri = uri.replace(/&?ref_type=[^&#$/]*/gi, '');
        if (uri[uri.length -1] === '?') {
            uri = uri.substr(0, uri.length-1);
        }

        element.href = uri;
        element.setAttribute("data-lynx-uri", "");
        return uri;
      }
    }

    var url = element.href.toString();
    var whitelist = ['#', '/profile.php', '/photo/download', '/groups', '/ad_campaign', '/pages'];
    var filter = true;
    whitelist.forEach(function(element) {
      if (url.indexOf(element) !== -1) {
        filter = false;
      }
    });

    if (filter) {
      element.onmousedown = updateElement;
      element.contextmenu = updateElement;
      element.ontouchstart = updateElement;
    } else {
      element.onmousedown = cleanup;
      element.contextmenu = cleanup;
      element.ontouchstart = cleanup;
    }
  });

  ready('iframe', function (iframe) {
    // A new observer for the iframe document
    var obs = null

    // Create a new observer and call check to update elements
    var startObserving = d => {
      obs = new MutationObserver(() => {
        check(null, null, d)
      })
      obs.observe(iframe.contentWindow.document, {childList: true, subtree: true})
      check(null, null, d)
    }

    /*
    Disconnect observer for that iframe
    but check if the window has been destroyed completely
    or has been recreated, if so, recreate also the observer
    */
    iframe.contentWindow.onunload = () => {
      if (obs) {
        obs.disconnect()
      }
      // wait for the window to be recreated
      setTimeout(() => {
        // If the window has been recreated recreate also the observer
        if (iframe.contentWindow) {
          startObserving(iframe.contentWindow.document)
        }
      }, 0)
    }

    // Actually create the observer
    startObserving(iframe.contentWindow.document)
  })
})(this)
