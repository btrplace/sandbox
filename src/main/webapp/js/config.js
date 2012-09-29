/**
  Javascript related to the edition of configuration
  @author Fabien Hermenier
*/


function randomConfiguration() {
    var buf = "#The nodes:\nN1,N2,N3,N4,N5,N6 = {cpu:8,mem:6}\n";
    buf += "N7,N8 = {cpu:6,mem:6}\n";

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
    var picked = [];
    for (var i = 1; i <= 20; i++) {
	    var x = Math.floor(Math.random() * tpls.length);
	    var v = new VirtualMachine("VM" + i, tpls[x][0], tpls[x][1]);
	    config.vms.push(v);

	    //Placement
	    var nIdx = Math.floor(Math.random() * config.nodes.length);
	    if (config.nodes[nIdx].fit(v)) {
	        config.nodes[nIdx].host(v);
            if (!picked[x]) {picked[x] = [v.id];}
            else {picked[x].push(v.id);}

	    }

    }
    //VMs declaration
    buf += "\n#Virtual Machines:\n";
    for (var i in picked) {
        if (picked.hasOwnProperty(i)) {
            var vms = picked[i];
            if (vms.length > 0) {
                buf += vms.join() + " = {cpu:" + tpls[i][0] + ",mem:" + tpls[i][1] + "}\n";
            }
        }
    }
    //Set idle node offline
    buf += "\n#Assignment:\n";
    for (var i in config.nodes) {
	    var n = config.nodes[i];
	    if (n.vms.length == 0) {
	        buf += n.id + " = {online: 0}\n";
	    } else {
	        buf += n.id + " = {vms: \"" + n.getVMsIds().join(",")+"\"}\n";
	    }
    }
    return buf;
}


function updateConfiguration(buf) {
    var cfg = parseConfiguration(buf);
    console.log(cfg);
    if (cfg.nodes.length > 0) {
        config = cfg;
        drawConfiguration('canvas');
    }
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

function parseConfiguration(b) {

    var lines = b.split("\n");
    //Replace \w+: by "\w+": to make the content JSON compatible

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
            var json = JSON.parse(toks[1].replace(/(\w+):/g,"\"$1\":"));
            //console.log(json);

            for (var j in ids) {
                //Declare an element
                makeOrCompleteElement(ids[j], config, json);
                if (json.vms && json.vms.length > 0) { //This is a online node
                    var n = config.getNode(ids[0]);
                    //console.log("Place the vms " + json.vms);
                    //Now, the VMs
                    vms = json.vms.split(",");
                    for (var k in vms) {
                        var vmId = vms[k];
                        var vm = config.getVirtualMachine(vmId);
                        if (!vm) {
                            console.log("Unknown virtual machine '" + vmId + "'");
                        } else {
                       //     console.log("Place '" + vm.id + "' on '" + n.id +"'");
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