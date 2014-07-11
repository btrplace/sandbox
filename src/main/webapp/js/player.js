/*
 * Everything related to the player and the animations.
 */

var LOG = true ;

var animationQueue = [];
var playerNextTarget  = 1, //
	isPlaying = false; // Indicates if the player is playing or not.
	doPause = false,  // If set to true, the player will pause before next step
	playSpeed = 1000, // Duration of one step in regular Play mode or step by step mode
	rewindSpeed = 100 ; // Duration of the rewind

/**
 * Changes the Player mode to the specified mode.
 * Modes are 'play','pause'
 * @param mode
 */
function setPlayerMode(mode){
	if( mode == "play" ){
		$("#playButton").hide();
		$("#pauseButton").show();
	}
	if( mode == "pause" ){
		isPlaying = false;
		$("#pauseButton").hide();
    	$("#playButton").show();
	}
}

function playerNextStep(){
	playerStepMove(1, animationBaseDuration);
}

function playerPreviousStep(){
	playerStepMove(-1, animationBaseDuration);
}

var pauseCallback ;
function playerPause(callback){
	$("#pauseButton").addClass("disabled");
	doPause = true;
	pauseCallback = callback;
}

function playerRewind(callback){
	if( isPlaying ){
		if (LOG) console.error("Can't rewind ! It's alreay playing !!");
		return ;
	}

	playLoop(-1,rewindSpeed, function(){
		console.error("Updating click bindings !");
		// In the case some of the Node have been .refresh()'d.
    	updateClickBindings();
    });
    return ;
    /*
	var backLoop = function(){
		if (LOG) console.log("BACK LOOP !");
		var canPlay = playerStepMove(-1, 100);
		setTimeout(function(){
			if( canPlay ){
				backLoop();
			}
		}, 100);
	};

	backLoop();
	*/
}

$(document).ready(function(){
	setPlayerMode("pause");
});

function actionHandler(action, direction, timeUnit, callback){
	var duration = (action.end - action.start) * timeUnit * 0.9;
	var name = action.id;
	if( name == "bootNode" ){
		if(direction == 1 ){
			animationQueue.push(function(){ bootNode(config.getNode("N"+action.node), duration, callback); });
		}
		// Reverse mode
		else if (direction == -1){
			animationQueue.push(function(){ shutdownNode(config.getNode("N"+action.node), duration, callback);  });
		}
	}
	else if( name == "shutdownNode" ){
		if (direction == 1){
			animationQueue.push(function(){ shutdownNode(config.getNode("N"+action.node), duration, callback); });
		}
		// Reverse mode
		else if (direction == -1){
			animationQueue.push(function(){ bootNode(config.getNode("N"+action.node), duration, callback); });
		}
	}
	else if( name == "bootVM" ){
		if (direction == 1) {
			bootVM(config.getVirtualMachine("VM"+action.vm), config.getNode("N"+action.node));
			animationQueue.push(function(){ bootVMAnim(config.getVirtualMachine("VM"+action.vm), duration, callback);  });
		}
		// Reverse mode
		else if (direction == -1) {
			//shutdownVM(config.vms[action.vm], config.nodes[action.to]);
			animationQueue.push(function(){ shutdownVM(config.getVirtualMachine("VM"+action.vm), config.getNode("N"+action.to), duration, callback); });
		}
	}
	else if (name == "shutdownVM") {
		if (direction == 1) {
			//shutdownVM(config.vms[action.vm], config.nodes[action.on]);
			animationQueue.push(function(){ shutdownVM(config.getVirtualMachine("VM"+action.vm), config.nodes[action.on], duration, callback); });
		}
		// Reverse mode
		else if (direction == -1) {
			bootVM(config.vms[action.vm], config.nodes[action.on]);
			animationQueue.push(function(){ bootVMAnim(config.getVirtualMachine("VM"+action.vm), duration, callback); });
		}
	}
	else if( name == "migrateVM" ){
		var from, to ;
		if( direction == 1 ){
			from = action.from;
			to = action.to;
		}
		// Reverse mode
		else if( direction == -1 ){
			from = action.to;
			to = action.from;
		}

		animationQueue.push(function(){ migrate(config.getVirtualMachine("VM"+action.vm), config.getNode("N"+from), config.getNode("N"+to), duration, callback) });
	};
}

//Animation for a migrate action
function migrate(vm, src, dst, duration, f) {
	if (LOG) console.log("[ANIM] Migrating "+vm.id+" from "+src.id+" to "+dst.id+" for "+duration+"ms");
	var a = 0;
	
	//A light gray (ghost) VM is posted on the destination
	var ghostDst = new VirtualMachine(vm.id, vm.cpu, vm.mem);
	ghostDst.bgColor = "#eee";
	ghostDst.strokeColor = "#ddd";
	dst.host(ghostDst);
	dst.refresh();
	
	//A light gray VM will move from the source to the destination
	var movingVM = new VirtualMachine(vm.id, vm.cpu, vm.mem);
	movingVM.bgColor = "#eee";
	movingVM.strokeColor = "#ddd";
	movingVM.draw(paper, vm.posX, vm.posY + vm.mem * unit_size);
	movingVM.box.toFront();
	
	var callbackAlreadyCalled = false;
	var animationEnd = function() {

		//Update vm position for reverse animation
		vm.posX = ghostDst.posX;
		vm.posY = ghostDst.posY;

		//The source VM goes away
		src.unhost(vm);
		vm.box.remove();

		//Remove the moving VM
		movingVM.box.remove();

		//The ghost VM becomes normal
		ghostDst.bgColor = "#bbb";
		ghostDst.strokeColor = "#000";

		//Refresh the nodes
		src.refresh();
		dst.refresh();
	}
	//movingVM.box.animate({transform :"T " + (ghostDst.posX - vm.posX) + " " + (ghostDst.posY - vm.posY)}, fast ? 50 : (300 * vm.mem),"<>",
	movingVM.box.animate({transform :"T " + (ghostDst.posX - vm.posX) + " " + (ghostDst.posY - vm.posY)}, duration,"<>",function(){
	    	animationEnd();
	    	callbackAlreadyCalled = true ;
	    }
	);

	// This is a safety, in the eventuality of some drawing error ;
	setTimeout(function(){
		if( ! callbackAlreadyCalled ){
			animationEnd();
		}
	}, duration+100);
}

//Animation for booting a node
function bootNode(node, duration) {
	if (LOG) console.log("[ANIM] Booting node "+node.id);
    node.boxStroke.animate({'stroke': 'black'}, duration,"<>", function() {node.online = true;});
    node.boxFill.animate({'fill': 'black'}, duration,"<>", function() {});
}

// Animation for shutting down a node
function shutdownNode(node, duration){
	if (LOG) console.log("[ANIM] Shutting down node "+node.id+" time : "+duration);
    node.boxStroke.animate({'stroke': '#bbb'}, duration,"<>", function(){node.online = false;});
    node.boxFill.animate({'fill': '#bbb'}, duration,"<>");
}

// Preparation for Animation for booting a VM
function bootVM(vm, node, duration){
	node.host(vm);
}

// Animation for booting a VM
function bootVMAnim(vm, duration){
	if (LOG) console.log("[ANIM] Booting "+vm.id);
   	vm.box.attr({"opacity":0});
	vm.box.animate({'opacity': 1}, duration,"<>", function() {});
}

// Animation for shutting down a VM
function shutdownVM(vm, node, duration){
	if (LOG) console.log("[ANIM] Shutting down "+vm.id+" on node "+node.id);
	vm.box.attr({"opacity":1}); // Ensure the opacity is at 1.
    vm.box.animate({'opacity': 0}, duration,"<>", function(){
    	if (LOG) console.log("[ANIM DONE] Unhosted "+vm.id+" from "+node.id);
    	node.unhost(vm);
    });
}
