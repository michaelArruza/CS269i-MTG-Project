
const LINE_COLOR = "blue";
const MARKER_COLOR = "steelblue";
const MARKER_DATE_COLOR = "grey";
const MARKER_PRICE_COLOR = "steelblue";
const MARKER_LINE_COLOR = "#cccccc";

var startDate = new Date("12/5/18");
var currDate = new Date("12/5/23");
var currIndex = 1826;	// Index to keep track of current date
var endDate = new Date("12/1/28");
var cardData = {};
var cash = 100.00;
var ownedCards = [];	// store keys for cardData
var assets = 0.00;


/*
 * Convert data to a dictionary of {cardname: {date:value info}} 
 */
function parseData(data) {
	var output = {};
	for (var card in data) {
		var arr = [];
		for (var i in data[card]) {
	    	arr.push(
	        	{
	            date: new Date(i),  	 //date
	            value: +data[card][i], 	 //convert string to number
	        });
		}
		output[card] = arr;
   	}
   	return output;
}


/*
 * Sets up initial display
 * Draws legend and graph with a random card
 */
function display(svg) {

	document.getElementById("currdate").innerHTML = currDate.toString();

	// Parse the data
	var rand = Math.floor(Math.random() * Object.keys(cardData).length);			// Initialize page to dispaly random card

	// Set max height for cardlist vis
	var cardList = document.getElementById('cardListContainer');
    cardList.style.height = visHeight + "px";

    /* Update vis header */
    updateHeader(Object.keys(cardData)[rand], cardData[Object.keys(cardData)[rand]]);

    /* Draw legend */
    updateLegend(cardData[Object.keys(cardData)[rand]]);

    /* Draw graph */
    var graphHeight = 7/8 * visHeight;
    var graphMargin = {
    	left: 30,
    	right: 40,
    	top: 20,
    	bottom: 20
    };
    var graphWidth = visWidth - graphMargin.left - graphMargin.right;
    var graphX = graphMargin.left;
    drawGraph(cardData[Object.keys(cardData)[rand]], currDate, svg, graphX, graphWidth, graphHeight, graphMargin);		// Display graph of random card


    /* Buy/Sell card functionality */
	var buyButton = document.querySelector(".buysell.buy");
	buyButton.onclick = function(d) {
		 buyCard();
	}
	var sellButton = document.querySelector(".buysell.sell");
	sellButton.onclick = function(d) {
		 sellCard();
	}


    /* Search functionality */
   	var search = document.querySelector("#search");
	var timeout = null;
	search.onsearch = function() {	
		clearTimeout(timeout);				// Restart delay if search is pressed
		timeout = setTimeout(function() {	// Delay function call
			updateVis(svg, graphX, graphWidth, graphHeight, graphMargin);
		}, 150);			
	}

	/* Back/forward simulator functionality */
	var backButton = document.querySelector(".button.back");
	backButton.onclick = function(d) {
		 backSimulate(svg, graphX, graphWidth, graphHeight, graphMargin);
	}
	var forwardButton = document.querySelector(".button.forward");
	forwardButton.onclick = function(d) {
		 forwardSimulate(svg, graphX, graphWidth, graphHeight, graphMargin);
	}
}


/*
 * Buy the current card, add to user card list
 */
function buyCard() {
	var price = cardData[currCard][currIndex].value;
	// buy card if you have enough money
	if (cash >= price) {
	    ownedCards.push(currCard);		// update owned cards
	    cash -= price;					// update user cash
	    assets += price;				// update user assets

	    // update visuals
	    document.getElementById("cashHeader").innerHTML = cash.toFixed(2);
	    document.getElementById("assetsHeader").innerHTML = "$" + assets.toFixed(2);

	    var cardList = document.getElementById('cardList');
	    cardList.innerHTML = "<p>" + currCard + "</p>" + cardList.innerHTML;
	} else {
		showToast("You don't have enough cash to purchase " + currCard);
	}
}


/*
 * Sell the current card, remove from user card list
 */
function sellCard() {
	var cardList = document.getElementById('cardList');
	// var cards = cardList.getElementsByTagName('p')[0].innerHTML;

	// sell card if you own it
	var index = ownedCards.indexOf(currCard);
	if (index >= 0) {
		var price = cardData[currCard][currIndex].value;
	    ownedCards.splice(index, 1);	// update owned cards
	    cash += price;					// update user cash
	    assets -= price;				// update user assets
	    if (assets <= 0) assets = 0;	// weird js addition stuff


	    // update visuals
	    document.getElementById("cashHeader").innerHTML = cash.toFixed(2);
	    document.getElementById("assetsHeader").innerHTML = "$" + assets.toFixed(2);

	    var cardString = ""
	    ownedCards.forEach(function(d) {
	    	cardString += "<p>" + d + "<p>";
	    })
	    cardList.innerHTML = cardString;
	} else {
		showToast("You don't own " + currCard);
	}
}


/*
 * Simulates moving the market back in time
 */
function backSimulate(svg, graphX, graphWidth, graphHeight, graphMargin) {
	currDate.subtractMonths(1);

	// Only allow moving backwards through time for data that exists
	if(currDate - startDate > 0) {
		document.getElementById("currdate").innerHTML = currDate.toString();
		drawGraph(cardData[document.getElementById("cardname").innerHTML], currDate, svg, graphX, graphWidth, graphHeight, graphMargin);
		updateDateIndex(cardData[currCard]);
		updateHeader(currCard, cardData[currCard]);
		updateLegend(cardData[currCard]);
		updateAssets();
	} else {
		currDate.addMonths(1);
		showToast("You've reached the beginning of the simulation!");
	}

}


/*
 * Simulates moving the market forward in time
 */
function forwardSimulate(svg, graphX, graphWidth, graphHeight, graphMargin) {
	currDate.addMonths(1);

	// Only allow moving forwards through time for data that exists
	if(endDate - currDate > 0) {
		document.getElementById("currdate").innerHTML = currDate.toString();
		drawGraph(cardData[document.getElementById("cardname").innerHTML], currDate, svg, graphX, graphWidth, graphHeight, graphMargin);
		updateDateIndex(cardData[currCard]);
		updateHeader(currCard, cardData[currCard]);
		updateLegend(cardData[currCard]);
		updateAssets();
	} else {
		currDate.subtractMonths(1);
		showToast("You've reached the end of the simulation!");
	}
}


/*
 * Updates the value of the assets according to owned cards (called on back/forward simulate)
 */
function updateAssets() {
	assets = 0.00;
	ownedCards.forEach(function(d) {
		assets += cardData[d][currIndex].value;
	})
	document.getElementById("assetsHeader").innerHTML = "$" + assets.toFixed(2);
}


/*
 * Updates the vis header to show the card name and current price info
 */
function updateHeader(card, data) {
	currCard = card;
	var currPrice = data[currIndex].value;
	document.getElementById("cardname").innerHTML = card;
	document.getElementById("marketpriceHeader").innerHTML = "$" + currPrice.toFixed(2);
}


/*
 * Updates the vis header to show the card name and current price info
 */
function updateLegend(data) {
	// Calculate prices over time
	var prices = calculatePricesOverTime(data);
	var maxPrice = prices[0],
		minPrice = prices[1],
		avgPrice = prices[2];
	var currPrice = data[currIndex].value;

	document.getElementById("maxprice").innerHTML = "$" + maxPrice;
	document.getElementById("minprice").innerHTML = "$" + minPrice;
	document.getElementById("avgprice").innerHTML = "$" + avgPrice;
	document.getElementById("marketprice").innerHTML = "$" + currPrice.toFixed(2);
}


/*
 * Returns the max, min, and avg price over time for the given card data
 */
function calculatePricesOverTime(data) {
	var max = 0.0,
	    min = 1000000.0,
		avg = 0.0;

	for (i = 0; i <= currIndex; i++) {
		var elem = data[i];
		if (elem.value > max) max = elem.value;
		if (elem.value < min) min = elem.value;
		avg += elem.value;
	}
	avg /= data.length;
	return [max.toFixed(2), min.toFixed(2), avg.toFixed(2)];
}


/*
 * Renders the graph with the given card data
 */
function drawGraph(data, currDate, svg, x, width, height, margin) {
	// re-render graph
	d3.selectAll(".graph").remove();

	// x and y scales
	var xVal = d3.scaleTime().rangeRound([0, width]);
	var yVal = d3.scaleLinear().rangeRound([height, 0]);

	// line equation
	var line = d3.line()
	   .x(function(d) { return xVal(d.date)})
	   .y(function(d) { return yVal(d.value)})
	   // xVal.domain(d3.extent(data, function(d) { return d.date }));
	xVal.domain([startDate, currDate]);
	yVal.domain(d3.extent(data, function(d) { return d.value }));

	var xShift = x + margin.left;
	var g = svg.append("g")
		.attr("class", "graph")
	    .attr("transform", "translate(" + xShift + "," + margin.top + ")");

	// render x axis
	g.append("g")
	   .attr("transform", "translate(0," + height + ")")
	   .call(d3.axisBottom(xVal))
	   .select(".domain");

	// render y axis
	g.append("g")
	    .call(d3.axisLeft(yVal))
	    .append("text")
	    .attr("fill", "#000")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 6)
	    .attr("dy", "0.71em")
	    .attr("text-anchor", "end")
	    .text("Price ($)");

	// plot line graph
	g.append("path")
		.datum(data)
		.attr("fill", "none")
		.attr("stroke", "steelblue")
		.attr("stroke-linejoin", "round")
		.attr("stroke-linecap", "round")
		.attr("stroke-width", 1.5)
		.attr("d", line);

	// Mouse event renderer --> line, circle, and text to display hovered data
	var focus = g.append("g")
      .attr("fill", "none")
      .style("stroke", MARKER_COLOR)
      .style("display", "none");

  	focus.append("circle")
    	.attr("r", 4.5);

    var lineFocus = g.append("rect")
    	.attr("width", .00001)
    	.attr("height", height)
    	.attr("fill", MARKER_LINE_COLOR)
    	.attr("stroke", MARKER_LINE_COLOR);

  	focus.append("text")
  		.attr("id", "date")
    	.attr("x", 9)
    	.attr("font-size", 12)
        .attr("fill", MARKER_DATE_COLOR)
        .attr("stroke", MARKER_DATE_COLOR)
        .style("opacity", .7);

    focus.append("text")
    	.attr("id", "price")
    	.attr("x", 9)
    	.attr("y", 20)
    	.attr("font-size", 16)
        .attr("fill", MARKER_PRICE_COLOR)
        .attr("stroke", MARKER_PRICE_COLOR);

    // detect where mouse is anywhere on the graph with overlayed rectangle
  	g.append("rect")
	    .style("opacity", 0)
	    .attr("width", width)
	    .attr("height", height)
	    .on("mouseover", function() { focus.style("display", null); lineFocus.style("display", null); })
	    .on("mouseout", function() { focus.style("display", "none"); lineFocus.style("display", "none"); })
	    .on("mousemove", mousemove);

	// on mouseover handler
  	function mousemove() {
  		var bisectDate = d3.bisector(function(d) { return d.date; }).left;
    	var x0 = xVal.invert(d3.mouse(this)[0]),
	        i = bisectDate(data, x0, 1),
	        d0 = data[i - 1],
	        d1 = data[i],
	        d = x0 - d0.date > d1.date - x0 ? d1 : d0;
	    focus.attr("transform", "translate(" + xVal(d.date) + "," + yVal(d.value) + ")");
	    lineFocus.attr("transform", "translate(" + xVal(d.date) + ", 0)");
    	focus.select("#date").text(d.date.toString());
    	focus.select("#price").text("$" + d.value.toFixed(2));
  	}
}



/*
 * Allows searching functionality of the dataset
 * If word is found, updates the vis to display new card info
 */
function updateVis(svg, graphX, graphWidth, graphHeight, graphMargin) {
	var search = document.querySelector("#search");

	// If a word is found
	if (search.value in cardData) {

		drawGraph(cardData[search.value], currDate, svg, graphX, graphWidth, graphHeight, graphMargin);
		updateHeader(search.value, cardData[search.value]);
		updateLegend(cardData[search.value]);
	}
}


/*
 * Updates the date index to keep track of where in the data we are
 */
function updateDateIndex(data) {
	for (var i = 0; i < data.length; i++) {
		if (data[i].date.getTime() == currDate.getTime()) {
			currIndex = i;
			return;
		}
	}
}


/*
 * Shows a toast with the given message (called by invalid buy/sell)
 */
function showToast(message) {
    var toast = document.getElementById("toast");
    toast.className = "show";
    toast.innerHTML = message;
    setTimeout(function(){ toast.className = toast.className.replace("show", ""); }, 1000);
}


/*
 * Date handling
 */
Date.isLeapYear = function (year) { 
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0)); 
};
Date.getDaysInMonth = function (year, month) {
    return [31, (Date.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
};
Date.prototype.isLeapYear = function () { 
    return Date.isLeapYear(this.getFullYear()); 
};
Date.prototype.getDaysInMonth = function () { 
    return Date.getDaysInMonth(this.getFullYear(), this.getMonth());
};
Date.prototype.addMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() + value);
    this.setDate(Math.min(n, this.getDaysInMonth()));
    return this;
};
Date.prototype.subtractMonths = function (value) {
    var n = this.getDate();
    this.setDate(1);
    this.setMonth(this.getMonth() - value);
    this.setDate(Math.min(n, this.getDaysInMonth()));
    return this;
};
Date.prototype.toString = function () {
	// format date to be day, month, year
	const days = [
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
		"Sunday"
	];
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	];
	return days[this.getDay()] + ", " + months[this.getMonth()] + " " + this.getDate() + ", " + this.getFullYear();
}




//////////////////////////////////////////////
//////////////////// MAIN ////////////////////
//////////////////////////////////////////////
// Vis area dimensions
var visWidth  = d3.select("#vis").node().offsetWidth,
    visHeight = d3.select("#vis").node().offsetHeight;
// Set up vis svg
var svg = d3.select('#vis').append('svg')
	.attr('width', visWidth)
    .attr('height', visHeight)
document.getElementById("cashHeader").innerHTML = "$" + cash.toFixed(2);

var i = 0;
d3.csv("data/cards_database.csv", function(d) {
	// Read in csv data, card by card
	i++;
	var name = "card" + i;
	prices = {};

	// Iterate through dates in csv, 
    Object.keys(d).forEach(function(date) {
        prices[date] = d[date];
    });

    // Add card to database
    cardData[name] = prices;

}).then(function (d) {
	// hide animation
	document.querySelector("#vis").style.backgroundColor = "white";
	// Called after reading in the csv
	// Convert data structure to include Date objects, then display
	cardData = parseData(cardData);
	display(svg);
});































