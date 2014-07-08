
function showExport() {
    $("#exportBox").jqm();
    $("#exportStatus").val("");
    $("#exportDir").val("directory_name");
    $("#exportBox").jqmShow();
}

function exportAll() {
	var xmlHttp = new XMLHttpRequest();
	var o = parseUri(document.location.href);
	var directory = $("#exportDir").val();
    xmlHttp.open("GET", "http://" + o.authority + o.directory + "api/export?dir=" + directory, false);
    xmlHttp.send( null );
    $("#exportStatus").val(xmlHttp.responseText);
    if (LOG) console.log("[LOG] Export request :", xmlHttp.responseText);
}