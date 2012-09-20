//Check for an id

function init() {
    var o = parseUri(location.href);
    if (o.queryKey.id) {
        console.log("re-using sandbox " + o.queryKey.id);
        loadExperiment(o.queryKey.id);
    } else {
        console.log("New sandbox");
        step(0);
    }

    	            $().ready(function() {
                      $('#pinBox').jqm({modal:true});
                      $('#unknownPinBox').jqm({modal:true});
                    });

$('#tab-container').easytabs({animate: false});
document.getElementById("configuration").value = dumpOld(nodes, vms);

document.getElementById("configuration").onkeyup = function(e){
    updateConfiguration(document.getElementById("configuration").value);
  return true;
 }

}


function pinSandbox() {
    var experiment = {"cfg":serialize(nodes), "scenario" : scenario,"script" : document.getElementById('constraints').value};
    document.getElementById('pin_button').style.visibility="hidden";
    postToAPI("pin","experiment="+encodeURI(JSON.stringify(experiment)),function() {
	    if (this.readyState == 4) {
	        if (this.status == 201) {
	            var l = this.getResponseHeader("Location");
                document.getElementById('pinURL').innerHTML = l;
                document.getElementById('goToPin').href = l;
                $('#pinBox').jqmShow();
	        } else {
	            console.log("ERROR. Status code " + this.status + "\n" + this.responseText);
	        }
	    }
    });
}


function loadExperiment(id) {
        var http = createXhrObject();
        //Remove the possible index.html at the end
        var url = location.origin + location.pathname;
        http.open("GET", url + "/cache/" + id, true);
        http.onreadystatechange = function() {
    	    if (this.readyState == 4) {
    	        if (this.status == 200) {
    	            var experiment = JSON.parse(this.responseText);
    	            scenario = experiment.scenario;
    	            unserialize(experiment.cfg);
    	            document.getElementById('constraints').value = experiment.script;
    	            drawConfiguration('canvas');
    	            step(1);
    	        } else {
    	            console.log("ERROR: " + this.status + ":\n" + this.responseText);
    	            step(0);
    	            $('#unknownPinBox').jqmShow();
    	        }
    	    }
        }
        http.send(null);
}

function serialize(nodes) {
    var cpy = [];
    for (var i in nodes) {
        var n = nodes[i];
        cpy[i] = new Node(n.id, n.cpu, n.mem);

        for (var j in n.vms) {
            var v = n.vms[j];
            var x = new VirtualMachine(v.id, v.cpu, v.mem);
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