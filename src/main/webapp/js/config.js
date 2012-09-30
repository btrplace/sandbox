/**
  Javascript related to the edition of configuration
  @author Fabien Hermenier
*/


function randomConfiguration() {
    var buf = "# Nodes:\nN1,N2,N3,N4,N5,N6 = {cpu:8,mem:6}\n";
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
    buf += "\n# Virtual Machines:\n";
    for (var i in picked) {
        if (picked.hasOwnProperty(i)) {
            var vms = picked[i];
            if (vms.length > 0) {
                buf += vms.join() + " = {cpu:" + tpls[i][0] + ",mem:" + tpls[i][1] + "}\n";
            }
        }
    }
    //Set idle node offline
    buf += "\n# Assignment:\n";
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
    var ret = parseConfiguration(buf);
    if (ret[0].nodes.length) {
        config = ret[0];
        drawConfiguration('canvas');
    }
    if (ret[1].lines.length > 0) {
        console.log(ret[1].msgs);
    }
}

function makeOrCompleteElement(id, config, errors, lineNumber, cnt) {
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
        if (cnt.cpu && cnt.cpu > 0) {n.cpu = cnt.cpu;}
        if (cnt.mem && cnt.mem > 0) {n.mem = cnt.mem;}
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
        errors.lines.push(lineNumber);
        errors.msgs.push("lines " + lineNumber + ": Type error: '" + id + "' must start with a 'N' or a 'V' to specify a node or a virtual machine");
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
    var errors = new Object();
    errors.lines = [];
    errors.msgs = [];
    for (var i in lines) {
        var lineNumber = parseInt(i) + 1;
        lines[i] = lines[i].replace(/\s/g, ""); //Remove space characters
        if (lines[i].length == 0 || lines[i].indexOf("#") == 0) {continue;} //Skip blank lines and single line comments

        var toks = lines[i].split("=");
        if (toks.length == 2 && toks[1].length > 1 && toks[0].length > 0) {
            //Get the identifiers
            var ids = toks[0].split(",");

            //Right parameter is a JSON structure
            var proper = toks[1].replace(/(\w+):/g,"\"$1\":");
            //console.log(proper);
            var json = JSON.parse(proper);
            //console.log(json);

            //Check for positive value here to avoid duplicate error messages
            if ((typeof(json.cpu) !== 'undefined' && json.cpu <= 0) || (typeof(json.mem) !== 'undefined' && json.mem <= 0)) {
                errors.lines.push(lineNumber);
                errors.msgs.push("lines " + lineNumber + ":     The memory or the resource consumption must be strictly positive");
            }

            for (var j in ids) {
                //Declare an element
                if (ids[j][0] != 'V' && ids[j][0] != 'N') {
                }
                makeOrCompleteElement(ids[j], config, errors, lineNumber, json);
                if (json.vms && json.vms.length > 0) { //This is a online node
                    var n = config.getNode(ids[0]);
                    if (n.online == 0) {
                        errors.lines.push(i);
                        errors.msgs.push("lines " + lineNumber + ": '" + n.id + "' is online. It can not host VMs");
                    } else {
                        vms = json.vms.split(",");
                        for (var k in vms) {
                            var vmId = vms[k];
                            var vm = config.getVirtualMachine(vmId);
                            if (!vm) {
                                errors.lines.push(i);
                                errors.msgs.push("lines " + lineNumber + ": Unknown virtual machine '" + vmId + "'");
                            } else {
                                var x = config.getHoster(vm.id);
                                if (x) {
                                    errors.lines.push(i);
                                    errors.msgs.push("lines " + lineNumber + ":  virtual machine '" + vmId + "' is already running on '" + x.id + "'");
                                } else if (!n.fit(vm)) {
                                    errors.lines.push(i);
                                    errors.msgs.push("lines " + lineNumber + ": '" + vmId + "' cannot fit in '" + n.id + "'");
                                } else {
                                    n.host(vm);
                                }
                            }
                        }
                    }
                }
            }
        } else {
            errors.lines.push(i);
            errors.msgs.push("lines " + lineNumber + ": The line does not respect the format '<li>identifiers</li> = <li>content</li>");
        }
    }
    if (config.nodes.length == 0) {
            errors.lines.push(lines.length - 1);
            errors.msgs.push("lines " + lines.length + ": The configuration must be composed of at least 1 node.");
    }
    return [config,errors];
}