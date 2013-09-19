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

var config = new Configuration(),
	initialConfig ;

function drawConfiguration(id) {
	var verbose = true;
	if (verbose) console.log("[DIAGRAM] Drawing current configuration ===================");

	if( paper != undefined ){
		paper.clear();
		if (verbose) console.log("[DIAGRAM] Cleared paper.");
	}

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

    paper = Raphael(id, width, height);
    // emptying the paper
    paper.clear();

    for (var i in config.nodes) {
        var n = config.nodes[i];
        n.draw(paper,n.posX,n.posY);
    }

	updateClickBindings();

    if (verbose) console.log("[DIAGRAM] Finished drawing =====================");
}

/*
 * Sends the current configuration to the server to get a solution.
 * Receives the solution or the errors in the constraints script if any.
 */
function check(id) {
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
	                step(2);
	            } else { //Some constraints are not satisfied
	                step(1);
	            }
	        } else if (scenario.errors[0].msg == "no solution") {
	            step(3);
	        } else if (scenario.errors.length > 0) {
	            step(4);
	        }
        }
    });
    checkable(false);
}

/*
 * Change the step of the usage flow.
 */
function step(id) {
	if (LOG) console.log("[STEP System] Step "+id);
    // Change the message displayed in the box
    $(".state").hide();
    $("#state"+id).show();
    /*for (var i = 0; i < 5; i++) {
        if (id != i) {document.getElementById("state" + i).style.display="none";}
        else {document.getElementById("state" + i).style.display="block";}
    } */

    var o = parseUri(location.href);
    // Step 0 : initialization
    if (id == 0) {
        checkable(true);
        animationStep = 0;
        scenario = undefined;
        pending = false;
        $("#configurationHelpText").show(changeViewDuration);
    }
    // Step 1 : after user submitted input.
    else if (id == 1) {
        showSyntaxErrors();
        /*//Don't show the pin button when the sandbox is already pinned
        showScenario();
        animationStep = 0;
        colorLines(0);*/
        $("#configurationHelpText").hide(changeViewDuration);
    } else if (id == 2 || id == 3) {
        showSyntaxErrors();
        checkable(true);
        colorLines(0);
    } else if (id == 4) {
        showSyntaxErrors();
        checkable(true);
    }
}

/*
 * Color the lines of the constrains input.
 * If the constrains is matched, the line gets green. Red otherwise.
 */
function colorLines(nb) {
	// TODO : Use colorLines() function.
    var stats = JSON.parse(scenario.status[nb]);
    var annotations = [];
    for (var j in stats) {
        var x = stats[j];
        if (x < 0) {
            annotations.push({
                row: -1 * x -1,
                column: 0,
                type: "warning",
                text: "Unsatisfied constraint"
            });
        }
    }
    if (annotations.length > 0) {
            $("#cstrs-mode > a").get()[0].style.fontWeight="bold";
            $("#cstrs-mode > a").get()[0].style.color="#D6D629";
    } else {
            $("#cstrs-mode > a").get()[0].style.fontWeight="";
            $("#cstrs-mode > a").get()[0].style.color="";
    }
    cstrsEditor.setAnnotations(annotations);
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
	return "spread({VM0, VM3});\nban({VM5}, {N1,N2,N3});\noffline(N3);";
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
            if (nb > 1) {
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
    /*if (cfg.nodes[4].vms.length > 0) {
        buf += "root({" + cfg.nodes[4].vms[0].id + "});";
    } */
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

        /*var lineNo = err.lineNo - 1;
        if (!msgs[lineNo]) {
            msgs[lineNo] = err.msg;
        } else {
            msgs[lineNo] += "\n" + err.msg;
        }*/
    }
    /*
    for (var j in msgs) {
        var msg = msgs[j];
        annotations.push({
            row: j,
            column: 0,
            type: "error",
            text: msg
        });
    }      */
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

