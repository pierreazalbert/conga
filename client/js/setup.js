//listen for submit event//
document.getElementById('setupForm').addEventListener('submit', formSubmit);

var shops = db.collection("shops");

//Submit form
function formSubmit(e) {
	e.preventDefault();
	
	// Get Values from the DOM
	var shopName = document.querySelector('#name').value;
	var shopAddress = document.querySelector('#address').value;
	var monOpen = document.querySelector('#mon-open').value;
	var monClose = document.querySelector('#mon-close').value;
	var tueOpen = document.querySelector('#tue-open').value;
	var tueClose = document.querySelector('#tue-close').value;
	var wedOpen = document.querySelector('#wed-open').value;
	var wedClose = document.querySelector('#wed-close').value;
	var thuOpen = document.querySelector('#thu-open').value;
	var thuClose = document.querySelector('#thu-close').value;
	var friOpen = document.querySelector('#fri-open').value;
	var friClose = document.querySelector('#fri-close').value;
	var satOpen = document.querySelector('#sat-open').value;
	var satClose = document.querySelector('#sat-close').value;
	var sunOpen = document.querySelector('#sun-open').value;
	var sunClose = document.querySelector('#sun-close').value;
	var bookingNumber = parseInt(document.querySelector('#number').value);
	var bookingRate = parseInt(document.querySelector('#rate').value);
	var acceptMessages = document.querySelector('#messages').checked;
	var shopEmail = document.querySelector('#email').value;
	
	var shopData = {
				name: shopName,
				address: shopAddress,
				hours: {
					mon: {open: monOpen, close: monClose},
					tue: {open: tueOpen, close: tueClose},
					wed: {open: wedOpen, close: wedClose},
					thu: {open: thuOpen, close: thuClose},
					fri: {open: friOpen, close: friClose},
					sat: {open: satOpen, close: satClose},
					sun: {open: sunOpen, close: sunClose}
				},
				bookings: {number: bookingNumber, rate: bookingRate, messages: acceptMessages}
	}

	
//	var previous = getPreviousIDs();
//	console.log(previous);
//	var shopCode = HashID.generateUnique(previous);
//	console.log(shopCode);

	
	shops.get()
		.then(function(querySnapshot) {
			var previousIDs = [];
			querySnapshot.forEach(function(doc) {
				previousIDs.push(doc.data().code);
				console.log(doc.id, doc.data());
			});
			console.log(previousIDs);
			return previousIDs;
		})
		.then(function(previousIDs) {
			var shopCode = HashID.generateUnique(previousIDs);
			console.log(shopCode);
			shopData.code = shopCode;
		})
		.add(shopData)
		.then(function(docRef) {
			console.log("Document written with ID: ", docRef.id);
		})
		.catch(function(error) {
			console.error("Error adding document: ", error);
		});
			

	
	
	// send to Firebase	
//	shops.add(shopData)
//	.then(function(docRef) {
//		console.log("Document written with ID: ", docRef.id);
//	})
//	.catch(function(error) {
//		console.error("Error adding document: ", error);
//	});
	
	
	//Show Alert Message(5)
	document.querySelector('.alert').style.display = 'block';
	
	//Hide Alert Message After Seven Seconds(6)
	setTimeout(function() {
		document.querySelector('.alert').style.display = 'none';
	}, 7000);
	
	//Form Reset After Submission(7)
	document.getElementById('setupForm').reset();
}

//function getPreviousIDs() {
//	var previousIDs = [];
//	shops.get().then(function(querySnapshot) {
//		querySnapshot.forEach(function(doc) {
//			previousIDs.push(doc.data().code);
//		});
//	});
//	return previousIDs;
//}
//
//function generateID() {
//	var previousIDs = [];
//	var newID = "";
//	try {
//		shops
//			.get()
//			.then(function(querySnapshot) {
//				querySnapshot.forEach(function(doc) {
//					previousIDs.push(doc.data().code);
//					console.log(doc.id, doc.data());
//				});
//				console.log(previousIDs);
//			})
//			.then(function(previousIDs) {
//				newID = HashID.generateUnique(previousIDs);
//				console.log(newID);
//			});
//	 } catch (error) {
//	 	console.log(error);
//	 }
//	return newID;
//}
//
//
