var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/PiscesDB');

var db = mongoose.connection;

db.once('open', function callback() {
    console.log("Connection successful");
});

db.on('error', console.error.bind(console, 'connection error in db.on:'));

clearMyDB = function ()
{
	console.log('drop database');
	db.db.dropDatabase();
}
module.exports.clearMyDB = clearMyDB;

// Game Schema and Object
// gameSchema is GAME NEUTRAL - not Pisces gameplay specific
var gameSchema = new mongoose.Schema({

    name: String,
    creationDate: Date,
    startDate: Date,  // the datetime when game play first commenced against this object
    lastPauseDate: Date, // the last 
    lastResumeDate: Date, // the last
    gameStatus: Number // TODO: What is the gameStatus value?
});

var game = mongoose.model('game', gameSchema); // bg added var
module.exports.game = game;

// Admin Schema and Object
// adminSchema is GAME NEUTRAL - not Pisces gameplay specific
var adminSchema = new mongoose.Schema({
    startGame: Boolean,
    pauseGame: Boolean,
    resumeGame: Boolean,
    endOfRound: Boolean,

});

var admin = mongoose.model('admin', adminSchema);  // bg: added var
module.exports.admin = admin;


///// EVERYTHING below will eventually be broken out into separate Pisces specific modules

// PiscesGame Schema and Object
// This object hold all the pisces specific state for the "a game" - uniquely identified by a gameID - the ID of a gameSchema object
var piscesGameCommonSchema = new mongoose.Schema({
    gameID: Number,
    creationDate: Date,
    lakeFishPopulation: Number
});

var piscesGameCommon = mongoose.model('piscesGameCommon', piscesGameCommonSchema);  // bg added var
module.exports.piscesGameCommon = piscesGameCommon;


// PiscesPlayer Schema and Object 
//TODO: eventually create a playerPiscesSchema to separate out Pisces specifics
var playerSchema = new mongoose.Schema({
    name: String,
    fishInPond: Number,
    pondSize: Number,
    totalFishInvestedInPond: Number,
    boatSize: Number,
    fishOnStringer: Number,
    totalFishEaten: Number,
    totalFishTaken: Number,
    totalFishStolen: Number,
    totalFishGiven: Number,
    totalFishReceived: Number,
    reputation: Number,
    currentAction: Number,
    guard: Number,
    timeRemaining: Number,
    fishFromLake: Number,
    fishCommandTime: Number,
    peopleStolenFrom: [String],
    villagePopulation: Number,
    villageDeaths: Number,
    isAdmin: Boolean,
    intendedFishCatch: Number
});

var playerModel = mongoose.model('tweetUser', playerSchema);  // bg : added var
module.exports.playerModel = playerModel;

//Adds the FindByName function to the schema documents
playerSchema.static('findByName', function (name, callback) {
    return this.find({ name: name }, callback);
});


//Lake Schema and Object
var lakeSchema = new mongoose.Schema({
    currentFishInLake: Number,
    lakeCapacity: Number,
    growthRate: Number,
    decayRate: Number,
    lengthOfRound: Number,
    numberOfRounds: Number,
    endOfRound: Number
});

var lake = mongoose.model('lake', lakeSchema); // bg: added var
module.exports.lake = lake;


//////// Game Saving 


var savedPiscesGameSchema = new mongoose.Schema({
    name: String,
    notes: String,
    game: Object, // A gameSchema instance 
    gameID: String, // Copy the game instance ID from property immediately above to make saved game sorting easier
    piscesGame: Object, // copy of PiscesGame instance aka piscesGameCommon
    lake: Object,// copy of 'lake' instance
    players: Array, // n copies of player instances
    savedTime: Date
});







