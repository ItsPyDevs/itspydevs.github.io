function goto(page) {
	if (typeof(anim) !== 'undefined') {
		anim.stop();
	}
	$("#page-content").load("/pages/"+page+".html", function(responseTxt, statusTxt, jqXHR){
		if(statusTxt == "success"){
			console.log("Page "+page+" loaded successfully");
		}
		if(statusTxt == "error"){
			console.log("Error: [" + jqXHR.status + "] " + jqXHR.statusText);
		}
	});
}

goto('index');
