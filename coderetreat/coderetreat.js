function generateSession(data, sessionIndex){
	let luck = calculateLuck(data.sessions, sessionIndex);
	var guests = Array.from(new Array(data.nGuests).keys()).
		sort((a, b) => (luck[a]||(a/100)) - (luck[b]||(b/100))); // [0..nGuests) sorted by luck
	for(let leftGuest of data.leftGuests || []){
		let index = guests.indexOf(+leftGuest);
		if (index >= 0)
		{
			guests.splice(index, 1);
			console.log("remove left guest. len: " + guests.length);
		}
		else
			console.log("left guest " + leftGuest + " not found!");
	}
	var pastPairs = calculatePastPairs(data.sessions, sessionIndex);
	var pairs = {};
	var iTable = 0;
	while (iTable < data.nExperts){
		let guest = guests.shift();
		pairs[guest] = {table:iTable, pair:iTable, expert:true, luck: luck[guest]+1 || 1, history:formatHistory(pastPairs[guest])};
		iTable++;
	}
	while (guests.length > 1){
		let guest = guests.shift();
		let pair = extractRandomExcept(pastPairs[guest], guests);
		if (pair === null) return null;
		console.log("settled pair " + guest + " " + pair);
		pairs[guest] = {table:iTable, pair: pair, expert: false, luck: luck[guest] || 0, history:formatHistory(pastPairs[guest])};
		pairs[pair] = {table:iTable, pair: guest, expert: false, luck: luck[pair] || 0, history:formatHistory(pastPairs[pair])};
		iTable++;
	}
	if (guests.length > 0){
		let guest = guests.shift();
		pairs[guest] = {table:iTable, pair: -1, expert: true, luck: luck[guest]+1 || 1, history:formatHistory(pastPairs[guest])};
	}
	return pairs;
}

function formatHistory(pastPairs){
	return pastPairs === undefined ? "" : pastPairs.join();
}

function extractRandomExcept(restricted, items){
	for(let i = 0; i < 50; i++) {
		var index = Math.floor(Math.random()*items.length);
		var pair = items[index];
		if (!restricted || restricted.indexOf(pair) < 0) {
			items.splice(index, 1);
			return pair;
		}
	}
	return null;
}

function calculateLuck(sessions, currentSessionIndex){
	let luck = {};
	for(let iSession=0; iSession<currentSessionIndex; iSession++){
		var pairs = sessions[iSession].pairs
		for(let p in pairs){
			if (pairs[p].expert) luck[p] = luck[p] + 1 || 1;
		}
	}
	return luck;
}

function calculatePastPairs(sessions, currentSessionIndex){
	var res = {};
	for(let iSession=0; iSession<currentSessionIndex; iSession++){
		var pairs = sessions[iSession].pairs;
		for(let p in pairs){
			if (!res[p]) res[p] = [];
			if (!pairs[p].expert) {
				res[p].push(pairs[p].pair);
			}
			else
				res[p].push("expert " + pairs[p].pair);
		}
	}
	return res;
}