var currentView = "";

function changeView(viewName){
	if( viewName == currentView ){
		return ;
	}
	console.log("Switching to View: "+viewName);
	if( viewName == "input" ){
		$("#solution > div").hide(300, function(){
        	$("#input_zone_wrapper").show(300);
        	clearActions();
        });
	}
	else if( viewName == "solution"){
		console.log("Fading out inputWrapper");
		$("#input_zone_wrapper").hide(300, function(){
			$("#solution > div").show(300);
		});
	}
}

function onServerResponse(json){
	changeView("solution");
	$("#userInput").html(cstrsEditor.getValue().replace("\n","<br />"));
	createDiagram(json);
}

$(document).ready(function(){
	changeView("input");
});