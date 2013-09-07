/*
Javascript to generate and navigate in a time-line diagram from a given scenario
@author Tom Guillermin
*/

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


// For VMs only
function convertID(sourceID){
	return conversionTable[sourceID];
}

var conversionTemplate = {
	"bootVM":["vm"],
	"shutdownVM":["vm"],
	"migrateVM":["vm"]
}

function convertScenarioIDs(scenario){
	for(var i in scenario.actions){
    	var action = scenario.actions[i];
    	if( ["bootVM","shutdownVM","migrateVM"].indexOf(action.id) != -1 ){
    		console.log("Getting corresponding ID from "+action.vm);
    		action.vm = convertID(action.vm);
    	}
	}
}

/*
 * Loads the action from the JSON response from server
 */
function loadActions(scenario){
	console.log("Converting VMs IDs to match client IDs.");
	convertScenarioIDs(scenario);
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

var currentScenario,
	scenarioDuration = 0 ;
function createDiagram(scenario){
	currentScenario = scenario;
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

	//diagramNextTarget = 1 ;
	//updateTimeLinePosition(0);
	isPlaying = false;
	doPause = false;


	doPause = true ;
	pauseCallback = function(){
    	diagramRewind(0);
    };

	//console.log("[LOG] Going to redraw after diagram reset");
    //drawConfiguration('canvas');
}

var diagramNextTarget = 1,
	isPlaying = false;
	doPause = false;

function setPlayerMode(mode){
	if( mode == "play" ){
		$("#playButton").hide();
		$("#pauseButton").show();
	}
	if( mode == "pause" ){
		isPlaying = false;
		$("#pauseButton").hide();
    	$("#playButton").show();
	}
}

$(document).ready(function(){
	setPlayerMode("pause");
});

function diagramPlay(){
	if( isPlaying ){
		return ;
	}

	// If the user clicks Play after the animation has finished,
	// the animation goes back to the start
	if( diagramNextTarget > scenarioDuration ){
    		diagramRewind();
    		return ;
    }
    // Set the player mode
	setPlayerMode("play");
	// Start the scenario loop
	diagramPlayLoop();
}

var animationBaseDuration = 1000;

function diagramPlayLoop(callback){
	doPause = false;
	// Play the animation & set the next step as a callback to the animation
	var canPlay = diagramStepMove(1, animationBaseDuration, function(){
		if( doPause ){
			setPlayerMode("pause");
			$("#pauseButton").removeClass("disabled");
			doPause = false;
            if( pauseCallback ){
            	pauseCallback();
            }
			return false;
		}

		// play it
		diagramPlayLoop();
	});

	if( !canPlay ){
		console.log("Can't play now...");
		if( callback ){
    			callback();
    	}
    	setPlayerMode("pause");
   		return false;
	}
	else {
		console.log("Can play !");
	}
}


function diagramStepMove(direction, duration, callback){
	if( isPlaying ){
		console.log("Is already playing !");
		return false ;
	}

	var start, end, step;
	if( direction == 1 ){
		start = diagramNextTarget-1;
		end = diagramNextTarget;
		step = start;
	}
	else if( direction == -1 ){
		start = diagramNextTarget-1;
		end = diagramNextTarget-2;
		step = end;
	}

	// Some validation
	if( end < 0 || end > scenarioDuration){
		console.log("Didn't pass validation");
		return false;
	}

	isPlaying = true ;
	//console.log("Playing step #"+step+" : ",getActionsStartingAt(step));

	var actions = getActionsStartingAt(step);
	for(var i in actions){
		var action = actions[i];
		actionHandler(action, direction, duration*0.9, function(){});
	}

	// Update the SVG with the new configuration
	console.log("[LOG] Going to redraw after animations preparation");
	drawConfiguration('canvas');

	// Play all the animations
	for(var i in animationQueue){
		var anim = animationQueue[i];
		anim();
	}

	animationQueue = [];

	// Play the time-line animation
	timeLineAnimation(start,end, duration, function(){
		isPlaying = false;
		diagramNextTarget += direction;

		console.log("[LOG] Going to redraw after all animations completed");
		drawConfiguration('canvas');

		if( callback ){
			callback();
		}
	});
	return true;

}

var pauseCallback ;
function diagramPause(callback){
	$("#pauseButton").addClass("disabled");
	doPause = true;
	pauseCallback = callback;
}

function diagramRewind(){
	if( isPlaying ){
		console.log("Is alreay playing !!");
		return ;
	}

	var backLoop = function(){
		console.log("BACK LOOP !");
		var canPlay = diagramStepMove(-1, 100);
		setTimeout(function(){
			drawConfiguration('canvas');
			if( canPlay ){
				backLoop();
			}
		}, 105);
	};

	backLoop();
	/*
	// Undo all the actions
	var canPlay = diagramStepMove(-1, 0);
	while (canPlay) {
		canPlay = diagramStepMove(-1, 0);
	}
	return ;
	diagramNextTarget =  1;
	updateTimeLinePosition(0);
	reset();
	drawConfiguration('canvas');*/
}

function diagramNextStep(){
	diagramStepMove(1, animationBaseDuration);
}

function diagramPreviousStep(){
	diagramStepMove(-1, animationBaseDuration);
}

function getActionsStartingAt(time){
	var result = [];
	var actions = currentScenario.actions;
	for(var i in actions){
		var action = actions[i];
		if( action.start == time ){
			result.push(action);
		}
	}
	return result;
}