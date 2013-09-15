/**
  Javascript related to the edition of configuration
  @author Fabien Hermenier
*/

// Generate the getting start, as it is in the Btrplace wiki on github.
function generateGettingStarted(){
	config = new Configuration();
	// Création de 4 noeuds
	for (var i = 0; i < 4; i++) {
		var n = new Node("N" + i, 8, 7);
		config.nodes.push(n);
	}

	//Templates
	var tpls = [[1,2],[2,1],[2,2],[2,1],[3,2],[2,3]];
	var picked = [];

	for (var i = 0; i < 6; i++) {
		var v = new VirtualMachine("VM" + i);
		config.vms.push(v);
	}

	config.vms[0].cpu = 2 ;
	config.vms[0].mem = 2 ;
	config.vms[1].cpu = 3 ;
	config.vms[1].mem = 2 ;
	config.vms[2].cpu = 4 ;
	config.vms[2].mem = 4 ;
	config.vms[3].cpu = 3 ;
	config.vms[3].mem = 3 ;
	config.vms[4].cpu = 1 ;
	config.vms[4].mem = 1 ;
	config.vms[5].cpu = 5 ;
	config.vms[5].mem = 4 ;

	config.nodes[0].host(config.vms[2]);
	config.nodes[1].host(config.vms[1]);
	config.nodes[2].host(config.vms[0]);
	config.nodes[2].host(config.vms[3]);
	config.nodes[3].host(config.vms[5]);
}

function randomConfiguration() {
    return generateGettingStarted();

//    var buf = "# Nodes:\nN1,N2,N3,N4,N5,N6 = {cpu:8,mem:6}\n";
//    buf += "N7,N8 = {cpu:6,mem:6}\n";

    config = new Configuration();
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

    console.log("Picked : ", picked);
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
    //var configurationJSON = '{"views":[{"id":"shareableResource","rcId":"mem","nodes":{},"defCapacity":7,"vms":{"3":3,"2":4,"1":2,"0":2,"5":4},"defConsumption":0},{"id":"shareableResource","rcId":"cpu","nodes":{},"defCapacity":8,"vms":{"3":3,"2":4,"1":3,"0":2,"5":5},"defConsumption":0}],"mapping":{"onlineNodes":{"3":{"runningVMs":[5],"sleepingVMs":[]},"2":{"runningVMs":[0,3],"sleepingVMs":[]},"1":{"runningVMs":[1],"sleepingVMs":[]},"0":{"runningVMs":[2],"sleepingVMs":[]}},"offlineNodes":[],"readyVMs":[4]},"attributes":{"nodes":{},"vms":{}}}';
    //var configuration = parseConfigurationJSON(configurationJSON);
    if (ret[0].nodes.length) {
        config = ret[0];
        console.log("[LOG] Going to redraw after update configuration");
        drawConfiguration('canvas');
    }

    //Hide inspect button if errors
    if (ret[1].length > 0) {
        $(".check_button").get()[0].style.visibility="hidden";
    } else {
        $(".check_button").get()[0].style.visibility="visible";
    }
    highlightErrors(ret[1]);
}

function highlightErrors(errors) {

    var annotations = [];

    var msgs = [];

    for (var j in errors) {
        var err = errors[j];
            var lineNo = err[1] - 1;
            if (!msgs[lineNo]) {
                msgs[lineNo] = err[2];
            } else {
                msgs[lineNo] += "\n" + err[2];
            }
        }

    for (var j in msgs) {
        var msg = msgs[j];
        annotations.push({
            row: j,
            column: 0,
            type: "error",
            text: msg
        });
    }

    if (errors.length > 0) {
        $("#config-mode > a").get()[0].style.fontWeight="bold";
        $("#config-mode > a").get()[0].style.color="red";
    } else {
        $("#config-mode > a").get()[0].style.fontWeight="";
        $("#config-mode > a").get()[0].style.color="";
    }
}

function createElements(ids, config, errors, lineNumber, cnt) {

    //Accepted: cpu,mem,vms

    if ((typeof(cnt.cpu) !== 'undefined' && cnt.cpu <= 0) || (typeof(cnt.mem) !== 'undefined' && cnt.mem <= 0)) {
        errors.push(["error",lineNumber, "Resources usage must be strictly positive"]);
        return;
    }

    for (var x in ids) {
        var id = ids[x].trim();
        if (id.length == 0) {
            errors.push(["error",lineNumber, "Missing identifier"]);
        } else if (id.indexOf(' ') > 0) {
            errors.push(["error",lineNumber, "Space characters not allowed here"]);
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
            if (typeof(cnt.online) !== 'undefined') {
                if (cnt.online == 1 || cnt.online == 0) {
                    n.online = cnt.online;
                } else {
                    errors.push(["error",lineNumber, "I ncorrect value: '1' for an online node, '0' otherwise"]);
                    break;
                }
            }
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
        errors.push(["error", lineNumber, "Unknown node '" + nid + "'"]);
        return;
    } else if (n.online == 0) {
        errors.push(["error", lineNumber, "'" + n.id + "' is declared as offline. It cannot host VMs"]);
        return;
    } else {
        var unknownVMs = [];
        for (var k in vms) {
            var vmId = vms[k].trim();
            var vm = config.getVirtualMachine(vmId);
            if (vmId.indexOf(' ') > 0) {
                errors.push(["error",lineNumber, "Space characters not allowed here"]);
            } else if (!vm) {
                unknownVMs.push(vmId);
            } else {
                var x = config.getHoster(vm.id);
                if (x) {
                    errors.push(["error", lineNumber, "'" + vmId + "' is already running on '" + x.id + "'"]);
                } else if (!n.fit(vm)) {
                    errors.push(["error", lineNumber, "Virtual Machines '" + vms.slice(k).join() + "' cannot fit on '" + n.id + "'"]);
                    break;
                } else {
                    n.host(vm);
                }
            }
        }
    }
    if (unknownVMs.length > 0) {
        errors.push(["error", lineNumber, "Unknown virtual machine(s): " + unknownVMs.join()]);
    }
}