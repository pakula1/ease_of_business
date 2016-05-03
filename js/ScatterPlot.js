


// SVG drawing area

var margin = {top: 20, right: 20, bottom: 30, left: 80},
    width = 700 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

var svg = d3.select("#scatter")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


// Date parser (https://github.com/mbostock/d3/wiki/Time-Formatting)
var formatDate = d3.time.format("%Y");

var lifeData = [];
var selectedYearArray = [];
var secondMetricData;
var fraserTestArray = [];
var bizDate;


// Assign the loaded data values to local storage variables
function drawScatter(DBData, MigrationData, CorruptionData, LifeExpectancyData) {


    lifeData = d3.nest()
        .key(function(d) { return d.Country_Code ; })
        .entries(LifeExpectancyData);


    // Draw the visualization for the first time
    populateDatepicker();
    updateScatter();
}


function filterWorkingData() {
    // We're going to make an easy-to-access array with the combined X and Y data from
    // EoDB and the filterMetric the user chose

    // First, grab the metric the user has chosen from the dataFilter dropdown
    var filterMetric = d3.select("#dataFilter").property("value");

    // Grab the year they picked from the filterMetric date dropdown
    var bizDate = d3.select("#metricYear").property("value");

    var formatToYear = d3.time.format("%Y");
    searchYear = formatToYear(new Date(bizDate));


    switch(d3.select("#dataFilter").property("value")) {
        case "LifeExpectancyData":
            secondMetricData = d3.nest()
                .key(function(d) { return d.Country_Code ; })
                .entries(LifeExpectancyData);
            break;
        case "CorruptionData":
            secondMetricData = d3.nest()
                .key(function(d) { return d.Country_Code ; })
                .entries(CorruptionData);
            break;
        case "MigrationData":
            secondMetricData = d3.nest()
                .key(function(d) { return d.Country_Code ; })
                .entries(MigrationData);
            break;
    }

    selectedYearArray = [];

    // Filter doing biz data by year
    bizData = d3.nest()
        .key(function(d) { return d.Calendar_Year; })
        .entries(DBData);

    // Then create a new array of just the EoDB data from the selected year
    var yearData = bizData.filter(function(d){
        return d['key'] == searchYear;
    });

    //console.log(searchYear)

    // Then save that data as a new array, sorted by country code as key
    nestedEoDB = d3.nest()
        .key(function(d) {
            return d.Country_Code;
        })
        .entries(yearData[0]['values']);

    // Go through the year's EoDB elements
    // If the DTF isn't blank for that year, and the secondMetricCriteria isn't blank that year ..
    // Add them to a new array called testeroo

    console.log(secondMetricData)

    fraserTestArray = nestedEoDB.map(
        // For every element in the array of DTF countries of that year
        function(d) {
            // If the Overall_DTF score is not blank
            if (d['values'][0].Overall_DTF == '') {

            } else if (d['values'][0].Overall_DTF == "..") {

            } else {
                // Iterate through every country code element in the secondary data array
                for (var i=0; i<secondMetricData.length; i++) {
                    // If there is a matching country code

                    if (d.key == secondMetricData[i]['key']) {
                        // OK, so there is a match in country names
                        // And if the field for the given search year is not blank
                        if (secondMetricData[i]['values'][0]["CY"+searchYear] == '') {

                        } else {
                            // OK, so there is a value for the second metric too
                            return {
                                name : d.key,
                                values : {
                                    DTF : d['values'][0].Overall_DTF,
                                    Secondary :  secondMetricData[i]['values'][0]["CY"+searchYear],
                                    Full_Name : d['values'][0].Economy
                                }
                            }
                        }
                    }
                }
            }
        }
    );

    fraserTestArray = fraserTestArray.filter(function(d){
        return d != null;
    });

    // Now we've got a new array, that has combined metrics.  Let's redraw
    if (d3.select("#dataFilter").property("value") == "DoingBusinessData") {
        console.log("User selected doing biz (skipping scatter plot generation)");
    } else {
        updateScatter();
    }



}


function updateScatter() {

    /* Render the scales based on the new data */
    var x = d3.scale.linear()
        .range([0, width])
        .domain([0, 100]);

    var y = d3.scale.linear()
        .range([height, 0])
        //.domain([0,1000000]);
        .domain(d3.extent(fraserTestArray, function(d) { return d.values.Secondary; }));

    //console.log("Y range boundaries: " + d3.extent(fraserTestArray, function(d) { return d.values.Secondary; }));

    
    ///* Render the axes based on the new data */
    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickValues([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    /* Render the tips based on the new data */
    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>"
                + d.values.Full_Name
                + "</strong> <span style='color:red'>"
                + d.values.DTF
                + ", "
                + (Math.round(d.values.Secondary * 100) / 100)
                + "</span>";
        })

    svg.call(tip);

    svg.selectAll(".x.axis").remove();
    svg.selectAll("text").remove();

    var xAxisHeight = (d3.select("#dataFilter").property("value") == "MigrationData") ? y(0) : height;

    /* Add the two axes */
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + xAxisHeight + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

    svg.selectAll(".y.axis")
        .call(yAxis);

    svg.selectAll(".x.axis")
        .call(xAxis);

    var circle = svg.selectAll("circle")
        .data(fraserTestArray);

    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("Ease of Doing Business (/100)");

    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)");


    circle.enter()
        .append("circle")
        .style("fill", "gray")
        .style("stroke", "black")
        .attr("r", 2.5)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide);

    circle.exit()
        .remove();

    circle
        .transition()
        .duration(1500)
        .attr("cx", function(d) {
            if (d == null) {
                //console.log(" x is null")
            } else if (d.values == null) {
                //console.log("x.values is null")
            } else {
                //console.log(d.name + " x " + d.values.DTF);
                return x(d.values.DTF);
            };
        })
        .attr("cy", function(d) {
            if (d == null) {
                //console.log("y is null")
            } else if (d.values == null) {
                //console.log("y.values is null")
            } else {
                //console.log(d.name + " y " + d.values.Secondary);
                return y(d.values.Secondary);
            };
        })
        .attr("r", 3);
}