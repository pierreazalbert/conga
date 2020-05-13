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