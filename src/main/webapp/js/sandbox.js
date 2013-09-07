var currentView = "";

function changeView(viewName){
	if( viewName == currentView ){
		return ;
	}
	console.log("Switching to View: "+viewName);
	if( viewName == "input" ){
		var duration = 300 ;
		$("#solution > div").hide(duration);
        setTimeout(function(){
            $("#input_zone_wrapper").show(300);
            resetDiagram();
        }, duration);
	}
	else if( viewName == "solution"){
		console.log("Fading out inputWrapper");
		$("#input_zone_wrapper").hide(300, function(){
			$("#solution > div").show(300);
		});
	}
}

var conversionTable ;
function onServerResponse(json){
	//json = JSON.parse('{"origin":{"views":[{"id":"shareableResource","rcId":"mem","nodes":{},"defCapacity":7,"vms":{"0":2,"1":2,"2":4,"3":3,"5":4},"defConsumption":0},{"id":"shareableResource","rcId":"cpu","nodes":{},"defCapacity":8,"vms":{"0":2,"1":3,"2":4,"3":3,"5":5},"defConsumption":0}],"mapping":{"onlineNodes":{"0":{"runningVMs":[2],"sleepingVMs":[]},"1":{"runningVMs":[1],"sleepingVMs":[]},"2":{"runningVMs":[0,3],"sleepingVMs":[]},"3":{"runningVMs":[5],"sleepingVMs":[]}},"offlineNodes":[],"readyVMs":[4]},"attributes":{"nodes":{},"vms":{}}},"actions":[{"to":1,"id":"bootVM","vm":4,"hooks":{"post":[],"pre":[{"amount":2,"id":"allocate","vm":4,"rc":"mem"},{"amount":3,"id":"allocate","vm":4,"rc":"cpu"}]},"start":0,"end":1},{"id":"shutdownVM","vm":3,"hooks":{"post":[],"pre":[]},"start":0,"on":2,"end":1},{"to":2,"id":"migrateVM","vm":5,"hooks":{"post":[],"pre":[]},"start":1,"from":3,"end":2},{"id":"shutdownNode","node":3,"hooks":{"post":[],"pre":[]},"start":2,"end":3},{"amount":3,"id":"allocate","vm":0,"hooks":{"post":[],"pre":[]},"start":3,"on":2,"rc":"cpu","end":3}]}');
	//initialConfig = owl.deepCopy(config);
	if( json.solution ){
		conversionTable = json.conversionTable;
		console.log("Conversion table used : ", conversionTable);
		changeView("solution");
    	$("#userInput").html(cstrsEditor.getValue().replace("\n","<br />"));
    	createDiagram(json.solution);
	}
	if( json.errors ){
		alert("Errors !");
	}
}

$(document).ready(function(){
	changeView("input");
});