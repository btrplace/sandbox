//Check for an id


var configEditor;
var cstrsEditor;
var editor;

function randomConfiguration() {
    config = new Configuration();
    //Generate the 4 nodes
    for (var i = 0; i < 4; i++) {
        var n;
        if (i <= 3) {
            n = new Node("N" + i, 8, 6);
        } else {
            n = new Node("N" + i, 6, 6);
        }
        config.nodes.push(n);
    }

    //Templates
    var tpls = [[2,2],[2,3],[2,2],[2,4],[2,3]];
    var picked = [];
    var i = 0
    //Pick a random node
    while (i < 8) {
        var nIdx = Math.floor(Math.random() * config.nodes.length);
        //pick a satisfying size, minimum 2x2
        freeRcs = config.nodes[nIdx].free();
        if (freeRcs[0] <= 1 || freeRcs[1] <= 1) {
            continue
        }
        //console.log(freeRcs)
        //Check for a template that fit
        var c = Math.floor(Math.random() * (freeRcs[0]/4)) + 2
        var m = Math.floor(Math.random() * (freeRcs[1]/4)) + 2
        if (c > freeRcs[0]) {
            c = freeRcs[0]
        }
        if (m > freeRcs[1]) {
            m = freeRcs[1]
        }

        var v = new VirtualMachine("VM" + i, c, m);
        //console.log(v)
        if (config.nodes[nIdx].fit(v)) {
            config.vms.push(v);
            config.nodes[nIdx].host(v);
        }  else {
            console.log("BUG: cannot fit")
        }
        i++
    }
}

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
     nIdx  =Math.floor(Math.random() * config.nodes.length);
     if (config.nodes[nIdx].vms.length > 0) {
        buf += "ban(" + config.nodes[0].vms[0].id + ", " + config.nodes[0].id + ");\n";
     }
     //maxOnlines
    buf += "maxOnline({N0,N1,N2,N3}, 3);\n"
    return buf;
}

function init() {
    //var o = parseUri(location.href);
    var get = GETParameters();

    editor = ace.edit("editor");
    var EditSession = ace.require('ace/edit_session').EditSession;
    /*configEditor = new EditSession("");
    cstrsEditor = new EditSession("");*/
    if (get.cfg) {
    	var cfg = decodeURIComponent(get.cfg);
        if (LOG) console.log("Re-using sandbox from configuration : " + cfg);
        loadExperiment(cfg);
        state(0);
        //document.getElementById('lock_button').style.display="none";
        //document.getElementById('unlock_button').style.display="inline";
        //editor.setReadOnly(true);
    } else if (false) {
        if (LOG) console.log("Unlocked sandbox from " + o.queryKey.unlock);
        loadExperiment(o.queryKey.unlock);
        document.getElementById('lock_button').style.display="inline";
        document.getElementById('unlock_button').style.display="none";
        editor.setReadOnly(false);
    } else  {
        if (LOG) console.log("New sandbox");
        editor.setReadOnly(false);

        // Create configuration and fill the editor
        randomConfiguration();
		editor.setValue(generateSampleScript(config));

		if( paper )
			paper.clear();

		drawConfiguration("canvas");
        state(0);
    }
    editor.clearSelection();
    //configEditor.on("change", function(e) {updateConfiguration(configEditor.getValue());});
    //insertCatalogContent();
}

function pinSandbox() {
    var experiment = {"cfg":configEditor.getValue(), "scenario" : scenario,"script" : cstrsEditor.getValue()};
    document.getElementById('lock_button').style.display="none";
    document.getElementById('unlock_button').style.display="inline";
    postToAPI("pin","experiment="+encodeURI(JSON.stringify(experiment)),function() {
	    if (this.readyState == 4) {
	        if (this.status == 201) {
	            var l = this.getResponseHeader("Location");
                document.getElementById('pinURL').innerHTML = l;
                document.getElementById('goToPin').href = l;
                $('#pinBox').jqm();
                $('#pinBox').jqmShow();
	        } else {
	            console.error("ERROR. Status code " + this.status + "\n" + this.responseText);
	        }
	    }
    });
}

function unpinSandbox() {
    var o = parseUri(location.href);
    location.href=location.origin + location.pathname + "?unlock=" + o.queryKey.lock;
}


function loadExperiment(cfg) {
		var parsedCfg = JSON.parse(cfg.replace("%22",'"'));
		config.fromStorage(parsedCfg);
}

function pinSandbox(){
	var configStr = JSON.stringify(config.toStorage()),
		//encodedCfg =
		pinUrl = document.location.origin + document.location.pathname+ "?cfg="+encodeURIComponent(configStr);
		//pinUrlText = pinUrl;
		pinUrlText = "Here";
	$("#pinURLInput").val(pinUrl);
	$("#goToPin").attr("href",pinUrl).text(pinUrlText);
    $("#pinBox").jqm();
    $("#pinBox").jqmShow();
    moveCaretToStart($("#pinURLInput").get(0));
}
