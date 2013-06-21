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
function migrate(a, vm, src, dst, f) {

    //A light gray VM is posted on the destination
    var ghostDst = new VirtualMachine(vm.id, vm.cpu, vm.mem);
    ghostDst.bgColor = "#eee";
    ghostDst.strokeColor = "#ddd";
    // remove the moving light gray and the source dark gray
    dst.host(ghostDst);
    dst.refresh();

    //a light gray VM will move from the source to the destination
    var movingVM = new VirtualMachine(vm.id, vm.cpu, vm.mem);
    movingVM.bgColor = "#eee";
    movingVM.strokeColor = "#ddd";
    movingVM.draw(paper, vm.posX, vm.posY + vm.mem * unit_size);
    movingVM.box.toFront();
    movingVM.box.animate({transform :"T " + (ghostDst.posX - vm.posX) + " " + (ghostDst.posY - vm.posY)}, fast ? 50 : (300 * vm.mem),"<>",
        function() {
            //The source VM goes away
            src.unhost(vm);

            // the dst light gray VM into dark gray
            ghostDst.box.remove();
            dst.vms.length--;    //remove ghostDst
            vm.posX = ghostDst.posX;
            vm.posY = ghostDst.posY;
            dst.host(vm);
            src.refresh();
            dst.refresh();
            f(a);
        }
        );
}

//Animation for booting a node
function boot(a, node, f) {
    node.boxStroke.animate({'stroke': 'black'}, fast ? 50 :500,"<>", function() {node.online = true;f(a);});
    node.boxFill.animate({'fill': 'black'}, fast ? 50 : 500,"<>", function() {});
}

//Animation for halting a node.
function halt(a, node, f) {
    node.boxStroke.animate({'stroke': '#bbb'}, fast ? 50 : 500,"<>", function(){node.online = false;f(a);});
    node.boxFill.animate({'fill': '#bbb'}, fast ? 50 : 500,"<>", function() {});
}