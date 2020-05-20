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

	// render next booking & all bookings sections
	var bookings = await db.collection('tickets').where('shop', '==', shop.id).where('date', '==', today.format("DD/MM/YYYY")).get();
	if(bookings.empty) {
		console.log("No bookings found for this shop!");
		$('#all-bookings').empty().append('<div class="col-12 mb-2 d-flex justify-content-center"><label class="w-100 btn btn-outline-secondary nohover btn-lg">No bookings found for today</label></div>');
	} else {
		console.log("Found following bookings: ", bookings.docs);
		renderBookings(bookings.docs);
	}

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

	// render booking link section
	renderLinks(shop);
});

function renderLinks(shop) {
	// copy link button
	new ClipboardJS('#copy-link');
	$("#copy-link").attr('data-clipboard-text', 'https://conga.store/book?shop=' + shop.data().code);
	// qr code and pdf poster
	var qrcode = new QRCode(document.getElementById("qrcode"), 'https://conga.store/book?shop=' + shop.data().code);
	$("#qrcode > img ").on('load', function() {
		var pdf = new jsPDF();
		pdf.setFontSize(40);
		pdf.text("Book your visit", 30, 30);
		pdf.text("with Conga", 30, 50);
		pdf.addImage(this.src, 30, 100, 100, 100);
		pdf.text('www.conga.store/' + shop.data().code, 30, 250);
		$("#get-pdf").on('click', function() {
			pdf.save('Shop poster ('+ shop.data().code[0] + "-" + shop.data().code[1] + "-" + shop.data().code[2] + "-" + shop.data().code[3] + ')');
		});
	});
}

async function renderBookings(bookings){

	// render next booking
	var closest = bookings.slice();
	console.log(closest);
	closest.sort(function(a, b) {
	  var dA = Math.abs(moment(a.data().time, 'HH:mm') - today),
	    dB = Math.abs(moment(b.data().time, 'HH:mm') - today);
	  if (dA < dB) {
	    return -1;
	  } else if (dA > dB) {
	    return 1;
	  } else {
	    return 0;
	  }
	});

	if (moment(closest[0].data().time, 'HH:mm') >= moment()) {
		$('#next-booking').parent().removeClass('d-none');
		$('#next-booking').find('h1').text('#' + closest[0].data().time.replace(':', ''));
		$('#next-booking').find('h1').parent().css('background-color', closest[0].data().color);
		$('#next-booking').find('h1').addClass(lightOrDark(closest[0].data().color) ? 'text-dark':'text-white');
	}

	// $('button[name=next]').click(function (sorted) {
	// 	var current =
	// });

	// render all Bookings
	var sorted = bookings.slice();
	sorted.sort((a, b) => moment(a.data().time, 'HH:mm') - moment(b.data().time, 'HH:mm'));
	sorted.forEach(function (ticket) {
		console.log(ticket.data().color);
		if (moment(ticket.data().time, 'HH:mm') < moment()) {
			$('#all-bookings').append('<div class="col-4 col-xl-3 p-3 mb-2 d-flex justify-content-center"><label class="w-100 btn btn-outline-secondary nohover btn-lg">#' + ticket.data().time.replace(':', '') + '</label></div>');
		} else {
			if (ticket.data().time == closest[0].data().time) {
				$('#all-bookings').append('<div class="col-4 col-xl-3 p-3 mb-2 d-flex justify-content-center"><label class="w-100 font-weight-bold btn nohover btn-outline-dark btn-lg" style="box-shadow: 0 0 0 5px ' + ticket.data().color + '; border-color: transparent">#' + ticket.data().time.replace(':', '') + '</label></div>');
			}  else {
				$('#all-bookings').append('<div class="col-4 col-xl-3 p-3 mb-2 d-flex justify-content-center"><label class="w-100 font-weight-bold btn btn-outline-dark nohover btn-lg">#' + ticket.data().time.replace(':', '') + '</label></div>');
			}
		}
	});

	// create pdf to print Schedule
	var pdf = new jsPDF({putOnlyUsedFonts: true});
	pdf.setFontSize(25);
	pdf.text(today.format("dddd Do MMMM"), 30, 30);
	pdf.setFontSize(20);
	$('#all-bookings > > label').each(function (index) {
		pdf.text($(this).text(), 30, 50+index*10);
	});
	$("button[name=print]").on('click', function () {
		//pdf.save('schedule.pdf');
		pdf.autoPrint();
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

    // Using the HSP value, determine whether the color is light or dark
    if (hsp>127.5) {

        return true;
    }
    else {

        return false;
    }
}
