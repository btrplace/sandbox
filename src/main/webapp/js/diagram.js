var TIME_UNIT_SIZE = 100 ;

// List of the marks in the X graduation (to avoid duplicates)
var gradMarks = [];

/*
 * Creates the graduation in the diagram
 * duration : number of steps
 */
function createGraduations(duration){
	var graduations = $("#graduations");
	for(var i = 0 ; i < duration ; i++){
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
function loadActions(actions){
	console.log("Loading data : ",actions);
}

function addLine(label, start, end){
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

function createDiagram(json){
	var duration = 10 ;
	TIME_UNIT_SIZE = computeTimeUnitSize(duration);
	console.log("TIME_UNIT_SIZE = "+TIME_UNIT_SIZE+"px");
	createGraduations(duration);
	loadActions(json);
}