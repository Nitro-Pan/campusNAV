var userID;
$(document).ready(function() {
	let menuIsDown = true;
	$('#menuButton').click(function() {
		$('#menu').toggleClass('menuUp');
		$('#menu').toggleClass('menuDown');

		if (menuIsDown) {
			$('#menuButton img').attr('src', 'close_button.png');
			menuIsDown = false;
		} else {
			$('#menuButton img').attr('src', 'menu_button.png');
			menuIsDown = true;
		}
	});

	$('#logout').click(function() {
		firebase.auth().signOut().then(
			function() {
				window.location = 'index.html';
			},
			function(e) {
				console.log("You can't sign out.");
			}
		);
	});

	let debugIsShown = false;
	$('#debugShow').click(function() {
		if (debugIsShown) {
			$('#debug').css({ display: 'none' });
			$('#debugShow').text('Show Debug Info');
			debugIsShown = false;
		} else {
			$('#debug').css({ display: 'block' });
			$('#debugShow').text('Hide Debug Info');
			debugIsShown = true;
		}
	});

	$('#locationInput').focus(function(e) {
		//show the search button when the input field is focused
		$('#searchClick').css({ display: 'block' });
		displayHistory();
	});

	function displayHistory() {
		$('#historyDrop').css({ display: 'block' });
	}

	$('#locationInput').blur(async function(e) {
		//hack so that the button gets pressed before it goes away
		await sleep(100);
		$('#searchClick').css({ display: 'none' });
	});
	$('#locationInput').keydown(function(e) {
		let keycode = e.keyCode ? e.keyCode : e.which;
		//if the enter key is pressed
		if (keycode == 13) {
			let input = $('#locationInput');
			//if the userID exists and the input isn't empty
			if (userID && input.val() != '') {
				console.log('setting location');
				//set the location to a collection under their ID
				db
					.collection('users')
					.doc(userID)
					.collection('history')
					.doc(input.val())
					.set({
						location: input.val()
					})
					.then(console.log('updated location'));
			} else {
				console.log('Not logged in or no input');
			}
		}
	});
	$('#searchClick').click(function(e) {
		let input = $('#locationInput');
		if (userID && input.val() != '') {
			console.log('setting location');
			db
				.collection('users')
				.doc(userID)
				.collection('history')
				.doc(input.val())
				.set({
					location: input.val()
				})
				.then(console.log('Updated location'));
		} else {
			console.log('Not logged in or no input');
		}
	});

	// if time allows it, make the background scrollable. Don't worry about it for now.
	// let pos1 = 0;
	// let pos2 = 0;
	// let pos3 = 0;
	// let pos4 = 0;
	// let oldPositionX = 0;
	// let oldPositionY = 0;
	// let scrollingMap = false;
	// $("#mapScroll").mousedown(function (e) {
	//   scrollingMap = true;
	//   pos3 = e.pageX;
	//   pos4 = e.pageY;
	// });
	// $("#mapScroll").mouseup(function (e) {
	//   scrollingMap = false;
	//   pos3 = e.pageX;
	//   pos4 = e.pageY;
	// });
	// $("#mapScroll").mouseleave(function (e) {
	//   scrollingMap = false;
	//   pos3 = e.pageX;
	//   pos4 = e.pageY;
	// });
	// $("#mapScroll").mousemove(function (e) {
	//   if (scrollingMap) {
	//     pos1 = e.pageX - pos3;
	//     pos2 = e.pageY - pos4;
	//     // pos3 = e.pageX;
	//     // pos4 = e.pageY;

	//     $("#mapScroll").css({ transform: "translate(" + pos1 + "px," + pos2 + "px)" });
	//   }
	// });
});

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLocation() {
	if (navigator.geolocation) {
		navigator.geolocation.watchPosition(showPosition);
	} else {
		document.getElementById('latlongdebug').innerHTML = 'No Geolocation :(';
	}
}

function showPosition(position) {
	console.log('Updated Position');

	document.getElementById('latlongdebug').innerHTML =
		'Lat: ' + position.coords.latitude + '<br />Long: ' + position.coords.longitude;

	var bcitLeft = -123.004656;
	// var bcitRight = -122.998273;
	var bcitRight = -122.996;
	var bcitTop = 49.254732;
	// var bcitBottom = 49.24295;
	var bcitBottom = 49.2432;

	var xWidth = bcitRight - bcitLeft;
	var yHeight = bcitTop - bcitBottom;

	var relLat = bcitTop - position.coords.latitude;
	var relLong = bcitRight - position.coords.longitude;

	var latPercent = relLat / xWidth * 100;
	var longPercent = relLat / yHeight * 100;

	document.getElementById('bcitsize').innerHTML = 'BCIT width: ' + xWidth + '<br />BCIT height: ' + yHeight;
	document.getElementById('relbcitloc').innerHTML = 'Relative width: ' + relLat + '<br />Relative height: ' + relLong;
	document.getElementById('relbcitlocpercent').innerHTML =
		'% width: ' + (100 - latPercent) + '<br />% height: ' + longPercent;

	var pos = document.getElementById('locationDot');
	pos.style.transform = 'translate(' + (100 - latPercent) + 'vw, ' + longPercent + 'vh)';
}
firebase.auth().onAuthStateChanged(function() {
	var user = firebase.auth().currentUser;
	//when user logs in, writes user name and email in Firestore
	if (user) {
		let userdb = db.collection('users');
		userID = user.uid;

		userdb.doc(user.uid).set({
			name: user.displayName,
			email: user.email
		});

		db.collection('users').doc(userID).get().then(function(doc) {
			document.getElementById('userName').innerHTML = doc.data().name;
		});
	} else {
		console.log('No user logged in');
	}
	//reads user current location stored in Firestore
});

//read: .get() , .onSnapshot()
//write: .set() , .update() , .create() , .add()

//write: search history and read: search history when user clicks on searchbar
//data-entry: building locations and read: building coordinates when user selects building

getLocation();
