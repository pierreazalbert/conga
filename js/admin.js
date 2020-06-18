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
		$('#all-bookings').empty().append('<div class="col-12 mb-2 d-flex justify-content-center"><label class="w-100 btn btn-grey btn-conga nohover btn-lg">No bookings found for today</label></div>');
		$(':button[name=print]').hide();
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

	// toggle function to control queue mode (auto vs manual)
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
	renderShopSettings(shop);

	$(':button[name=settings]').click(function () {

		$('#shop-settings').load('setup.html form', function () {

			// layout adjustments & removing unused sections
			$('#shop-settings').addClass('mb-5');
			$('form > :submit').text('Save shop settings');
			$('form').find('#email').parent().parent().prev().remove();
			$('form').find('#email').parent().parent().next().remove();
			$('form').find('#email').parent().parent().remove();
			$('form').find('.text-muted').remove();
			$(":checkbox").change(function () {
				$(this).parent().parent().parent().find("input[type='time']").prop('disabled', function(i, v) {
					return!v;
				});
			});

			// fill up form with current shop settings
			$('form').find('#name').val(shop.data().name);
			$('form').find('#address').val(shop.data().address);
			$.each(shop.data().hours, function(day, hours) {
				if (hours == "closed") {
					$('form').find('#' + day + '-closed').click();
				} else {
					$('form').find('#' + day + '-open').val(hours.open);
					$('form').find('#' + day + '-close').val(hours.close);
				}
			});
			$('form').find('#number').val(shop.data().bookings.number);
			$('form').find('#rate').val(shop.data().bookings.rate);

			// form validation & Submission
			$('input[type=time]').change(function () {
				checkTimeInput(this);
			});
			$('#setupForm').submit(function (event) {
				var form = this;
				if (form.checkValidity() === false) {
		      event.preventDefault()
		      event.stopPropagation()
		    } else {
		      //alert("your form is valid and ready to send");
		      updateShopSettings(event, shop);
		    }
		    // Add bootstrap 4 was-validated classes to trigger validation messages
		    $(form).addClass('was-validated');
			});


		});

	});

	// render booking link section
	renderLinks(shop);
});

async function updateShopSettings(event, shop) {
	event.preventDefault();

	// Get Values from the DOM
	var shopName = $('#name').val();
	var shopAddress = $('#address').val();
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

	// Prepare object to send to database
	var shopData = {
		name: shopName,
		address: shopAddress,
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
		}
	}
	console.log(shopData);

	// Write completed object to database
	var docRef = await db.collection('shops').doc(shop.id).update(shopData).then(function () {
		location.reload();
	}).catch(function(error) {
		console.error("Error updating shop settings: ", error);
		$('.btn').css('background-color', 'red').text('Shop settings update failed');
	});

}

function renderShopSettings(shop) {
	$('#shop-settings > > #name').text(shop.data().name);
	$('#shop-settings > > #address').text(shop.data().address);
	$.each(shop.data().hours, function(day, hours) {
		if (hours == "closed") {
			$('#shop-settings > > #hours > > #' + day).text("Closed");
		} else {
			$('#shop-settings > > #hours > > #' + day).text(hours.open + ' to ' + hours.close);
		}
	});
	$('#shop-settings > > #options').text("Accepting " + shop.data().bookings.number + " bookings every " + shop.data().bookings.rate + " minutes.");
}

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
			$('#queue-status').find('h1').parent().css('background-color', '#f8ad17');
		}

	} else {
		$('#queue-status').find('h1').text('NEXT CUSTOMER').removeClass('text-white text-dark').addClass('text-white');
		$('#queue-status').find('h1').parent().css('background-color', '#7bd118');
	}

}

function renderBookings(bookings){

	// render all Bookings
	var closest = bookings.find(booking => moment(booking.data().time, 'HH:mm') >= moment());

	$('#all-bookings').empty();
	bookings.forEach(function (ticket) {
		if (moment(ticket.data().time, 'HH:mm') < moment()) {
			$('#all-bookings').append('<div class="col-4 col-xl-3 p-2 mb-2 d-flex justify-content-center"><label class="w-100 btn btn-grey nohover btn-lg">#' + ticket.data().time.replace(':', '') + '</label></div>');
		} else {
			if ((ticket.data().time == closest.data().time) && (moment.duration(moment(closest.data().time, "HH:mm") - moment()).asMinutes() < 2)) {
				$('#all-bookings').append('<div class="col-4 col-xl-3 p-2 mb-2 d-flex justify-content-center"><label class="w-100 font-weight-bold btn nohover btn-outline-dark btn-lg" style="box-shadow: 0 0 0 5px ' + ticket.data().color + '; border-color: transparent">#' + ticket.data().time.replace(':', '') + '</label></div>');
			}  else {
				$('#all-bookings').append('<div class="col-4 col-xl-3 p-2 mb-2 d-flex justify-content-center"><label class="w-100 font-weight-bold btn btn-outline-dark nohover btn-lg">#' + ticket.data().time.replace(':', '') + '</label></div>');
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
