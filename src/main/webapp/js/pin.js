//Check for an id
function init() {
var offset = location.href.indexOf("id=");
if ( offset > 0) {
        pin = location.href.substring(offset + 3);
        loadExperiment(pin);
} else {
    console.log("Nothing to load");
    step(0);
}
}

function pin(nodes, scenario) {
    var experiment = {"cfg":serialize(nodes), "scenario" : scenario,"script" : document.getElementById('constraints').value};
    console.log(experiment);

    var http = createXhrObject();
    var port = document.location.port;
    var href = document.location.href;
    //Remove the possible index.html at the end
    var url = href;
    if (href.lastIndexOf("/index.html") > 1) {
        url = href.substring(0, href.lastIndexOf("/index.html"));
    }
    var params = "experiment="+encodeURI(JSON.stringify(experiment));
    http.open("POST", url + "rest/cache", true);
    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    http.onreadystatechange = function() {
	    if (this.readyState == 4) {
	        if (this.status == 200) {
                console.log("pinned: " + this.responseText);
	        } else {
	            console.log("ERROR: " + this.responseText);
	        }
	    }
    }
    http.send(params);
}

function loadExperiment(id) {
    console.log("Looking for experiment '" + id + "'");
        var http = createXhrObject();
        //Remove the possible index.html at the end
        var url = location.origin + location.pathname;
        http.open("GET", url + "/cache/" + id, true);
        http.onreadystatechange = function() {
    	    if (this.readyState == 4) {
    	        if (this.status == 200) {
    	            console.log(this.responseText);
    	            var experiment = JSON.parse(this.responseText);
    	            scenario = experiment.scenario;
    	            unserialize(experiment.cfg);
    	            document.getElementById('constraints').value = experiment.script;
    	            drawConfiguration('canvas');
    	            step(1);

    	        } else {
    	            console.log("ERROR: " + this.status + ":\n" + this.responseText);
    	            step(0);
    	        }
    	    }
        }
        http.send(null);
}

function serialize(nodes) {
    var cpy = [];
    for (var i in nodes) {
        var n = nodes[i];
        cpy[i] = new Node();
        cpy[i].id = n.id;
        cpy[i].cpu = n.cpu;
        cpy[i].mem = n.mem;

        for (var j in n.vms) {
            var v = n.vms[j];
            var x = new VirtualMachine();
            x.id = v.id;
            x.mem = v.mem;
            x.cpu = v.cpu;
            cpy[i].host(x);
        }
    }
    return cpy;
}

function unserialize(src) {
    nodes = [];
    vms = [];
    for (var i in src) {
        s = src[i];
        var n = new Node(s.id, s.cpu, s.mem);
        for (var j in s.vms) {
            v = s.vms[j];
            vv = new VirtualMachine(v.id, v.cpu, v.mem);
            n.host(vv);
            vms.push(vv);
        }
        nodes.push(n);
    }
}