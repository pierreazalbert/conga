//listen for submit event//
//document.getElementById('setupForm').addEventListener('submit', formSubmit);
$(document).ready(function () {
	$('#setupForm').submit(function (e) {

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
	
	// Prepare object to send to database
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
	
	// Query database to collect all existing shop IDs
	// then generate unique shop ID
	// then write completed object to database
	// then send email with login key to admin panel
	var shops = db.collection("shops");
	shops.get()
		.then(function(querySnapshot) {
			var previousIDs = [];
			querySnapshot.forEach(function(doc) {
				previousIDs.push(doc.data().code);
			});
			return previousIDs;
		})
		.then(function(previousIDs) {
			var shopCode = HashID.generateUnique(previousIDs);
			//console.log("Generated shop code: ",shopCode);
			shopData.code = shopCode;
		})
		.then(function() {
			shops.add(shopData).then(function(docRef) {
				//console.log("Shop registered with ID: ", docRef.id);
				$.ajax({
					url:'/php/send-login-email.php',
					type:'POST',
					data:{
						email:shopEmail,
						id:docRef.id,
						code:shopData.code
					},
					success: function (result) {
						console.log("Email successfully sent");
//						$('.btn').css('background-color', 'green').text('Registration complete');
//						$('#info').css('display', 'block');
						$('form').hide();
						$('.alert > p > a').attr("href", "https://www.conga.store/admin?key=" + docRef.id);
						$('.alert > p:eq(1)').text("Your shop's 4 letter code is " + shopData.code + " and this is your public booking link: https://www.conga.store/" + shopData.code);
						$('.alert').show();
					},
					error: function (error) {
						console.log("Error sending email");
					}
				});
			})
			.catch(function(error) {
				console.error("Error adding document: ", error);
				$('.btn').css('background-color', 'red').text('Registration failed');
			});
		});
		
	//Form Reset After Submission(7)
	$('#setupForm').trigger('reset');
	
	});
	
});