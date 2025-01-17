$(document).ready(async function() {

	// Listen for submit event and check validity
	//$('#register').submit(event => submitForm(event);
	$('input[type=time]').change(function () {
		checkTimeInput(this);
	});

	$('input[type=email]').change(function () {
		checkEmailInput(this);
	});

	$('input[id=short]').change(async function () {
		await checkShortCodeInput(this);
	});

	$('#register').submit(function (event) {
		var form = this;
		if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    } else {
      //alert("your form is valid and ready to send");
      submitForm(event);
    }
    // Add bootstrap 4 was-validated classes to trigger validation messages
    $(form).addClass('was-validated');
	});

	//$("input[id$='closed']").change(console.log('checked'));
	$(":checkbox").change(function () {
		//console.log(this);
		$(this).parent().parent().parent().find("input[type='time']").prop('disabled', function(i, v) {
			return!v;
		});
	});
});

async function submitForm(event) {
	event.preventDefault();

	// Get Values from the DOM
	var shopName = $('#name').val();
	var shopAddress = $('#address').val();
	var shopShortCode = $('#short').val();
	var monOpen = $('#mon-open').val();
	var monClose = $('#mon-close').val();
	var tueOpen = $('#tue-open').val();
	var tueClose = $('#tue-close').val();
	var wedOpen = $('#wed-open').val();
	var wedClose = $('#wed-close').val();
	var thuOpen = $('#thu-open').val();
	var thuClose = $('#thu-close').val();
	var friOpen = $('#fri-open').val();
	var friClose = $('#fri-close').val();
	var satOpen = $('#sat-open').val();
	var satClose = $('#sat-close').val();
	var sunOpen = $('#sun-open').val();
	var sunClose = $('#sun-close').val();
	var bookingNumber = parseInt($('#number').val());
	var bookingRate = parseInt($('#rate').val());
	var acceptMessages = $('#messages').prop('checked');
	var shopEmail = $('#email').val();
	var queueControl = $('input[name=control]:checked').val() == 'true' ? true : false;

	// Prepare object to send to database
	var shopData = {
		name: shopName,
		address: shopAddress,
		short: shopShortCode,
		hours: {
			mon: $('#mon-closed').prop('checked') ? "closed" : {open: monOpen, close: monClose},
			tue: $('#tue-closed').prop('checked') ? "closed" : {open: tueOpen, close: tueClose},
			wed: $('#wed-closed').prop('checked') ? "closed" : {open: wedOpen, close: wedClose},
			thu: $('#thu-closed').prop('checked') ? "closed" : {open: thuOpen, close: thuClose},
			fri: $('#fri-closed').prop('checked') ? "closed" : {open: friOpen, close: friClose},
			sat: $('#sat-closed').prop('checked') ? "closed" : {open: satOpen, close: satClose},
			sun: $('#sun-closed').prop('checked') ? "closed" : {open: sunOpen, close: sunClose}
		},
		bookings: {
			number: bookingNumber,
			rate: bookingRate,
			messages: acceptMessages
		},
		status: 'auto',
		control: queueControl
	}
	console.log(shopData);

	// Query database to collect all existing shop IDs
	var shops = await db.collection("shops").get();
	var previous = new Array();
	shops.forEach(shop => previous.push(shop.data().code));

	// Generate unique shop ID
	shopData.code = HashID.generateUnique(previous);

	// Write completed object to database
	var docRef = await db.collection('shops').add(shopData).catch (function(error) {
		console.error("Error adding document: ", error);
		$('.btn').css('background-color', 'red').text('Registration failed');
	});

	// Send email with login key to admin panel
	$.ajax({
		url: '/php/send-login-email.php',
		type: 'POST',
		data: {
			email: shopEmail,
			id: docRef.id,
			code: shopData.code
		},
		success: function (result) {
			console.log("Email successfully sent");
			$('form').hide();
			$('.alert > p > a').attr("href", "https://www.conga.store/admin?key=" + docRef.id);
			$('.alert > p:eq(1)').text("Your shop's 4 letter code is " + shopData.code + " and this is your public booking link: conga.store/" + shopData.code);
			$('.alert').removeClass('d-none');
		},
			error: function (error) {
			console.log("Error sending email");
		}
	});

	//Form Reset After Submission(7)
	//$('#register').trigger('reset');
}
