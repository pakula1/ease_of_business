/**
 * Created on 4/16/16.
 */
var width = 550,
    height = 400;

var map;
var choroplethMetric;

// Formatting numbers
var formatMigration = d3.format(",.4s");
var formatLifeExpectancy = d3.format(",.0f");


// --> CREATE SVG DRAWING AREA
var svg = d3.select("#choropleth").append("svg")
    .attr("id","choropleth_map")
    .attr("width", width)
    .attr("height", height);

// Initialize projection(mercator)
var projection = d3.geo.mercator()
    .translate([width/2,height/2+60])
    .scale([80]);

// Initialize path based on projection
var path = d3.geo.path()
    .projection(projection);

// Initialize scale for colors in map
var color = d3.scale.quantize()
    .range(["#fff5f0","#fee0d2","#fcbba1","#fc9272","#fb6a4a","#ef3b2c","#cb181d","#a50f15","#67000d"]);

// Initialize legend data
var legend;

var legend_data_colors = [
    color.domain()[0],
    (((1.5 * color.domain()[0]) + (0.5 * color.domain()[1])) / 2),
    ((color.domain()[0] + color.domain()[1]) / 2),
    (((0.5 * color.domain()[0]) + (1.5 * color.domain()[1])) / 2)
];

var legend_data_labels = [
    color.domain()[0],
    (((1.5 * color.domain()[0]) + (0.5 * color.domain()[1])) / 2),
    ((color.domain()[0] + color.domain()[1]) / 2),
    (((0.5 * color.domain()[0]) + (1.5 * color.domain()[1])) / 2),
    color.domain()[1]
];

// Load map
d3.json("data/countries.json", function(error, data1) {
    map = topojson.feature(data1, data1.objects.units).features;
    //console.log("MAP: ",map);
});


function updateChoropleth(){

    // Get user's selection
    choroplethMetric = d3.select("#dataFilter").property("value");

    if (year == null) {
        searchYear = new Date("01-01-2004");
    } else {
        searchYear = d3.select("#metricYear").property("value");
    }

    console.log("Choropleth filter & year: " + choroplethMetric + " " + searchYear)

    if (year == null) {
        year = 2004;
    } else {
        var formatToYear = d3.time.format("%Y");

        year = formatToYear(new Date(searchYear));
    }

    // Update COLOR SCALE domain

    // DB data set is selected
    if (choroplethMetric == "DoingBusinessData") {
        color.domain([100, 0]);
    }

    // Migration data set is selected
    else if (choroplethMetric == "MigrationData") {
        migrationYearFunction();
        color.domain([d3.max(MigrationData, function (d) {
            return (d[migrationYear]);
        }),
            d3.min(MigrationData, function (d) {
                return (d[migrationYear]);
            })]
        );
    }

    // Corruption data set is selected
    else if (choroplethMetric == "CorruptionData") {
        CYear = "CY"+year;
        color.domain([100,0]);
    }

    // Life Expectancy data set is selected
    else if (choroplethMetric == "LifeExpectancyData") {
        CYear = "CY"+year;
        color.domain([d3.max(LifeExpectancyData, function (d) {return (d[CYear]);}),
            d3.min(LifeExpectancyData, function (d) {return (d[CYear]);})]);
    }


    // Update data for the LEGEND
    legend_data_colors = 0;
    legend_data_colors = [
        color.domain()[0],
        (((1.5 * color.domain()[0]) + (0.5 * color.domain()[1])) / 2),
        ((color.domain()[0] + color.domain()[1]) / 2),
        (((0.5 * color.domain()[0]) + (1.5 * color.domain()[1])) / 2)
    ];

    legend_data_labels = 0;
    legend_data_labels = [
        color.domain()[0],
        (((1.5 * color.domain()[0]) + (0.5 * color.domain()[1])) / 2),
        ((color.domain()[0] + color.domain()[1]) / 2),
        (((0.5 * color.domain()[0]) + (1.5 * color.domain()[1])) / 2),
        color.domain()[1]
    ];

    // FILL country color based on value of selected criterion
    d3.selectAll(".country")
        .transition()
        .duration(500)
        .attr("stroke", function(d){
            if (d.id == country)
            return "#1C7B3E";
            else return "#5e4e53"
        })
        .attr("stroke-width", function(d){
            if (d.id == country)
                return 2;
            else return 0.5
        })
        .attr("stroke-opacity", function(d){
            if (d.id == country)
                return 1;
            else return 0.3
        })
        .attr("fill", function (d) {
            // Define dummy variables
            var value;
            var result = "none";

            // Doing Business dataset selected
            if (choroplethMetric == "DoingBusinessData") {
                for (i = 0; i < DBData.length; i++) {
                    if (DBData[i].Country_Code == d.id && DBData[i].Calendar_Year == year) {
                        value = DBData[i].Overall_DTF;
                        result = color(value);
                    }
                }
                return result;
            }

            // Migration dataset selected
            else if (choroplethMetric == "MigrationData") {
                migrationYearFunction();
                for (i = 0; i < MigrationData.length; i++) {
                    if (MigrationData[i].Country_Code == d.id) {
                        if (isNaN(MigrationData[i][migrationYear]))
                            var result = "none";
                        else {
                            value = MigrationData[i][migrationYear];
                            result = color(value);
                        }
                    }
                }
                return result;
            }

            // Corruption dataset selected
            else if (choroplethMetric == "CorruptionData") {
                CYear = "CY"+year;
                for (i = 0; i < CorruptionData.length; i++) {
                    if (CorruptionData[i].Country_Code == d.id) {
                        if (isNaN(CorruptionData[i][CYear]))
                            var result = "none";
                        else {
                            value = CorruptionData[i][CYear];
                            result = color(value);
                        }
                    }
                }
                return result;
            }

            // Life Expectancy dataset selected
            else if (choroplethMetric == "LifeExpectancyData") {
                CYear = "CY"+year;
                for (i = 0; i < LifeExpectancyData.length; i++) {
                    if (LifeExpectancyData[i].Country_Code == d.id) {
                        if (isNaN(LifeExpectancyData[i][CYear]) || LifeExpectancyData[i][CYear] == 0)
                            var result = "none";
                        else {
                            value = LifeExpectancyData[i][CYear];
                            result = color(value);
                        }
                    }
                }
                return result;
            }
        });

    updateLegend();
    updateDescriptionChoropleth();
    updateDescriptionReportCard();
}

function updateLegend() {

    var legend_text = d3.selectAll(".legend").selectAll("text");

    legend_text
        .attr("x", function (d, index) {
            return index * 100 + 40
        })
        .attr("y", 40)
        .text(function (d,i) {
            if (choroplethMetric == "DoingBusinessData" || choroplethMetric == "CorruptionData")
                return (legend_data_labels[i]);
            else if (choroplethMetric == "MigrationData")
                return formatMigration(legend_data_labels[i]);
            else if (choroplethMetric == "LifeExpectancyData")
                return formatLifeExpectancy(legend_data_labels[i])
        });
}

// Initialize legend for Choropleth
d3.select("#choropleth")
    .append("div")
    .attr("class","sub-title")
    .text("Legend:");

d3.select("#choropleth")
    .append("svg")
    .attr("class","legend")
    .attr("width", width)
    .attr("height", height / 6);

legend = d3.selectAll(".legend");

legend.selectAll("rect")
    .data(legend_data_colors)
    .enter()
    .append("rect")
    .attr("x", function (d, index) {
        return index * 100 + 40
    })
    .attr("y", 5)
    .attr("width", 100)
    .attr("height", 20)
    .attr("fill", function (d) {
        return color(d)
    })
    .attr("stroke", "#5e4e53");

legend.selectAll("text")
    .data(legend_data_labels)
    .enter()
    .append("text")
    .attr("class", "legend_text")
    .attr("x", function (d, index) {
        return index * 100 + 40
    })
    .attr("y", 40)
    .text(function (d) {
        if (choroplethMetric == "DoingBusinessData" || choroplethMetric == "CorruptionData")
            return (d);
        else if (choroplethMetric == "MigrationData")
            return formatMigration(d);
        else if (choroplethMetric == "LifeExpectancyData")
            return formatLifeExpectancy(d)
    });
