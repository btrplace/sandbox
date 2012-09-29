/**
  Javascript related to the edition of configuration
  @author Fabien Hermenier
*/


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

    var lines = b.split("\n");
    var elements = new Object();
    var config = new Configuration();
    for (var i in lines) {
        lines[i] = lines[i].replace(/\s/g, ""); //Remove space characters
        if (lines[i].length == 0 || lines[i].indexOf("#") == 0) {continue;} //Skip blank lines and single line comments

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
                if (json.vms && json.vms.length > 0) { //This is a online node
                    var n = config.getNode(ids[0]);
                    console.log("Place the vms " + json.vms);
                    //Now, the VMs
                    vms = json.vms.split(",");
                    for (var k in vms) {
                        var vmId = vms[k];
                        var vm = config.getVirtualMachine(vmId);
                        if (!vm) {
                            console.log("Unknown virtual machine '" + vmId + "'");
                        } else {
                            console.log("Place '" + vm.id + "' on '" + n.id +"'");
                            n.host(vm);
                        }

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