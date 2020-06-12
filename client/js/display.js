$(document).ready(async function () {
	// get login key
	var key = getParams(window.location.href).key;
	// get shop data
	var shop = await getShopData(key);

  $('h3').text(shop.data().name);
  $('h5').text('conga.store/' + shop.data().code);

  // listen to shop status updates and update queue display
  var update;
  await db.collection("shops").doc(key).onSnapshot(async function(shop) {
      console.log("Queue status: ", shop.data().status);
      if (shop.data().status == 'auto') {
        // poll database for bookings and update queue status (wait or call next booking)
      	var bookings = await db.collection('tickets').where('shop', '==', shop.id).where('date', '==', moment().format("DD/MM/YYYY")).get();
      	if(bookings.empty) {
      		console.log("No bookings found for this shop!");
          renderDisplay('please wait');
      	} else {
      		console.log("Found following bookings: ", bookings.docs);
      		var sorted = bookings.docs.slice();
      		sorted.sort((a, b) => moment(a.data().time, 'HH:mm') - moment(b.data().time, 'HH:mm'));
          updateQueue(sorted);
          update = setInterval(function () {
            updateQueue(sorted);
          }, 10000);
        }
      }
      else if (shop.data().status == 'manual') {
        // call next customer without booking
        renderDisplay('next customer');
        clearInterval(update);
      }
  });

});

function updateQueue(bookings) {
  var closest = bookings.find(booking => moment(booking.data().time, 'HH:mm') >= moment());
  if ((closest != undefined) && (moment.duration(moment(closest.data().time, "HH:mm") - moment()).asMinutes() < 2)) {
    console.log('Next booking', closest.data().time);
    $('#booking-id').text('#' + closest.data().time.replace(':', ''))
    $('#booking-id').parent().removeClass('text-white text-dark').addClass(lightOrDark(closest.data().color) ? 'text-dark':'text-white');
    $('#next-booking').find('h3').parent().removeClass('text-white text-dark').addClass(lightOrDark(closest.data().color) ? 'text-dark':'text-white');
    $('#next-booking').find('.modal-header').css('background-color', closest.data().color);
    $('#next-booking').find('.modal-body').css('background-color', closest.data().color);
    renderDisplay('next booking');
  } else {
    renderDisplay('please wait');
  }

}

function renderDisplay(mode) {
  if (mode == 'please wait') {
    console.log('PLEASE WAIT');
    $('.modal').modal('hide');
    $('#please-wait').modal('show');
  } else if (mode == 'next customer') {
    console.log('NEXT CUSTOMER PLEASE COME IN');
    $('.modal').modal('hide');
    $('#next-customer').modal('show');
  } else if (mode == 'next booking') {
    console.log('NEXT BOOKING PLEASE COME IN');
    $('.modal').modal('hide');
    $('#next-booking').modal('show');
  }
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
