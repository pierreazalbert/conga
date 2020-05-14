var tomorrow = moment().add(1, 'days');

$(document).ready(async function () {
	
	// get shop code
	var code = getShopCode();	
	
	// get shop data
	var shop = await getShopDataByCode(code);
	console.log(shop.id, shop.data());
	$('#shop-name').text(shop.data().name);
	$('#shop-address').text(shop.data().address);
	
	// check that shop is open tomorrow
	$('#schedule-date').text(moment(tomorrow).format("dddd Do MMMM YYYY"));
	var hours = shop.data().hours[tomorrow.toLocaleString().slice(0,3).toLowerCase()];
	if (hours == "closed") {
		$(":button").removeClass('btn-primary').addClass('btn-secondary').addClass('disabled').text('Shop not open on that day');		
	} else {
		$('#shop-hours').text('Open ' + hours.open + ' to ' + hours.close);
		// listen to shop bookings and generate/update schedule
		listenBookings(shop);
		
		// on submit, add booking to wallet using a cookie containing the booking object
		//$(":submit").submit(addToWallet(shop, schedule, ));
		
	}
	
});

async function createBooking(shop, schedule, slot) {
	
	// build booking object to send to database
	var booking = schedule.find(row => row[0].time == slot).find(ticket => ticket.free == true);
	booking.date = tomorrow.format("DD/MM/YYYY");
	booking.shop = shop.id;
	delete booking.free;
	
	// save previous ticket id then update selected slot value
	var previous = $(':submit').prop('ticket');
	$(':submit').prop('value', booking.time);
	
	// if a slot was selected before, delete previous booking
	if (previous != undefined) {
		await db.collection('tickets').doc(previous).delete();
		console.log('deleted booking with id:', previous);
	}
		
	// add new ticket to database
	var doc = await db.collection('tickets').add(booking);
	console.log("created booking with id:", doc.id);
	
	// update current ticket id
	$(':submit').prop('ticket', doc.id);	
		
	return doc;
}

async function renderSchedule(schedule){
	$('#schedule').empty();
	schedule.forEach(function (slot) {
		var count = slot.filter(booking => booking.free == false).length;
		//console.log(slot[0].time, count, slot.length);
		if (count == slot.length) {
			$('#schedule').append('<div class="col-4 col-md-2 p-3 my-2 btn-group-toggle"><label class="btn btn-outline-secondary disabled btn-lg"><input type="radio" name="slot" value="' + slot[0].time + '" autocomplete="off">' + slot[0].time + '</label></div>');
		} else if (count < slot.length && count > 0) {
			$('#schedule').append('<div class="col-4 col-md-2 p-3 my-2 btn-group-toggle"><label class="btn btn-outline-warning btn-lg"><input type="radio" name="slot" value="' + slot[0].time + '" autocomplete="off">' + slot[0].time + '</label></div>');
		} else if (count == 0) {
			$('#schedule').append('<div class="col-4 col-md-2 p-3 my-2 btn-group-toggle"><label class="btn btn-outline-success btn-lg"><input type="radio" name="slot" value="' + slot[0].time + '" autocomplete="off">' + slot[0].time + '</label></div>');
		}
	});
	
	// activate button currently reserved booking if the schedule is rendered after a delete operation
	var reserved = $(':submit').val();
	if (reserved != "") {
		var slot = schedule.find(row => row.some(column => column.time == reserved))[0].time;
		$('input[value="'+ slot +'"]').parent().addClass('active');
		$('input[value="'+ slot +'"]').prop('checked', true);
	}
}

function generateSchedule(shop, bookings) {
	// get revenant shop info
	var hours = shop.data().hours[tomorrow.toLocaleString().slice(0,3).toLowerCase()];
	var params = shop.data().bookings;
	
	// calculate number of slots during the day
	var slots_n = moment.duration(moment(hours.close, 'HH:mm')-moment(hours.open, 'HH:mm'))/moment.duration(params.rate, 'minutes');
	
	// generate empty schedule
	var schedule = new Array(slots_n);
	for (var i = 0; i < slots_n; i++) {
		var slots = new Array();
		for (var j = 0; j < params.number; j++) {
			var time = moment(hours.open, 'HH:mm') + i*moment.duration(params.rate, 'minutes') + j*moment.duration(5, 'minutes');
			var free = bookings.find(booking => booking.data().time == moment(time).format('HH:mm')) == undefined;
			slots.push({'time': moment(time).format('HH:mm'), 'free': free});
		}
		schedule[i] = slots;
	}
	console.log("Schedule", schedule);
	return schedule;
}

async function listenBookings(shop) {
	
	var schedule = new Array();
	
	// get shop's booking for tomorrow
	await db.collection('tickets').where('shop', '==', shop.id).where('date', '==', tomorrow.format("DD/MM/YYYY")).onSnapshot(function (bookings) {
		// only generate/update schedule if db notification comes from server
		if(!bookings.metadata.hasPendingWrites) {
			if(bookings.empty) {
				console.log("No bookings found for this shop!");
				schedule = generateSchedule(shop, []);
			} else {
				console.log("Found following bookings: ", bookings.docs);
				schedule = generateSchedule(shop, bookings.docs);
			}
			renderSchedule(schedule);
			
			// attach new buttons to booking creation function
			$("form").off('change').change(async function () {	
				var slot = $('input[name=slot]:checked').val();
				console.log("booking selected", slot);
				var booking = await createBooking(shop, schedule, slot);
			});
		}
	});
}

async function getShopDataByCode (code) {
	var query = await db.collection('shops').where("code", "==", code).get();
	if(query.empty) {
		throw new Error ("Error getting shop data: no shop found");
		window.location.href = 'index.html';
	} else {
		var data = query.docs[0];
		return data;
	}
}

function getShopCode() {
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
	return params.shop;
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