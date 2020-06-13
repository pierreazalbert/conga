$(document).ready(async function () {
	// get login key
	var key = getParams(window.location.href).key;
	// get shop data
	var shop = await getShopData(key);

	// display shop info
	$('#shop-name').text(shop.data().name);
	$('#shop-code').prepend("Shop ID: " + shop.data().code[0] + "-" + shop.data().code[1] + "-" + shop.data().code[2] + "-" + shop.data().code[3]);
	$('#shop-link').prop('href', '/book?shop=' + shop.data().code);
	$('[name=today]').text(moment().format("dddd Do MMMM"));

	// render next booking & all bookings sections
	var bookings = await db.collection('tickets').where('shop', '==', shop.id).where('date', '==', moment().format("DD/MM/YYYY")).get();
	if(bookings.empty) {
		console.log("No bookings found for this shop!");
		$('#all-bookings').empty().append('<div class="col-12 mb-2 d-flex justify-content-center"><label class="w-100 btn btn-outline-secondary nohover btn-lg">No bookings found for today</label></div>');
	} else {
		console.log("Found following bookings: ", bookings.docs);
		var sorted = bookings.docs.slice();
		sorted.sort((a, b) => moment(a.data().time, 'HH:mm') - moment(b.data().time, 'HH:mm'));

		renderQueue(shop.data(), sorted);
		renderBookings(sorted);
		makeSchedulePDF(sorted);

		if(shop.data().status == "auto") {
			$("#next-booking").click();
			var update = setInterval(function () {
				renderQueue(shop.data(), sorted);
				renderBookings(sorted);
			}, 10000);
		} else {
			$("#next-customer").click();
		}

	}

	$("#toggle-queue").change(async function (event) {
		if($(':checked').attr('id') == 'next-booking') {
			console.log('Switching to automatic queue control');
			shop = await updateShopQueueStatus(shop, 'auto');
			// switch to auto mode

			renderQueue(shop.data(), sorted);
			renderBookings(sorted);

			update = setInterval(function () {
				renderQueue(shop.data(), sorted);
				renderBookings(sorted);
			}, 10000);



		} else if ($(':checked').attr('id') == 'next-customer') {
			console.log('Switching to manual queue control');
			shop = await updateShopQueueStatus(shop, 'manual');
			// if button was inactive, activate manual mode
			renderQueue(shop.data(), sorted);
			clearInterval(update);

		}
	});

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

async function updateShopQueueStatus(shop, status) {

	try {
		var doc = await db.collection("shops").doc(shop.id);
		await doc.update({status: status});
		console.log("Shop queue status successfully updated!");
		shop = await doc.get();
		return shop;
	} catch (error) {
		console.error("Error updating shop: ", error);
	}


}

function renderQueue(shop, bookings){

	var closest = bookings.find(booking => moment(booking.data().time, 'HH:mm') >= moment());

	console.log("Queue status", shop.status);

	$('#queue-status').parent().removeClass('d-none');

	if (shop.status == 'auto') {

		if ((closest != undefined) && (moment.duration(moment(closest.data().time, "HH:mm") - moment()).asMinutes() < 2)) {

			console.log('Next booking', closest.data().time);
			$('#queue-status').find('h1').text('#' + closest.data().time.replace(':', ''));
			$('#queue-status').find('h1').parent().css('background-color', closest.data().color);
			$('#queue-status').find('h1').removeClass('text-white text-dark').addClass(lightOrDark(closest.data().color) ? 'text-dark':'text-white');

		} else {
			$('#queue-status').find('h1').text('PLEASE WAIT').removeClass('text-white text-dark').addClass('text-dark');
			$('#queue-status').find('h1').parent().css('background-color', '#FF9020');
		}

	} else {
		$('#queue-status').find('h1').text('NEXT CUSTOMER').removeClass('text-white text-dark').addClass('text-white');
		$('#queue-status').find('h1').parent().css('background-color', '#35A000');
	}

}

function renderBookings(bookings){

	// render all Bookings
	var closest = bookings.find(booking => moment(booking.data().time, 'HH:mm') >= moment());

	$('#all-bookings').empty();
	bookings.forEach(function (ticket) {
		if (moment(ticket.data().time, 'HH:mm') < moment()) {
			$('#all-bookings').append('<div class="col-4 col-xl-3 p-3 mb-2 d-flex justify-content-center"><label class="w-100 btn btn-outline-secondary nohover btn-lg">#' + ticket.data().time.replace(':', '') + '</label></div>');
		} else {
			if ((ticket.data().time == closest.data().time) && (moment.duration(moment(closest.data().time, "HH:mm") - moment()).asMinutes() < 2)) {
				$('#all-bookings').append('<div class="col-4 col-xl-3 p-3 mb-2 d-flex justify-content-center"><label class="w-100 font-weight-bold btn nohover btn-outline-dark btn-lg" style="box-shadow: 0 0 0 5px ' + ticket.data().color + '; border-color: transparent">#' + ticket.data().time.replace(':', '') + '</label></div>');
			}  else {
				$('#all-bookings').append('<div class="col-4 col-xl-3 p-3 mb-2 d-flex justify-content-center"><label class="w-100 font-weight-bold btn btn-outline-dark nohover btn-lg">#' + ticket.data().time.replace(':', '') + '</label></div>');
			}
		}
	});

}

function makeSchedulePDF(bookings) {
	var pdf = new jsPDF();
	pdf.setFontSize(25);
	pdf.text(moment().format("dddd Do MMMM"), 20, 20);
	pdf.setFontSize(20);
	var row = 0;
	bookings.forEach(function (ticket, index) {
		var column = index % 5;
		pdf.setFillColor(ticket.data().color);
		pdf.roundedRect(20+35*column, 30+20*row, 30, 15, 3, 3, "F");
		pdf.setFontStyle("bold");
		pdf.setTextColor(lightOrDark(ticket.data().color) ? 0:255);
		pdf.text(ticket.data().time, 26+35*column, 40+20*row);
		if ((column+1) % 5 == 0) {
			row += 1;
		}
	});
	$("button[name=print]").on('click', function () {
		pdf.save('schedule.pdf');
		//pdf.autoPrint();
	});
}

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
