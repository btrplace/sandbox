String.prototype.trim = String.prototype.trim || function trim() { return this.replace(/^\s\s*/, '').replace(/\s\s*$/, ''); };


Element.prototype.hasClass = function (cls) {
  return this.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

Element.prototype.addClass = function(cls) {
  if (!this.hasClass(cls)) this.className += " "+cls;
}

Element.prototype.removeClass = function(cls) {
  if (this.hasClass(cls)) {
	  var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
	  this.className=this.className.replace(reg,' ');
  }
}

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri (str) {
	var	o   = parseUri.options,
		m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
		uri = {},
		i   = 14;

	while (i--) uri[o.key[i]] = m[i] || "";

	uri[o.q.name] = {};
	uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
		if ($1) uri[o.q.name][$1] = $2;
	});

	return uri;
};

parseUri.options = {
	strictMode: false,
	key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
	q:   {
		name:   "queryKey",
		parser: /(?:^|&)([^&=]*)=?([^&]*)/g
	},
	parser: {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
		loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
	}
};

function createXhrObject() {
	if (window.XMLHttpRequest) {
		return new XMLHttpRequest();
	}
	if (window.ActiveXObject) {
		var names = ["Msxml2.XMLHTTP.6.0","Msxml2.XMLHTTP.3.0","Msxml2.XMLHTTP","Microsoft.XMLHTTP"];
		for(var i in names) {
			try{ return new ActiveXObject(names[i]); }
			catch(e){}
		}
	}
	window.alert("Your browser does not support XMLHttpRequest.");
	return null;
}

function postToAPI(id, params, callback) {
	var http = createXhrObject();
	var o = parseUri(document.location.href);
	http.open("POST", "http://" + o.authority + o.directory + "api/" + id, true);
	http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	http.onreadystatechange = callback;
	http.send(params);
}

/*
 * Applies the callback f to all the objects in the list l and its sublists.
 */
function foreachArray(l, f){
	var i = 0 ;
    while(i < l.length){
    	var element = l[i];
    	if ($.isArray(element)) {
    		l = l.concat(element);
    		i++;
    		continue;
    	}
    	// Apply the callback
    	f(element);
    	i++;
    }
}

function GETParameters(){
	var prmstr = window.location.search.substr(1);
	var prmarr = prmstr.split ("&");
	var params = {};

	for ( var i = 0; i < prmarr.length; i++) {
		var tmparr = prmarr[i].split("=");
		params[tmparr[0]] = tmparr[1];
	}
	return params ;
}

function encode64(input) {
     input = escape(input);
     var output = "";
     var chr1, chr2, chr3 = "";
     var enc1, enc2, enc3, enc4 = "";
     var i = 0;

     do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
           enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
           enc4 = 64;
        }

        output = output +
           keyStr.charAt(enc1) +
           keyStr.charAt(enc2) +
           keyStr.charAt(enc3) +
           keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
     } while (i < input.length);

     return output;
  }

function decode64(input) {
   var output = "";
   var chr1, chr2, chr3 = "";
   var enc1, enc2, enc3, enc4 = "";
   var i = 0;

   // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
   var base64test = /[^A-Za-z0-9\+\/\=]/g;
   if (base64test.exec(input)) {
	  alert("There were invalid base64 characters in the input text.\n" +
			"Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
			"Expect errors in decoding.");
   }
   input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

   do {
	  enc1 = keyStr.indexOf(input.charAt(i++));
	  enc2 = keyStr.indexOf(input.charAt(i++));
	  enc3 = keyStr.indexOf(input.charAt(i++));
	  enc4 = keyStr.indexOf(input.charAt(i++));

	  chr1 = (enc1 << 2) | (enc2 >> 4);
	  chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
	  chr3 = ((enc3 & 3) << 6) | enc4;

	  output = output + String.fromCharCode(chr1);

	  if (enc3 != 64) {
		 output = output + String.fromCharCode(chr2);
	  }
	  if (enc4 != 64) {
		 output = output + String.fromCharCode(chr3);
	  }

	  chr1 = chr2 = chr3 = "";
	  enc1 = enc2 = enc3 = enc4 = "";

   } while (i < input.length);

   return unescape(output);
}

function moveCaretToStart(el) {
    if (typeof el.selectionStart == "number") {
        el.selectionStart = el.selectionEnd = 0;
    } else if (typeof el.createTextRange != "undefined") {
        el.focus();
        var range = el.createTextRange();
        range.collapse(true);
        range.select();
    }
}

function getConsecutiveObject(arr, obj, direction){
	var objIndex = arr.indexOf(obj);
	objIndex += direction;
	// Backward safeguard
	if (objIndex < 0) {
		objIndex = arr.length + objIndex;
	}
	// Forward safeguard
	objIndex %= arr.length;

	return arr[objIndex];
}

function ucFirst(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}
