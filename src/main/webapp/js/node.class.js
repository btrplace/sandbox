function createNodeFromStorage(data){
	var node = new Node(data[0], data[1], data[2]);
	node.populateFromStorage(data);
	return node ;
}

function Node(name, cpu, mem) {
    this.id = name;
    this.cpu = cpu;
    this.mem = mem;
    this.online = true;
    this.vms = [];
    this.isSelected = false;

    this.boundingBox = function () {
	    return [2 * border + unit_size * this.cpu, 2 * border + unit_size * this.mem];
    };

    this.draw = function (canvas, x, y) {
	    this.posX = x;
	    this.posY = y;

	    if( this.boxStroke != undefined ) this.boxStroke.remove();
	    if( this.boxFill != undefined ) this.boxFill.remove();

        this.boxStroke = canvas.set();
        this.boxFill = canvas.set();
	    this.canvas = canvas;
	    var box_width = this.cpu * unit_size;
	    var box_height = this.mem * unit_size;
	    var width = 2 * border + box_width;
	    var height = 2 * border + box_height;
	    var rc_bg = "#fff";

	    var bgColor = this.online ? "black" : "#bbb";

 	    //lightgray for the resources area
 	    var rect = canvas.rect(x + border, y + border, box_width, box_height).attr({'stroke':bgColor});
 	    // Fill with transparent color to catch click
 	    rect.attr({'fill':'rgba(0,0,0,0)'});
 	    this.rect = rect;

 	    this.updateSelectionDraw();

	    this.boxStroke.push(rect);

	    //labels
        this.boxFill.push(canvas.text(x + width - border,y + height - 10,"cpu").attr({'font-size':'12pt','text-anchor':'end','baseline-shift':'0em','fill':bgColor}));
        this.boxFill.push(canvas.text(x + 2,y + border - 7,"memory").attr({'font-size': '12pt','text-anchor':'start','baseline-shift':'0em','fill':bgColor}));

	    //Node name, bottom left
	    this.boxFill.push(canvas.text(x - 1 + border, y + border + box_height, name).attr({'text-anchor': 'end' ,'baseline-shift': '-2em','font-size' : '16pt', 'fill' : bgColor}));

        //Resource grid
	    for (var i = 1; i < this.cpu; i+=1) {
	        var pos = border + i * unit_size;
	        this.boxStroke.push(canvas.path("M " + (x + pos) + " " + (y + border) + " l " + " 0 " + " " + box_height).attr({'stroke-dasharray' : '--','stroke':bgColor}));
	    }
    	for (var i = 1; i < this.mem; i+=1) {
	        var pos = border + i * unit_size;
	        this.boxStroke.push(canvas.path("M " + (x + border) + " " + (y + pos) + " l " + box_width + " 0").attr({'stroke-dasharray' : '--','stroke':bgColor}));
	    }

	    //The VMs
	    //get the origin of the boundingBox
	    var oX = this.posX + border;
	    var oY = this.posY + border + box_height;
	    for (var i in this.vms) {
	        this.vms[i].draw(canvas,oX,oY);
	        //Update the position by the VMs bounding box
	        oX += this.vms[i].boundingBox()[0];
	        oY -= this.vms[i].boundingBox()[1];
	    }

		var drawingElements = $.merge(this.boxStroke, this.boxFill);
		//var drawingElements = this.boxStroke;
		var self = this ;
		// Add class data foreach drawed element, to ensure to
		// catch the click, even on the grid line.
		foreachArray(drawingElements, function(element){
			element.node.setAttribute("class","nodeZone");
			element.node.setAttribute("sandboxNodeID",self.id);
		});
    }

	this.setSelected = function(isSelected){
		this.isSelected = isSelected ;
		this.updateSelectionDraw();
	}

	this.updateSelectionDraw = function(){
		if( this.isSelected ){
			this.rect.attr({
				'fill':'#DBDEC5',
				'fill-opacity':'1'
			});
		}
		else {
			this.rect.attr({'fill-opacity':'0'});
		}
	}

	/*
	 * Returns true if the Node can be reduced by some attribute
	 * @param attribute String 'cpu' or 'mem'
	 */
	this.canBeReduced = function(attribute){
		var used = 0 ;
		for(var i in this.vms){
			used += this.vms[i][attribute];
		}
		return used < this[attribute] ;
	}

    this.refresh  = function() {
		this.draw(this.canvas,this.posX,this.posY);
    }

    this.host = function(vm) {
		this.vms.push(vm);
    }

    this.unhost = function(vm) {
        for (var i in this.vms) {
            if (this.vms[i].id == vm.id) {
                if (this.vms[i].box) this.vms[i].box.remove();
                this.vms.splice(i, 1);
                break;
            }
        }
    }

    this.isHosting = function(id) {
        for (var i in this.vms) {
            if (this.vms[i].id == id) {
                return true;
            }
        }
        return false;
    }

    this.fit = function(vm) {
	    var freeCPU = this.cpu - vm.cpu;
	    var freeMem = this.mem - vm.mem;
	    for (var v in this.vms) {
	        freeCPU -= this.vms[v].cpu;
	        freeMem -= this.vms[v].mem;

	        if (freeMem < 0 || freeCPU < 0) {
	            break;
	        }
	    }
	    return freeMem >= 0 && freeCPU >= 0;
    }

    this.getVMsIds = function() {
        var ids = [];
        for (var v in this.vms) {
            ids.push(this.vms[v].id);
        }
        return ids;
    }

    this.delete = function(){
    	for (var i in this.vms) {
    		var vm = this.vms[i];
    		vm.delete(false);
    	}
    	config.nodes.splice(config.nodes.indexOf(this), 1);
    }

    this.toStorage = function(){
    	var result = [this.id, this.cpu, this.mem],
    		vms = [];
    	result.push(vms);
    	for(var i in this.vms){
    		vms.push(this.vms[i].toStorage());
    	}
    	return result;
    }

    this.populateFromStorage = function(nodeData){
    	// Add its VMs
    	for(var i in nodeData[3]){
    		var vmData = nodeData[3][i],
    			vm = createVMFromStorage(vmData);//new VirtualMachine("",1,1);
    		//vm.fromStorage(vmData);
    		this.host(vm);
    		config.vms.push(vm);
    	}
    }

    this.free = function() {
        var freeCPU = this.cpu;
        var freeMem = this.mem;
        for (var v in this.vms) {
            freeCPU -= this.vms[v].cpu;
            freeMem -= this.vms[v].mem;
        }
        return [freeCPU, freeMem];
    }
}
