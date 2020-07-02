Cookies.json = true;
var today = moment();
var tomorrow = moment().add(1, 'days');
var lang = 'en';

$(document).ready(async function () {

	var params = getParams(window.location.href);
	if ((params != null) && ('lang' in params) ) {
		lang = params.lang;
	}
	moment.locale(lang);

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

	$('#ticket-focus').on('show.bs.modal', function (event) {
		var ticket = $(event.relatedTarget); // Button that triggered the modal
		// If necessary, you could initiate an AJAX request here (and then do the updating in a callback).
		// Update the modal's content. We'll use jQuery here, but you could use a data binding library or other methods instead.
		var modal = $(this);
		modal.removeClass('text-dark').removeClass('text-white').addClass(lightOrDark(ticket.css('background-color')) ? 'text-dark':'text-white');
		modal.find('#shop-name-focus').text(ticket.parent().find('#shop-name').text());
		modal.find('#ticket-date-focus').text(ticket.find('h6')[0].textContent);
		modal.find('#ticket-time-focus').text(ticket.find('h6')[1].textContent);
		modal.find('#ticket-number-focus').text(ticket.find('h1').text());
		modal.css('background-color', ticket.css('background-color'));
		modal.find('.modal-content').css('background-color', ticket.css('background-color'));
	});

});

async function renderWallet() {

	// get cookies
	var cookies = Cookies.get();
	// extract cookies which are bookings
	var bookings = Object.entries(cookies).filter(shop => shop[1].time != undefined);
	// filter to only display bookings for today tomorrow - others will expire in the background
	var active = bookings.filter(booking => booking[1].date == tomorrow.format("DD/MM/YYYY") || (booking[1].date == today.format("DD/MM/YYYY") && booking[1].time >= moment().format('HH:mm')));
	// sort bookings by time and date (ascending)
	active.sort((a, b) => moment(a[1].date + ' ' + a[1].time, 'DD/MM/YYYY HH:mm') - moment(b[1].date + ' ' + b[1].time, 'DD/MM/YYYY HH:mm'));

	console.log(active);

	// render bookings
	var wallet = $("#wallet");
	wallet.empty();
	$.each(Object.fromEntries(active), async function (id, booking) {
		console.log(id, booking);
		var shop = await db.collection('shops').doc(booking.shop).get();
		wallet.append('<div class="col-sm-12 mb-5"><h5 class="pb-0" id="shop-name">' + shop.data().name + '</h5><div class="card border-0 ' + (lightOrDark(booking.color) ? 'text-dark':'text-white') + ' text-center" style="background-color:' + booking.color + '" data-toggle="modal" data-target="#ticket-focus"><div class="card-body"><h6 class="card-subtitle mb-2 ' + (lightOrDark(booking.color) ? 'text-dark':'text-white') + '" style="float:left">' + moment(booking.date, "DD/MM/YYYY").format("dddd Do MMMM") + '</h6><h6 class="card-subtitle mb-2 ' + (lightOrDark(booking.color) ? 'text-dark':'text-white') + '" style="float:right">' + booking.time + '</h6><div style="clear: both;"></div><h1 class="card-title display-4 font-weight-bold mt-3">#' + booking.time.replace(':', '') + '</h1></div></div><button type="button" name="cancel" class="btn btn-conga btn-grey w-100 my-2" booking="' + id + '">' + translate.wallet.cancel_booking[lang] + '</button></div>');

		// autofocus booking if is happening in less than 2 minutes
		var diff = moment.duration(moment(booking.time, "HH:mm") - moment()).asMinutes();
		if ((booking.date == today.format("DD/MM/YYYY")) && (diff > 0) && (diff < 2)) {
			$(':button[booking="' + id + '"]').prev().click();
		}
	});

	// extract cookies which are shop favourites
	var shops = Object.entries(cookies).filter(shop => shop[1].address != undefined);
	// render shop favourites
	var favourites = $('#favourites');
	favourites.empty();
	$.each(Object.fromEntries(shops), async function(id, shop) {
		console.log(active.filter(booking => booking[1].shop == id).length);
		if (active.filter(booking => booking[1].shop == id).length == 0) {
			console.log(id, shop);
			var shopFromDB = await db.collection('shops').doc(id).get();
			favourites.append('<div class="col-sm-12 mb-5"><h5 class="pb-0" id="shop-name">' + shopFromDB.data().name + '</h5><button type="button" name="book" code="' + shopFromDB.data().code + '" class="btn btn-conga btn-blue w-100 mb-2">' + translate.wallet.make_booking[lang] + '</button><button type="button" name="forget" id="' + id + '" class="btn btn-conga btn-grey w-100 mb-2">' + translate.wallet.remove_favourite[lang] + '</button></div>');
			$(':button[code=' + shopFromDB.data().code + ']').attr('onclick', 'window.location="/book?shop=' + shopFromDB.data().code + '"');
			$(':button[id=' + id + ']').click(function() {
				Cookies.remove(id);
				console.log('deleted cookie with id:', id);
				renderWallet();
			})
		}
	});

	// if no bookings and no favourites, give help message
	if ((active.length == 0) & (shops.length == 0)) {
		$(".alert").removeClass('d-none');
	}

}
