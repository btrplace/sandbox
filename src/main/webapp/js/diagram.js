var TIME_UNIT_SIZE = 100 ;

function addLine(label, start, end){
    var actionContainer = $("<div></div>").addClass("actionContainer"),
	actionBar = $("<div></div>").addClass("actionBar");
	actionLine = $("<div></div>").addClass("actionLine");
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
}

function updateTimeLinePosition(newTime){
	var newPos = newTime * TIME_UNIT_SIZE;
	$("#currentFrameTimeLine").css({left:newPos});
}

function timeLineAnimation(duration){
    $({value:0}).animate({value:duration},{
    	duration:duration,
    	step:function(){
    		console.log("Current step : ",this.value);
    		updateTimeLinePosition(this.value/1000);
    	}
    })
}