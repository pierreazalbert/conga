$(document).ready(function () {
	// get shop code
	var params = getParams(window.location.href);
	if (params == null || !('shop' in params) ) {
		console.log('no shop code detected');
		window.location.href = 'index.html';
	} else if ('shop' in params) {
		if (params.shop.length == 4 && allLetters(params.shop) == true) {
			console.log('detected shop code: ', params.shop);
		} else {
			console.log('invalid shop code');
			window.location.href = 'index.html';
		}
	}
	
	// get shop data
	var shop = new Object();
	var query = db.collection("shops").where("code", "==", params.shop);
    query.get().then(function(results) {
        results.forEach(function(doc) {
            // doc.data() is never undefined for query doc snapshots
			shop = doc.data();
			console.log(shop);
			renderPage(shop);
        });	
    })
    .catch(function(error) {
        console.log("Error getting shop data: ", error);
    });
	
});

function renderPage(shop) {
	$('#shop-name').text(shop.name);
	$('#shop-address').text(shop.address);
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