var today = moment();

$(document).ready(async function () {
	// get login key
	var key = getParams(window.location.href).key;
	// get shop data
	var shop = await getShopData(key);

	// display shop info
	$('#shop-name').text(shop.data().name);
	$('#shop-code').prepend("Shop ID: " + shop.data().code[0] + "-" + shop.data().code[1] + "-" + shop.data().code[2] + "-" + shop.data().code[3]);
	$('#shop-link').prop('href', '/book?shop=' + shop.data().code);
	$('[name=today]').text(today.format("dddd Do MMMM"));

	// render live status section
	//$("#next-booking")


	// render all bookings section
	listenBookings(shop);

	// render shop settings
	$('#shop-settings > #name').text(shop.data().name);
	$('#shop-settings > #address').text(shop.data().address);
	$.each(shop.data().hours, function(day, hours) {
		if (hours == "closed") {
			$('#shop-settings > #hours > > #' + day).text("Closed");
		} else {
			$('#shop-settings > #hours > > #' + day).text(hours.open + ' to ' + hours.close);
		}
	});
	$('#shop-settings > #options').text("Accepting " + shop.data().bookings.number + " bookings every " + shop.data().bookings.rate + " minutes.");

});

async function renderBookings(bookings){
	$('#all-bookings').empty();
	var sorted = bookings.sort((a, b) => moment(a.data().time, 'HH:mm') - moment(b.data().time, 'HH:mm'));
	sorted.forEach(function (ticket) {
		if (moment(ticket.data().time, 'HH:mm') < moment()) {
			$('#all-bookings').append('<div class="col-4 col-md-2 p-3 mb-2 d-flex justify-content-center"><label class="w-100 btn btn-outline-secondary nohover btn-lg">#' + ticket.data().time.replace(':', '') + '</label></div>');
		} else {
			$('#all-bookings').append('<div class="col-4 col-md-2 p-3 mb-2 d-flex justify-content-center"><label class="w-100 font-weight-bold btn btn-outline-dark nohover btn-lg">#' + ticket.data().time.replace(':', '') + '</label></div>');
		}


	});
}

async function listenBookings(shop) {

	var schedule = new Array();

	// get shop's booking for tomorrow
	await db.collection('tickets').where('shop', '==', shop.id).where('date', '==', today.format("DD/MM/YYYY")).onSnapshot(function (bookings) {

		if(bookings.empty) {
			console.log("No bookings found for this shop!");
			$('#all-bookings').empty().append('<div class="col-12 mb-2 d-flex justify-content-center"><label class="w-100 btn btn-outline-secondary nohover btn-lg">No bookings found for today</label></div>');
		} else {
			console.log("Found following bookings: ", bookings.docs);
			renderBookings(bookings.docs);
		}

	});
}

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
