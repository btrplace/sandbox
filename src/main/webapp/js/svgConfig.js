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
}

function Node(name, cpu, mem) {
    this.id = name;
    this.cpu = cpu;
    this.mem = mem;
    this.online = true;
    this.vms = [];
    this.boundingBox = function () {
	    return [2 * border + unit_size * this.cpu, 2 * border + unit_size * this.mem];
    };

    this.draw = function (canvas, x, y) {
	    this.posX = x;
	    this.posY = y;
        this.boxStroke = canvas.set();
        this.boxFill = canvas.set();
	    this.canvas = canvas;
	    var box_width = this.cpu * unit_size;
	    var box_height = this.mem * unit_size;
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
                this.vms[i].box.remove();
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
	    for (var v  in this.vms) {
	        freeCPU -= this.vms[v].cpu;
	        freeMem -= this.vms[v].mem;
	        if (freeMem < 0 || freeCPU < 0) {
	            break;
	        }
	    }
	    return freeMem > 0 && freeCPU > 0;
    }

    this.getVMsIds = function() {
        var ids = [];
        for (var v in this.vms) {
            ids.push(this.vms[v].id);
        }
        return ids;
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
	    var t = canvas.text(x + (this.cpu * unit_size) / 2, y - ( this.mem * unit_size) / 2, this.id).attr({'font-size':'12pt'});
	    if (this.cpu == 1) {
	        t.rotate(-90);
	    }
	    this.box.push(t);

	    //Upper left corner
		this.posY = y - this.mem * unit_size;
    	this.posX = x;

    }

    this.boundingBox = function() {
	    return [this.cpu * unit_size, this.mem * unit_size];
    }
 
}


var config = new Configuration();

function drawConfiguration(id) {
    //Compute the SVG size
    var width = 0;
    var height = 0;

    //Up to 4 nodes side by side
    var max_width = 800;

    var cur_width = 0; //width of the current line
    var max_height = 0; //maximum height of the node on the current line
    //How many nodes per line, how many lines

    var posX = 0;
    var posY = 0;
    for (var i in config.nodes) {
        var n = config.nodes[i];
        var dim = n.boundingBox();

        if (dim[1] > max_height) { max_height = dim[1];}
        n.posY = height;
        if (cur_width + dim[0] > max_width) {
            height += max_height;
            if (width < cur_width) {width = cur_width};
            cur_width = dim[0];
            n.posX = 0;
            n.posY = height;
            if (i == config.nodes.length - 1) {
                height += max_height;
            }
        } else {
            n.posX = cur_width;
            cur_width += dim[0];
            if (i == config.nodes.length - 1) {
                if (width < cur_width) {width = cur_width};
                height += max_height;
            }
        }
    }
    //draw it
    if (paper != undefined) {
	    paper.remove();
    }
    paper = Raphael(id, width, height)
    for (var i in config.nodes) {
        var n = config.nodes[i];
        n.draw(paper,n.posX,n.posY);
    }
}


function check(id) {
    var script = cstrsEditor.getValue();
    var cfg = config.btrpSerialization();
    var http = createXhrObject();

    postToAPI("inspect","cfg="+encodeURI(cfg)+"&script="+encodeURI(script),
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


function step(id) {

    for (var i = 0; i < 5; i++) {
        if (id != i) {document.getElementById("state" + i).style.display="none";}
        else {document.getElementById("state" + i).style.display="block";}
    }
    var o = parseUri(location.href);

    if (id == 0) {
        checkable(true);
        animationStep = 0;
        scenario = undefined;
        pending = false;
        var cfg = randomConfiguration();
        updateConfiguration(cfg);
        configEditor.setValue(cfg);
	    cstrsEditor.setValue(generateSampleScript(config));
    } else if (id == 1) {
        //Don't show the pin button when the sandbox is already pinned
        if (!o.queryKey.id) {document.getElementById('pin_button').style.visibility="visible";}
        else {document.getElementById('pin_button').style.visibility="hidden";}
        showScenario();
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
    var annotations = [];
    for (var j in stats) {
        var x = stats[j];
        if (x < 0) {
            annotations.push({
                row: -1 * x,
                column: 0,
                type: "error",
                text: "Unsatisfied constraint"
            });
        }
    }
    cstrsEditor.setAnnotations(annotations);

        if (errors.length > 0) {
            $("#cstrs-mode > a").get()[0].style.fontWeight="bold";
            $("#cstrs-mode > a").get()[0].style.color="red";
        } else {
            $("#cstrs-mode > a").get()[0].style.fontWeight="";
            $("#cstrs-mode > a").get()[0].style.color="";
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
    var cstrs = ["spread", "gather", "root", "lonely", "split", "root", "among", "quarantine", "ban", "fence","online","offline"];
    for (var i in cstrs) {
        buf += "<a href='http://www-sop.inria.fr/members/Fabien.Hermenier/btrpcc/" + cstrs[i] + ".html' target='_blank'>"+cstrs[i]+"</a>";
        if ( i < cstrs.length - 1) {
            buf += ", ";
        }
    }
}

function output(id) {
    var out = document.getElementById("output");
    out.innerHTML = id;
}

var spaceSplitter = /\s/g;


function generateSampleScript(cfg) {
    var buf = "";
    for (var i in cfg.nodes) {
        var n = cfg.nodes[i];
        if (n.vms.length >= 2) {
            buf += "spread({" + n.vms[0].id + ", " + n.vms[1].id + "});\n";
            break;
        }
    }
    //One ban on the 3 first VMs that are placed, after vms[5]
    buf += "ban({";
    var nb = 3;
    var i = 5;
    for (i; i < cfg.vms.length; i++) {
        if (cfg.vms[i].posX) {
            nb--;
            buf += cfg.vms[i].id;
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
    if (cfg.nodes[4].vms.length > 0) {
        buf += "root({" + cfg.nodes[4].vms[0].id + "});";
    }
    return buf;
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



Element.prototype.hasClass = function (cls) {
  return this.className.match(new RegExp('(\\s|^)'+cls+'(\\s|$)'));
}

Element.prototype.addClass = function(cls) {
  if (!this.hasClass(cls)) this.className += " "+cls;
}

Element.prototype.removeClass = function(cls) {
  if (this.hasClass(cls)) {
      var reg = new RegExp('(\\s|^)'+cls+'(\\s|$)');
      this.className=this.className.replace(reg,' ');
  }
}

function setMode(id) {
    console.log("Switch to mode '" + id + "'");
    if (id == "configuration") {
        $("#config-mode")[0].addClass("active");
        $("#cstrs-mode")[0].removeClass("active");
        editor.setSession(configEditor);
    } else {
        $("#cstrs-mode")[0].addClass("active");
        $("#config-mode")[0].removeClass("active");
        editor.setSession(cstrsEditor);
    }
}

/**
* Save the configuration into SVG format
*/
function saveSVG() {
    var text = $("#canvas").get()[0].innerHTML;
        a = document.createElement('a');
        a.download = 'configuration.svg';
        a.type = 'image/svg+xml';
        bb = new(window.BlobBuilder || WebKitBlobBuilder);
        bb.append(text);
        blob = bb.getBlob('image/svg+xml');
        a.href = (window.URL || webkitURL).createObjectURL(blob);
        a.click();
    }

