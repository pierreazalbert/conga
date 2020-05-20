Cookies.json = true;
var today = moment();
var tomorrow = moment().add(1, 'days');

$(document).ready(async function () {

		renderWallet();

		$(document).on("click", "button[name=cancel]", async function () {
			var id = $(this).attr('booking');
			console.log(id);
			await db.collection('tickets').doc(id).delete();
			console.log('deleted booking with id:', id);
			Cookies.remove(id);
			console.log('deleted cookie with id:', id);
			renderWallet();
		});

});

async function renderWallet() {



	// => NEED TO SORT BOOKINGS BY DATE AND TIME!
	var cookies = Cookies.get();
	var sorted = Object.entries(cookies);
	sorted.sort((a, b) => moment(a[1].date + ' ' + a[1].time, 'DD/MM/YYYY HH:mm') - moment(b[1].date + ' ' + b[1].time, 'DD/MM/YYYY HH:mm'));


	var wallet = $("#wallet");
	wallet.empty();
	$.each(Object.fromEntries(sorted), async function (id, booking) {

		console.log(id, booking);

		var shop = await db.collection('shops').doc(booking.shop).get();

		// only display bookings for tomorrow - others will expire in the background
		if (booking.date == tomorrow.format("DD/MM/YYYY") || booking.date == today.format("DD/MM/YYYY")){ 
			wallet.append('<div class="col-sm-12 col-md-6 mb-5"><h4 class="pb-3" id="shop-name">' + shop.data().name + '</h4><div class="card border-light ' + (lightOrDark(booking.color) ? 'text-dark':'text-white') + ' text-center" style="background-color:' + booking.color + '"><div class="card-body"><h6 class="card-subtitle mb-2 ' + (lightOrDark(booking.color) ? 'text-dark':'text-white') + '" style="float:left">' + moment(booking.date, "DD/MM/YYYY").format("dddd Do MMMM YYYY") + '</h6><h6 class="card-subtitle mb-2 ' + (lightOrDark(booking.color) ? 'text-dark':'text-white') + '" style="float:right">' + booking.time + '</h6><div style="clear: both;"></div><h1 class="card-title display-4 font-weight-bold mt-3">#' + booking.time.replace(':', '') + '</h1></div></div><button type="button" name="cancel" class="btn btn-secondary w-100 my-2" booking="' + id + '">Cancel booking</button></div>');
		}

	});

}

function lightOrDark(color) {

    // Variables for red, green, blue values
    var r, g, b, hsp;

    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {

        // If HEX --> store the red, green, blue values in separate variables
        color = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);

        r = color[1];
        g = color[2];
        b = color[3];
    }
    else {

        // If RGB --> Convert it to HEX: http://gist.github.com/983661
        color = +("0x" + color.slice(1).replace(
        color.length < 5 && /./g, '$&$&'));

        r = color >> 16;
        g = color >> 8 & 255;
        b = color & 255;
    }

    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
    );

		console.log(color, hsp);
    // Using the HSP value, determine whether the color is light or dark
    if (hsp>160) {

        return true;
    }
    else {

        return false;
    }
}
