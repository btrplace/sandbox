function badLine(nb) {
    var span = document.getElementsByClassName('lineno')[nb - 1];
    span.style.fontWeight="bold";
    span.style.backgroundColor="red";
    span.style.color="white";
}

function validLine(nb) {
    var span = document.getElementsByClassName('lineno')[nb - 1];
    span.style.fontWeight="bold";
    span.style.backgroundColor="green";
    span.style.color="white";
}
function resetLines() {
    var es = document.getElementsByClassName('lineno');
    for (var i in es) {
        if (es[i].style == undefined) { //Invisible lines. Don't know why
            break;
        }
        es[i].style.fontWeight="normal";
        es[i].style.backgroundColor="";
        es[i].style.color="rgb(102,102,102)";
    }
}

$(function() {
	$(".lined").linedtextarea();
});

$(document).ready(function() {
    insertCatalogContent();
});