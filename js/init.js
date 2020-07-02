// Your web app's Firebase configuration
var firebaseConfig = {
	apiKey: "AIzaSyACk3i96bLAr-MBY8BdErrQ6sz2t8I-2-Y",
	authDomain: "conga-ab860.firebaseapp.com",
	databaseURL: "https://conga-ab860.firebaseio.com",
	projectId: "conga-ab860",
	storageBucket: "conga-ab860.appspot.com",
	messagingSenderId: "70299305919",
	appId: "1:70299305919:web:cf9c617ec0ced80e8a830a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// Initialise Cloud Firestore
var db = firebase.firestore();

async function getShopData(id) {

	try {
		var shop = await db.collection("shops").doc(id).get();
		if (shop.exists) {
				console.log("Shop data:", shop.data());
				return shop;
		} else {
				// doc.data() will be undefined in this case
				console.log("No shop found!");
				window.location.href = 'index.html';
		}
	} catch (error) {
		console.log("Error getting shop data:", error);
		window.location.href = 'index.html';
	}
}

function checkEmailInput(input) {
	var constraint = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
	console.log(input.value);
	if (constraint.test(input.value)) {
		input.setCustomValidity('');
	} else {
		input.setCustomValidity('Incorrect email');
	}
}

function checkTimeInput(input) {
	var constraint = new RegExp("^([0-1][0-9]|[2][0-3]):([0-5][0-9])$");
	if (constraint.test(input.value)) {
		input.setCustomValidity('');
	} else {
		input.setCustomValidity('Incorrect time');
	}
}

async function checkShortCodeInput(input) {
	var constraint = new RegExp("[a-z]{7,20}");
	var shops = await db.collection("shops").get();
	var previous = new Array();
	shops.forEach(shop => previous.push(shop.data().short));
	console.log(previous, previous.includes(input.value));
	if (constraint.test(input.value)) {
		if (previous.includes(input.value)) {
			input.setCustomValidity('Shortcode already taken');
		} else {
			input.setCustomValidity('');
		}
	} else {
		input.setCustomValidity('Shortcode isn\'t in right format');
	}

}

function lightOrDark(color) {

    // Variables for red, green, blue values
    var r, g, b, hsp;

    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {

        // If HEX --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

        r = color[1];
        g = color[2];
        b = color[3];
    }
    else {

        // If RGB --> Convert it to HEX: http://gist.github.com/983661
        color = +("0x" + color.slice(1).replace(
        color.length < 5 && /./g, '$&$&'));

        r = color >> 16;
        g = color >> 8 & 255;
        b = color & 255;
    }

    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
    );

    // Using the HSP value, determine whether the color is light or dark
    if (hsp>160) {

        return true;
    }
    else {

        return false;
    }
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
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};
