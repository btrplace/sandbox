function pin(nodes, scenario) {
    var experiment = {"cfg":smallConfig(nodes), "scenario" : scenario};
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
	            console.log(this.responseText);

	        } else {
	            console.log("ERROR: " + this.responseText);
	        }
	    }
    }
    http.send(params);
}

function smallConfig(nodes) {
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