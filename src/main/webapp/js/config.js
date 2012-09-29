/**
  Javascript related to the edition of configuration
  @author Fabien Hermenier
*/

/**
* Script format
VM1 5 5
VM2 6 7
VM3 1 1
VM4 1 1
VM5 2 2
N1 10 10
N2 10 10
N3 10 10
N4 10 10
N5 8 8
N6 8 8
N6 8 8
N1: VM1 VM2 VM4
N2: VM4 VM5
(N3)
*/

function parseConfiguration(buffer) {
    var lines = buffer.split("\n");
    var ids = new Object();
    var config = new Configuration();
    for (var i in lines) {
        if (lines[i].length == 0 || lines[i].indexOf("//") == 0) {
        continue;
        }
        var cnt = lines[i].split(" ");
        var id = cnt[0];
        if (id.charAt(id.length - 1) == ":") { //This is an assignment
            var nodeId;
            var online = true;
            if (id[0] == "(") { //Offline node
                nodeId = id.slice(1,-2);
                online = false;
            } else {
                nodeId = id.slice(0, -1);
            }
            if (ids[nodeId] != null) {
                console.log(nodeId);
                var n = new Node(nodeId,ids[nodeId][0], ids[nodeId][1]);
                n.online = online;

                //Now the assignment
                for (var j in cnt) {
                    var tok = cnt[j];
                    if (ids[tok]) {
                        //Create if the object does not already exists
                        var vm = new VirtualMachine(tok, ids[tok][0], ids[tok][1]);
                        if (n.fit(vm)) {
                            n.host(vm);
                            config.vms.push(vm);
                        } else {
                            console.log("Ignoring VM " + vm.id);
                        }
                    }
                }
                config.nodes.push(n);
            }
        } else { //Declaration
            //TODO: Check the number of parameters
            if (cnt.length != 3) {
                return null;
            }
            ids[cnt[0]] = [cnt[1], cnt[2]];
        }
    }
    return config;
}

function dumpOld(nodes, vms) {
    var cfg = new Configuration();
    cfg.nodes = nodes;
    cfg.vms = vms;
    return dumpConfiguration(cfg);
}
function dumpConfiguration(cfg) {
    var buffer ="";
    for (var i in cfg.nodes) {
        var n = cfg.nodes[i];
        buffer += n.id + " " + n.cpu + " " + n.mem + "\n";
    }
    for (var i in cfg.vms) {
        var vm = cfg.vms[i];
        buffer += vm.id + " " + vm.cpu + " " + vm.mem + "\n";
    }
    //The assignment
    for (var i in cfg.nodes) {
        var n = cfg.nodes[i];
        if (!n.online) {
            buffer += "(" + n.id + "):\n";
        } else {
            buffer += n.id+":";
            for (var j in n.vms) {
                var vm = n.vms[j];
                buffer += " " + vm.id;
            }
            buffer += "\n";
        }
    }
    return buffer;
}


function randomConfiguration() {
    var config = new Configuration();
    //Generate the 8 nodes
    for (var i = 1; i <= 8; i++) {
	    var n;
	    if (i < 6) {
	        n = new Node("N" + i, 8, 6);
	    } else {
	        n = new Node("N" + i, 6, 6);
	    }
	    config.nodes.push(n);
    }

    //Templates
    var tpls = [[1,2],[2,1],[2,2],[2,1],[3,2],[2,3]];
    for (var i = 1; i <= 20; i++) {
	    var x = Math.floor(Math.random() * tpls.length);
	    var v = new VirtualMachine("VM" + i, tpls[x][0], tpls[x][1]);
	    config.vms.push(v);

	    //Placement
	    var nIdx = Math.floor(Math.random() * nodes.length);
	    if (config.nodes[nIdx].fit(v)) {
	        config.nodes[nIdx].host(v);
	    }

    }
    //Set idle node offline
    for (var i in config.nodes) {
	    var n = config.nodes[i];
	    if (n.vms.length == 0) {
	        n.online = false;
	    }
    }
    return config;
}
function updateConfiguration(buf) {
    var cfg = parseConfiguration2(buf);
    console.log(cfg);
    if (cfg.nodes.length > 0) {
        config = cfg;
        drawConfiguration('canvas');
    }
}

function fillConfig(cfg) {
  var table_obj = $('#tableNodes');
  table_obj.append('<caption>Nodes</caption>');
  table_obj.append('<thead><tr><td>ID</td><td>cpu</td><td>mem</td></tr></thead><tbody>');
    $.each(cfg.nodes, function(v, n){
         table_obj.append('<tr id="'+n.id+'"><td>'+n.id+'</td><td>' + n.cpu + "</td><td>" + n.mem + "</td></tr>");
    });
   table_obj.append("</tbody>");

  var table_obj = $('#tableVMs');
  table_obj.append('<caption>Virtual machines</caption>');
  table_obj.append('<thead><tr><td>ID</td><td>cpu</td><td>mem</td></tr></thead><tbody>');
  $.each(cfg.vms, function(v, n){
    table_obj.append('<tr id="'+n.id+'"><td>'+n.id+'</td><td>' + n.cpu + "</td><td>" + n.mem + "</td></tr>");
  });
  table_obj.append("</tbody>");

}

function typeElement(id, known, elements, f) {
    //Look for the element
    for (var i in known) {
        if (known.id == id) {
            return known[i];
        }
    }
    //The elem does not exists yet
    if (!elements[id]) {
        return null;
    }
    var e = f(id, elements[id]);
    known.push(e);
    return e;
}

function makeOrCompleteElement(id, config, cnt) {
    if (id[0] == 'N') {
        var n = new Node(id, 1, 1);
        var b = true;
        for (var i in config.nodes) {
            if (config.nodes[i].id == id) {
                n = config.nodes[i];
                b = false;
                break;
            }
        }
        if (cnt.cpu) {n.cpu = cnt.cpu;}
        if (cnt.mem) {n.mem = cnt.mem;}
        if (cnt.online == 1 || cnt.online == 0) {n.online = cnt.online;}
        if (b) {config.nodes.push(n);}
    } else if (id[0] == 'V') {
        var vm = new VirtualMachine(id, 1, 1);
        var b = true;
        for (var i in config.vms) {
            if (config.vms[i].id == id) {
                vm = config.vms[i];
                b = false;
                break;
            }
        }
        if (cnt.cpu) {vm.cpu = cnt.cpu;}
        if (cnt.mem) {vm.mem = cnt.mem;}
        if (b) {config.vms.push(vm);}
    } else {
        console.log(id + " must be either a VM or a node");
    }
}


/**
 * Configuration format:
  N1,N2,N3,N4,N5,N6,N7,N8 = { cpu:8, mem:6 };
  VM1,VM2, VM3, VM4, ... = {cpu: X, mem:Y };

  N1 = {vms: {VM1, VM2, VM3}}
  N2 = {offline}
*/
function parseConfiguration2(b) {
    //Remove space characters
    var lines = b.split("\n");
    //console.log(lines);
    var elements = new Object();
    var config = new Configuration();
    for (var i in lines) {
        //console.log("Line: '" + lines[i] + "'");
        lines[i] = lines[i].replace(/\s/g, "");
        //Skip blank lines and single line comments
        if (lines[i].length == 0 || lines[i].indexOf("#") == 0) {
        continue;
        }

        var toks = lines[i].split("=");
        if (toks.length == 2) {
            //Get the identifiers
            var ids = toks[0].split(",");

            //Right parameter is a JSON structure
            var json = JSON.parse(toks[1]);
            console.log(json);

            for (var j in ids) {
                //Declare an element
                makeOrCompleteElement(ids[j], config, json);

                if (json.vms) { //This is a online node
                    var n = typeElement(ids[j], config.nodes, elements, function(x, e) {
                        return new Node(x, e.cpu, e.mem);
                    });

                    //Now, the VMs
                    for (var k in json.vms) {
                        var vmId = json.vms[k];
                        var vm = typeElement(vmId, config.vms, elements, function(x, e) {
                            var vm = new VirtualMachine(vmId, elements[vmId].cpu, elements[vmId].mem);
                            n.host(vm);
                        });

                    }
                }
            }
        } else {
            console.log("Syntax error on line '" + lines[i] + "'. No '=' sign: " + toks.length);
            return false;
        }
        }
    return config;
}