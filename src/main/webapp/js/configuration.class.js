function Configuration (ns,vs) {
    this.vms = vs ? vs : [];
    this.nodes = ns ? ns : [];

    this.getNode = function (id) {
        for (var i in this.nodes) {
            if (this.nodes[i].id == id) {
                return this.nodes[i];
            }
        }
    }

    this.getHoster = function(id) {
        for (var i in this.nodes) {
            if (this.nodes[i].isHosting(id)) {
                return this.nodes[i];
            }
        }
    }

    this.getVirtualMachine = function (id) {
        for (var i in this.vms) {
            if (this.vms[i].id == id) {
                return this.vms[i];
            }
        }
    }

    this.btrpToJSON = function(){
        var json = {};
        var nodes = {};
        for(var i in this.nodes){
            var n = this.nodes[i],
                nJSON = {};

        }
    }

    this.btrpSerialization = function() {
        var buffer = "#list of nodes\n";
        for (var i in this.nodes) {
    	    var  n = this.nodes[i];
    	    buffer = buffer + n.id + " 1 " + n.cpu + " " + n.mem + "\n";
        }
        buffer = buffer + "#list of VMs\n";
        for (var  i in this.vms) {
    	var vm = this.vms[i];
    	buffer = buffer + "sandbox."+vm.id + " 1 " + vm.cpu + " " + vm.mem + "\n";
        }
        buffer += "#initial configuration\n";
        for (var i in this.nodes) {
    	var n = this.nodes[i];
    	if (n.online) {
    	    buffer += n.id;
    	} else {
    	    buffer = buffer + "(" + n.id + ")";
    	}
    	for (var j in n.vms) {
    	    var vm = n.vms[j];
    	    buffer = buffer + " sandbox." + vm.id;
    	}
    	buffer += "\n";
        }
        return buffer;
    }

    this.getNextNodeID = function(){
    	var candidate = 0;
    	var valid = false;
    	while (!valid) {
    		valid = true;
    		for (var i in this.nodes) {
				if ("N"+candidate == this.nodes[i].id) {
					valid = false;
					candidate++;
					break;
				}
			}
    	}
    	return "N"+candidate;
    }

    this.getNextVMID = function(){
        	var candidate = 0;
        	var valid = false;
        	while (!valid) {
        		valid = true;
        		for (var i in this.vms) {
    				if ("VM"+candidate == this.vms[i].id) {
    					valid = false;
    					candidate++;
    					break;
    				}
    			}
        	}
        	return "VM"+candidate;
    }

    this.toStorage = function(){
    	var result = [],
    		nodes = [];
    	result.push(nodes);
    	result.push(editor.getValue());
    	for(var i in this.nodes){
            nodes.push(this.nodes[i].toStorage());
    	}
    	return result ;
    }

    this.fromStorage = function(configData){
    	this.nodes = [];
    	this.vms = [];
    	for(var i in configData[0]){
 			var nodeData = configData[0][i],
    			node = createNodeFromStorage(nodeData);
    		this.nodes.push(node);
    	}
		editor.setValue(configData[1]);
		drawConfiguration("canvas");
    }
}