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
    var cfg = parseConfiguration(buf);
    console.log(cfg);
    if (cfg) {
        nodes = cfg.nodes;
        vms = cfg.vms;
        drawConfiguration('canvas');
    }
}