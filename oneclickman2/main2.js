// Reference articles:
// http://dhmholley.co.uk/incrementals.html
// http://dhmholley.co.uk/incrementals-part-2.html

// --------------------------------------------
// variables
// --------------------------------------------

// player stats
var player = {
	name: 'player',
	trainLevel: 1,
	bossesBeaten: 0,
	energy: 50,
	prestige: 0
}

var cash = {
	name: 'cash',
	total: 0,
	increment: 2
}

// cost formula for levelled items
// Math.floor(baseCost * Math.pow(costExp,level))

// cost formula for accumulated items
// Math.floor(baseCost * Math.pow(costExp,total))

// weighted clothing increases effect of training
// formula = trainLevel + (clothes.level * modifier)
var clothes = {
	name: 'clothes',
	level: 0,
	baseCost: 100,		// how much does level 1 cost?
	costExp: 1.5,		// the multiplier applied to the cost per level
	increment: 1,		// how much should it increment the related value on each action?
	modifier: 1			// how much does each level increase increment by?
}

// trainers automatically increase power level every second
// formula = player.trainLevel * (trainers.total * trainers.efficiency)
var trainers = {
	name: 'trainers',
	total: 0,
	baseCost: 5000,
	costExp: 1.5,
	efficiency: 1
}

// disciples earn cash every second
// formula = cash.increment * (disciples.total / ( disciples.efficiency / 10) )
// OPTION: could have a chance at a special bonus; someone shared the video on YouTube, gain 10^(x * bossesBeaten) bonus, where x is between 0.5 and 1.0
var disciples = {
	name: 'disciples',
	total: 0,
	efficiency: 0.1,
	minGainBase: 1,		// base minimum amount gained per boss beaten
	maxGainBase: 3		// base maximum amount gained per boss beaten
}

var achievements = {
	train1:0,			// reach 100 power level -- trainer efficiency + 0.5
	train2:0,			// reach 100k power level -- trainer efficiency + 0.5
	train3:0,			// reach 100m power level -- trainer efficiency + 0.5
	train4:0,			// reach 100b power level -- trainer efficiency + 2.5
	train5:0,			// reach 100t power level -- trainer efficiency + 5
	train6:0,			// reach 100qa power level -- trainer efficiency + 10
	hero1:0,			// beat 1 boss -- disciple efficiency + 0.1
	hero2:0,			// beat 1k bosses -- disciple efficiency + 0.1
	hero3:0,			// beat 1m bosses -- disciple efficiency + 0.1
	hero4:0,			// beat 1b bosses -- disciple efficiency + 0.1
	hero5:0,			// beat 1t bosses -- disciple efficiency + 0.25
	hero5:0,			// beat 1qa bosses -- disciple efficiency + 0.25
	heavy1:0,			// have 1k weighted clothing -- trainLevel * 2
	heavy2:0,			// have 1m weighted clothing -- trainLevel * 2
	heavy3:0,			// have 1b weighted clothing -- trainLevel * 2
	heavy4:0,			// have 1t weighted clothing -- trainLevel * 2
	hidden1:0			// 37 trainers, 37 clothing, 37 bosses beaten -- unlock speed upgrade?
}

// --------------------------------------------
// functions
// --------------------------------------------
function saveGame(saveType) {
	
	var save = {
		saveCash: cash,
		saveCashFactor: cashFactor,
		savePowerLevel: powerLevel,
		saveEnergy: energy,
		saveClothesLevel: clothesLevel,
		saveCashLvl: cashLvl,
		saveTrainLvl: trainLvl,
		saveBossesBeaten: bossesBeaten,
		saveDisciples: disciples,
		saveTrainers: AutoTrainers,
		savePrestige: prestige
	}

	localStorage.setItem("save",JSON.stringify(save));
	ga('send', 'event', 'OneClickMan', 'Save', saveType);
	
};

function loadGame() {

	var gameSave = JSON.parse(localStorage.getItem("save")); 
	
	if (typeof gameSave.saveCash !== "undefined") cash = gameSave.saveCash;
	if (typeof gameSave.saveCashFactor !== "undefined") cashFactor = gameSave.saveCashFactor;
	if (typeof gameSave.savePowerLevel !== "undefined") powerLevel = gameSave.savePowerLevel;
	if (typeof gameSave.saveEnergy !== "undefined") energy = gameSave.saveEnergy;
	if (typeof gameSave.saveClothesLevel !== "undefined") clothesLevel = gameSave.saveClothesLevel;
	if (typeof gameSave.saveCashLvl !== "undefined") cashLvl = gameSave.saveCashLvl;
	if (typeof gameSave.saveTrainLvl !== "undefined") trainLvl = gameSave.saveTrainLvl;
	if (typeof gameSave.saveBossesBeaten !== "undefined") bossesBeaten = gameSave.saveBossesBeaten;
	if (typeof gameSave.saveDisciples !== "undefined") disciples = gameSave.saveDisciples;
	if (typeof gameSave.saveTrainers !== "undefined") AutoTrainers = gameSave.saveTrainers;
	if (typeof gameSave.savePrestige !== "undefined") prestige = gameSave.savePrestige;
	
	refreshPageValues();
	
};

function deleteSave() {
	localStorage.removeItem("save")
};

function refreshPageValues() {
	
	document.getElementById("cash").innerHTML = presentNumber(cash);
	document.getElementById("powerLevel").innerHTML = presentNumber(powerLevel);
	document.getElementById("energy").innerHTML = presentNumber(energy);
	document.getElementById("clothesLevel").innerHTML = presentNumber(clothesLevel);
	document.getElementById("bossesBeaten").innerHTML = presentNumber(bossesBeaten);
	document.getElementById("disciples").innerHTML = presentNumber(disciples);
	document.getElementById("AutoTrainers").innerHTML = presentNumber(AutoTrainers);
	document.getElementById("prestige").innerHTML = presentNumber(prestige);

	document.getElementById("cashLvl").innerHTML = presentNumber(cashLvl);
	document.getElementById("trainLvl").innerHTML = presentNumber(trainLvl);
	document.getElementById("cashFactor").innerHTML = presentNumber(cashFactor);

	document.getElementById("clothesCost").innerHTML = presentNumber(clothesCost);
	document.getElementById("atCost").innerHTML = presentNumber(atCost);
	document.getElementById("discipleCost").innerHTML = presentNumber(discipleCost);

};

function presentNumber(number) {
	var output = Math.round(number);
	return output;
};

function incPower(num) {
	powerLevel = powerLevel + num;
	document.getElementById("powerLevel").innerHTML = presentNumber(powerLevel);
};

function getCash(num) {
	cash = cash + num;
	document.getElementById("cash").innerHTML = presentNumber(cash);
};

function buyAutoTrainer(){
	
	//checks that the player can afford the AutoTrainer
	if(cash >= atCost) {                                   

		// increases number of AutoTrainers
		AutoTrainers = AutoTrainers + 1;               

		// removes the cash spent
		cash = cash - atCost;                          

		// updates the number of cursors for the user
		document.getElementById('AutoTrainers').innerHTML = presentNumber(AutoTrainers);

		// updates amount of cash for the user
		document.getElementById('cash').innerHTML = presentNumber(cash);

	};

	//works out the cost of the next AutoTrainer
	var nextCost = Math.floor(5000 * Math.pow(1.25,AutoTrainers));

	// updates the AutoTrainer cost for the user
	document.getElementById('atCost').innerHTML = presentNumber(nextCost);  
	
};

function buyClothes(){

    if(cash >= clothesCost){      
	
        clothesLevel = clothesLevel + 1;
		trainLvl = trainLvl + 1;
    	cash = cash - clothesCost;
        document.getElementById('clothesLevel').innerHTML = presentNumber(clothesLevel);
        document.getElementById('cash').innerHTML = presentNumber(cash);

	};
	
    var nextCost = Math.floor(200 * Math.pow(1.1,clothesLevel));
    clothesCost = nextCost;
    document.getElementById('clothesCost').innerHTML = presentNumber(nextCost);
    document.getElementById('trainLvl').innerHTML = presentNumber(trainLvl);
	
};

function fightBoss(){
	
    // checks that the player is strong enough to beat the boss
    if(powerLevel >= discipleCost){                                   
	
		bossesBeaten = bossesBeaten + 1;
		var minGain = Math.floor(0 + Math.pow(1.5,bossesBeaten));
		var maxGain = minGain + Math.floor(2 + Math.pow(1.5,bossesBeaten));
	    
        disciples = disciples + Math.floor(Math.random()*maxGain+minGain);
    	powerLevel = powerLevel - discipleCost;
        document.getElementById('disciples').innerHTML = presentNumber(disciples);
        document.getElementById('powerLevel').innerHTML = presentNumber(powerLevel);
	    
    };
	
    var nextCost = Math.floor(5000 * Math.pow(1.5,bossesBeaten));
    document.getElementById('discipleCost').innerHTML = presentNumber(nextCost);
    discipleCost = nextCost;
	
};

// add a debug mode flag
// allow user to add large amounts of resources and levels for testing


// --------------------------------------------
// active code
// --------------------------------------------

window.onload = function() {
	
	loadGame();
	refreshPageValues();
	
};

window.setInterval(function(){
	
	incPower(AutoTrainers * trainLvl);
	getCash(disciples * ( (cashFactor * cashLvl) / 10 ) );
	
}, 1000);

window.setInterval(function(){
	
	saveGame('auto');
	
}, 600000);