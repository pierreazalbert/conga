Cookies.json = true;
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
	var cookies = Cookies.get();
	var wallet = $("#wallet");
	wallet.empty();

	$.each(cookies, async function (id, booking) {

		if (typeof(booking) == "object") {

			var shop = await db.collection('shops').doc(booking.shop).get();

			// only display bookings for tomorrow - others will expire in the background
			if (booking.date == tomorrow.format("DD/MM/YYYY")){ 
				wallet.append('<div class="col-sm-12 col-md-6 mb-5"><h4 class="pb-3" id="shop-name">' + shop.data().name + '</h4><div class="card bg-info border-light text-white text-center"><div class="card-body"><h6 class="card-subtitle mb-2 text-white" style="float:left">' + moment(booking.date, "DD/MM/YYYY").format("dddd Do MMMM YYYY") + '</h6><h6 class="card-subtitle mb-2 text-white" style="float:right">' + booking.time + '</h6><div style="clear: both;"></div><h1 class="card-title display-4 font-weight-bold mt-3">#' + booking.time.replace(':', '') + '</h1></div></div><button type="button" name="cancel" class="btn btn-secondary w-100 my-2" booking="' + id + '">Cancel booking</button></div>');
			}
		}

	});

}
