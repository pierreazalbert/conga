var tomorrow = moment().add(1, 'days');
var countdown;
Cookies.json = true;

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
		$(":button").text('Shop not open on that day');
	} else {
		$('#shop-hours').text('Open ' + hours.open + ' to ' + hours.close);

		var bookings = Object.entries(Cookies.get());
		// detect if user already has a booking for tomorrow
		if (bookings.find(booking => (booking[1].shop == shop.id) && (booking[1].date == moment(tomorrow).format('DD/MM/YYYY'))) != undefined) {
			//$("#schedule").text('You already have a booking for this day. You must cancel your existing booking before making a new one');
			$(":button").text('You already have a booking for this day. Click here to go to your wallet').removeClass('disabled').attr('onclick', 'window.location="/index"');

		} else {
			// listen to shop bookings and generate/update schedule
			listenBookings(shop);
		}

	}

});

async function createBooking(shop, schedule, slot) {

	// build booking object to send to database
	var booking = schedule.find(row => row[0].time == slot).find(ticket => ticket.free == true);
	booking.date = tomorrow.format("DD/MM/YYYY");
	booking.shop = shop.id;
	booking.color = '#' + Math.floor(Math.random()*16777215).toString(16);
	console.log(booking.color);
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

	// activate submit button
	//$(":submit").removeClass('btn-outline-secondary disabled').addClass('btn-primary').text("");

	// detach old booking and attach new booking to submit event
	$(':submit').off('click').click(function () {
		Cookies.set(doc.id, booking, {expires: 2});
		Cookies.set(shop.id, shop.data(), {expires:365});
		console.log('Added cookie with id:', doc.id);
		window.location.href = 'index.html';
	});

	// reserve booking for 5mins
	var expiry = 300; //5 min * 60 sec
	clearInterval(countdown);
	countdown = setInterval(async function (){
		expiry -= 1;
		var clock = moment(moment.duration(expiry, 'seconds').as('milliseconds')).format('mm:ss');
		$(':submit').removeClass('btn-outline-secondary disabled').addClass('btn-primary').text("Confirm booking (" + clock + ")" );
		if (expiry == 0) {
			var reserved = $(':submit').prop('ticket');
			await db.collection('tickets').doc(reserved).delete();
			console.log('reservation expired - deleted booking with id:', reserved);
			$(":submit").removeClass('btn-primary').addClass('btn-outline-secondary disabled').text('Pick a time for your visit');
			clearInterval(countdown);
			$(":input[value='" + slot +"']").prop('checked', false).parent().removeClass('active');
		}
	}, 1000);

	return doc;
}

async function renderSchedule(schedule){
	var selected = $('#schedule').find('.active').text();
	$('#schedule').empty();
	schedule.forEach(function (slot) {
		var count = slot.filter(booking => booking.free == false).length;
		if (slot[0].time == selected) {
			$('#schedule').append('<div class="col-4 col-md-2 p-2 btn-group-toggle d-flex justify-content-center"><label class="w-100 btn btn-outline-success btn-lg active"><input type="radio" name="slot" value="' + slot[0].time + '" autocomplete="off">' + slot[0].time + '</label></div>');
			$('#schedule').find('.active').prop('checked', true);
		} else if (count == slot.length) {
			$('#schedule').append('<div class="col-4 col-md-2 p-2 btn-group-toggle d-flex justify-content-center"><label class="w-100 btn btn-outline-secondary disabled btn-lg"><input type="radio" name="slot" value="' + slot[0].time + '" autocomplete="off">' + slot[0].time + '</label></div>');
		} else if (count < slot.length && count > 0) {
			$('#schedule').append('<div class="col-4 col-md-2 p-2 btn-group-toggle d-flex justify-content-center"><label class="w-100 btn btn-outline-warning btn-lg"><input type="radio" name="slot" value="' + slot[0].time + '" autocomplete="off">' + slot[0].time + '</label></div>');
		} else if (count == 0) {
			$('#schedule').append('<div class="col-4 col-md-2 p-2 btn-group-toggle d-flex justify-content-center"><label class="w-100 btn btn-outline-success btn-lg"><input type="radio" name="slot" value="' + slot[0].time + '" autocomplete="off">' + slot[0].time + '</label></div>');
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
		//throw new Error ("Error getting shop data: no shop found");
		window.location.href = '/index.html';
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

function allLetters(input) {
	var letters = /^[A-Za-z]+$/;
	if (input.match(letters)) {
		return true;
	}
	else {
		return false;
	}
}
