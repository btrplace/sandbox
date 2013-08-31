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

/*
 * Adds an action in the diagram
 * @param string Label of the action
 * @param number Starting time of the action
 * @param number Ending time of the action
 */
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

/*
 * Marks a time graduation label with an event (text set to bold)
 * @param instant number Time with event.
 */
function addTimeLineMark(instant){
	$(".timeLineGradLabel").eq(instant).addClass("withEvent");
}

/*
 * Updates the position of the time-line to a match given time
 * @param newTime number Time to which the time-line has to be set.
 */
function updateTimeLinePosition(newTime){
	var newPos = newTime * TIME_UNIT_SIZE;
	$("#currentFrameLine").css({left:Math.round(newPos)});
}

/*
 * Performs the time-line animation from a <i>start</i> to an </i>end</i> time
 * for a given <i>duration</i>.
 * @param duration number Duration of the animation in ms.
 */
function timeLineAnimation(start, end, duration, callback){
    $({value:start}).animate({value:end},{
    	duration:duration,
    	easing:"linear",
    	step:function(){
    		updateTimeLinePosition(this.value);
    	},
    	complete:function(){
    		updateTimeLinePosition(end);
    		console.log("Complete !");
    		// Call the callback if any
    		if(callback){
    			callback();
    		}
    	}
    })
};

/*
 * Computes the pixel size of a time unit
 */
function computeTimeUnitSize(duration){
	return $("#diagram").width()/duration ;
}

/*
 * Calculates the duration of a given <i>scenario</i>
 * @param scenario Object The scenario object.
 * @return The duration of the scenario.
 */
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

var scenarioDuration = 0 ;
function createDiagram(scenario){
	scenarioDuration = getScenarioDuration(scenario) ;
	console.log("Duration = ",scenarioDuration);
	TIME_UNIT_SIZE = computeTimeUnitSize(scenarioDuration);
	console.log("TIME_UNIT_SIZE = "+TIME_UNIT_SIZE+"px");
	createGraduations(scenarioDuration);
	loadActions(scenario);
}

/**
 * Resets the diagram.
 */
function resetDiagram(){
	$(".actionContainer").remove();
	$("#graduations").children().remove();
}

var diagramNextTarget = 1,
	doPause = false;

function setPlayMode(mode){
	if( mode == "play" ){
		$("#playButton").hide();
		$("#pauseButton").show();
	}
	if( mode == "pause" ){
		$("#pauseButton").hide();
    	$("#playButton").show();
	}
}

$(document).ready(function(){
	setPlayMode("pause");
});

function diagramPlay(){
	diagramPlayStep();
}
function diagramPlayStep(callback){
	doPause = false;
	// Don't get further than the scenario ;)
	if( diagramNextTarget > scenarioDuration ){
		if( callback ){
			callback();
		}
		return false;
	}
	// Play the animation & set the next step as a callback to the animation
	timeLineAnimation(diagramNextTarget-1,diagramNextTarget, 1000, function(){
		// Set next target
        diagramNextTarget++;

		if( doPause ){
			doPause = false;
			return false;
		}

		// play it
		diagramPlayStep();
	});
}

function diagramPause(){
	doPause = true;
}

function diagramRewind(){
	updateTimeLinePosition(0);
}