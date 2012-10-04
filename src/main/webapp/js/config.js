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
    buf += "\n# Assignment:";
    for (var i in config.nodes) {
	    var n = config.nodes[i];
	    if (n.vms.length == 0) {
	        buf += "\n" + n.id + " = {online: 0}";
	    } else {
	        buf += "\n" + n.id + " = {vms: \"" + n.getVMsIds().join(",")+"\"}";
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
    highlightErrors(ret[1]);
}

function highlightErrors(errors) {

    var annotations = [];
    for (var i in errors) {
        annotations.push({
            row: errors[i][1] - 1,
            column: 0,
            text: errors[i][2],
            type: errors[i][0]
        }
        );
    }
    if (errors.length > 0) {
        $("#log")[0].innerHTML = "<div class=\"ace_error\"></div> " + errors.length + " error(s)";
    } else {
        $("#log")[0].innerHTML = "";
    }
    configEditor.setAnnotations(annotations);
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
        if (cnt.cpu > 0) {vm.cpu = cnt.cpu;}
        if (cnt.mem > 0) {vm.mem = cnt.mem;}
        if (b) {config.vms.push(vm);}
    } else {
        errors.push([lineNumber, "Unable to type '" + id + "'. It must start by a 'N' or a 'V' to indicate a node or a virtual machine"]);
    }
}

function createElements(ids, config, errors, lineNumber, cnt) {

    //Accepted: cpu,mem,vms

    if ((typeof(cnt.cpu) !== 'undefined' && cnt.cpu <= 0) || (typeof(cnt.mem) !== 'undefined' && cnt.mem <= 0)) {
        errors.push(["error",lineNumber, "Resources usage must be strictly positive"]);
        return;
    }

    for (var x in ids) {
        var id = ids[x];
        if (id.length == 0) {
            errors.push(["error",lineNumber, "Missing identifier"]);
        } else if (id[0] == 'N') {
            var n = new Node(id, 0, 0); //0 to detect undeclared node when having N1 = {vms:".."} without any cpu or mem declaration
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
            if (cnt.cpu > 0) {vm.cpu = cnt.cpu;}
            if (cnt.mem > 0) {vm.mem = cnt.mem;}
            if (b) {config.vms.push(vm);}
        } else {
            errors.push([lineNumber, "Unable to type '" + id + "'. It must start by a 'N' or a 'V' to indicate a node or a virtual machine"]);
        }
    }
}


function createPlacement(nid, config, vms, errors, lineNumber) {
    var n = config.getNode(nid);
    if (!n || n.cpu == 0 || n.mem == 0) {
        console.log("Line " + lineNumber);
        errors.push(["error", lineNumber, "Unknown node '" + nid + "'"]);
        return;
    } else if (n.online == 0) {
        errors.push(["error", lineNumber, "'" + n.id + "' is declared as offline. It cannot host VMs"]);
        return;
    } else {
        var unknownVMs = [];
        for (var k in vms) {
            var vmId = vms[k];
            var vm = config.getVirtualMachine(vmId);
            if (!vm) {
                unknownVMs.push(vmId);
            } else {
                var x = config.getHoster(vm.id);
                if (x) {
                    errors.push(["error", lineNumber, "'" + vmId + "' is already running on '" + x.id + "'"]);
                }
            }
            if (!n.fit(vm)) {
                //vm and after cannot fit.
                errors.push(["error", lineNumber, "Virtual Machines '" + vms.slice(k).join() + "' cannot fit on '" + n.id + "'"]);
                break;
            } else {
                n.host(vm);
            }
        }
    }
    if (unknownVMs.length > 0) {
        errors.push(["error", lineNumber, "Unknown virtual machine(s): " + unknownVMs.join()]);
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
    var elements = new Object();
    var config = new Configuration();
    var errors = [];
    for (var i in lines) {
        lines[i].replace(/\s/g, "");
        var lineNumber = parseInt(i) + 1;
        if (lines[i].length == 0 || lines[i].indexOf("#") == 0) {continue;} //Skip blank lines and single line comments

        var toks = lines[i].split("=");
        if (toks.length == 2 && toks[1].length > 1 && toks[0].length > 0) {
            //Get the identifiers
            var ids = toks[0].replace(/\s/g, "").split(",");

            //Right parameter is a JSON structure
            var proper = toks[1].replace(/(\w+):/g,"\"$1\":");
            try {
                var json = JSON.parse(proper);
                createElements(ids, config, errors, lineNumber, json);
                if (json.vms && json.vms.length > 0) {
                    createPlacement(ids[0], config, json.vms.split(","), errors, lineNumber);
                }
            } catch (err) {
                errors.push(["error",lineNumber, err.message]);
            }

        } else {
            errors.push(["error", lineNumber, "The line does not respect the format 'identifiers = content"]);
        }
    }
    if (config.nodes.length == 0) {
        errors.push(["error", lineNumber, "The configuration must be composed of at least 1 node"]);
    }
    return [config,errors];
}