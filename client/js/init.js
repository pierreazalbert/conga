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
