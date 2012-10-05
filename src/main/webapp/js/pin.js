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
    if (o.queryKey.id) {
        console.log("re-using sandbox " + o.queryKey.id);
        loadExperiment(o.queryKey.id);
    } else {
        console.log("New sandbox");
        step(0);
    }

    if (o.anchor == "cfg") {
        setMode("cfg");
    } else {
        setMode("cstrs");
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
    document.getElementById('lock_button').style.display="inline";
    document.getElementById('unlock_button').style.display="none";
    step(1);
}


function loadExperiment(id) {
        var http = createXhrObject();
        //Remove the possible index.html at the end
        var url = location.origin + location.pathname;
        http.open("GET", url + "/cache/" + id, true);
        http.onreadystatechange = function() {
    	    if (this.readyState == 4) {
    	        if (this.status == 200) {
    	            var experiment = JSON.parse(this.responseText);
    	            scenario = experiment.scenario;
    	            config = parseConfiguration(experiment.cfg)[0];
    	            cstrsEditor.setValue(experiment.script);
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