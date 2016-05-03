// DATA variables - Will be used to the save the loaded CSV data
var DBData = [];
var MigrationData = [];
var CorruptionData = [];
var LifeExpectancyData = [];

// SELECTION variables (super-global)
var country = "AFG";
var year;
var metrics = "corruption";
var choroplethMetric = "db";
var migrationYear;
var countries;

//Global variable to store data
var DoingBiz = [];
//Global variable to store corruption data
var le_corruption_nm = [];
//Global variable to store world flag data
var flag_al2_3 = [];
//Global variable to store Sankey variable
var sankeychart;

// Load data simultaneously
queue()
    .defer(d3.csv, "data/Doing_Business.csv")
    .defer(d3.csv, "data/Net_migration.csv")
    .defer(d3.csv, "data/Corruption.csv")
    .defer(d3.csv, "data/Life_expectancy.csv")
    .defer(d3.csv, "data/DoingBusiness.csv")
    .defer(d3.csv, "data/le_corruption_nm.csv")
    .defer(d3.csv, "data/worldflag_alpha2_alpha3.csv")
    .await(loadData);

// Assign the loaded data values to local storage variables
function loadData(error, data1, data2, data3, data4, data5, data6, data7) {
    if (error) console.log(error);
    else {
        // Doing Business data
        data1.forEach(function (d) {
            d.Calendar_Year = +d.Calendar_Year;
            d.Overall_DTF = +d.Overall_DTF;
            d.SB = +d.SB;
            d.DwCP = +d.DwCP;
            d.RP = +d.RP;
            d.GE = +d.GE;
            d.GC = +d.GC;
            d.PMI = +d.PMI;
            d.PT = +d.PT;
            d.TaB = +d.TaB;
            d.EC = +d.EC;
            d.RI = +d.RI;
        });
        DBData = data1;

        // Migration data
        data2.forEach(function (d) {
            d.CY2007 = parseInt(d.CY2007);
            d.CY2012 = parseInt(d.CY2012);
        });
        MigrationData = data2;

        // Corruption data
        data3.forEach(function (d) {
            d.CY2012 =+d.CY2012;
            d.CY2013 =+d.CY2013;
            d.CY2014 =+d.CY2014;
            d.CY2015 =+d.CY2015;
            d.Transparency_Rank =+d.Transparency_Rank;
        });
        CorruptionData = data3;

        // Life Expectancy data
        data4.forEach(function (d) {
            for (i=2003; i<2015; i++) {
                var j = "CY" + i;
                if (d[j] == 0)
                    d[j] = "undefined";
                else d[j] = +d[j];
            }
        });
        LifeExpectancyData = data4;

        data5.forEach(function (d, i) {
            //Convert data and store it in item variable
            var item = {
                source: d.Indicator,
                ccode: d.CCODE,
                inddesc: d.IndicatorDescription,
                dbyear: d.DBYEAR,
                year: +d.CAL_YEAR,
                target: d.Economy,
                values: +d.value
            };
            //Push data to Global variable
            DoingBiz.push(item);
        });

        //Get corruption data and store it in global variable
        data6.forEach(function (d, i) {
            var item = {countryname: d.country_name,ccode: d.country_code,year: +d.year, trans_rank: d.trans_rank, life_expectancy: d.life_expectancy,net_migration: +d.net_migration};
            le_corruption_nm.push(item);
        });
        //Get corruption data and store it in global variable
        data7.forEach(function (d, i) {
            var item = {country: d.country,alpha2: d.alpha2,alpha3: d.alpha3};
            flag_al2_3.push(item);
        });

        drawReportCard(DBData,DoingBiz,le_corruption_nm,flag_al2_3);
        drawScatter(DBData, MigrationData, CorruptionData, LifeExpectancyData);
        updateDescriptionReportCard();
        prepGraphs()
    }
}

// Updates the "Metric Year" dropdowns with years that are available for both Ease of Doing Business AND the filterMetric
function populateDatepicker() {

    var availableYears = [];
    var yearDropdown = document.getElementById("metricYear");

    // Clear out the old dropdown
    for(var k=yearDropdown.options.length-1; k>=0; k--) {
        yearDropdown.remove(k);
    }

    // Depending on the data source, update the second metric data and the available years
    switch(d3.select("#dataFilter").property("value")) {
        case "DoingBusinessData":
            availableYears = ["2015","2014","2013","2012","2011","2010","2011","2010","2009","2008","2007", "2006"];
            break;
        case "LifeExpectancyData":
            availableYears = ["2014","2013","2012","2011","2010","2009","2008","2007","2006","2005","2004"];
            break;
        case "CorruptionData":
            availableYears = ["2015","2014","2013","2012"];
            break;
        case "MigrationData":
            availableYears = ["2012","2007"];
            break;
    }

    var formatToYear = d3.time.format("%Y");

    // This will create a dropdown with years
    for(var i = 0; i < availableYears.length; i++) {
        var el = document.createElement("option");
        el.textContent = availableYears[i];
        var opt = new Date("01-01-"+availableYears[i]);
        el.value = opt;
        yearDropdown.appendChild(el);
    }

    if (d3.select("#dataFilter").property("value") == "DoingBusinessData") {
        // User selected doing biz (skip scatter plot generation)
        //console.log("User selected doing biz (skipping scatter plot generation)");
    } else {
        filterWorkingData();
    }

    prepGraphs()
}

// Called when the user picks a secondary metric
// Calls populateDatepicker and updateChoropleth
function prepGraphs() {
    updateChoropleth();
    updateScatterIfNotEoDB();
}


function migrationYearFunction() {
    // Define migration year to be used
    if (year > 2009 && year < 2015)
        migrationYear = 'CY2012';
    else if (year < 2010 && year > 2004)
        migrationYear = 'CY2007';
    else migrationYear = 0;
    return migrationYear;
}

function updateScatterIfNotEoDB() {
    if (d3.select("#dataFilter").property("value") == "DoingBusinessData") {
        // User selected doing biz (skip scatter plot generation)
        //console.log("User selected doing biz (skipping scatter plot generation)");
    } else {
        filterWorkingData();
        updateScatterTitle();
    }
}

function updateScatterTitle() {

    var skillsSelect = document.getElementById("dataFilter");
    var filterMetric = skillsSelect.options[skillsSelect.selectedIndex].text;

    // Grab the year they picked from the filterMetric date dropdown
    var bizDate = d3.select("#metricYear").property("value");

    var formatToYear = d3.time.format("%Y");
    searchYear = formatToYear(new Date(bizDate));

    document.getElementById('scatter-title').innerHTML = ("Now viewing: Ease of Doing Business (X axis) vs. " +
        filterMetric +
        " (Y axis) in " +
        searchYear

    )

}
