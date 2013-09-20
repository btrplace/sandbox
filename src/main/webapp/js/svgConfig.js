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

// TODO : Use colorLines() function to indicate constraints satisfaction evolution.
/*
 * Color the lines of the constrains input.
 * If the constrains is matched, the line gets green. Red otherwise.
 */
function colorLines(nb) {

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

var spaceSplitter = /\s/g;


function generateSampleScript(cfg) {
	return "spread({VM0, VM3});\nban({VM5}, {N1,N2,N3});\noffline(N3);";
	// TODO : randomize script
	/*
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
    //return buf;
}


/**
 * Save the configuration into SVG format.
 * It's currently not working. Will be implemented in a future release.
 */
function saveSVG() {
	return false ;
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
