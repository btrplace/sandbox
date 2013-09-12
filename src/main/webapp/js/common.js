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