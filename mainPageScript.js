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
		$('#historyDrop').empty();
		$('#historyDrop').css({ display: 'block' });
		db.collection('users').doc(userID).collection('history').doc('locations').get().then(function(data) {
			for (let i of data.data().location) {
				let para = $('<p>' + i + '</p>');
				$('#historyDrop').prepend(para.clone());
			}
		});
	}
	$('#historyDrop').on('click', (e) => {
		console.log(e.target.innerText);
		$('#locationInput').val(e.target.innerText);
		addHistoryData();
	});

	$('#locationInput').blur(async function(e) {
		//hack so that the button gets pressed before it goes away
		await sleep(100);
		$('#searchClick').css({ display: 'none' });
		$('#historyDrop').css({ display: 'none' });
	});
	$('#locationInput').keydown(function(e) {
		let keycode = e.keyCode ? e.keyCode : e.which;
		//if the enter key is pressed
		if (keycode == 13) {
			addHistoryData();
		}
	});
	$('#searchClick').click(function(e) {
		addHistoryData();
	});

	function addHistoryData() {
		let input = $('#locationInput');
		let snapData = [ 'emptyLocation' ];
		db
			.collection('users')
			.doc(userID)
			.collection('history')
			.doc('locations')
			.get()
			.then(function(snap) {
				//see if the location attribute exists
				try {
					//if it does, no problem
					snapData = snap.data()['location'];
				} catch (e) {
					//if it doesnt, the data will be correctly added in the next .then()
					console.log("location doc doesn't exist, adding in later");
				}
				//console.log(snapData);
			})
			.then(function() {
				if (userID && input.val() != '') {
					//if snapData has some new information in it
					if (snapData[0] != 'emptyLocation') {
						console.log('snapdata exists');
						let addedValue = false;
						//check to see if snapData already has this entry
						for (let i in snapData) {
							//if it does, remove it and re add it.
							if (snapData[i] == input.val()) {
								console.log('found value ' + i + ' already in the array');
								snapData.splice(i, 1);
								snapData.push(input.val());
								addedValue = true;
							}
						}
						if (!addedValue) {
							snapData.push(input.val());
						}
						//otherwise, clear snapdata and initialize it
					} else {
						console.log("array doesn't exist, initializing");
						snapData = [];
						snapData.push(input.val());
					}
					console.log('array before setting is ' + snapData);
					console.log('setting location');
					db
						.collection('users')
						.doc(userID)
						.collection('history')
						.doc('locations')
						.set({
							location: snapData
						})
						.then(console.log('Updated location'));
				} else {
					console.log('Not logged in or no input');
				}
				findBuilding();
			});

		function findBuilding() {
			db.collection('location').get().then((data) => {
				for (let i = 0; i < data.docs.length; i++) {
					if ($('#locationInput').val().toUpperCase() == data.docs[i].id) {
						db.collection('location').doc(data.docs[i].id).get().then((doc) => {
							console.log(doc.data());
						});
					}
				}
			});
		}
	}
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
	var bcitRight = -122.99;
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
		'% width: ' + latPercent + '<br />% height: ' + longPercent;

	var pos = document.getElementById('locationDot');
	pos.style.transform = 'translate(' + latPercent + 'vw, ' + longPercent + 'vh)';
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
