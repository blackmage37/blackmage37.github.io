// --------------------------------------------
// variables
// --------------------------------------------

// player stats
var powerLevel = 0;			// player power level
var cash = 0;				// player cash
var energy = 50;
var prestige = 0;

// set increments for actions
var trainLvl = 1;
var cashLvl = 1;
var cashFactor = 2;

// weighted clothes
var clothesLevel = 0;		// level of the weighted clothing
var clothesCost = Math.floor(10 * Math.pow(1.1,clothesLevel));

// AutoTrainers
var AutoTrainers = 0
var atCost = Math.floor(50 * Math.pow(1.1,AutoTrainers));

// bosses beaten
var bossesBeaten = 0;

// disciples
var disciples = 0;
var discipleCost = Math.floor(100 * Math.pow(1.5,bossesBeaten));

var cashPerClick = Math.Max(1, (cashLvl * disciples));

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
		saveClothesCost: clothesCost,
		saveCashLvl: cashLvl,
		saveCashPerClick: cashPerClick,
		saveTrainLvl: trainLvl,
		saveBossesBeaten: bossesBeaten,
		saveDisciples: disciples,
		saveDiscipleCost: discipleCost,
		saveTrainers: AutoTrainers,
		saveATCost: atCost,
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
	if (typeof gameSave.saveClothesCost !== "undefined") clothesCost = gameSave.saveClothesCost;
	if (typeof gameSave.saveCashLvl !== "undefined") cashLvl = gameSave.saveCashLvl;
	if (typeof gameSave.saveCashPerClick !== "undefined") cashPerClick = gameSave.saveCashPerClick;
	if (typeof gameSave.saveTrainLvl !== "undefined") trainLvl = gameSave.saveTrainLvl;
	if (typeof gameSave.saveBossesBeaten !== "undefined") bossesBeaten = gameSave.saveBossesBeaten;
	if (typeof gameSave.saveDisciples !== "undefined") disciples = gameSave.saveDisciples;
	if (typeof gameSave.saveDiscipleCost !== "undefined") discipleCost = gameSave.saveDiscipleCost;
	if (typeof gameSave.saveTrainers !== "undefined") AutoTrainers = gameSave.saveTrainers;
	if (typeof gameSave.saveATCost !== "undefined") atCost = gameSave.saveATCost;
	if (typeof gameSave.savePrestige !== "undefined") prestige = gameSave.savePrestige;
	
	refreshPageValues();
	//saveGame('auto');
	
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
	document.getElementById("cashPerClick").innerHTML = presentNumber(cashPerClick);
	document.getElementById("trainLvl").innerHTML = presentNumber(trainLvl);
	document.getElementById("cashFactor").innerHTML = presentNumber(cashFactor);

	document.getElementById("clothesCost").innerHTML = presentNumber(clothesCost);
	document.getElementById("atCost").innerHTML = presentNumber(atCost);
	document.getElementById("discipleCost").innerHTML = presentNumber(discipleCost);

};

function presentNumber(number) {
	var output = Math.round(number);
	return String(output).replace(/(.)(?=(\d{3})+$)/g,'$1,');
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
	var nextCost = Math.floor(50 * Math.pow(1.5,AutoTrainers));

	// updates the AutoTrainer cost for the user
	document.getElementById('atCost').innerHTML = presentNumber(nextCost); 
	atCost = nextCost;
	
};

function buyClothes(){
    if(cash >= clothesCost){                                   
        clothesLevel = clothesLevel + 1;
		trainLvl = trainLvl + 1;
    	cash = cash - clothesCost;
        document.getElementById('clothesLevel').innerHTML = presentNumber(clothesLevel);
        document.getElementById('cash').innerHTML = presentNumber(cash);
    };
    var nextCost = Math.floor(10 * Math.pow(1.1,clothesLevel));
    clothesCost = nextCost;
    document.getElementById('clothesCost').innerHTML = presentNumber(nextCost);
    document.getElementById('trainLvl').innerHTML = presentNumber(trainLvl);
};

function fightBoss(){
	
    // checks that the player is strong enough to beat the boss
    if(powerLevel >= discipleCost){                                   
	
	bossesBeaten = bossesBeaten + 1;
	var minGain = Math.floor(0 + Math.pow(1.5,bossesBeaten));
	var maxGain = minGain + Math.floor(4 + Math.pow(1.5,bossesBeaten));
	    
        disciples = disciples + Math.floor(Math.random()*maxGain+minGain);
    	powerLevel = powerLevel - discipleCost;
        document.getElementById('disciples').innerHTML = presentNumber(disciples);
        document.getElementById('powerLevel').innerHTML = presentNumber(powerLevel);
	    
    };
	
    var nextCost = Math.floor(100 * Math.pow(1.5,bossesBeaten));
    document.getElementById('discipleCost').innerHTML = presentNumber(nextCost);
    discipleCost = nextCost;
};

// --------------------------------------------
// active code
// --------------------------------------------

window.onload = function() {
	
	loadGame();
	
};

window.setInterval(function(){
	
	incPower(AutoTrainers * trainLvl);
	getCash(disciples * ( (cashFactor * cashLvl) / 2) );
	
}, 1000);

window.setInterval(function(){
	
	saveGame('auto');
	
}, 600000);
