$(document).ready(async function () {
	// get shop code
	var code = getShopCode();	
	// get shop data
	var shop = await getShopDataByCode(code);
	console.log(shop.id, shop.data());
	
	// listen to shop bookings and update schedule
	listenBookings(shop);

	// render page
	renderPage(shop.data());
	
	
});

function renderPage(shop) {
	$('#shop-name').text(shop.name);
	$('#shop-address').text(shop.address);
	
	const today = new Date();
	$('#todays-date').text(moment(today).format("dddd Do MMMM YYYY"));
	var hours = shop.hours[today.toDateString().slice(0,3).toLowerCase()]
	$('#shop-hours').text('Open ' + hours.open + ' to ' + hours.close);
}

function renderSchedule(schedule){
	$('#schedule').empty();
	schedule.forEach(function (slot) {
		var count = slot.filter(booking => booking.free == false).length;
		//console.log(slot[0].time, count, slot.length);
		if (count == slot.length) {
			$('#schedule').append('<div class="col-4 col-md-2 p-3 my-2"><button type="button" class="btn btn-secondary disabled btn-lg">' + slot[0].time + '</button></div>');
		} else if (count < slot.length && count > 0) {
			$('#schedule').append('<div class="col-4 col-md-2 p-3 my-2"><button type="button" class="btn btn-outline-warning btn-lg">' + slot[0].time + '</button></div>');
		} else if (count == 0) {
			$('#schedule').append('<div class="col-4 col-md-2 p-3 my-2"><button type="button" class="btn btn-outline-success btn-lg">' + slot[0].time + '</button></div>');
		}
	});
}

function generateSchedule(shop, bookings) {
	const today = new Date();
	var hours = shop.data().hours[today.toDateString().slice(0,3).toLowerCase()];
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

//async function getBookings(shopID) {
//	
//	// we are only interested in getting tomorrow's bookings
//	const today = new Date();
//	const tomorrow = new Date(today);
//	tomorrow.setDate(tomorrow.getDate() + 1);
//	
//	// get bookings for specific shop on specific day
//	var query = await db.collection('tickets').where('shop', '==', shopID).where('date', '==', tomorrow.toLocaleDateString()).get();
//	if(query.empty) {
//		console.log("No bookings found for this shop!");
//		return [];
//	} else {
//		console.log("Found " + query.size.toString() + " bookings");
//		return query.docs;
//	}
//}

async function listenBookings(shop) {
	
	var schedule = new Array();
	
	// we are only interested in getting tomorrow's bookings
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	
	// get bookings for specific shop on specific day
	await db.collection('tickets').where('shop', '==', shop.id).where('date', '==', tomorrow.toLocaleDateString()).onSnapshot(function (bookings) {
		if(bookings.empty) {
			console.log("No bookings found for this shop!");
			schedule = generateSchedule(shop, []);
		} else {
			console.log("Found following bookings: ", bookings.docs);
			schedule = generateSchedule(shop, bookings.docs);
		}
		renderSchedule(schedule);
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

//function range(min, max, step){
//  let arr = [];
//  for(let i = min; i <= max; i += step){
//     arr.push(i);
//  }
//  
//  return arr;
//}