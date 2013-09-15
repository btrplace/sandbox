//Check for an id


var configEditor;
var cstrsEditor;
var editor;

function init() {
    var o = parseUri(location.href);

    editor = ace.edit("editor");
    var EditSession = ace.require('ace/edit_session').EditSession;
    configEditor = new EditSession("");
    cstrsEditor = new EditSession("");
    if (o.queryKey.lock) {
        console.log("re-using sandbox " + o.queryKey.lock);
        loadExperiment(o.queryKey.lock);
        document.getElementById('lock_button').style.display="none";
        document.getElementById('unlock_button').style.display="inline";
        editor.setReadOnly(true);
    } else if (o.queryKey.unlock) {
        console.log("Unlocked sandbox from " + o.queryKey.unlock);
        loadExperiment(o.queryKey.unlock);
        document.getElementById('lock_button').style.display="inline";
        document.getElementById('unlock_button').style.display="none";
        editor.setReadOnly(false);
    } else  {
        console.log("New sandbox");
        editor.setReadOnly(false);
        step(0);
    }

    configEditor.on("change", function(e) {updateConfiguration(configEditor.getValue());});

    insertCatalogContent();
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
	            console.log("ERROR. Status code " + this.status + "\n" + this.responseText);
	        }
	    }
    });
}

function unpinSandbox() {
    var o = parseUri(location.href);
    location.href=location.origin + location.pathname + "?unlock=" + o.queryKey.lock;
}


function loadExperiment(id) {
        var http = createXhrObject();
        //Remove the possible index.html at the end
        if (!location.origin) {
            location.origin = location.protocol + "//" + location.host;
        }
        var url = location.origin + location.pathname;
        http.open("GET", url + "/cache/" + id, true);
        http.onreadystatechange = function() {
    	    if (this.readyState == 4) {
    	        if (this.status == 200) {
    	            var experiment = JSON.parse(this.responseText);
    	            scenario = experiment.scenario;
    	            config = parseConfiguration(experiment.cfg)[0];
    	            cstrsEditor.setValue(experiment.script);
    	            configEditor.setValue(experiment.cfg);
    	            console.log("[LOG] Going to redraw after Load Experiment");
    	            drawConfiguration('canvas');
    	            step(1);
    	        } else {
    	            console.log("ERROR: " + this.status + ":\n" + this.responseText);
    	            step(0);
    	            $('#unknownPinBox').jqmShow();
    	        }
    	    }
        }
        http.send(null);
}