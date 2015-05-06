dbInfo = require('./dbInfo.js');
main = require('./main.js');

var endOfRoundInterval = -1;
//var updatePlayersInterval=-1;
//var gEorTimer = -1; // End of Round Timer
var gGameStartTime=0;
var gTimeRemaining = -1;

//Lake Information
var gCurrentFishInLake = 300;
var lakeCapacity = 600;
var growthRate = 0.3;
var decayRate = 0.3;
var gSendTweets = false;  // TURN off tweets for daily limit
var gameStateEnum = Object.freeze(
    {
    "pause":-1,
    "over":0,
    "waitOnVillage":1,
    "waitOnStart":2,
    "on":3,
    });

var gSetup=false;

var myCounter = 0;

var gNumberOfRounds; //Number of turns until the game ends
var gCurrentRound; //The turn that the game is currently on
var gRoundTimeInMilliseconds; //SET by the admin. This is the time used to determine the length of each turn in real time
gRoundTimeInMilliseconds = 60000; //By default, turnTime is set to 100 seconds
gCurrentRound = 0;
gNumberOfRounds = -1;

var gAries = null;
var gTaurus = null;
var gGemini = null;
var gCancer = null;
var gLeo = null;
var gVirgo = null;
var gLibra = null;
var gScorpio = null;
var gSagittarius = null;
var gCapricorn = null;
var gAquarius = null;
var gPisces = null;
var gActionethics = null;
var gSeagertp = null;
var gMistagogue = null;
var gDavidgerding = null;
var gVinlasan = null;

//This array holds userCommands (see 315) on update, this array is run through to see if any of the userCommands are ready to execute
var gActionsArray = new Array();

//This object holds the name of a command, the arguments, the name of the user who initiated the command,
//the time at which the command was added to the list, and the time at which the command will execute
userCommand = function (action, arg1, arg2, username, timeStart, timeRemaining, actionTime, actionDate) {
    this.action = action;
    this.arg1 = arg1;
    this.arg2 = arg2;
    this.username = username;
    this.timeStart = timeStart;
    this.timeRemaining = timeRemaining;
    this.actionTime = actionTime;
    this.actionDate = actionDate;
};
module.exports.userCommand = userCommand;

updatePlayersDB = function()
{
    gAries = main.updatePlayer('AriesXSET');
    //console.log('Aries name is ' + gAries.name);
    gTaurus = main.updatePlayer('TaurusXSET');
    gGemini = main.updatePlayer('GeminiXSET');
    gCancer = main.updatePlayer('CancerXSET');
    gLeo = main.updatePlayer('LeoXSET');
    gVirgo = main.updatePlayer('VirgoXSET');
    gLibra = main.updatePlayer('LibraXSET');
    gScorpio = main.updatePlayer('ScorpioXSET');
    gSagittarius = main.updatePlayer('SagittariusXSET');
    gCapricorn = main.updatePlayer('CapricornXSET');
    gAquarius = main.updatePlayer('AquariusXSET');
    gPisces = main.updatePlayer('PiscesXSET');
    gActionethics = main.updatePlayer('Actionethics');
    gSeagertp = main.updatePlayer('seagertp');
    gMistagogue = main.updatePlayer('mistagogue');
    gDavidgerding = main.updatePlayer('davidgerding');
    gVinlasan = main.updatePlayer('vinlasan');
    gAwesome_Punch = main.updatePlayer('Awesome_Punch');
}
module.exports.updatePlayersDB = updatePlayersDB;

createDB = function() {
    gAries = main.createPlayer('AriesXSET');
    //console.log('Aries name is ' + gAries.name);
    gTaurus = main.createPlayer('TaurusXSET');
    gGemini = main.createPlayer('GeminiXSET');
    gCancer = main.createPlayer('CancerXSET');
    gLeo = main.createPlayer('LeoXSET');
    gVirgo = main.createPlayer('VirgoXSET');
    gLibra = main.createPlayer('LibraXSET');
    gScorpio = main.createPlayer('ScorpioXSET');
    gSagittarius = main.createPlayer('SagittariusXSET');
    gCapricorn = main.createPlayer('CapricornXSET');
    gAquarius = main.createPlayer('AquariusXSET');
    gPisces = main.createPlayer('PiscesXSET');
    gActionethics = main.createPlayer('Actionethics');
    gSeagertp = main.createPlayer('seagertp');
    gMistagogue = main.createPlayer('mistagogue');
    gDavidgerding = main.createPlayer('davidgerding');
    gVinlasan = main.createPlayer('vinlasan');
    gAwesome_Punch = main.createPlayer('Awesome_Punch');
	
    dbInfo.game.create( {   name: "gameMoFo",
    creationDate: 0,
    startDate: 0,  // the datetime when game play first commenced against this object
    lastPauseDate: 0, // the last 
    lastResumeDate: 0, // the last
    gameStatus: gameStateEnum.over
	}, function(err, gameInstance) {} );
}
module.exports.createDB = createDB;

clearDB = function() {
    dbInfo.playerModel.find({}).remove(); 
	//TODO Remove game entities
    console.log('DB cleared');
}
module.exports.clearDB = clearDB;

initializePlayersAndGameStateInDB = function () {
    dbInfo.playerModel.find({}, function (err, allUser) {
        // reset timers
        // clear users
        for (i = 0; i < allUser.length; i++) {
            dbInfo.playerModel.findOneAndUpdate(
                { name: allUser[i].name },
                {
                    $set:
                       {
                           name: allUser[i].name,
                           fishInPond: 20,
                           pondSize: 40,
                            totalFishInvestedInPond: 40,
                            boatSize: 12,
                           fishOnStringer: 16,
			   totalFishEaten: 0,
                           totalFishTaken: 0,
                           totalFishStolen: 0,
                           totalFishGiven: 0,
                           totalFishReceived: 0,
                           //roundsSurvived: 0,
                           reputation: 0,
                           currentAction: 0,
                           guard: 0,
                           timeRemaining: 0,
                            fishFromLake: 0,
                           fishCommandTime: 0,
                           peopleStolenFrom: [],
                           villagePopulation: 0,
			   villageDeaths: 0,
                           isAdmin: false,
                           intendedFishCatch: 0
                        }
                },
                function (er, screen_name) {
                    if (er) { console.log(er) }
                });
        } // end for

    });  // end user find
    
    
    gCurrentFishInLake = 300; // fixed bug currrentFish BG 11/20

    console.log("End of Game Reset");
};
module.exports.initializePlayersAndGameStateInDB = initializePlayersAndGameStateInDB;


pauseGame = function () {
    myCounter.pause();
    //gEorTimer.pause();
    // default game status is off 0, game pause -1 , 1 game ready waiting for villagesetup, 2 game ready waiting for start, 3 game under way
    dbInfo.game.findOneAndUpdate({}, { $set: { gameStatus: gameStateEnum.pause } }, function (er, gameToken) { if (er) { console.log(er) } });

        main.app.io.sockets.emit('gameStatus', gameStateEnum.pause);

    main.app.io.sockets.emit('pauseMusic', 2);

    console.log('paused Timers');
}
module.exports.pauseGame = pauseGame;

resumeGame = function () {
    myCounter.resume();
    //gEorTimer.resume();
    //updatePlayersTimer.resume();

        main.app.io.sockets.emit('gameStatus', gameStateEnum.on);
    main.app.io.sockets.emit('playMusic', 1);
    // default game status is off 0, game pause -1 , 1 game ready waiting for villagesetup, 2 game ready waiting for start, 3 game under way
    dbInfo.game.findOneAndUpdate({}, { $set: { gameStatus: gameStateEnum.on } }, function (er, gameToken) { if (er) { console.log(er) } });
}
module.exports.resumeGame = resumeGame;

sendUpdateOfPlayers = function()
{
dbInfo.playerModel.find({}, function (err, allUser)
 {
    main.app.io.sockets.emit('allPlayersContainer', { allPlayers: allUser });
 });
}
module.exports.sendUpdateOfPlayers = sendUpdateOfPlayers;

sendUpdateOfGameState = function () {
    try{
    main.app.io.sockets.emit('currentRound', gCurrentRound);
    main.app.io.sockets.emit('numberOfRounds', gNumberOfRounds);
    main.app.io.sockets.emit('timePerRound', (gRoundTimeInMilliseconds/1000)/60);

    main.app.io.sockets.emit('fishInLake', gCurrentFishInLake);
    main.app.io.sockets.emit('capacity', lakeCapacity);
    }
    catch(err)
{
    console.log("error in sendUpdateOfGameState part 1 " + err);
}

    try{

        // default game status is off 0, game pause -1 , 1 game ready waiting for villagesetup, 2 game ready waiting for start, 3 game under way
    dbInfo.game.findOne({}, function (er, gameInstance)
    {
        if (er) { console.log(er) }
		
        main.app.io.sockets.emit('gameStatus', gameInstance.gameStatus);
    });

 
    dbInfo.playerModel.find({}, function (err, allUser) {
        for (i = 0; i < allUser.length; i++) {
            if (gSendTweets) {
                main.sendTweet("@" + allUser[i].name + "Your fish in pond is " + allUser[i].fishInPond +
                      allUser[i].fishInPond);
            }
            else  // send to web site
            {
                main.app.io.sockets.emit('fishInPond', allUser[i].fishInPond);
            }
        }
    });
   }
    catch(err)
{
    console.log("error in sendUpdateOfGameState part 2 " + err);
}

try
{
    main.app.io.sockets.emit('growthRate', growthRate);
    main.app.io.sockets.emit('decayRate', decayRate);
    var playMusic = 1;
    main.app.io.sockets.emit('playMusic', playMusic);
}
    catch(err)
{
    console.log("error in sendUpdateOfGameState part 3 " + err);
}

    console.log('finished sendUpdateToScoreboard part 4');
}
module.exports.sendUpdateOfGameState = sendUpdateOfGameState;

lakeReproduction = function () {
    gCurrentFishInLake += Math.floor(0.3 * (gCurrentFishInLake) * (1 - ((gCurrentFishInLake - 3) / (lakeCapacity - 3))));
    if (gCurrentFishInLake > 600) {
        gCurrentFishInLake = 600;
    }
}
module.exports.lakeReproduction = lakeReproduction;

pondReproduction = function () {
    console.log("pond reproduction");
    dbInfo.playerModel.find({}, function (err, allUser) {
        for (var i = 0; i < allUser.length; i++) {

            var updatedFishInPond = allUser[i].fishInPond * 1.3;

            if (updatedFishInPond > allUser[i].pondSize) updatedFishInPond = allUser[i].pondSize;  // CLIP to pondSize
            dbInfo.playerModel.findOneAndUpdate({ name: allUser[i].name }, { $set: { fishInPond: updatedFishInPond } }, function (er, screen_name) { if (er) { console.log(er) } });
        }
    });

}
module.exports.pondReproduction = pondReproduction;


endOfRoundUpdate = function ()
{
    gCurrentRound = gCurrentRound + 1;  // Increment current round which we check at bottom
    
	// 1 POND REPRODUCTION
	console.log('1 pondReproduction');
	pondReproduction();
	
	// 2 Subtract catch from lake
	console.log('2 catchFishReproduction');
	catchFishFromLakeByExecutingFishQueue();  // put intendedFishCatch into Boat, set intendedFishCatch to 0
	
	// 3 LAKE REPRODUCTION CODE
	console.log('3 lakeRepro');
       lakeReproduction();
       
	// 4 Fish Transfer per User
	console.log('4 stockPond');
	stockPondFromStringer();  // move fish From Boat to Stringer to Pond
	
	 
	// 5 Fish eat per user AND or dying
	console.log('5 eat fish and die');
	villagersEatFishAndSomeDie();
       
	console.log('current round is ' + gCurrentRound);
    
	console.log('6 sendUpdate of players');
	sendUpdateOfPlayers();
	sendUpdateOfGameState();
}; // end update function
module.exports.endOfRoundUpdate = endOfRoundUpdate;

catchFishFromLakeByExecutingFishQueue = function () {
    // Go thru actions in the queue which should only be fishing
    for (var i = 0; i < gActionsArray.length; i++) {
        console.log('size of gActionsArray is ' + gActionsArray.length);
        switch (gActionsArray[i].action) {
            case "#fishing":
                console.log(gActionsArray[i].username + ' added to fish queue with ' + gActionsArray[i].arg1 + ' fish');
                fishing(gActionsArray[i].username, gActionsArray[i].arg1, gActionsArray[i].actionTime, gActionsArray[i].actionDate, i);
                break;
            default:
                console.log("Command other than #fishing in Actions Array, it is: " + gActionsArray[i].action);
                break;
        }
    }
} // end executeFishCommandsInQueue()
module.exports.catchFishFromLakeByExecutingFishQueue = catchFishFromLakeByExecutingFishQueue;

//Push a new instance of userCommand with the name "#fishing" to gActionsArray
pushFishing = function (tweeterName, fishToCatch, actionTime, actionDate) {
    try {
        //intendedFishCatch
        console.log('intended fish to catch ' + fishToCatch);
        dbInfo.playerModel.findOneAndUpdate({ name: tweeterName }, { $set: { intendedFishCatch: fishToCatch } }, function (er, screen_name)
            {
            if (er) { console.log(er) }
            });
       //  Send data update to client
        sendUpdateOfPlayers();
        deleteAction(tweeterName, "#fishing"); // get rid of old fish command
        gActionsArray.push(new userCommand("#fishing", fishToCatch, 0, tweeterName, Date.now(), Date.now() + (10000 + (1000 * fishToCatch)), actionTime, actionDate));
        // oldest command is at 0, newest command is at end of array
    }
    catch (err) {
        console.log(err);
    }
};
module.exports.pushFishing = pushFishing;

fishing = function (screenName, intendedFishCatch, actionTime, actionDate, actionArrayIndex) {
    var fishCaught = 0; // use this variable to track actual fish caught vs intended fish catch
    console.log('amount to fish is ' + intendedFishCatch);
    dbInfo.playerModel.findOne({ name: screenName }, function (err, thisUser) {
        // If number of fish is bigger than boatSize CAP it to boatSize
        if (intendedFishCatch > thisUser.boatSize) {
            fishCaught = thisUser.boatSize;  // fishCaught capped to boat Size
        }

        //If there are ENOUGH fish in the lake for the user to fish, or not.
        if (gCurrentFishInLake < intendedFishCatch) {
            fishCaught = gCurrentFishInLake; // fishCaught capped to amount in lake
            gCurrentFishInLake = 0; // can't have negative fish BG
        }
        else {
            fishCaught = intendedFishCatch; // fishCaught is intendedFishCatch
            console.log(' subtracting ' + fishCaught + ' from lake');
            gCurrentFishInLake -= fishCaught;
        }
        
        // Increase the tweeter's fish in boat by the Argument AND set intended fish catch to 0
        dbInfo.playerModel.findOneAndUpdate({ name: screenName }, { $set: { fishOnStringer: fishCaught, intendedFishCatch: 0 } }, function (er, screen_name) { if (er) { console.log(er) } });
        sendUpdateOfPlayers();
        //commandUpdateInfo = "@" + tweeter + " just fished and caught " + amountToFish + " fish!\n";
        //main.app.io.sockets.emit('recentCommandInfo', commandUpdateInfo);
    });

    gActionsArray.splice(actionArrayIndex, 1);
    //main.app.io.broadcast('sound', 'sound');	
    //attempt to play the sound on fishing
    
    main.sendTweet("@" + screenName + " your intention to fish for " + intendedFishCatch + " fishes will occur at end of round ");

}
module.exports.fishing = fishing;


gameOver = function () {
    // default game status is off 0, game pause -1 , 1 game ready waiting for villagesetup, 2 game ready waiting for start, 3 game under way
    dbInfo.game.findOneAndUpdate({}, { $set: { gameStatus: gameStateEnum.over } }, function (er, gameToken) { if (er) { console.log(er) } });

    // end of round timer to stop
    myCounter.stop();
    //gEorTimer.pause();

    //pause update players 
    // updatePlayersTimer.pause();

    sendUpdateOfGameState(); // update game status

    //Game ends. After Action Report
    console.log("GAME OVER ");
}
module.exports.gameOver= gameOver;

villageCheck = function (villageName) {
    dbInfo.playerModel.findOne({ name: villageName }, function (err, thisUser) {
        if (thisUser.villagePopulation < 0) {
            return villageSetup = false;
        }
        else return villageSetup = true;
    });
}
module.exports.villageCheck = villageCheck;

//This function performs mathematical calculations to simulate changes in the lake's population, and then sends the updated f to all clients
villagersEatFishAndSomeDie = function ()
{
   var query =  dbInfo.playerModel.find({});
   var promise = query.exec();
        // Update database with fish on boat, string, and pond as COST PER ROUND
   var query2 = dbInfo.playerModel.findOneAndUpdate
    (
	{ name: allUser[i].name },
	{
	$set:
	    {
	    fishOnStringer: 	newNumberOfFishOnStringer,
	    totalFishEaten: 	newTotalEaten,
	    fishInPond: 	newNumberOfFishInPond,
	    villagePopulation: 	vPop,
	    villageDeaths: 	newVDead
	    }
	});

    promise.then( function (allUser)
    {
    var vPop, vDead = 0;
    var pondFishHarvested=0, stringerFishHarvested=0;
    var newNumberOfFishOnStringer=0, newNumberOfFishInPond = 0;

    for (i = 0; i < allUser.length; i++)
    {
    var eatAmountRequired = 4 * allUser[i].villagePopulation; // this number needs to be updated to n * villagers
    pondFishHarvested = TryHarvest(eatAmountRequired, allUser[i].fishInPond);
    var fishRemainingToGet = eatAmountRequired - pondFishHarvested;
    if (fishRemainingToGet > 0)
	{
	stringerFishHarvested = TryHarvest(fishRemainingToGet, allUser[i].fishOnStringer); 
	}
    var availableToBeEaten = pondFishHarvested + stringerFishHarvested;
    if (availableToBeEaten < eatAmountRequired)
	{
	    main.sendTweet('@' + allUser[i] + ' does not have ' + eatAmountRequired + ' fish on their stringer or in their pond. Used ' + availableToBeEaten + ' fish instead. 0 Fish remaining.');
	}

    newNumberOfFishOnStringer = allUser[i].fishOnStringer - stringerFishHarvested;
    newNumberOfFishInPond = allUser[i].fishInPond - pondFishHarvested;
    
    if (availableToBeEaten < eatAmountRequired)
    { // TIME TO Kill users
	vPop = allUser[i].villagePopulation;
	var missingFish = eatAmountRequired - availableToBeEaten;
	vDead = Math.floor(missingFish / 4);
	main.sendTweet("@" + allUser[i].name + "Your villager(s) died and the number is " + vDead); 
	vPop = vPop - vDead;  // Kill off in multiples 4, 1 kill per 4 fish
    }
    var newVDead = allUser[i].villageDeaths + vDead;
    var newTotalEaten = allUser[i].totalFishEaten + availableToBeEaten;
    }  // end for
    query2.exec();
    });  // end promise then   
};
module.exports.villagersEatFishAndSomeDie = villagersEatFishAndSomeDie;

//Functions for pushing a new user command to the list
//TODO: add code to push objects to list
//Console.log("Guards the pond if the player attacks it");
pushGuardPond = function (tweeter) {
    gActionsArray.push(new userCommand("#guard", 0, 0, tweeter.user.screen_name, 1, 1, 0, 0));
};
module.exports.pushGuardPond = pushGuardPond;

//Push a new instance of userCommand with the name "#query" to gActionsArray
queryNow = function (tweeterName, whomToQuery) {
    try {
        //remove the first character of the username (which should be "@")
        var slicedNameOfWhomToQuery = whomToQuery.slice(1);
        console.log("SLICED NAME: " + slicedNameOfWhomToQuery);
        //If the user has not signed in and authenticated
        if (tweeterName == null) {
            if (gSendTweets) {
                main.sendTweet("@" + tweeterName + " You must first sign in here http://iam.colum.edu/PiscesGame/ to send commands");
            }
            else {
                console.log('put on website that tweeter needs to authenticate first');
                }
        }
        else {
            try {
                //find the user in the database, and send a tweet to that user containing their stats
                dbInfo.playerModel.findOne({ name: slicedNameOfWhomToQuery }, function (err, thisUser) {
                    if (thisUser != null) {
                        console.log("-----\n" + thisUser + "\n-----");
                        main.sendTweet("@" + thisUser.name
                                       + "'s stats: \nPrivate Pond Capacity: "
				       + thisUser.pondSize
				       + " \nFish In Pond: "
                                       + thisUser.fishInPond
                                       + " \nBoat Size: "
                                       + thisUser.boatSize 
                                       + "\nFish On Stringer: "
                                       + thisUser.fishOnStringer
                                       + "\nFish In Lake: "
                                       + gCurrentFishInLake);
                    }
                });
            }
            catch (e) {
                console.log("Query Error: " + e);
            }
        }
    }
    catch (err) {
        console.Log("queryNow Error: " + err);
    }
};
module.exports.queryNow = queryNow;

startTheGame = function () {

    //gEorTimer.resume();
   // console.log('start gEorTimer in startTheGame');
    myCounter.start();

    // default game status is off 0, game pause -1 , 1 game ready waiting for villagesetup, 2 game ready waiting for start, 3 game under way
    // game under way 3
    dbInfo.game.findOneAndUpdate({}, { $set: { gameStatus: gameStateEnum.on } }, function (er, gameToken) { if (er) { console.log(er) } });

    sendUpdateOfGameState();
}
module.exports.startTheGame = startTheGame;


pushExpandBoat = function (tweeter, Arg1, actionTime, actionDate) {
    villageCheck(tweeter.user.screen_name);
    if (villageSetup) {
        try {
            dbInfo.playerModel.findOne({ name: tweeter.user.screen_name }, function (err, thisUser) {
                //If the user has not signed in and authenticated
                if (thisUser == null) {
                    main.sendTweet("@" + tweeter.name + "You must first sign in here http://iam.colum.edu/PiscesGame/ to send commands");
                }
                else {
                    if (thisUser.currentAction == 0 || thisUser.currentAction == 4) {
                        dbInfo.playerModel.findOneAndUpdate({ name: tweeter.user.screen_name }, { $set: { currentAction: 2, timeRemaining: Date.now() + (10000 + (1000 * Arg1)) } }, function (er, screen_name) { if (er) { console.log(er) } });
                        gActionsArray.push(new userCommand("#buildBoat", Arg1, 0, tweeter.user.screen_name, Date.now(), Date.now() + (2000 * Arg1), actionTime, actionDate));
                    }
                    else {
                        //user.findOneAndUpdate({name: tweeter}, {$set: {currentAction: 2}}, function (er, screen_name) { if (er){console.log(er)}  } );
                        //gActionsArray.push(new userCommand("#buildBoat", Arg1, 0, tweeter.user.screen_name, 1, 1));
                    }
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    }
    else main.sendTweet("@" + tweeter.name + "You must first setup up your village population using the #villageSetup command to send commands");
};
module.exports.pushExpandBoat = pushExpandBoat;

villagePop = function ( populationOfVillage, villageName) {
    try
    {
    var villageNameDBName = villageName.slice(1);
    dbInfo.playerModel.findOneAndUpdate({ name: villageNameDBName }, { $set: { villagePopulation: populationOfVillage } },
                      function (er, screen_name) { if (er) { console.log(er) } });

    // default game status is off 0, game pause -1 , 1 game ready waiting for villagesetup, 2 game ready waiting for start, 3 game under way
    // waiting for start 2
    dbInfo.game.findOneAndUpdate({}, { $set: { gameStatus: gameStateEnum.waitOnStart } }, function (er, gameToken) { if (er) { console.log(er) } });
    sendUpdateOfGameState(); // Update scoreboard
	sendUpdateOfPlayers(); //Update HTML
    }
    catch(err)
    {
        console.log("villagePop catch is " + err);
    }
}
module.exports.villagePop = villagePop;


//Push a new instance of userCommand with the name "#expandPond" to gActionsArray
//Console.log("Uses to expand pond of the game.")
pushExpandPond = function (tweeter, Arg1, actionTime, actionDate) {
    villageCheck(tweeter.user.screen_name);
    if (villageSetup) {
        try {
            dbInfo.playerModel.findOne({ name: tweeter.user.screen_name }, function (err, thisUser) {
                //If the user has not signed in and authenticated
                if (thisUser == null) {
                    main.sendTweet("@" + tweeter.name + "You must first sign in here http://iam.colum.edu/PiscesGame/ to send commands");
                }
                else {
                    if (thisUser.currentAction == 0 || thisUser.currentAction == 4) {
                        dbInfo.playerModel.findOneAndUpdate({ name: tweeter.user.screen_name }, { $set: { currentAction: 3, timeRemaining: Date.now() + (10000 + (1000 * Arg1)) } }, function (er, screen_name) { if (er) { console.log(er) } });
                        gActionsArray.push(new userCommand("#expandPond", Arg1, 0, tweeter.user.screen_name, Date.now(), Date.now() + (2000 * Arg1), actionTime, actionDate));
                    }
                    else {
                        //dbInfo.playerModel.findOneAndUpdate({name: tweeter.user.screen_name}, {$set: {currentAction: 3}}, function (er, screen_name) { if (er){console.log(er)}  } );
                        //gActionsArray.push(new userCommand("#expandPond", Arg1, 0, tweeter.user.screen_name, Date.now(), Date.now() + (2000 * Arg1)));
                    }
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    }
    else main.sendTweet("@" + tweeter.name + "You must first setup up your village population using the #villageSetup command to send commands");
};
module.exports.pushExpandPond = pushExpandPond;

//Push a new instance of userCommand with the name "#give" to gActionsArray
//Console.log("Uses to give the other tweeter");
pushGive = function (tweeter, Arg1, Arg2, actionTime, actionDate) {
    villageCheck(tweeter.user.screen_name);
    if (villageSetup) {
        console.log("PushGive fired");
        try {
            dbInfo.playerModel.findOne({ name: tweeter.user.screen_name }, function (err, thisUser) {
                console.log("PushGive this user:" + thisUser);
                //If the user has not signed in and authenticated
                if (thisUser == null) {
                    console.log("User is null")
                    main.sendTweet("@" + tweeter.name + " You must first sign in here http://iam.colum.edu/PiscesGame/ to send commands");
                }
                    //Otherwise
                else {
                    console.log("PushGive 2nd step has fired");
                    //If the user is not currently doing an action
                    if (thisUser.currentAction == 0 || thisUser.currentAction == 4) {
                        console.log("give function pushed to action array");
                        dbInfo.playerModel.findOneAndUpdate({ name: tweeter.user.screen_name }, { $set: { currentAction: 5, timeRemaining: Date.now() } }, function (er, screen_name) { if (er) { console.log(er) } });
                        console.log("update process");
                        //gActionsArray.push(new userCommand("#give", Arg1, Arg2, tweeter.user.screen_name, Date.now(), Date.now() + (10000 + (1500 * Arg1))));

                        //Add the command to gActionsArray so the server can beging to count down the time until it starts. 
                        gActionsArray.push(new userCommand("#give", Arg1, Arg2, tweeter.user.screen_name, Date.now(), Date.now(), actionTime, actionDate));
                    }
                    else {
                        console.log("Empty else");
                        //dbInfo.playerModel.findOneAndUpdate({name: tweeter.user.screen_name}, {$set: {currentAction: 5}}, function (er, screen_name) { if (er){console.log(er)}  } );
                        //gActionsArray.push(new userCommand("#give", Arg1, Arg2, tweeter.user.screen_name, 1, 1));
                    }
                }
            });
        }
        catch (err) {
            console.log(err);
        }
    }
    else main.sendTweet("@" + tweeter.name + "You must first setup up your village population using the #villageSetup command to send commands");
};
module.exports.pushGive = pushGive;



createVillage = function (tweet, size) {
    dbInfo.playerModel.findByName(tweet.user.screen_name, function (err, us) {
        if (err) { console.log(err) };
        if (us == "" || JSON.stringify(us) == "") {
            console.log("create " + tweet.user.screen_name);
            dbInfo.playerModel.create(
				{
				    name: tweet.user.screen_name,
				    fishInPond: 0,
				    pondSize: 0,
				    boatSize: 12,
				    fishOnStringer: 0,
				    totalFishTaken: 0,
				    totalFishStolen: 0,
				    totalFishGiven: 0,
				    totalFishReceived: 0,
				    roundsSurvived: 0,
				    reputation: 0,
				    currentAction: 0,
				    timeRemaining: 0,
				    fishFromLake: 0,
				    fishCommandTime: 0, // BG find time stamp of command
				    peopleStolenFrom: [],
				    villagePopulation: size,
				    villageDeaths: 0,
				    isAdmin: false,
                                    intendedFishCatch: 0
				},
				function (err, user) {
				    if (err)
				    { console.log("Create Error " + err); }
				    console.log(user);
				});
        }
    });
};
module.exports.createVillage = createVillage;

deleteAction = function (tweeter, actionName) {
    // DELETE action 
    console.log("deleteAction hit");
    for (var i = 0; i < gActionsArray.length; i++) {
        if (gActionsArray[i].username == tweeter && gActionsArray[i].action == actionName) {
            gActionsArray.splice(i, 1);
            console.log(tweeter + "'s " + actionName + "command");
            break;
        }
    }
};
module.exports.deleteAction = deleteAction;



//Console.log("Uses to guard the pond");
guardPond = function (tweeterName) {
    main.app.io.sockets.emit('guardPond');

    dbInfo.playerModel.findOneAndUpdate({ name: tweeterName }, { $set: { guard: 1 } }, function (er, screen_name) { if (er) { console.log(er) } });

    commandUpdateInfo = "@" + tweeterName + " is guarding their private pond!\n";
    
    main.app.io.sockets.emit('recentCommandInfo', commandUpdateInfo);
    //main.sendTweet("@" + tweeter + " is guarding their private pond!");
};
module.exports.guardPond = guardPond;

TryHarvest = function(fishNeeded, fishAvailable) {
    var finalHarvest = 0;
    if (fishNeeded > fishAvailable) {
        finalHarvest = fishAvailable;  // grab whatever is available since there is not enough
    }
    else {
        finalHarvest = fishNeeded;  // cap grab to what is needed
    }
    return finalHarvest;
};
module.exports.TryHarvest = TryHarvest;


buildBoat = function (tweeterName, sizeRequested) {
     var allowableSizeIncrease = 0;
     var pondFishHarvested=0, stringerFishHarvested=0;
     var newBoatSize=0, newNumberOfFishOnStringer=0, newNumberOfFishInPond = 0;
    try
    {
	var query2 = dbInfo.playerModel.findOneAndUpdate
	(
	    { name: tweeterName },
	    {
	    $set:
		{
		boatSize: newBoatSize,
		fishOnStringer: newNumberOfFishOnStringer,
		fishInPond: newNumberOfFishInPond
		}
	    }
	);

        var query = dbInfo.playerModel.findOne( { name: tweeterName });
	
	var promise = query.exec();
	var promise2;
	
	promise.then(    function (thisUser)
	    {
	    pondFishHarvested = TryHarvest(sizeRequested, thisUser.fishInPond);
	    var remainingFishToHarvest = sizeRequested - pondFishHarvested;
	    if (remainingFishToHarvest > 0)
	    {
		stringerFishHarvested = TryHarvest(remainingFishToHarvest, thisUser.fishOnStringer); 
	    }
            allowableSizeIncrease = pondFishHarvested + stringerFishHarvested;
	    if (allowableSizeIncrease < sizeRequested)
	{
	    main.sendTweet('@' + allUser[i] + ' does not have ' + sizeRequested + ' fish on their stringer or in their pond. Used ' + allowableSizeIncrease + ' fish instead. 0 Fish remaining.');
	}

	    console.log('thisUser.BOATSIZE is ' + thisUser.boatSize +' and using pond fish ' + pondFishHarvested + ' and using Stringer fish ' + stringerFishHarvested);
	    newBoatSize = thisUser.boatSize + allowableSizeIncrease;
	    console.log('newBoatSize is ' + newBoatSize);
	    newNumberOfFishOnStringer = thisUser.fishOnStringer - stringerFishHarvested;
	    newNumberOfFishInPond = thisUser.fishInPond - pondFishHarvested;
	    
	    promise2 = query2.exec();
	    promise2.then( function(thisUser)
	    {
		console.log('sizeRequested is ' + sizeRequested + ' and allowableSizeIncreases is ' + allowableSizeIncrease);
		if (sizeRequested > allowableSizeIncrease) // we didn't use all the fish you requested
		{
		    main.sendTweet("@" + tweeterName + " new boat size (smaller because not enough fish): " + newBoatSize
				   + "Fish Remaining: stringer " + newNumberOfFishOnStringer
				   + " pond " + newNumberOfFishInPond);
		}
		else
		{
		    main.sendTweet("@" + tweeterName + " new boat size (enough fish): " + newBoatSize
				   + "Fish Remaining: stringer " + newNumberOfFishOnStringer
				   + " pond " + newNumberOfFishInPond);
		}
	    });

	    });
    }
    catch(err)
	{
	    console.log(err);
	}
	
};
module.exports.buildBoat = buildBoat;


expandPond = function (tweeterName, sizeRequested) {
    var allowableSizeIncrease = 0;
     var pondFishHarvested=0, stringerFishHarvested=0;
     var newPondSize=0, newNumberOfFishOnStringer=0, newNumberOfFishInPond = 0, newTotalFishInvested=0;
    try
    {
	var query2 = dbInfo.playerModel.findOneAndUpdate
	(
	    { name: tweeterName },
	    {
	    $set:
		{
		pondSize: 			newPondSize,
		fishOnStringer: 		newNumberOfFishOnStringer,
		fishInPond: 			newNumberOfFishInPond,
		totalFishInvestedInPond: 	newTotalFishInvested
		}
	    }
	);

        var query = dbInfo.playerModel.findOne({ name: tweeterName } );
	var promise = query.exec();
	var promise2;
	
	promise.then (
	function ( thisUser)
	{
	    pondFishHarvested = TryHarvest(sizeRequested, thisUser.fishInPond);
	    var remainingFishToHarvest = sizeRequested - pondFishHarvested;
	    if (remainingFishToHarvest > 0)
	    {
		stringerFishHarvested = TryHarvest(remainingFishToHarvest, thisUser.fishOnStringer); 
	    }
            allowableSizeIncrease = pondFishHarvested + stringerFishHarvested;
	    if (allowableSizeIncrease < sizeRequested)
	{
	    main.sendTweet('@' + allUser[i] + ' does not have ' + sizeRequested + ' fish on their stringer or in their pond. Used ' + allowableSizeIncrease + ' fish instead. 0 Fish remaining.');
	}

	    console.log('size increase is ' + allowableSizeIncrease + ' pondFish harvested is ' + pondFishHarvested + ' stringer fish harvested is ' + stringerFishHarvested);
            newTotalFishInvested = thisUser.totalFishInvestedInPond + allowableSizeIncrease;  // use this to calculate pond reproduction at end of round
	    console.log('\n newTotalFishInvested ' + newTotalFishInvested);
            /* DF = total number of fish invested in pond expansion in ALL rounds, added up, then: POND SIZE = (DF)^1.5 - DF */
            newPondSize = Math.pow(newTotalFishInvested, 1.5) - newTotalFishInvested;
	    console.log('\n newpondsize is ' + newPondSize);
	    
	    newNumberOfFishOnStringer = thisUser.fishOnStringer - stringerFishHarvested;
	    newNumberOfFishInPond = thisUser.fishInPond - pondFishHarvested;
	    
	    promise2 = query2.exec();
	    promise2.then
	    (
	    function(thisUser)
		{
		console.log('sizeRequested is ' + sizeRequested + ' and allowableSizeIncrease is ' + allowableSizeIncrease);
		sendUpdateOfPlayers();
		console.log('this User data pond size is ' + thisUser.pondSize + ' and should be ' + newPondSize);
		if (sizeRequested > allowableSizeIncrease) // we didn't use all the fish you requested
		{
		    main.sendTweet("@" + tweeterName + " new pond capacity (smaller because not enough fish): " + newPondSize
				   + "Fish Remaining: stringer " + newNumberOfFishOnStringer
				   + " pond " + newNumberOfFishInPond);
		}
		else
		{
		    main.sendTweet("@" + tweeterName + " new pond capacity (enough fish): " + newPondSize
				   + "Fish Remaining: stringer " + newNumberOfFishOnStringer
				   + " pond " + newNumberOfFishInPond);
		}
		}
	    );
	});
	}
	catch(err)
	{
	    console.log('error in expandPond harvest fish calculation : ' + err);
	}
 

 

};
module.exports.expandPond = expandPond;


stockPondFromStringer = function () {

    dbInfo.playerModel.find({}, function (err, allUser) {
        for (var i = 0; i < allUser.length; i++) {
            var availableRoomInPond = allUser[i].pondSize - allUser[i].fishInPond; // calculate available room in player's pond

            // stock pond from stringer and empty stringer
            if (availableRoomInPond >= allUser[i].fishOnStringer) // ALL of stringer to pond
            {
                allUser[i].fishInPond += allUser[i].fishOnStringer;
                allUser[i].fishOnStringer = 0;
            }
            else  // stock pond from stringer and update stringer
            {
                allUser[i].fishInPond += availableRoomInPond;
                allUser[i].fishOnStringer -= availableRoomInPond;
            }

            dbInfo.playerModel.findOneAndUpdate({ name: allUser[i].name },
            {
                $set: {
                    fishInPond: allUser[i].fishInPond,
                    fishOnStringer: allUser[i].fishOnStringer,
                }
            },
            function (er, screen_name) { if (er) { console.log(er) } });
        }
    });
	sendUpdateOfPlayers();

}
module.exports.stockPondFromStringer = stockPondFromStringer;


// options is a javascript object { seconds, onUpdateStatus, onCounterEnd}
function Countdown(options) {
  var timer,
  timeRemaining,
  instance = this,
  rounds = options.rounds || 1,
  seconds = options.seconds || 10,
  updateStatus = options.onUpdateStatus || function () {},
  counterEnd = options.onCounterEnd || function () {};

  function decrementCounter() {
    updateStatus(seconds);
    if (seconds === 0 && rounds > 0 ) {
      counterEnd();  // call end of round update
      //instance.stop();
      instance.start();  // repeat counter
      console.log("rounds is " + rounds);
      rounds--;
    }
    else if (seconds == 0 && rounds <= 0) {
	instance.stop();
	gameOver();
    }
    seconds--;
  }

  
  this.start = function () {
    clearInterval(timer);
    timer = 0;
    rounds--;
    timeRemaining = options.seconds;
    seconds = options.seconds;
    timer = setInterval(decrementCounter, 1000);
  };

  this.stop = function () {
    clearInterval(timer);
  };
  
  this.pause = function () {
	timeRemaining = seconds;
       clearInterval(timer);
  }
  this.resume = function() {
   seconds = timeRemaining;
    timer = setInterval(decrementCounter, 1000);
   }
}
module.exports.Countdown = Countdown;

RecurringTimer = function (callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function () {
        clearTimeout(timerId); // clear window
        remaining -= new Date() - start;
    };

    var resume = function () {
        start = new Date();
        timerId = setTimeout(function () { // clear window
            remaining = delay;
            resume();
            callback(remaining);
        }, remaining);
    };

    this.resume = resume;

    //this.resume(); // adding this starts timer when new is called
}
module.exports.RecurringTimer = RecurringTimer;


updateTime  = function()
{

//        gTimeRemaining = myCounter.options.seconds;
//    main.app.io.sockets.emit('timeRemaining', gTimeRemaining);

}

updateGameGlobals = function(rounds,minutes)
{
gCurrentFishInLake = 116; // fixed bug currrentFish BG 11/20
gCurrentRound = 3;
gNumberOfRounds = rounds;

var timeInSeconds = minutes * 60;
gRoundTimeInMilliseconds = timeInSeconds * 1000; //Time is given in milliseconds, so multiply by 1000 to get seconds and then 60 to get minutes
console.log("Current game is set with " + gNumberOfRounds + " rounds at " + minutes + " minutes per each round");
/*console.log('gEorTimer turnTime is ' + gRoundTimeInMilliseconds);
gEorTimer = new RecurringTimer(function (timeRemaining) {
    endOfRoundUpdate(timeRemaining);
}, gRoundTimeInMilliseconds);*/
gGameStartTime = new Date();

// just a timer that climbs up
setInterval(updateTime,1000,0);
myCounter = new Countdown(
{  
    seconds: timeInSeconds,  // number of seconds to count down
    rounds: gNumberOfRounds,
    onUpdateStatus: function(sec)
    {
	if (sec%10 == 0)
	    {
		sendUpdateOfPlayers();
		sendUpdateOfGameState();
	    }
	
    gTimeRemaining = sec;
    main.app.io.sockets.emit('timeRemaining', gTimeRemaining);
    }, // callback for each second
    onCounterEnd: function()
    {
	console.log('new counter counter ended!');
	endOfRoundUpdate();
    } // final action
});
module.exports.myCounter = myCounter;

}
module.exports.updateGameGlobals = updateGameGlobals;

//Reset all players stats. This does not un-authenticate users, and is not the same as resetting the whole server.
setupGame = function (tweeterName, numberOfRounds, timeInMinutes)
{
    
gSetup = true; // machine this a state machine PUT this in Schema 
 module.exports.gSetup = gSetup;
 
// add some code to check admin for security
if (gSendTweets == true)
    main.sendTweet("@" + tweeterName + " Thank you for setting up Pisces");
//initializePlayersAndGameStateInDB(); // put this in createPlayer
updateGameGlobals(numberOfRounds,timeInMinutes);
updatePlayersDB();
sendUpdateOfGameState();  // update Scoreboard to start
// default game status is off 0, game pause -1 , 1 game ready waiting for villagesetup, 2 game ready waiting for start, 3 game under way
// game under way 1
dbInfo.game.findOneAndUpdate({}, { $set: { gameStatus: gameStateEnum.waitOnVillage } }, function (er, gameToken) { if (er) { console.log("findOneandUpdate didn't work with error " + er) } });

try 
{
dbInfo.playerModel.findOne({ name: tweeterName }, function (err, thisUser)
    {
        if (err) { console.log('can not find tweet user in database' + tweeterName);}
        
        console.log('looking for ' + tweeterName + ' and this user instance is ' + thisUser);
        if (thisUser.isAdmin == true)
        {
        }
        else 
        {
            console.log('user : ' + tweeterName + ' is not admin');
            return;
        }

    });
}
catch(err)
{
console.log('try failed on findOne in setup');
}
};
module.exports.setupGame = setupGame;


//ig.game.spawnEntity(EntityGiveFish, Math.floor((Math.random()*600) + 200), Math.floor((Math.random()*400) + 100));


giveFish = function (giverName, donatedFish, recipient)
{
    var recipientDBName = recipient.slice(1);

    if (donatedFish > 0) {
        donateFish(giverName, recipientDBName, donatedFish);
    }
    else {
        var poachedFish = Math.abs(donatedFish);
        poachFish(giverName, recipientDBName, poachedFish);
    }
};
module.exports.giveFish = giveFish;

donateFish = function (giverName, recipientDBName, donatedFish) {
    var fishGiven = donatedFish; // use fishGiven to adjust for the amount of fish to give
     var pondFishHarvested=0, stringerFishHarvested=0;
     var newReceiverFishOnStringer = 0;newNumberOfFishOnStringer=0, newNumberOfFishInPond = 0;

    // CODE for Giver, check how much fish they can give
try
{
    dbInfo.playerModel.findOne({ name: giverName },
	function (err, thisUser) {
	    pondFishHarvested = TryHarvest(donatedFish, thisUser.fishInPond);
	    var fishRemainingToGet = donatedFish - pondFishHarvested;
	    if (fishRemainingToGet > 0) {
		stringerFishHarvested = TryHarvest(fishRemainingToGet, thisUser.fishOnStringer); 
	    }
 	    fishGiven = pondFishHarvested + stringerFishHarvested;
	    if (fishGiven < donatedFish)
	    {
		main.sendTweet('@' + giverName + ' does not have ' + donatedFish + ' fish on their stringer or in their pond. Used ' + fishGiven + ' fish instead. 0 Fish remaining.');
	    }
	    newNumberOfFishOnStringer = thisUser.fishOnStringer - stringerFishHarvested;
	    newNumberOfFishInPond = thisUser.fishInPond - pondFishHarvested;
	});
}
catch(err)
{
    console.log('giverName err is ' + err);
}
try {
     dbInfo.playerModel.findOneAndUpdate
    (
	    { name: giverName },
	    {
	    $set:
		{
		fishOnStringer: newNumberOfFishOnStringer,
		fishInPond: newNumberOfFishInPond
		}
	    },
	    function (er, thisUser)
	    {
		if (er) { console.log('giver update error ' + er); }
	    }
    );
}
catch(err)
{
console.log('giverName update err is ' + err);
}
    // CODE for recipient
try
{
    dbInfo.playerModel.findOne(
	    { name: recipientDBName },
	    function (err, thisUser)
	    {
		newReceiverFishOnStringer = thisUser.fishOnStringer + fishGiven;
	    });
      
    dbInfo.playerModel.findOneAndUpdate
    (
	    { name: recipientDBName },
	    { $set: { fishOnStringer: newReceiverFishOnStringer } },
	    function (er, thisUser)
	    {
		if (er) { console.log('update fish on stringer ' + er); }
	    }
    );
}
catch(err)
{
    console.log(' updating recipient err is ' + err);
}
		    main.sendTweet("@" + giverName + " Fish Given: " + fishGiven
				   + " to " + "@" + recipientDBName +
				   + "Fish Remaining: stringer " + newNumberOfFishOnStringer
				   + " pond " + newNumberOfFishInPond);

}
module.exports.donateFish = donateFish;


poachFish = function (robberName, victimDBName, stolenFish) {
    var allowableStolenFish = stolenFish;
    // CODE for victim
     var pondFishHarvested=0, stringerFishHarvested=0;
     var newReceiverFishOnStringer = 0;newNumberOfFishOnStringer=0, newNumberOfFishInPond = 0;

    // CODE for Giver, check how much fish they can give
try
{
    dbInfo.playerModel.findOne({ name: victimDBName },
	function (err, thisUser) {
	    if (thisUser.guard == 1)
	    {
		allowableStolenFish = 0;
	    }
	    else
	    {
	    pondFishHarvested = TryHarvest(stolenFish, thisUser.fishInPond);
	    var fishRemainingToGet = stolenFish-pondFishHarvested;
	    if (fishRemainingToGet > 0) {
		stringerFishHarvested = TryHarvest(fishRemainingToGet, thisUser.fishOnStringer); 
	    }
 	    allowableStolenFish = pondFishHarvested + stringerFishHarvested;
	    if (allowableStolenFish < stolenFish)
	    {
		main.sendTweet('@' + victimDBName + ' does not have ' + stolenFish + ' fish on their stringer or in their pond. Used ' + allowableStolenFish + ' fish instead. 0 Fish remaining.');
	    }

	    newNumberOfFishOnStringer = thisUser.fishOnStringer - stringerFishHarvested;
	    newNumberOfFishInPond = thisUser.fishInPond - pondFishHarvested;
	    }
	});
}
catch(err)
{
    console.log('victim steal err is ' + err);
}
try {
     dbInfo.playerModel.findOneAndUpdate
    (
	    { name: victimDBName },
	    {
	    $set:
		{
		fishOnStringer: newNumberOfFishOnStringer,
		fishInPond: newNumberOfFishInPond
		}
	    },
	    function (er, thisUser)
	    {
		if (er) { console.log('victim update error ' + er); }
	    }
    );
}
catch(err)
{
console.log('victim update err is ' + err);
}
    // CODE for robber
try
{
    dbInfo.playerModel.findOne(
	    { name: robberName },
	    function (err, thisUser)
	    {
		newReceiverFishOnStringer = thisUser.fishOnStringer + allowableStolenFish;
	    });
      
    dbInfo.playerModel.findOneAndUpdate
    (
	    { name: robberName },
	    { $set: { fishOnStringer: newReceiverFishOnStringer } },
	    function (er, thisUser)
	    {
		if (er) { console.log('update robber fish on stringer ' + er); }
	    }
    );
}
catch(err)
{
    console.log(' updating robber recipient err is ' + err);
}

	main.sendTweet("@" + robberName + " Fish Poached: " + fishGiven
		       + " from " + "@" + victimDBName +
		       + "Fish Remaining: stringer " + newNumberOfFishOnStringer
		       + " pond " + newNumberOfFishInPond);

    main.sendTweet("@" + robberName + " poached fish in the amount of " + allowableStolenFish + " from @" + victimDBName);

}
module.exports.poachFish = poachFish;

generateLeaderBoard = function (leaders, type) {
    try {
        switch (type) {
            case "boatSize":
                gLeaderArray[0] = leaders;
                gLeaderArray[0].sort(function compare(a, b) {

                    if (a.boatSize < b.boatSize)
                        return 1;
                    if (a.boatSize > b.boatSize)
                        return -1;
                    return 0;
                });
                break;
            case "pondSize":
                gLeaderArray[1] = leaders;
                gLeaderArray[1].sort(function compare(a, b) {

                    if (a.pondSize < b.pondSize)
                        return 1;
                    if (a.pondSize > b.pondSize)
                        return -1;
                    return 0;
                });
                break;
            case "fishInPond":
                gLeaderArray[2] = leaders;
                gLeaderArray[2].sort(function compare(a, b) {

                    if (a.fishInPond < b.fishInPond)
                        return 1;
                    if (a.fishInPond > b.fishInPond)
                        return -1;
                    return 0;
                });
                break;
            case "givenFish":
                gLeaderArray[3] = leaders;
                gLeaderArray[3].sort(function compare(a, b) {

                    if (a.totalFishGiven < b.totalFishGiven)
                        return 1;
                    if (a.totalFishGiven > b.totalFishGiven)
                        return -1;
                    return 0;
                });
                break;
            case "timeInGame":
                gLeaderArray[4] = leaders;
                gLeaderArray[4].sort(function compare(a, b) {

                    if (a.timeRemaining < b.timeRemaining)
                        return 1;
                    if (a.timeRemaining > b.timeRemaining)
                        return -1;
                    return 0;
                });
                break;
            default:
                // do nothing
                console.log("Type not implemented:" + type);
                break;
        }
    }
    catch (e) {
        console.log("Leaderboard Error: " + e);
    }
};
module.exports.generateLeaderBoard = generateLeaderBoard;
