$(document).ready(async function () {
	// get shop code
	var code = getShopCode();	
	// get shop data
	var shop = await getShopDataByCode(code);
	console.log(shop.id, shop.data());
	// get shop bookings for tomorrow
	var bookings = await getBookings(shop.id);
	// render page
	renderPage(shop.data());
	
	// determine which slots are free
	var schedule = generateSchedule(shop, bookings);
	
});

function renderPage(shop) {
	$('#shop-name').text(shop.name);
	$('#shop-address').text(shop.address);
}

function generateSchedule(shop, bookings) {
	const today = new Date();
	var hours = shop.data().hours[today.toDateString().slice(0,3).toLowerCase()]
	var params = shop.data().bookings;
	console.log(params.number, params.rate);
	
	// calculate number of slots during the day
	var slots_n = moment.duration(moment(hours.close, 'HH:mm')-moment(hours.open, 'HH:mm'))/moment.duration(params.rate, 'minutes');
	console.log("Number of slots during the day: ", slots_n);
	
	// generate empty schedule
	var schedule = new Array(slots_n);
	console.log(schedule);
//	schedule.forEach(function (slot, i) {
//		console.log('i=',i);
//		console.log('slot=', slot);
//		for (var j = 0; j < params.number; j++) {
//			var time = moment(hours.open, 'HH:mm') + i*moment.duration(params.rate, 'minutes') + j*moment.duration(5, 'minutes');
//			slot.push({'time': moment(time).format('HH:mm'), 'free': true});
//		}
//		
//	});
	
	for (var i = 0; i < slots_n; i++) {
		var slots = new Array();
		for (var j = 0; j < params.number; j++) {
			var time = moment(hours.open, 'HH:mm') + i*moment.duration(params.rate, 'minutes') + j*moment.duration(5, 'minutes');
			slots.push({'time': moment(time).format('HH:mm'), 'free': true});
		}
		schedule[i] = slots;
	}
	console.log(schedule);

}

async function getBookings(shopID) {
	
	// we are only interested in getting tomorrow's bookings
	const today = new Date();
	const tomorrow = new Date(today);
	
	tomorrow.setDate(tomorrow.getDate() + 1);
	// get bookings for specific shop on specific day
	var query = await db.collection('tickets').where('shop', '==', shopID).where('date', '==', tomorrow.toLocaleDateString()).get();
	if(query.empty) {
		console.log("No bookings found for this shop!");
		return [];
	} else {
		console.log("Found " + query.size.toString() + " bookings");
		return query.docs;
	}
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