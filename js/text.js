/**
 * Created on 4/24/16.
 */

// Introduction

var generalOverviewText = d3.select("#generalOverview")
    .append("p")
    .attr("class","sub-title")
    .text("Introduction:")
    .append("p")
    .attr("class","text")
    .text("Have you ever wondered how a country's business climate might relate to its non-business life? " + 
        "Does it affect the country's perceived of corruption? " + 
        "How about its international migration, or life expectancy? We created a tool that lets you explore the " + 
        "World Bank's meticulous data from the past decade, so that you can explore patterns and trends for yourself  " + 
        "in the 'business friendly' countries.");

// Section 1 - country data
d3.select("#generalOverview")
    .append("h3")
    .text("Explore the Data - country level");

// Choropleth description
//var textUnderChoropleth = d3.select("#choropleth")
//    .append("p")
//    .attr("class","sub-title")
//    .text("Description of data:")
//    .append("p")
//    .attr("class","text");

function updateDescriptionChoropleth() {
    var text;

    if (choroplethMetric == "db") {
        text = "Doing Business measures ease of business environment for locally owned SMEs. " +
            "Scores range from 100 (easy to do business) to 0 (difficult to do business).";
        if (year < 2009)
        text += " Overall scores for years prior to 2009, are based on a different set of indicators compared to " +
            "scoring in 2009-2015.";
        if (year < 2013)
        text += " For the 11 economies with population above 100Mil (Bangladesh, Brazil, China, Japan, India, Indonesia, " +
            "Mexico, Nigeria, Pakistan, Russian Federation, USA), scoring for years 2004-2012 is based on the largest business city, " +
            "while scoring for 2013-2015 is based on the population-weighted data for the first and second largest " +
            "business cities. Scoring for all other economies is based on the largest business city."

    }

    else if (choroplethMetric == "migration") {
        migrationYearFunction();
        if (migrationYear == 'CY2007')
            text = "Net migration data represent average net migration (immigration plus emigration) for each country " +
                "over the 5-years period (from 2005 to 2009). " +
                "Net migration is showed in absolute numbers.";
        else if (migrationYear == 'CY2012')
            text = "Net migration data represent average net migration (immigration plus emigration) for each country " +
                "over the 5-years period (from 2010 to 2014). " +
                "Net migration is showed in absolute numbers.";
        else text = "Net migration data represent average net migration (immigration plus emigration) for each country " +
                "over the 5-years periods. Data are only available for years 2005-2014. " +
                "Please change your selection below."
    }

    else if (choroplethMetric == "corruption") {
        if (year < 2012)
        text = "Corruption perception index measures the extend of bribery in the country. " +
            "Data are available for years 2012-2015. Please change your selection below.";
        else
        text = "Corruption perception index measures the extend of bribery in the country. " +
            "Scores ranges from 100 (not corrupt) to 0 (highly corrupt)."
    }

    else if (choroplethMetric == "life") {
        text = "Life expectancy shows the number of years a person born in the country is expected to live. Values are absolute and provided in years."
    }

    //textUnderChoropleth.text(text)
}

// Text above report card
var reportDescription = d3.select("#report")
    .append("p")
    .attr("class", "sub-title")
    .text("Explore data for a specific country:")
    .append("p")
    .attr("class", "text");

function updateDescriptionReportCard () {
    var countryName;
    for(i=0; i<LifeExpectancyData.length; i++)
    {
        if (LifeExpectancyData[i].Country_Code == country)
            countryName = LifeExpectancyData[i].Country_Name;
    }
    if (countryName == undefined)
        var text = "There are no data for this country. Please select a different country.";
    else
        var text = "The below report card provides details on performance of " + countryName + " compared to other countries. ";

    //reportDescription.text(text);

}

// Sankey description
d3.select("#descriptionSankey")
.append("p")
.text("Overall score for ease of doing business is based on country's results in 10 individual areas: " +
    "The above diagram provides more insight on these individual indicators, each which " +
    "ranges from 0 (difficult environment) to 100 (easy environment). Overall score is a simple average of all individual scores.");

// Section 2 - comparing data sets
d3.select("#compareDataSets")
    .append("h3")
    .text("Explore the Data - compare datasets")
    .append("h2")
    .append("p")
    .attr("class","text")
    .text("The below scatter plot provides more insight on how the ease of doing business relates to countries' results " +
        "on corruption perception index, life expectancy at birth, and on net migration. Data are displayed for all the " +
        "countries where information is available. View can be modified to compare ease of doing business scores against " +
        "other data sets.");