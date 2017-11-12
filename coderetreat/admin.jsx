//var eventId = "201702-imkn";
var eventId = "201711-shpora";
var ref = firebase.database().ref(eventId);

init();

function onGenerateClick(data, sessionIndex){
	var pairs = generateSession(data, sessionIndex);
	if (pairs){
		ref.child("sessions/" + sessionIndex + "/pairs").set(pairs);
	}
	else{
		alert("can't generate!");
	}
}

function Page(props){
	var sessionIndex = 0;
	if (props.data.sessions)
		sessionIndex = props.data.sessions.length;
	return (<div className="container">
		<h1>Code Retreat {props.name}</h1>
		<div>nGuests: {props.data.nGuests}</div>
		<div>nExperts: {props.data.nExperts}</div>
		<div>nSessions: {sessionIndex}</div>
		<div>nLeftGuests: {(props.data.leftGuests || []).length}</div>
		<input id="sessionIndex" value={sessionIndex} />
		<button onClick={() => onGenerateClick(props.data, sessionIndex)}>Generate session</button>
	</div>);
}

function updateUI(name, data){
	console.log(data);
	ReactDOM.render( 
		<Page name={name} data={data} />,
		document.getElementById("root")
	);
}

function init(){
	var provider = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(provider).catch(function(e){console.log(e);});

	ref.on('value', function(sn){
		var data = sn.val();
		updateUI(sn.key, data);
	});
}
