var TIME_UNIT_SIZE = 100 ;

// List of the marks in the X graduation (to avoid duplicates)
var gradMarks = [];

/*
 * Creates the graduation in the diagram
 * duration : number of steps
 */
function createGraduations(duration){
	var graduations = $("#graduations");
	for(var i = 0 ; i <= duration ; i++){
		var x = i * TIME_UNIT_SIZE,
			grad = $("<div></div>").addClass("timeLineGrad");
			gradLabel = $("<div></div>").addClass("timeLineGradLabel").html(i);
			grad.css({left:x});
			gradLabel.css({left:x});
			graduations.append(grad);
			graduations.append(gradLabel);
	}
}

/*
 * Loads the action from the JSON response from server
 */
function loadActions(scenario){
	console.log("Loading data : ",scenario);
	var actions = scenario.actions;
	for(var i in actions){
		var action = actions[i];
		if( action.id == "allocate"){
			continue;
		}
		var	start = action.start,
			end = action.end,
			actionName = actionToString(action);
		addAction(actionName, start, end);

	}
}

function actionToString(action){
	switch(action.id){
		case "bootVM":
			return "boot(VM"+action.vm+") to N"+action.to;
		case "shutdownVM":
			return "shutdown(VM"+action.vm+") on N"+action.on ;
		case "migrateVM":
			return "migrate(VM"+action.vm+") from N"+action.from+" to N"+action.to;
		case "shutdownNode":
			return "shutdown(N"+action.node+")";
		case "allocate":
			return "allocate(VM"+action.vm+","+action.rc+"="+action.amount+") on N"+action.on;
	}
}

function addAction(label, start, end){
    var actionContainer = $("<div></div>").addClass("actionContainer"),
		actionBar = $("<div></div>").addClass("actionBar"),
		actionLine = $("<div></div>").addClass("actionLine"),
		gradMark = $("<div></div>").addClass("gradMark");
    	timeLine = $("#timeLine");

	actionBar.html(label);
	actionContainer.append(actionBar);
	actionContainer.append(actionLine);


	var actionTime = 3,
		xLeft = start * TIME_UNIT_SIZE,
		width = (end-start) * TIME_UNIT_SIZE;


	actionBar.css({
	   left: xLeft,
	   width: width
	});

	$("#actionLines").append(actionContainer);

	addTimeLineMark(start);
}

function addTimeLineMark(instant){
	$(".timeLineGradLabel").eq(instant).addClass("withEvent");
	/*var x = instant * TIME_UNIT_SIZE,
		grad = $("<div></div>").addClass("timeLineMark");
    grad.css({left:x});
   	$("#graduations").append(grad);*/
}

function updateTimeLinePosition(newTime){
	var newPos = newTime * TIME_UNIT_SIZE;
	$("#currentFrameLine").css({left:Math.round(newPos)});
}

function timeLineAnimation(duration){
    $({value:0}).animate({value:duration},{
    	duration:duration,
    	easing:"linear",
    	step:function(){
    		updateTimeLinePosition(this.value/1000);
    	}
    })
};

function computeTimeUnitSize(duration){
	return $("#diagram").width()/duration ;
}

function getScenarioDuration(scenario){
	var maxTime = 0 ,
		actions = scenario.actions ;
	for(var i in actions){
		var action = actions[i];
		if( action.end > maxTime ){
			maxTime = action.end ;
		}
	}
	return maxTime ;
}

function createDiagram(scenario){
	var duration = getScenarioDuration(scenario) ;
	console.log("Duration = ",duration);
	TIME_UNIT_SIZE = computeTimeUnitSize(duration);
	console.log("TIME_UNIT_SIZE = "+TIME_UNIT_SIZE+"px");
	createGraduations(duration);
	loadActions(scenario);
}