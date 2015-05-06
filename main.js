app = require('express.io')();
// server = require('http').createServer(app);  // server = added this BILL
sys = require('sys');
var io = require('socket.io'); //.listen(server);  // added .listen(server) BILL
express = require('express.io');
dbInfo = require('./dbInfo.js');
gameLogic = require('./gameLogic.js');

app.http().io();

var gCurrentGameStatus;  // start undefined

//This block of code connects the server to twitter, enabling authentication, and the reading and sending of tweets
var access_token = '1963524385-rRLDDxCvjtLDQvwDjY1ld4Qc1bl1ITwp23JC26B';
var access_token_secret = 'LFisePEFhOB662n4eA9y0PnClCg9lZ81jIDNec';
var OAuth = require('oauth').OAuth
  , oa = new OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      "B1Man4Ko0BwfXJS1zSi0g",
      "c0GHS1rxGzm3TVHJ1loHwFiiEpTXtAE31Vbm7PE0dFQ",
      "1.0A",
      "http://students.iam.colum.edu:8091/auth/twitter/callback",
      "HMAC-SHA1"
    );
	
//Web socket stuff
app.io.configure(function () {
    app.io.set("transports", ['websocket', 'xhr-polling', 'htmlfile', 'jsonp-polling', 'flashsocket']);
    app.io.set("polling duration", 5);
	app.set('views', __dirname + '\Pisces');
	//app.set('views', __dirname + '/views'); //BILL
	
	app.set('view engine', 'html');
	//app.use(express.logger());
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.session({ secret: 'neko' }));
	//app.use(express.static(__dirname, + '/public'));  // BILL added this
	app.use(app.router);
});

module.exports.app = app;

//Broadcasts messages to the client to play the sounds
app.io.on('connection', function (socket) {
    socket.emit('sound', 'sound');
});

//Broadcasts the user info to monoData
app.io.route('userDataLog', function (req) {
    dbInfo.playerModel.findOne({ name: req.data }, function (err, player) {
        if (err) { console.log(err) };
        try {
            req.io.emit('userUpdateLog', player);
        }
        catch (error) {
            console.log("userDataLog error " + error)
        }
    });
});
	
app.io.route('getAllPlayers', function (req) 
{
    dbInfo.playerModel.find({}, function (err, allUser)
	{
        req.io.emit('allPlayersContainer', { allPlayers: allUser });
        });
});

app.io.route('endOfRound', function (req) 
{
    if ( gameLogic.gSetup != true ) {
	console.log('#setup not called yet so counter is not valid yet ' + gameLogic.gSetup);
	return;
    }
    gameLogic.myCounter.stop();
    console.log('button triggered end of round update');
    gameLogic.endOfRoundUpdate();
    dbInfo.playerModel.find({}, function (err, allUser)
	{
        req.io.emit('allPlayersContainer', { allPlayers: allUser });
        });
});


app.io.route('gameCheck', function(req) {
	dbInfo.game.find({}, function (err, gameInstance)
	{
        req.io.emit('gameCheckResponse', { gameStatus: gameInstance.gameStatus });
        });

});
//Authenticate with Twitter, this posts the login to Twitter screen
app.get('/auth/twitter', function (req, res) {
    oa.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
        if (error) {
            console.log(error);
            res.send("yeah no. didn't work.")
            res.redirect("http://iam.colum.edu/PiscesGame/");
        }
        else {
			//var temp;
			//temp = JSON.parse(req);
			//console.log(temp);
			console.log(req + 'req sesion is' + req.session);
            req.session.oauth = {};
            req.session.oauth.token = oauth_token;
            console.log('oauth.token: ' + req.session.oauth.token);
            req.session.oauth.token_secret = oauth_token_secret;
            console.log('oauth.token_secret: ' + req.session.oauth.token_secret);
            res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)

        }
    });
});

//Receive callback from Twitter after Twitter login screen
app.get('/auth/twitter/callback', function (req, res, next) {
    // res is how to redirect html page
    if (req.session.oauth) {
        req.session.oauth.verifier = req.query.oauth_verifier;
        var oauth_data = req.session.oauth;

        oa.getOAuthAccessToken(oauth_data.token, oauth_data.token_secret, oauth_data.verifier,
          function (error, oauth_access_token, oauth_access_token_secret, results) {
              if (error) {
                  console.log('Error with getOAuthAccessToken ' + error);
                  res.send("Authentication Failure!");
              }
              else {
                  try {
                      req.session.oauth.access_token = oauth_access_token;
                      req.session.oauth.access_token_secret = oauth_access_token_secret;
                      userAccess = req.session.oauth.access_token;
                      userAccessSecret = req.session.oauth.access_token_secret;
                      console.log(results, req.session.oauth);
                      twitteruser = results["screen_name"];

                      // Process user
                      createPlayer(twitteruser);
                      oa.get("http://twitter.com/account/verify_credentials.json", req.session.oauthAccessToken, req.session.oauthAccessTokenSecret,
                       function (error, data, response) {
                           if (error) {
                               res.send("Error getting twitter screen name : " + sys.inspect(error), 500);
                           }
                           else {
                               req.session.twitterScreenName = data[screen_name];
                               console.log(req.session.twitterScreenName);
                               twitteruser = req.session.twitterScreenName;
                               res.send('You are signed in: ' + req.session.twitterScreenName);
                           }
                       });
                  }
                  catch (err) { console.log('Error with oa get credentials' + err); }
              }
              res.send("Authentication Successful");

              res.redirect('http://iam.colum.edu/PiscesGame/game.html'); // You might actually want to redirect!
              // Welcome Tweet
              sendTweet("@" + twitteruser + " Welcome to Pisces Game! ");
          })
    }
    else {
        //res.redirect('http://iam.colum.edu/PiscesGame/'); // Redirect to login page 
    }
});	
	
//Connects to the Twitter Stream tracking all tweets @PiscesGame
var request = oa.get("https://stream.twitter.com/1.1/statuses/filter.json?track=PiscesTheGame", access_token, access_token_secret);

request.addListener('response', function (response) {
    response.setEncoding('utf8');

    response.addListener('data', function (chunk) {
        console.log('Received a chunk of data sent to ' + chunk.user + ' from user: ' + chunk.text);
        // Send tweet to client to display MAYBE send text
        // DOES not work inside processData or processTweet
        app.io.sockets.emit('PiscesthegameTweet', chunk);

        console.log("Data Received in Twitter Streams");
        processData(chunk);
    });

    response.addListener('type', function (eventString) {
        console.log("Event at Piscesgame occurred: " + eventString);
    });

    response.addListener('region', function (regionString) {
        console.log("Event clicked on: " + regionString);
    });

    // xhr status BG 11/20 total hack Status 200 is ok
    response.addListener('status', function (error) {
        console.log("status Twitter Error: " + error);
    });

    // xhr readyState BG 11/20
    response.addListener('readyState', function (error) {
        console.log("readyState Twitter Error: " + error);
    });

    response.addListener('error', function (error) {
        console.log("Twitter Error: " + error);
    });

    response.addListener('end', function () {
        console.log('--- END ---');
        console.log(response.statusCode);
    });
});

request.end();

request.addListener('close', function () {
    console.log('The server has disconnected because it received a close command');
});

request.addListener('error', function (error) {
    console.log("Twitter Error " + error);
});

//Handles recieving data from the twitter streaming API
processData = function (myData) {
    console.log('data in processData is ' + myData);
    var crIndex = myData.indexOf('\r');
    var upToCR = myData.slice(0, crIndex);
    try {
        var pt = JSON.parse(upToCR); //when there is nothing to parse this will throw Unexpected end of input error
        console.log('pt after JSON.parse is ' + pt);
        processTweet(pt);
        console.log('tweet: ' + pt.text); //For testing purposes
    }
    catch (e) {
        console.log("ProcessData Error trying JSON.parse or processTweet: " + e.toString());
    }
};

//Twitter command object
var actionsInProgress = [
	{ tweetVerb: function () { tweetVerb() }, tweeter: "@tweeter", timeStarted: "timeStarted", timeLeft: "timeLeft" },
];

// Set up the ready route, and emit talk event.
app.io.route('list', function (req) {
    dbInfo.playerModel.findOne({ name: twitteruser }, function (err, users) {
        if (err) {
            console.log(err);
        }

        if (JSON.stringify(users) == "") {
            console.log(req + "IS NOT CONNECTED");
        }
        else {
            try {
                console.log(users);
                console.log(Object.getOwnPropertyNames(users));
                req.io.emit('listing', users); //returns a list of all users in the database
            }
            catch (error) {
                console.log('error emitting listing ' + error);
            }
        } // closing else
    }); // closing playerModel.findOne

}); // closing app.io.route

 

//Route to get the name of the authenticated user
app.io.route('user', function (req) {
    try {

        console.log('sending variable twitteruser to client ' + twitteruser);
        req.io.emit('name', twitteruser);

    }
    catch (err) {
        console.log('emitting name catch error is' + err);
    }
});

//Route for updating the users data	TODO: Method below should be called UpdatePlayer - not "save"
app.io.route('save', function (req) {
    try {
        console.log("This is req in a save: " + req.data);
        var updateInfo = req.data;
        dbInfo.playerModel.findOneAndUpdate({ name: twitteruser }, updateInfo, { upsert: true }, function (er, screen_name) { if (er) return handleError(er); return true; });  // added return true BG 11/20
    }
    catch (err) {
        console.log('updating users data error is' + err);
    }
});

//Route to receive context for the tweet - TODO: method below needs new name, maybe SendTweetForPlayer ?
app.io.route('tweet', function (req) {
    console.log(req.data);
    console.log(JSON.stringify(req.data));
    userSendTweet(req.data);
});

var commandUpdateInfo;

initPlayer = function(userName)
{
        var adminCheck = false;
    // default to adminCheck is false
    if (userName == "actionethics" || userName == "Awesome_Punch" || userName == "vinlasan" || userName == "seagertp" || userName == "mistagogue" || userName == "davidgerding")
	{ //admin command #setup>x>y x is for turns and y is time
        adminCheck = true;
	}

        var player = 	{
	    name: userName,
	    fishInPond: 0,
	    pondSize: 0,
	    totalFishInvestedInPond: 0,
	    boatSize: 12,
	    fishOnStringer: 0,
	    totalFishEaten: 0,
	    totalFishTaken: 0,
	    totalFishStolen: 0,
	    totalFishGiven: 0,
	    totalFishReceived: 0,
	    reputation: 0,
	    currentAction: 0,
	    guard: 0,
	    timeRemaining: 0,
	    fishFromLake: 0,
	    fishCommandTime: 0, // BG find time stamp of command
	    peopleStolenFrom: [],
	    villagePopulation: 0,
	    villageDeaths: 0,
	    isAdmin: adminCheck,
	    intendedFishCatch: 0 };

    switch(userName)
	    {
	case "actionethics":
	case "vinlasan":
	case "Awesome_Punch":
	case "seagertp":
	    // test single update - to be replaced by foreach ?
	    console.log('player is ' + userName + ' and should be one of the admins');
	    //player.name 
	    player.fishInPond=21;
	    player.pondSize=25;
	    player.totalFishInvestedInPond=11;
	    player.boatSize=20;
	    player.fishOnStringer=0;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=2;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "mistagogue":
	    // test single update - to be replaced by foreach ?
	    console.log('player is ' + userName + ' and should be mistagogue');
	    //player.name 
	    player.fishInPond=21;
	    player.pondSize=25;
	    player.totalFishInvestedInPond=11;
	    player.boatSize=20;
	    player.fishOnStringer=0;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=2;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    
	    break;
	case "AriesXSET":
	    // test single update - to be replaced by foreach ?
	    console.log('player is ' + userName + ' and should be Aries');
	    //player.name 
	    player.fishInPond=8;
	    player.pondSize=25;
	    player.totalFishInvestedInPond=11;
	    player.boatSize=20;
	    player.fishOnStringer=0;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=2;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;
	    
	    break;
	case "TaurusXSET":
	    console.log('player is ' + userName + ' and should be Taurus');
	    //player.name 
	    player.fishInPond=0;
	    player.pondSize=0;
	    player.totalFishInvestedInPond=0;
	    player.boatSize=15;
	    player.fishOnStringer=0;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "GeminiXSET":
	    console.log('player is ' + userName + ' and should be Gemini');
	    //player.name 
	    player.fishInPond=61;
	    player.pondSize=141;
	    player.totalFishInvestedInPond=16;
	    player.boatSize=18;
	    player.fishOnStringer=12;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	    case "CancerXSET":
		console.log('player is ' + userName + ' and should be Cancer');
	    //player.name 
	    player.fishInPond=12;
	    player.pondSize=18;
	    player.totalFishInvestedInPond=0;
	    player.boatSize=8;
	    player.fishOnStringer=12;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "LeoXSET":
	    console.log('player is ' + userName + ' and should be Leo');
	    //player.name 
	    player.fishInPond=0;
	    player.pondSize=29;
	    player.totalFishInvestedInPond=0;
	    player.boatSize=16;
	    player.fishOnStringer=12;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=1;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "VirgoXSET":
	    console.log('player is ' + userName + ' and should be Virgo');
	    //player.name 
	    player.fishInPond=0;
	    player.pondSize=0;
	    player.totalFishInvestedInPond=0;
	    player.boatSize=22;
	    player.fishOnStringer=6;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=1;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "LibraXSET":
	    console.log('player is ' + userName + ' and should be Libra');
	    //player.name 
	    player.fishInPond=0;
	    player.pondSize=0;
	    player.totalFishInvestedInPond=0;
	    player.boatSize=12;
	    player.fishOnStringer=4;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=2;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "ScorpioXSET":
	    console.log('player is ' + userName + ' and should be Scorpio');	    
	    //player.name 
	    player.fishInPond=17;
	    player.pondSize=81;
	    player.totalFishInvestedInPond=18;
	    player.boatSize=25;
	    player.fishOnStringer=0;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "SagittariusXSET":
	    console.log('player is ' + userName + ' and should be Sagittarius');
	    //player.name 
	    player.fishInPond=0;
	    player.pondSize=141;
	    player.totalFishInvestedInPond=31;
	    player.boatSize=2;
	    player.fishOnStringer=0;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=1;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "CapricornXSET":
	    console.log('player is ' + userName + ' and should be Capricorn');
	    //player.name 
	    player.fishInPond=15;
	    player.pondSize=120;
	    player.totalFishInvestedInPond=28;
	    player.boatSize=10;
	    player.fishOnStringer=0;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "AquariusXSET":
	    console.log('player is ' + userName + ' and should be Aquarius');
	    //player.name 
	    player.fishInPond=1;
	    player.pondSize=48;
	    player.totalFishInvestedInPond=12;
	    player.boatSize=2;
	    player.fishOnStringer=0;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	    break;
	case "PiscesXSET":
	    console.log('player is ' + userName + ' and should be Pisces');
	    //player.name = userName;
	    player.fishInPond=52;
	    player.pondSize=93;
	    player.totalFishInvestedInPond=22;
	    player.boatSize=32;
	    player.fishOnStringer=0;
	    player.totalFishEaten=0;
	    player.totalFishTaken=0;
	    player.totalFishStolen=0;
	    player.totalFishGiven=0;
	    player.totalFishReceived=0;
	    player.reputation=0;
	    player.currentAction=0;
	    player.guard=0;
	    player.timeRemaining=0;
	    player.fishFromLake=0;
	    player.fishCommandTime=0; // BG find time stamp of command
	    //peopleStolenFrom: [],
	    player.villagePopulation=0;
	    player.villageDeaths=0;
	    //isAdmin: adminCheck,
	    player.intendedFishCatch=0;

	break;
	default:
		console.log("some other user in create player " + player.name);
	break;
	    } // end switch
    return player;
}
module.exports.initPlayer = initPlayer;

updatePlayer = function(userName)
{
	var player = initPlayer(userName);
	console.log('initPlayer returned fishInPond of' + player.fishInPond);
	try {
		dbInfo.playerModel.findOneAndUpdate
		({ name: userName },
		{
			$set:
			{
				fishInPond: 	player.fishInPond,
				pondSize: 		player.pondSize,
				totalFishInvestedInPond: 	player.totalFishInvestedInPond,
				boatSize: 		player.boatSize,
				fishOnStringer: 	player.fishOnStringer,
				totalFishEaten:	player.totalFishEaten,
				totalFishTaken:    	player.totalFishTaken,
				totalFishStolen:	player.totalFishStolen,
				totalFishGiven:	player.totalFishGiven,
				totalFishRecieved: 	player.totalFishReceived,
				reputation:		player.reputation,
				currentAction:	player.currentAction,
				guard: 		player.guard,
				timeRemaining:    	player.timeRemaining,
				fishFromLake:    	player.fishFromLake,
				fishCommandTime:    player.fishCommandTime, // BG find time stamp of command
				peopleStolenFrom: 	[],
				villagePopulation: 	player.villagePopulation,
				villageDeaths:    	player.villageDeaths,
				isAdmin: 		player.isAdmin,
				intendedFishCatch: 	player.intendedFishCatch,
				
			}
	    },
	    function (er, thisUser)
	    {
			if (er) { console.log('giver update error ' + er); }
	    });
	}
	catch(err)
	{
		console.log(' updatePlayer() : update err is ' + err + ' and name is ' + userName + ' \n and player.fishInPond is ' + player.fishInPond);
	}
	return player;
}
module.exports.updatePlayer = updatePlayer;


    
//
//Check to see if the user exist in the database, if not, create the user
createPlayer = function (userName) {
    var returnPlayer = 0;
	    
    var player = initPlayer(userName);
    
    try
    {
	console.log("create " + userName);
	dbInfo.playerModel.create(
	{
	name: 				player.name,
	fishInPond: 			player.fishInPond,
	pondSize: 			player.pondSize,
	totalFishInvestedInPond: 	player.totalFishInvestedInPond,
	boatSize: 			player.boatSize,
	fishOnStringer: 		player.fishOnStringer,
	totalFishEaten: 		player.totalFishEaten,
	totalFishTaken: 		player.totalFishTaken,
	totalFishStolen: 		player.totalFishStolen,
	totalFishGiven: 		player.totalFishGiven,
	totalFishReceived: 		player.totalFishReceived,
	reputation: 			player.reputation,
	currentAction: 			player.currentAction,
	guard: 				player.guard,
	timeRemaining: 			player.timeRemaining,
	fishFromLake: 			player.fishFromLake,
	fishCommandTime: 		player.fishCommandTime, // BG find time stamp of command
	peopleStolenFrom: 		[],
	villagePopulation: 		player.villagePopulation,
	villageDeaths: 			player.villageDeaths,
	isAdmin: 			player.isAdmin,
	intendedFishCatch: 		player.intendedFishCatch
	},
	function (err, userR)
	{
	    returnPlayer = userR;
	    if (err)
	    {
		console.log("Create Error " + err);
	    }
	    console.log('2 player is in createPlayer ' + returnPlayer);
	}); // end dbInfo.playerModel.create
    }
    catch (err)
    {
        console.log('finding player by name in CreatePlayer has error ' + err);
    }
    return returnPlayer;
}
module.exports.createPlayer = createPlayer;

convertTwitterTime = function (timeToConvert) {

    var time = new Date(Date.parse(timeToConvert)).toLocaleTimeString();
    console.log("Converted Time: " + time);

    return time;
};
module.exports.convertTwitterTime = convertTwitterTime;

convertTwitterDate = function (tweetText) {
    var date = new Date(Date.parse(tweetText.replace(/( +)/, ' UTC$1')));
    console.log('Converted date is : ' + date);
    return date;
};
module.exports.convertTwitterDate = convertTwitterDate;


//Here we process the information received
processTweet = function (tweet)
{
    if (!tweet.text) {
        console.log('return since there is no text');
        return
    };
    //dbInfo.playerModel.findOneAndUpdate({name: tweet.user.screen_name}, {$push: { tweets: [{ content: tweet.text, date: tweet.created_at }]}}, function (er, screen_name) { if (er) return handleError(er) } );
    try {
        var tweeterName = tweet.user.screen_name;
        var time = convertTwitterTime(tweet.created_at);
        var date = convertTwitterDate(tweet.created_at);  // not sure if this right date format
        //This is our dispatch table or dictionary. Key value pair. All keys include hashtags in order to utilize twitter's trending functionality
        var pushDispatchTable =
        {
            //"#guardPond":	 function() { pushGuardPond(u,time,date); },
	    //Admin Database commands 
	    //"#clear": 		function () { gameLogic.clearDB(); },	   
 	    "#clear": 		function () { dbInfo.clearMyDB(); },	   
           "#create": 		function () { dbInfo.clearMyDB(); gameLogic.createDB(); },
	   "#update":		function () { gameLogic.updatePlayersDB(); },
			//Admin start condition commands
	    "#setup": 		function (Arg1, Arg2) { gameLogic.setupGame(tweeterName, Arg1, Arg2); }, // CALL FIRST #setup>3>1
	    "#villageSetup": 	function (Arg1, Arg2) { gameLogic.villagePop( Arg1, Arg2); }, //command for setting up the village CALL AFTER SETUP #villageSetup>3>@AriesXSET
            "#villagesetup": 	function (Arg1, Arg2) { gameLogic.villagePop( Arg1, Arg2); }, //command for setting up the village CALL AFTER SETUP #villageSetup>3>@AriesXSET
            //Admin game cycle commands
	    "#start": 		function () { gameLogic.startTheGame(); }, // CALL AFTER VILLAGESETUP
            "#pause": 		function () { gameLogic.pauseGame(); },
            "#resume": 		function () { gameLogic.resumeGame(); },
	    //User game actions
	    "#fish": 		function (Arg1) { gameLogic.pushFishing(tweeterName, Arg1, time, date); },
            "#fishing": 	function (Arg1) { gameLogic.pushFishing(tweeterName, Arg1, time, date); },
            "#buildboat": 	function (Arg1) { gameLogic.buildBoat(tweeterName, Arg1); },
            "#buildBoat": 	function (Arg1) { gameLogic.buildBoat(tweeterName, Arg1); },
            "#expandboat": 	function (Arg1) { gameLogic.buildBoat(tweeterName, Arg1); },
            "#expandBoat": 	function (Arg1) { gameLogic.buildBoat(tweeterName, Arg1); },
	    "#expandpond": 	function (Arg1) { gameLogic.expandPond(tweeterName, Arg1); },
            "#expandPond": 	function (Arg1) { gameLogic.expandPond(tweeterName, Arg1); },
            "#query": 		function (Arg1) { gameLogic.queryNow(tweeterName, Arg1); }, //TODO rename to getplayerstats
            "#give": 		function (Arg1, Arg2) { gameLogic.giveFish(tweeterName, Arg1, Arg2); },  // GIVE IS IMMEDIATE #give>4>@AriesXSET
             "#gift": 		function (Arg1, Arg2) { gameLogic.giveFish(tweeterName, Arg1, Arg2); },  // GIVE IS IMMEDIATE #give>4>@AriesXSET
             "#poach": 		function (Arg1, Arg2) { gameLogic.giveFish(tweeterName, Arg2, Arg1); },  // GIVE IS IMMEDIATE #give>4>@AriesXSET

            "#guard": 		function () { gameLogic.guardPond(tweeterName); },
             "#guardPond": 	function () { gameLogic.guardPond(tweeterName); },
             "#guardpond": 	function () { gameLogic.guardPond(tweeterName); },
           
            //"#reset": 		function () { gameLogic.initializePlayersAndGameStateInDB(); },
            	    
        };
        var tweetChunks = tweet.text;
        console.log('tweetChunks ' + tweetChunks);
        //split the string into tweetChunks by spaces (each word becomes an element in a new string array called tweetChunks)
        console.log('tweetChunks length is ' + tweetChunks.length);
        tweetChunks = tweetChunks.split(" ");
	// First chunk separated by commas is @piscesthegame
        if (tweetChunks[0] == '@Piscesthegame' || tweetChunks[0] == '@piscesthegame' || tweetChunks[0] == '@PiscesTheGame')
	{
        //console.log('we got a valid Tweet');
        }
	else
	{
	// CHECK 1st part of command is @Piscesthegame if not, then what?
	console.log('did you put an @ on your target twitter user?');
	return;
	}

        for (var i = 0; i < tweetChunks.length; i++)
	{
            if (i==0)
		console.log('There are ' + tweetChunks.length + ' chunks');
	    console.log('and Twitter Chunk ' + i + ' is ' + tweetChunks[i]);
        }

        // ASSUMES No spaces with commands, #fish > 12 will break it, don't know what to do to fix FIX
        // This if avoids that but is not elegant
	// ALSO will OK @piscesthegame #fish>4 asdfsafj SINCE we can support 2 spaces
        if (tweetChunks.length > 3) {
            console.log('too many commands');
	    sendTweet("@" + tweeterName + " Your command was inaccurate, did you send too many commands or words? ");
        }
        else {
	    // GRAB the COMMAND and ignore @Piscesthegame at tweetChunks[0]
            var tweetCommand = tweetChunks[1].split("&gt;");   // SPLIT command into 0, 1, or 2 parts

	    //This will hold the "function" from the command in the tweet. This is the key sent to pushDispatchTable. 
	    var tweetVerb=tweetCommand[0];
	    var tweetArg1=tweetCommand[1];
	    var tweetArg2=tweetCommand[2];
	    if (tweetVerb in pushDispatchTable )  // This is TRUE if it matches a function in dispatch table
            {
	    switch (tweetVerb)
	    {
		case "#guard":
		case "#start":
		case "#pause":
		case "#resume":
		//case "#reset":
		case "#clear":
		case "#create":
		case "#update":
		    pushDispatchTable[tweetVerb]();
		    break;
		case "#give":
		case "#gift":
		case "#poach":  // change this to it's own since #poach>1 should be changed to - number
		    console.log('give should have an @ for a team to give ' + tweetArg2.indexOf("@"));
		    if ((isNaN(tweetArg1)) || (tweetArg2.indexOf("@") != 0)) {
			console.log("invalid input");
		    }
		    else
		    {
			tweetArg1 = parseInt(tweetArg1);
			tweetArg2 = tweetArg2;
			console.log('checking if tweetArg2 is defined? ' + tweetArg2);
			pushDispatchTable[tweetVerb](tweetArg1, tweetArg2);
		    }
		    break;
		case "#setup":
		// Put code here to check if game is started
			if ((isNaN(tweetArg1)) || (isNaN(tweetArg2))) 
			{
			console.log("invalid input");
			console.log(tweetArg1);
			console.log(tweetArg2);
			}
			else 
			{
			tweetArg1 = parseInt(tweetArg1);
			tweetArg2 = parseInt(tweetArg2);
			console.log('tweetVerb in case setup is ' + tweetVerb);
			// Execute immediate
			pushDispatchTable[tweetVerb](tweetArg1, tweetArg2);
			console.log('arg1 for setup is ' + tweetArg1);
			console.log('arg2 for setup is ' + tweetArg2);
			
			// default game status is off 0, game pause -1 , 1 game ready waiting for villagesetup, 2 game ready waiting for start, 3 game under way
			// game is 1
			gCurrentGameStatus = 1;
			dbInfo.game.findOneAndUpdate({}, { $set: { gameStatus: gCurrentGameStatus } }, function (er, gameToken) { if (er) { console.log('setting game status error is ' +  er) } });
			console.log('finished case of setup');
			}
		break;
		case "#villageSetup":
		case "#villagesetup":
		    if ((isNaN(tweetArg1)) || (tweetArg2.indexOf("@") != 0)) {
			console.log("invalid input");
			console.log(tweetArg1);
			console.log(tweetArg2);
		    }
		    else
		    {
			tweetArg1 = parseInt(tweetArg1);
			tweetArg2 = tweetArg2;
			pushDispatchTable[tweetVerb](tweetArg1, tweetArg2);
		    }
		    // default game status is off 0, game pause -1 , 1 game ready waiting for villagesetup, 2 game ready waiting for start, 3 game under way
		    gCurrentGameStatus = 2;
		    dbInfo.game.findOneAndUpdate({}, { $set: { gameStatus: gCurrentGameStatus } }, function (er, gameToken) { if (er) { console.log(er) } });
		    break;
		case "#query":
		    tweetArg1 = tweetArg1;  // Arg1 is not a number
		    pushDispatchTable[tweetVerb](tweetArg1);
		    break;
		case "#expandpond":
		case "#expandPond":
		    try {
			tweetArg1 = parseInt(tweetArg1);
			console.log('the argument of ' + tweetCommand[0] + ' is ' + tweetArg1);
			pushDispatchTable[tweetVerb](tweetArg1);
		    }
		    catch (err) {
			console.log('argument to expandPond is not a number ' + tweetArg1 + 'error is ' + err);
		    }
		    break;
		case "#buildboat":
		case "#buildBoat":
		case "#expandBoat":
		case "#expandboat":
		    try {
			tweetArg1 = parseInt(tweetArg1);
			console.log('the argument of ' + tweetCommand[0] + ' is ' + tweetArg1);
			pushDispatchTable[tweetVerb](tweetArg1);
		    }
		    catch (err) {
			console.log('argument to buildBoat is not a number ' + tweetArg1 + 'error is ' + err);
		    }
		    break;
		case "#fish":
		case "#fishing":
		    try {
			tweetArg1 = parseInt(tweetArg1);
			console.log('the argument of command' + tweetCommand[0] + 'is' + tweetArg1);
			pushDispatchTable[tweetVerb](tweetArg1);
		    }
		    catch (err) {
			console.log('argument to fish is not a number ' + tweetArg1 + 'error is ' + err);
		    }
		    break;
		default:
		    console.log('hit default with tweetCommand[0] being ' + tweetCommand[0]);
		    break;
                } // END SWITCH
            }  // end if in push dispatch table
            else
	    {
		sendTweet("@" + tweeterName + " Your command was inaccurate, did you leave a # out? Add an extra chunk? ");
                console.log("tweetCommand[0] is " + tweetCommand[0] + " and did not hit dispatch table");
            }
        } // END ELSE COMMAND has at most 3 parts
		
	gameLogic.sendUpdateOfPlayers();
	console.log('finished sendUpdateOfPlayers');
		
    } // end try
    catch (e)
    {
        console.log("Spencer Tweet Parser Error: " + e.toString() + "\n tweetVerb is " + tweetCommand[0] + ' arg 1 is ' + tweetArg1 + ' arg 2 is ' + tweetArg2);
    }
} // end ProcessTweet

//The server's internal counter, added to the end of server generated tweets to avoid duplicates
var tweetIndex = 0;
//Using the oauth post to send a new tweet to the user
sendTweet = function (contentOfTweet) {
    //Adds a tweet counter that affixes the total number of tweets since the start of the server to prevent duplicate tweets not being sent.
    //Essentially, this will trick twitter into sending the same information as much as we want by adding something like ("\n\nTweet ID: " + var totalTweetsSent)
    tweetIndex++;

    oa.post("https://api.twitter.com/1.1/statuses/update.json ",
        access_token, access_token_secret, { "status": (contentOfTweet + "\n\n Tweet_ID: " + tweetIndex) },
        function (error, data) {
            if (error)
                console.log(require('sys').inspect(error));
            else
                console.log("Tweet Sent by @PiscesTheGame and Content is " + contentOfTweet);
        }
    );
};
module.exports.sendTweet = sendTweet;

//This function uses the twitter API to send tweets on the user's behalf
userSendTweet = function (status) {
    console.log('userSendTweet:send tweet caller is: ' + userSendTweet.caller);

    oa.post("https://api.twitter.com/1.1/statuses/update.json",
        userAccess, userAccessSecret, { "status": status },
        function (error, data) {
            if (error)
                console.log(require('sys').inspect(error));
            else
                console.log("User Tweet Sent");
        }
    );
};
module.exports.userSendTweet = userSendTweet;


app.io.sockets.on('bill', function () {
    console.log("bill was received from results.html");
});

app.io.sockets.on('requestGameState', function () {
    gameLogic.sendUpdateOfGameState();
    console.log("gameCheck was received from game.html");
    app.io.sockets.emit('gameStatus', gCurrentGameStatus);  // send back game status
});

app.listen(8091)