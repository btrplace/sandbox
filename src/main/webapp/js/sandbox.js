var currentView = "";

function changeView(viewName){
	if( viewName == currentView ){
		return ;
	}
	console.log("Switching to View: "+viewName);
	if( viewName == "input" ){
		var duration = 300 ;
		$("#solution > div").hide(duration);
        setTimeout(function(){
            $("#input_zone_wrapper").show(300);
            resetDiagram();
        }, duration);
	}
	else if( viewName == "solution"){
		console.log("Fading out inputWrapper");
		$("#input_zone_wrapper").hide(300, function(){
			$("#solution > div").show(300);
		});
	}
}

var conversionTable ;
function onServerResponse(json){
	//json = JSON.parse('{"origin":{"views":[{"id":"shareableResource","rcId":"mem","nodes":{},"defCapacity":7,"vms":{"0":2,"1":2,"2":4,"3":3,"5":4},"defConsumption":0},{"id":"shareableResource","rcId":"cpu","nodes":{},"defCapacity":8,"vms":{"0":2,"1":3,"2":4,"3":3,"5":5},"defConsumption":0}],"mapping":{"onlineNodes":{"0":{"runningVMs":[2],"sleepingVMs":[]},"1":{"runningVMs":[1],"sleepingVMs":[]},"2":{"runningVMs":[0,3],"sleepingVMs":[]},"3":{"runningVMs":[5],"sleepingVMs":[]}},"offlineNodes":[],"readyVMs":[4]},"attributes":{"nodes":{},"vms":{}}},"actions":[{"to":1,"id":"bootVM","vm":4,"hooks":{"post":[],"pre":[{"amount":2,"id":"allocate","vm":4,"rc":"mem"},{"amount":3,"id":"allocate","vm":4,"rc":"cpu"}]},"start":0,"end":1},{"id":"shutdownVM","vm":3,"hooks":{"post":[],"pre":[]},"start":0,"on":2,"end":1},{"to":2,"id":"migrateVM","vm":5,"hooks":{"post":[],"pre":[]},"start":1,"from":3,"end":2},{"id":"shutdownNode","node":3,"hooks":{"post":[],"pre":[]},"start":2,"end":3},{"amount":3,"id":"allocate","vm":0,"hooks":{"post":[],"pre":[]},"start":3,"on":2,"rc":"cpu","end":3}]}');
	//initialConfig = owl.deepCopy(config);
	console.log("Received JSON : ",json);
	if( json.actions ){
		changeView("solution");
    	$("#userInput").html(cstrsEditor.getValue().replace("\n","<br />"));
    	createDiagram(json.actions);
	}
	if( json.errors ){
		alert("Errors !");
	}
}

$(document).ready(function(){
	changeView("input");
});

var selectedElement = null ;

function registerSelectedElement(element){
	selectedElement = element;
}


function updateClickBindings(){
	//$("body").click(function(){console.log("CLICK on body!")});
	$(".nodeZone, .vmZone").unbind('click').on('click',function(){
		var element ;
		if (this.className.baseVal == "nodeZone") {
			var nodeID = this.attributes["sandboxNodeID"].value;
			element = config.getNode(nodeID);
		}
		if (this.className.baseVal == "vmZone") {
			var vmID = this.attributes["sandboxVMID"].value;
			element = config.vms[vmID];
		}
       	// Safeguard
		if( typeof(element) == "undefined" ){
			console.error("Not a good click :(");
			return ;
		}
		//console.log("Click on element ",element);
        setSelectedElement(element);
	});
}

function setSelectedElement(element){
	if (selectedElement != null) {
		selectedElement.setSelected(false);
	}

	selectedElement = element;

	if (element != null) {
		element.setSelected(true) ;
	}
}

var CPU_UNIT = new VirtualMachine("CPU_UNIT", 1, 0),
	MEM_UNIT = new VirtualMachine("MEM_UNIT", 0, 1);

$(function() {
    updateClickBindings();
	$(document).keydown(function(event){
		console.log("Key "+event.which);
		if( ! editor.isFocused() ){
			var keyCode = event.which,
				redraw = false ;
			if (selectedElement == null) {
				if (keyCode == 78) {
					if (config.nodes.length > 10){
						return ;
					}
					var node = new Node(config.getNextNodeID(), 3,3);
					config.nodes.push(node);
					console.log("Created a node !");
					redraw = true ;
				}
			}
			else if (selectedElement != null){
				redraw = true ;
				// N : New element (node or VM)
				if (keyCode == 78) {
					var node = null ;
					if (selectedElement instanceof Node) {
						node = selectedElement;
					}
					else if (selectedElement instanceof VirtualMachine){
						node = config.getHoster(selectedElement.id);
					}
					if (node != null) {
						var vm = new VirtualMachine(config.getNextVMID(), 1, 1);
							config.vms.push(vm);
						if (node.fit(vm)) {
							node.host(vm);
							drawConfiguration('canvas');
							redraw = false;
							setSelectedElement(vm);
						}
					}
				}
				// Left
				if (keyCode == 37) {
					var minSize = -1;
					//if( (selectedElement instanceof Node && selectedElement.canBeReduced('cpu')) || selectedElement instanceof VirtualMachine){
					if (selectedElement instanceof Node && selectedElement.fit(CPU_UNIT)){
						minSize = 3;
					}
					if (selectedElement instanceof VirtualMachine) {
						minSize = 1;
					}
					console.log("MinSize : "+minSize);
					if (minSize != -1 && selectedElement.cpu > minSize) {
						selectedElement.cpu--;
					}
                    event.preventDefault();
				}
				// Right
				else if (keyCode == 39) {
                	if (selectedElement instanceof Node && selectedElement.cpu < 12) {
                		selectedElement.cpu++;
                	}
                	else if (selectedElement instanceof VirtualMachine) {
						var hoster = config.getHoster(selectedElement.id);
						if (hoster.fit(CPU_UNIT)) {
							selectedElement.cpu++;
						}
					}
                	event.preventDefault();
				}
				// Up
				else if (keyCode == 38){
                	if (selectedElement instanceof Node && selectedElement.mem < 12) {
						selectedElement.mem++;
					}
					else if (selectedElement instanceof VirtualMachine) {
						var hoster = config.getHoster(selectedElement.id);
						if (hoster.fit(MEM_UNIT)) {
							selectedElement.mem++;
						}
					}
                	event.preventDefault();
				}
				// Down
				else if (keyCode == 40){
					var minSize = -1;
					//if ((selectedElement instanceof Node && selectedElement.canBeReduced('mem')) || selectedElement instanceof VirtualMachine) {
					if (selectedElement instanceof Node && selectedElement.fit(new VirtualMachine("test", 0, 1))) {
						minSize = 3;
					}
					if (selectedElement instanceof VirtualMachine) {
						minSize = 1;
					}
					if (minSize != -1 && selectedElement.mem > minSize) {
						selectedElement.mem--;
					}

					event.preventDefault();
				}
				// Escape
				else if (keyCode == 27) {
					if (selectedElement instanceof VirtualMachine) {
						var node = config.getHoster(selectedElement.id);
						setSelectedElement(node);
					}
					else {
						setSelectedElement(null);
					}
					//selectedElement.setSelected(false) ;
					//selectedElement = null ;
				}
				// Delete key : DEL, Backspace
				else if (keyCode == 46 || keyCode == 8) {
					console.log("Deleting ",selectedElement);
					var newSelectedElement = null ;
					// If it's a VM select the previous one in the node.
					if (selectedElement instanceof VirtualMachine){
						var vm = selectedElement ;
						var node = config.getHoster(vm.id),
							vmIndex = node.vms.indexOf(vm);
						vmIndex++;
						// Fix vm index
						var noOver = false;
						// If no VM over the selected one
						if (vmIndex >= node.vms.length) {
							// Target the VM before the selected one
							vmIndex -= 2 ;
							noOver = true ;
						}
						// If no VM under the selected one
						if( vmIndex < 0 ){
							// If there's also no over, select the node
							if (noOver){
								newSelectedElement = node ;
							}
							// Otherwise, select the one over :
							vmIndex+=2;
						}
						// If this is the last VM of the node, select the node
						if( node.vms.length == 1){
						    newSelectedElement = node ;
						}
						// If there's still some element, get the previous
						else {
							newSelectedElement = node.vms[vmIndex];
						}

						//Math.abs(Math.floor(nodeIndex/length)*length)+nodeIndex

					}
					selectedElement.delete();
					if (newSelectedElement != null) {
						setSelectedElement(newSelectedElement);
					}
				}
				// V key : previous
				else if (keyCode == 86){
					if (selectedElement instanceof Node) {
						var nodeIndex = config.nodes.indexOf(selectedElement);
						nodeIndex--;
						if (nodeIndex <= -1) {
							nodeIndex = config.nodes.length-1;
						}
						//Math.abs(Math.floor(nodeIndex/length)*length)+nodeIndex
						setSelectedElement(config.nodes[nodeIndex]);
					}
					else if (selectedElement instanceof VirtualMachine) {
						var vm = selectedElement ;
						var node = config.getHoster(vm.id),
							vmIndex = node.vms.indexOf(vm);
						vmIndex--;
						if (vmIndex <= -1) {
							vmIndex = node.vms.length-1;
						}
						//Math.abs(Math.floor(nodeIndex/length)*length)+nodeIndex
						setSelectedElement(node.vms[vmIndex]);
					}

				}
				else if (keyCode == 16) {
					console.log("Event : ", event.shiftKey);
				}
				// B key : next
				else if (keyCode == 66) {
					if (selectedElement instanceof Node) {
						var nodeIndex = config.nodes.indexOf(selectedElement);
						nodeIndex++;
						nodeIndex %= config.nodes.length;
						//Math.abs(Math.floor(nodeIndex/length)*length)+nodeIndex
						setSelectedElement(config.nodes[nodeIndex]);
					}
					else if (selectedElement instanceof VirtualMachine) {
						var vm = selectedElement ;
						var node = config.getHoster(vm.id),
							vmIndex = node.vms.indexOf(vm);
						vmIndex++;
						vmIndex %= node.vms.length;
						//Math.abs(Math.floor(nodeIndex/length)*length)+nodeIndex
						setSelectedElement(node.vms[vmIndex]);
					}
				}
			}
			if (redraw) {
				drawConfiguration('canvas');
			}
		}
	});
});