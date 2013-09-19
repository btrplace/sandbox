//
var playing = false;

//Go very fast
var fast = false;

//Play the reconfiguration or pause it

function playMode() {
    playing = true;
    document.getElementById("play_button").style.backgroundPositionX="-40px";
}

function pauseMode() {
    playing = false;
    document.getElementById("play_button").style.backgroundPositionX="-60px";
    fast = false;
}
function playOrPause() {
    if (!playing && !pending && animationStep < scenario.actions.length) { //run & reveals the pause button if not at the end
        playMode();
        doAction(autoCommit);
    }
    else { //pause & reveals the play button
        pauseMode();
    }
}

//Move back to the source configuration
function reset() {
    if (pending || animationStep == 0) {return false;}
    playMode();
    if (animationStep != 0) {
        fast = true;
        undoAction(autoRollback);
    }

}


//Go directly to the destination configuration
function directEnd() {
    if (pending) {return false;}
    if (animationStep < scenario.actions.length) {
        playMode();
        fast = true;
        doAction(autoCommit);
    }
}

//Go to the previous move in a reconfiguration
function prev() {
    if (pending) {return false;}
    if (animationStep != 0) {
        pauseMode();
        undoAction(rollback);
    }
    return true;
}

//Go to the next move of the reconfiguration
function next() {
    if (pending) {return false;}
    if (animationStep < scenario.actions.length) {
        pauseMode();
        doAction(commit);
    }
    return true;
}

//Execute the current action
function doAction(f) {
    //console.log("do '" + scenario.actions[animationStep] + "'");
    begin(animationStep);
    var arr = scenario.actions[animationStep].split(spaceSplitter);
    if (arr[1] == "M") {migrate(animationStep, config.getVirtualMachine(arr[2]),config.getNode(arr[3]),config.getNode(arr[4]), f);}
    else if (arr[1] == "H") {halt(animationStep, config.getNode(arr[2]), f);}
    else if (arr[1] == "S") {boot(animationStep, config.getNode(arr[2]), f);}
}


var animationQueue = [];

function actionHandler(action, direction, duration, callback){
	duration *= 0.8 ;
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

//Undo the last committed action
function undoAction(f) {
    begin(animationStep - 1);
    var arr = scenario.actions[animationStep - 1].split(spaceSplitter);
    if (arr[1] == "M") {migrate(animationStep - 1, config.getVirtualMachine(arr[2]),config.getNode(arr[4]),config.getNode(arr[3]), f);}
    else if (arr[1] == "S") {halt(animationStep - 1, config.getNode(arr[2]),f);}
    else if (arr[1] == "H") {boot(animationStep - 1, config.getNode(arr[2]),f);}
}

//Commit the current action.
function commit() {
    document.getElementById('a' + animationStep).style.color="#666";
    document.getElementById('a' + animationStep).style.fontWeight="normal";
    animationStep++;
    colorLines(animationStep);
    pending = false;
}

//Commit the current action.
function autoCommit() {
        document.getElementById('a' + animationStep).style.color="#666";
        document.getElementById('a' + animationStep).style.fontWeight="normal";
        animationStep++;
        colorLines(animationStep);
        pending = false;
        if (animationStep == scenario.actions.length) {
            document.getElementById("play_button").style.backgroundPositionX="-60px";
            fast = false;
            pauseMode();
        } else if (playing) {
            doAction(autoCommit);
        }
}

//Cancel the current action.
function rollback() {
    animationStep--;
    document.getElementById('a' + animationStep).style.color="#bbb";
    document.getElementById('a' + animationStep).style.fontWeight="normal";
    colorLines(animationStep);
    pending = false;
}

//Cancel the current action.
function autoRollback() {
    animationStep--;
    document.getElementById('a' + animationStep).style.color="#bbb";
    document.getElementById('a' + animationStep).style.fontWeight="normal";
    colorLines(animationStep);
    pending = false;
    if (animationStep > 0 && playing) {
        undoAction(autoRollback);
    } else {
        pauseMode();
        fast = false;
    }
}

//Begin an action.
function begin(a){
    document.getElementById('a' + a).style.color="red";
    document.getElementById('a' + a).style.fontWeight="bold";
    pending = true;
}

//Animation for a migrate action
function migrate(vm, src, dst, duration, f) {
	if (LOG) console.log("[ANIM] Migrating "+vm.id+" from "+src.id+" to "+dst.id+" for "+duration+"ms");
	var a = 0;
    //A light gray VM is posted on the destination
    var ghostDst = new VirtualMachine(vm.id+"_G", vm.cpu, vm.mem);
    ghostDst.bgColor = "#eee";
    ghostDst.strokeColor = "#ddd";
    // remove the moving light gray and the source dark gray
    dst.host(ghostDst);
    dst.refresh();

    //a light gray VM will move from the source to the destination
    var movingVM = new VirtualMachine(vm.id+"_M", vm.cpu, vm.mem);
    movingVM.bgColor = "#eee";
    movingVM.strokeColor = "#ddd";
    movingVM.draw(paper, vm.posX, vm.posY + vm.mem * unit_size);
    movingVM.box.toFront();
    //movingVM.box.animate({transform :"T " + (ghostDst.posX - vm.posX) + " " + (ghostDst.posY - vm.posY)}, fast ? 50 : (300 * vm.mem),"<>",
    movingVM.box.animate({transform :"T " + (ghostDst.posX - vm.posX) + " " + (ghostDst.posY - vm.posY)}, duration,"<>",
        function() {
            //The source VM goes away
            src.unhost(vm);

            // the dst light gray VM into dark gray
            ghostDst.box.remove();
            movingVM.box.remove();

            dst.vms.length--;    //remove ghostDst
            vm.posX = ghostDst.posX;
            vm.posY = ghostDst.posY;
            dst.host(vm);
            src.refresh();
            dst.refresh();

            //drawConfiguration('canvas');
            //f(a);
        }
        );
}

//Animation for booting a node
function bootNode(node, duration) {
	if (LOG) console.log("[ANIM] Booting node "+node.id);

	//node.boxStroke.attr({'stroke':'#bbb'});

    node.boxStroke.animate({'stroke': 'black'}, duration,"<>", function() {node.online = true;});
    node.boxFill.animate({'fill': 'black'}, duration,"<>", function() {});
}

// Animation for shutting down a node
function shutdownNode(node, duration){
	if (LOG) console.log("[ANIM] Shutting down node "+node.id+" time : "+duration);
	//node.boxStroke.attr({'stroke':'black'});
	//node.boxFill.attr({'fill':'black'});

    node.boxStroke.animate({'stroke': '#bbb'}, duration,"<>", function(){
    	node.online = false;});
    node.boxFill.animate({'fill': '#bbb'}, duration,"<>");
}

// Preparation for Animation for booting a VM
function bootVM(vm, node, duration){
	node.host(vm);
	//vm.box.animate({'opacity': '1'}, duration,"<>", function() {});
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
	vm.box.attr({"opacity":1});
	//return ;
    vm.box.animate({'opacity': 0}, duration,"<>", function(){
    	if (LOG) console.log("[ANIM DONE] Unhosted "+vm.id+" from "+node.id);
    	node.unhost(vm);
    });
    //vm.box.animate({'fill-opacity': '0'}, duration,"<>");
}
