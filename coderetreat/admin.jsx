//var eventId = "201702-imkn";
//var eventId = "201711-shpora";
var eventId = "201802-kampus";
var ref = firebase.database().ref(eventId);

init();

function setSession(sessionIndex){
	ref.child("currentSessionIndex").set(sessionIndex);	
}

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
	var curSession = props.data.currentSessionIndex;
	var sessionsCount = 0;
	if (props.data.sessions)
		sessionsCount = props.data.sessions.length;
	return (<div className="container">
		<h1>Code Retreat {props.name}</h1>
		<div>nGuests: {props.data.nGuests}</div>
		<div>nExperts: {props.data.nExperts}</div>
		<div>nSessions: {sessionsCount}</div>
		<div>nLeftGuests: {(props.data.leftGuests || []).length}</div>
		<button onClick={() => onGenerateClick(props.data, sessionsCount)}>Generate session</button>
		<br/>
		<button className={"current-" + (curSession==0)} onClick={() => setSession(0)}>session=0</button>
		<button className={"current-" + (curSession==1)} onClick={() => setSession(1)}>session=1</button>
		<button className={"current-" + (curSession==2)} onClick={() => setSession(2)}>session=2</button>
		<button className={"current-" + (curSession==3)} onClick={() => setSession(3)}>session=3</button>
		<button className={"current-" + (curSession==4)} onClick={() => setSession(4)}>session=4</button>
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
	firebase.auth().signInWithPopup(provider).catch(function(e){console.log(e);}).then(function(){

		ref.on('value', function(sn){
			var data = sn.val();
			updateUI(sn.key, data);
		});
	
	});

}
