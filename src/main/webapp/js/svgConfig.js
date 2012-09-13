/*
Javascript to generate a SVG from a configuration.
@author Fabien Hermenier

*/

var paper;
var columns = 4;
var lines = 2;

//Size of a unit in px
var unit_size = 18;

//Space between the border of the node and the axes
var border = 20;

var scenario;

var animationStep;

//Indicate an action is in progress
var pending = false;

function Node(name, cpu, mem) {
    this.id = name;
    this.cpu = cpu;
    this.mem = mem;
    this.online = true;
    this.vms = [];
    this.boundingBox = function () {
	    return [2 * border + unit_size * cpu, 2 * border + unit_size * mem];
    };

    this.draw = function (canvas, x, y) {
	    this.posX = x;
	    this.posY = y;
        this.boxStroke = canvas.set();
        this.boxFill = canvas.set();
	    this.canvas = canvas;
	    var box_width = cpu * unit_size;
	    var box_height = mem * unit_size;
	    var width = 2 * border + box_width;
	    var height = 2 * border + box_height;
	    var rc_bg = "#fff";

	    var bgColor = this.online ? "black" : "#bbb";

	    //clean
	    canvas.rect(x,y,width, height).attr({'stroke':'white','fill' : 'white'});

 	    //lightgray for the resources area
	    this.boxStroke.push(canvas.rect(x + border, y + border, box_width, box_height).attr({'stroke':bgColor}));

	    //labels
        this.boxFill.push(canvas.text(x + width - border,y + height - 10,"cpu").attr({'font-size':'12pt','text-anchor':'end','baseline-shift':'0em','fill':bgColor}));
        this.boxFill.push(canvas.text(x + 2,y + border - 7,"memory").attr({'font-size': '12pt','text-anchor':'start','baseline-shift':'0em','fill':bgColor}));
	
	    //Node name, bottom left
	    this.boxFill.push(canvas.text(x + border, y + border + box_height, name).attr({'text-anchor': 'end' ,'baseline-shift': '-2em','font-size' : '16pt', 'fill' : bgColor}));
	
        //Resource grid
	    for (var i = 1; i < cpu; i+=1) {
	        var pos = border + i * unit_size;
	        this.boxStroke.push(canvas.path("M " + (x + pos) + " " + (y + border) + " l " + " 0 " + " " + box_height).attr({'stroke-dasharray' : '--','stroke':bgColor}));
	    }
    	for (var i = 1; i < mem; i+=1) {
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
    }

    this.refresh  = function() {
	this.draw(this.canvas,this.posX,this.posY);
    }

    this.host = function(vm) {
	this.vms.push(vm); 
    }

    this.fit = function(vm) {
	var freeCPU = this.cpu - vm.cpu;
	var freeMem = this.mem - vm.mem;
	for (var v  in this.vms) {
	    freeCPU -= this.vms[v].cpu;
	    freeMem -= this.vms[v].mem;
	    if (freeCPU < 0 || freeMem < 0) {
		    return false;
	    }
	}
	return true;
    }

}

function VirtualMachine(id, cpu, mem) {
    this.id = id;
    this.cpu = cpu;
    this.mem = mem;

    this.bgColor = "#bbb";
    this.strokeColor = "black";
    this.draw = function(canvas, x, y) {

        this.box = canvas.set();

	    //Bounding box
	    this.rect = canvas.rect(x, y - this.mem * unit_size, this.cpu * unit_size,  this.mem * unit_size);
	    this.rect.attr({'fill' : this.bgColor, 'stroke' : this.strokeColor});
	    this.box.push(this.rect);
	    //Identifier
	    var t = canvas.text(x + (cpu * unit_size) / 2, y - ( mem * unit_size) / 2, this.id).attr({'font-size':'12pt'});
	    if (cpu == 1) {
	        t.rotate(-90);
	    }
	    this.box.push(t);

	    //Upper left corner
		this.posY = y - this.mem * unit_size;
    	this.posX = x;

    }

    this.boundingBox = function() {
	    return [cpu * unit_size, mem * unit_size];
    }
 
}

    var nodes = [];
    var vms = [];


function generateConfiguration(id) {

    //Generate the 8 nodes
    nodes = [];
    vms = [];
    for (var i = 1; i <= 8; i++) {
	var n;
	if (i < 6) {
	    n = new Node("N" + i, 8, 6);
	} else {
	    n = new Node("N" + i, 6, 6);
	}
	nodes.push(n);
    }

    //Templates
    var tpls = [[1,2],[2,1],[2,2],[2,1],[3,2],[2,3]];
    for (var i = 1; i <= 20; i++) {
	var x = Math.floor(Math.random() * tpls.length);
	var v = new VirtualMachine("VM" + i, tpls[x][0], tpls[x][1]);
	vms.push(v);

	//Placement
	var nIdx = Math.floor(Math.random() * nodes.length);
	if (nodes[nIdx].fit(v)) {
	    nodes[nIdx].host(v);
	}

    }
    //Set idle node offline
    for (var i in nodes) {
	    var n = nodes[i];
	    if (n.vms.length == 0) {
	        n.online = false;
	    }
    }
}

function drawConfiguration(id) {
    //Compute the SVG size
    var width = 0;
    var height = 0;
    for (var i in nodes) {
	var n = nodes[i];
	if (i < 4) {
	    width += n.boundingBox()[0];
	} 
    }
    height = nodes[0].boundingBox()[1] * 2;

    //draw it
    if (paper != undefined) {
	paper.remove();
    }
    paper = Raphael(id, width, height)
    var posX = 0;
    var posY = 0;
    var nb = 0;
    for (var i = 0; i < 2; i++) {
	posX = 0;
	for (var j = 0; j < 4; j++) {
	    n = nodes[nb++];
	    n.draw(paper,posX,posY);
	    posX += n.boundingBox()[0];
	}
	posY += n.boundingBox()[1];
    }
}


function check(id) {
    var script = document.getElementById(id).value;
    var config = toPlainTextConfiguration();
    var http = createXhrObject();

    postToAPI("inspect","cfg="+encodeURI(config)+"&script="+encodeURI(script),
    function() {
	    if (this.readyState == 4 && this.status == 200) {
	        scenario = JSON.parse(this.responseText);
	        if (scenario.errors.length == 0) {
	            if (scenario.actions.length == 0) { //Every constraints are satisfied
	                step(2);
	            } else { //Some constraints are not satisfied
	                step(1);
	            }
	        } else if (scenario.errors[0] == "no solution") {
	            step(3);
	        } else if (scenario.errors.length > 0) {
	            step(4);
	        }
        }
    });
    checkable(false);
}


function toPlainTextConfiguration() {
    var buffer = "#list of nodes\n";
    for (var i in nodes) {
	    var  n = nodes[i];
	    buffer = buffer + n.id + " 1 " + n.cpu + " " + n.mem + "\n";
    }
    buffer = buffer + "#list of VMs\n";
    for (var  i in vms) {
	var vm = vms[i];
	buffer = buffer + "sandbox."+vm.id + " 1 " + vm.cpu + " " + vm.mem + "\n";
    }
    buffer += "#initial configuration\n";
    for (var i in nodes) {
	var n = nodes[i];
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

//Go to the previous move in a reconfiguration
function prev() {
    if (pending) {
        return false;
    }
        if (animationStep != 0) {
            undoAction();
        }
        return true;
}

//Go to the next move of the reconfiguration
function next() {
    if (pending) {
        return false;
    }
    if (animationStep < scenario.actions.length) {
        doAction();
    }
    return true;
}


function step(id) {

    for (var i = 0; i < 5; i++) {
        if (id != i) {document.getElementById("state" + i).style.display="none";}
        else {document.getElementById("state" + i).style.display="block";}
    }
            var o = parseUri(location.href);


    if (id == 0) {

        //If the URL indicates we are in the sandbox,
        //restart indicates we go to the root URL
        if (o.queryKey.id) {
            document.location.href=location.origin + location.pathname;
        }
        checkable(true);
        document.getElementById('pin_button').style.visibility="hidden";
        document.getElementById('constraints').disabled=false;
        resetLines();
        animationStep = 0;
        scenario = undefined;
        pending = false;
	    generateConfiguration();
	    drawConfiguration('canvas');
	    generateSampleScript(document.getElementById('constraints'));
    } else if (id == 1) {
        //Don't show the pin button when the sandbox is already pinned
        if (!o.queryKey.id) {
            document.getElementById('pin_button').style.visibility="visible";
        }
        document.getElementById("reconfigrationIsOver").style.display="none";
        document.getElementById('constraints').disabled=true;
        showScenario();
        document.getElementById('constraints').readonly="readonly";
        animationStep = 0;
        colorLines(0);
    } else if (id == 2 || id == 3) {
        checkable(true);
        colorLines(0);
    } else if (id ==4) {
        checkable(true);
        showSyntaxErrors();
        colorLines(0);
    }
}

function colorLines(nb) {
                var stats = JSON.parse(scenario.status[nb]);
                for (var j in stats) {
                    var nb = stats[j];
                    if (nb < 0) {
                        badLine(nb * -1);
                    } else {
                        validLine(nb);
                    }
                }

}

function checkable(b) {
    var e = document.getElementsByClassName("check_button");
    for (var i in e) {
        e[i].disabled = b;
    }
}

function insertCatalogContent() {
    var buf = "Supported constraints: ";
    var cstrs = ["spread", "gather", "root", "lonely", "split", "root", "among", "quarantine", "ban", "fence"];
    for (var i in cstrs) {
        buf += "<a href='http://www-sop.inria.fr/members/Fabien.Hermenier/btrpcc/" + cstrs[i] + ".html' target='_blank'>"+cstrs[i]+"</a>";
        if ( i < cstrs.length - 1) {
            buf += ", ";
        }
    }
    document.getElementById('available_constraints').innerHTML = buf + ".";
}

function output(id) {
    var out = document.getElementById("output");
    out.innerHTML = id;
}

var spaceSplitter = /\s/g;

function doAction() {
    //console.log("do '" + scenario.actions[animationStep] + "'");
    begin(animationStep);
    var arr = scenario.actions[animationStep].split(spaceSplitter);
    if (arr[1] == "M") {
        migrate(animationStep, getVM(arr[2]),getNode(arr[3]),getNode(arr[4]), commit);
    } else if (arr[1] == "H") {
        halt(animationStep, getNode(arr[2]), commit);
    } else if (arr[1] == "S") {
        boot(animationStep, getNode(arr[2]), commit);
    }
}

function undoAction() {
    //console.log("undo '" + scenario.actions[animationStep - 1] + "'");
    begin(animationStep - 1);
    var arr = scenario.actions[animationStep - 1].split(spaceSplitter);
        if (arr[1] == "M") {
            migrate(animationStep - 1, getVM(arr[2]),getNode(arr[4]),getNode(arr[3]),rollback);
        } else if (arr[1] == "S") {
            halt(animationStep - 1, getNode(arr[2]),rollback);
        } else if (arr[1] == "H") {
            boot(animationStep - 1, getNode(arr[2]),rollback);
        }
}

function commit() {
    document.getElementById('a' + animationStep).style.color="#666";
    document.getElementById('a' + animationStep).style.fontWeight="normal";
    animationStep++;
    if (animationStep == scenario.actions.length) {
        document.getElementById("reconfigrationIsOver").style.display="block";
    }
    colorLines(animationStep);
    pending = false;
}
function rollback() {
    animationStep--;
    document.getElementById('a' + animationStep).style.color="#bbb";
    document.getElementById('a' + animationStep).style.fontWeight="normal";
    colorLines(animationStep);
    pending = false;
}

function begin(a){
    document.getElementById('a' + a).style.color="red";
    document.getElementById('a' + a).style.fontWeight="bold";
    pending = true;
}

function migrate(a, vm, src, dst, f) {

    //The dark gray VM stay on the source VM vm

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
        movingVM.box.animate({transform :"T " + (ghostDst.posX - vm.posX) + " " + (ghostDst.posY - vm.posY)}, 300 * vm.mem,"<>",
        function() {

            //The source VM goes away
            for (var i in src.vms) {
                if (src.vms[i].id == vm.id) {
                    src.vms[i].box.remove();
                    src.vms.splice(i, 1);
                    break;
                }
            }

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

function boot(a, node, f) {
    node.boxStroke.animate({'stroke': 'black'}, 500,"<>", function()
    {
    f(a);
    node.online = true;
    }
    );
    node.boxFill.animate({'fill': 'black'}, 500,"<>", function() {});
}

function halt(a, node, f) {
    node.boxStroke.animate({'stroke': '#bbb'}, 500,"<>", function()
    {
    f(a);
    node.online = false;
    }
    );
    node.boxFill.animate({'fill': '#bbb'}, 500,"<>", function() {});
}

function getNode(id) {
    for (var i in nodes) {
        if (nodes[i].id == id) {
            return nodes[i];
        }
    }
    return undefined;
}

function getVM(id) {
    for (var i in vms) {
        if (vms[i].id == id) {
            return vms[i];
        }
    }
    return undefined;
}

function generateSampleScript(id) {
    var buf = "";
    for (var i in nodes) {
        var n = nodes[i];
        if (n.vms.length >= 2) {
            buf += "spread({" + n.vms[0].id + ", " + n.vms[1].id + "});\n";
            break;
        }
    }
    //One ban on the 3 first VMs that are placed, after vms[5]
    buf += "ban({";
    var nb = 3;
    var i = 5;
    for (i; i < vms.length; i++) {
        if (vms[i].posX) {
            nb--;
            buf += vms[i].id;
            if (nb > 0) {
                buf += ",";
            }
        }
        if (nb == 0) {
            break;
        }
    }
    buf += "}, {N1,N2,N3});\n";

    //Offline
    buf += "offline(N8);\n";

    //Root for the fun
    if (nodes[4].vms.length > 0) {
        buf += "root({" + nodes[4].vms[0].id + "});\n";
    }
    id.value = buf;
}

function showScenario() {
    var id = document.getElementById("plan");
    var buf = "<ul>";
    for (var i in scenario.actions) {
        buf += "<li style='color:#bbb; font-family: monospace; font-size: 10pt;' id='a" + i + "'>" + rephrase(scenario.actions[i]) + "</li>";
    }
    buf += "</ul>";
    id.innerHTML = buf;
}

function rephrase(a) {
    var arr = a.split(spaceSplitter);
    if (arr[1] == "M") {
        return "migrate " + arr[2] + " from " + arr[3] + " to " + arr[4];
    } else if (arr[1] == "S") {
        return "boot " + arr[2];
    } else if (arr[1] == "H") {
        return "shutdown " + arr[2];
    }
}

function showSyntaxErrors() {
    var e = document.getElementById("syntax_error");
    var b = "<ul>";
        for (var i in scenario.errors) {
            b += "<li>" + scenario.errors[i] + "</li>";
        }
    b += "</ul>";
    e.innerHTML = b;
}

