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

	// => NEED TO SORT BOOKINGS BY DATE AND TIME!
	var cookies = Cookies.get();
	var sorted = Object.entries(cookies);
	sorted.sort((a, b) => moment(a[1].date + ' ' + a[1].time, 'DD/MM/YYYY HH:mm') - moment(b[1].date + ' ' + b[1].time, 'DD/MM/YYYY HH:mm'));

	var wallet = $("#wallet");
	wallet.empty();
	$.each(Object.fromEntries(sorted), async function (id, booking) {
		// only display bookings for today tomorrow - others will expire in the background
		if (booking.date == tomorrow.format("DD/MM/YYYY") || (booking.date == today.format("DD/MM/YYYY") && booking.time >= moment().format('HH:mm'))){ 
			console.log(id, booking);
			var shop = await db.collection('shops').doc(booking.shop).get();
			wallet.append('<div class="col-sm-12 mb-5"><h5 class="pb-0" id="shop-name">' + shop.data().name + '</h5><div class="card border-0 ' + (lightOrDark(booking.color) ? 'text-dark':'text-white') + ' text-center" style="background-color:' + booking.color + '" data-toggle="modal" data-target="#ticket-focus"><div class="card-body"><h6 class="card-subtitle mb-2 ' + (lightOrDark(booking.color) ? 'text-dark':'text-white') + '" style="float:left">' + moment(booking.date, "DD/MM/YYYY").format("dddd Do MMMM") + '</h6><h6 class="card-subtitle mb-2 ' + (lightOrDark(booking.color) ? 'text-dark':'text-white') + '" style="float:right">' + booking.time + '</h6><div style="clear: both;"></div><h1 class="card-title display-4 font-weight-bold mt-3">#' + booking.time.replace(':', '') + '</h1></div></div><button type="button" name="cancel" class="btn btn-conga btn-grey w-100 my-2" booking="' + id + '">Cancel booking</button></div>');

			console.log(booking.time);
			var diff = moment.duration(moment(booking.time, "HH:mm") - moment()).asMinutes();
			console.log(diff);
			if ((booking.date == today.format("DD/MM/YYYY")) && (diff > 0) && (diff < 2)) {
				$(':button[booking="' + id + '"]').prev().click();
			}
		}


	});

	var favourites = $('#favourites');
	favourites.empty();
	$.each(cookies, function(id, shop) {
		filtered = sorted.filter(function (item) {
			return (item[1].date == today.format("DD/MM/YYYY")) && (item[1].time >= moment().format('HH:mm')) && (item[1].shop == id)
		});
		if ((shop.address != undefined) && (filtered.length == 0)) {
			console.log(id, shop);
			favourites.append('<div class="col-sm-12 mb-5"><h5 class="pb-0" id="shop-name">' + shop.name + '</h5><button type="button" name="book" code="' + shop.code + '" class="btn btn-conga btn-blue w-100 mb-2">Make booking</button></h4><button type="button" name="forget" id="' + id + '" class="btn btn-conga btn-grey w-100 mb-2">Remove favourite</button></div>');
			$(':button[code=' + shop.code + ']').attr('onclick', 'window.location="/book?shop=' + shop.code + '"');
			$(':button[id=' + id + ']').click(function() {
				Cookies.remove(id);
				console.log('deleted cookie with id:', id);
				renderWallet();
			})
		}
	});

}
