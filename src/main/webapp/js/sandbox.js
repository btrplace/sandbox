/*
 * Main functions used by the Sandbox.
 * This does not include function for diagram generation and animation.
 * @author Tom Guillermin
 */
var LOG = true ;
var currentView = "";
// If this variable is set to false, the check() function will not be able to be executed.
var canSubmit = true ;
var canEdit = true ;

// changeView transition duration
var changeViewDuration = 500;

/*
 * Changes the view of the app with a smooth transition.
 * Available views are 'input','solution'
 * @param viewName String The name of the view to change to.
 * @param instant Optional (Default:false). If set to true, the change will be done instantly without transition.
 */
function changeView(viewName, instant){
	// Default value for instant =
	if( typeof(instant) == "undefined" ){
		var instant = false;
	}

	if( viewName == currentView ){
		return ; // Nothing to do !
	}

	if( LOG ) console.log("Switching to View: "+viewName);

	var duration = instant ? 0 : changeViewDuration ;

	if( viewName == "input" ){
		// Back to initial state
		state(0);
		canEdit = true ;

		resetDiagram(function(){
			setTimeout('updateClickBindings',100);
		});
		$("#solution > div").hide(duration,function(){
            $("#input_zone_wrapper").show(duration);
        });
        $("#configurationHelpText").show(changeViewDuration);
	}
	else if( viewName == "solution"){
		state(1);
		canEdit = false ;
		if( LOG ) console.log("Fading out inputWrapper");
		$("#solution > div").show(duration, function(){
        				// Scroll to content
        				$('html, body').animate({
        						scrollTop: $("#content").offset().top
        					}, 1000);
        			});
		$("#input_zone_wrapper").hide(duration);
	}
}

/*
 * Change the active state of the usage flow.
 * Here are the available steps :
 * 0 : initial step, the user is asked to customize the configuration and the script
 * 1 : the user submitted his configuration and the server found a reconfiguration plan to satisfy all the constraints.
 * 2 : all the constraints are already satisfied.
 * 3 : there is no viable solution for this problem
 * 4 : User submitted but there are errors in the user script
 */
function state(id) {
	if (LOG) console.log("[STEP System] Step "+id);
    // Change the message displayed in the box
    $(".state").hide();
    $("#state"+id).show();

    var o = parseUri(location.href);
    // Step 0 : initialization
    if (id == 0) {
        canSubmit = true ;
        $("#configurationHelpText").show(changeViewDuration);
    }
    // Step 1 : after user submitted input and solution found.
    else if (id == 1) {
        showSyntaxErrors(); // Update syntax errors (to remove them)
        /*//Don't show the pin button when the sandbox is already pinned
        showScenario();
        animationStep = 0;
        colorLines(0);*/
        $("#configurationHelpText").hide(changeViewDuration);
    // Step 2 and 3 : nothing to do : all constraints are already satisfied or there's no viable solution.
    } else if (id == 2 || id == 3) {
        showSyntaxErrors(); // Update syntax errors (to remove them)
        canSubmit = true ;
	// Step 4 : there are errors in the script
    } else if (id == 4) {
        showSyntaxErrors();
        canSubmit = true ;

    }
}

/*
 * Sends the current configuration to the server to get a solution.
 * Receives the solution or the errors in the constraints script if any.
 */
function check(id) {
	if (!canSubmit) {
		return false;
	}
    var script = editor.getValue();
    //var cfg = config.btrpToJSON();

    var http = createXhrObject();

	var cfg = [];
	for(var i in config.nodes){
		var node = config.nodes[i];
		// Create a list of the VMs' IDs
		var vms = [];
		for(var j in node.vms){
			var vm = node.vms[j];
			vms.push({
				"id":vm.id,
				"cpu":vm.cpu,
				"mem":vm.mem
			});

		}
		// Create a Node JSON object to be parsed by the server.
		cfg.push({
			"id":node.id,
			"online":node.online,
			"cpu":node.cpu,
			"mem":node.mem,
			"vms":vms
		});

	}
	if (LOG) console.log("=== Configuration Data sent to the server : ", cfg);
	if (LOG) console.log("=== Script sent to the server : ", script);
	cfg = JSON.stringify(cfg);

    postToAPI("inspect","cfg="+encodeURI(cfg)+"&script="+encodeURI(script),
    function() {
	    if (this.readyState == 4 && this.status == 200) {
	        scenario = JSON.parse(this.responseText);
	        onServerResponse(scenario);
	        // Return here for testing purposes
	        return ;
	        if (LOG) console.log("Scenario : ", scenario);
	        if (scenario.errors.length == 0) {
	            if (scenario.actions.length == 0) { //Every constraints are satisfied
	                state(2);
	            } else { //Some constraints are not satisfied
	                state(1);
	            }
	        } else if (scenario.errors[0].msg == "no solution") {
	            state(3);
	        } else if (scenario.errors.length > 0) {
	            state(4);
	        }
        }
    });
    canSubmit = false;
}

/**
 * This function is called after the server answer the request.
 * It loads the JSON data in the app.
 * @param json JSON data from the server to be loaded.
 */
function onServerResponse(json){
	if (LOG) console.log("Received JSON : ",json);
	// If there is a solution : the data contains action
	if( json.actions ){
        if (json.actions.length > 0) {
		    editor.getSession().clearAnnotations();
		    // Move to solution state
		    state(1);
		    //showSyntaxErrors();
		    changeView("solution");
    	    $("#userInput").html(editor.getValue().replace(/\n/g,"<br />"));
    	    createDiagram(json.actions);
        } else {
            state(2)
        }
	}
	// There are errors in the user constraints script.
	else if (json.errors) {
		if (LOG) console.log("There are some errors in the user input.");
		// Move to the error-in-script UI state.
		state(4);
	}

	else if (json.errors == null && json.solution == null) {
		if (LOG) console.log("[SOLVER] There is no solution to the problem.");
		state(3);
	}
}

var selectedElement = null ;

function registerSelectedElement(element){
	selectedElement = element;
}


/**
 * Binds the click event on the newly drawn Nodes and VMs.
 */
function updateClickBindings(){
	$(".nodeZone, .vmZone").unbind('click').on('click',function(event){
		console.log("Click !");
		if (!canEdit) return false;

		var element ;
		if (this.className.baseVal == "nodeZone") {
			var nodeID = this.attributes["sandboxNodeID"].value;
			element = config.getNode(nodeID);
		}
		if (this.className.baseVal == "vmZone") {
			var vmID = this.attributes["sandboxVMID"].value;
			//element = config.vms[vmID];
			element = config.getVirtualMachine("VM"+vmID);
		}
       	// Safeguard
		if( typeof(element) == "undefined" ){
			console.error("Not a good click :(");
			return ;
		}
		else {
			event.stopPropagation();
		}
		console.log("Click on : ",element);
        setSelectedElement(element);
	});
}

/**
 * Set the selected element to <i>element</i>.
 * This way the element will be the target of the (relevant) keyboard actions.
 * The element will also be highlighted.
 * @param element The element (either a Node or a VM) of the Configuration to be selected.
 */
function setSelectedElement(element){
	// Unselect the previously selected element.
	if (selectedElement != null) {
		selectedElement.setSelected(false);
	}

	// Update the selectedElement global variable (for keyboard actions)
	selectedElement = element;

	// Mark the newly selected element itself as selected (for drawing purposes)
	if (element != null) {
		element.setSelected(true) ;
	}
}

// CPU_UNIT and MEM_UNIT are only tool elements, used for the validation of the keyboard action.
var CPU_UNIT = new VirtualMachine("CPU_UNIT", 1, 0),
	MEM_UNIT = new VirtualMachine("MEM_UNIT", 0, 1);

function onKeyEvent(event){
	var keyCode = event.which;

	if (!canEdit) {
		return false ;
	}
	var redraw = false ;
	if (selectedElement == null) {
		if (keyCode == 78) {
			if (config.nodes.length > 10){
				return ;
			}
			var node = new Node(config.getNextNodeID(), 3,3);
			config.nodes.push(node);
			if (LOG) console.log("Created a node !");
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
			if (selectedElement instanceof Node && selectedElement.fit(CPU_UNIT)){
				minSize = 3;
			}
			if (selectedElement instanceof VirtualMachine) {
				minSize = 1;
			}

			// Modify the selected element only if the new value is valid.
			if (minSize != -1 && selectedElement.cpu > minSize) {
				selectedElement.cpu--;
			}
			// Prevent the page from scrolling
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
			// Prevent the page from scrolling
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
			// Prevent the page from scrolling
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
				minSize = 2;
			}
			if (minSize != -1 && selectedElement.mem > minSize) {
				selectedElement.mem--;
			}
            // Prevent the page from scrolling
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
		// Delete keys : DEL, Backspace
		else if (keyCode == 46 || keyCode == 8 || keyCode == 68) {
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
			}
			selectedElement.delete();
			if (newSelectedElement != null) {
				setSelectedElement(newSelectedElement);
			}
		}
		// V key : previous
		else if (keyCode == 86){
			shiftSelectedElement(-1);
		}
		// B key : next
		else if (keyCode == 66) {
			shiftSelectedElement(1);
		}
		// O (letter, not zero) key : Switch node state.
		else if (keyCode == 79) {
			if (selectedElement instanceof Node) {
				// A node must be empty before being turned off
				if (selectedElement.vms.length != 0 ) {
					alert("Error : a node must be empty before being turned off");
					return false;
				}
				if (LOG) console.log("Switching Node online state");
                // Switch its state
				selectedElement.online = ! selectedElement.online;

				drawConfiguration("canvas");
				setSelectedElement(null);
			}
		}
	}
	// Do a redraw
	if (redraw) {
		drawConfiguration('canvas');
	}
}

/**
 * Shifts the currently selected element in the Configuration in the specified direction.
 * The direction parameter might be negative.
 * @param direction The direction in which the selection has to be shifted.
 */
function shiftSelectedElement(direction){
	var newSelectedElement = null;
	if (selectedElement instanceof Node) {
		newSelectedElement = getConsecutiveObject(config.nodes, selectedElement, direction);
	}
	else if (selectedElement instanceof VirtualMachine) {
		var node = config.getHoster(selectedElement.id);
		newSelectedElement = getConsecutiveObject(node.vms, selectedElement, direction);
	}
	setSelectedElement(newSelectedElement);
}

/**
 * Generates a list of the supported constraints with links to the official documentation
 */
function getCatalogContent() {
    var buf = "Supported constraints: ";
    var cstrs = ["MaxOnline", "Among", "Ban", "Gather", "Root", "CumulatedResourceCapacity", "CumulatedRunningCapacity", "Fence", , "Killed", "Lonely", "Offline", "Online", "Overbook", "Preserve", "Quarantine", "Ready", "Running", "SequentialVMTransitions", "Sleeping", "Split","Spread","SingleResourceCapacity", "SingleRunningCapacity", "SplitAmong"];
    for (var i in cstrs) {
    	var cstr = cstrs[i],
    		caseCstr = cstr.charAt(0).toLowerCase() + cstr.slice(1);
        buf += "<a href='http://btrp.inria.fr/apidocs/releases/btrplace/solver/last/index.html?btrplace/model/constraint/" + cstr + ".html' target='_blank'>" + caseCstr + "</a>";
        if ( i < cstrs.length - 1) {
            buf += ", ";
        }
    }
    return buf ;
}

/**
 * Annotates the lines with syntax errors in the constraints script.
 */
function showSyntaxErrors() {
	if (LOG) console.log("[Log] Showing syntax errors in scenario : ", scenario);
    var annotations = [];

    var msgs = [];

    for (var j in scenario.errors) {
        var err = scenario.errors[j];
        annotations.push({
                    row: err.row-1,
                    column: 0,
                    type: "error",
                    text: err.message
        });

    }
    if (annotations.length > 0) {
            var node = $("#cstrs-mode > a").get()[0];
            node.style.fontWeight="bold";
            node.style.color="red";
    } else {
    		$("#cstrs-mode a").css({
    			"font-weight":"",
    			"color":""
    		});
            //$("#cstrs-mode > a").get()[0].style.fontWeight="";
            //$("#cstrs-mode > a").get()[0].style.color="";
    }
    if (LOG) console.log("[LOG] Anotations :", annotations);
    editor.getSession().setAnnotations(annotations);
}

// Setup keyboard actions
$(function() {
    updateClickBindings();
	$(document).keydown(function(event){
		// Do keyboard actions only if the user is not typing in the text editor.
		if( ! editor.isFocused() ){
			onKeyEvent(event);
		}
	});
});

$(document).ready(function(){
	changeView("input", true);
	$("#catalog").html(getCatalogContent());
	$(document).click(function(){
		setSelectedElement(null);
	});
});