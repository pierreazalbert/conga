$(document).ready(function () {

});

function getShopData(id) {
	var docRef = db.collection("shops").doc(id);
	docRef.get().then(function(doc) {
	    if (doc.exists) {
	        console.log("Shop data:", doc.data());
			return doc.data();
	    } else {
	        // doc.data() will be undefined in this case
	        console.log("No shop found!");
	    }
	}).catch(function(error) {
		console.log("Error getting shop data:", error);
	});
}

/**
 * Get the URL parameters
 * source: https://css-tricks.com/snippets/javascript/get-url-variables/
 * @param  {String} url The URL
 * @return {Object}     The URL parameters
 */
var getParams = function (url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	if (query == "") return null;
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};

function allLetters(input) {
	var letters = /^[A-Za-z]+$/;
	if (input.match(letters)) {
		return true;
	}
	else {
		return false;
	}
}