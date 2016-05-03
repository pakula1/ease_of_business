/**
 * Created by akulap on 4/15/2016.
 */

//set up graph variable with nodes and links
var graph = {"nodes" : [], "links" : []};

function drawReportCard(DBData, DoingBiz, le_corruption_nm, flag_al2_3) {
    // Instantiate visualization objects here
    sankeychart = new SankeyAreaChart("chart-area", DoingBiz);
}

/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _data						-- the
 */

SankeyAreaChart = function(_parentElement, _data){
    this.parentElement = _parentElement;
    this.data = _data;

    this.initVis();
}

SankeyAreaChart.prototype.drawChoropleth = function(){
    var vis = this;
    // Draw map
    countries = d3.select("#choropleth_map").selectAll("path")
        .data(map)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "country");

    // Initialize tooltip and define pop-up text
    var tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
        var name = d.properties.name;
        var DBscore, Migration, Corruption, LifeExpectancy;

        //DB score
        for(i=0; i<DBData.length; i++)
        {
            if (DBData[i].Country_Code == d.id && DBData[i].Calendar_Year == year)
                DBscore = DBData[i].Overall_DTF;
        };

        migrationYearFunction();

        //Migration
        for(i=0; i<MigrationData.length; i++)
        {
            if (MigrationData[i].Country_Code == d.id)
                if (isNaN(MigrationData[i][migrationYear]))
                    Migration = "unknown";
                else
                    Migration = formatMigration(MigrationData[i][migrationYear]);
        };

        CYear = "CY"+year;

        //Corruption
        for(i=0; i<CorruptionData.length; i++)
        {
            if (CorruptionData[i].Country_Code == d.id)
                if (isNaN(CorruptionData[i][CYear]))
                    Corruption = "unknown";
                else
                    Corruption = CorruptionData[i][CYear];

        };

        //Life Expectancy
        for(i=0; i<LifeExpectancyData.length; i++)
        {
            if (LifeExpectancyData[i].Country_Code == d.id)
                if (isNaN(LifeExpectancyData[i][CYear]) || LifeExpectancyData[i][CYear] == 0)
                    LifeExpectancy = "undefined";
                else
                    LifeExpectancy = formatLifeExpectancy(LifeExpectancyData[i][CYear]) + " years";

        };

        return "<b>" + name + "</b><br> Ease of doing business score: " + DBscore +
            "<br> Net migration: " + Migration +
            "<br> Corruption perception: " + Corruption+
            "<br> Life expectancy at birth: " + LifeExpectancy;
    });

    // Set actions: show on hover; then remove; On mouse click change contents of doing business
    countries
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .on('click',function(d){
            country = d.id;

            updateChoropleth();
            vis.ranking = country;
            vis.setSelectedIndex();
            vis.wrangleData();

        });

    svg.call(tip);

    updateChoropleth();
    updateLegend();
    updateDescriptionChoropleth();
}

/*
 * Initialize visualization (static content, e.g. SVG area or axes)
 */

SankeyAreaChart.prototype.initVis = function(){
    var vis = this;

    vis.margin = {top: 42, right: 0, bottom: 20, left: 0};
    vis.width = 600 - vis.margin.left - vis.margin.right;
    vis.height = 480 - vis.margin.top - vis.margin.bottom;

    vis.formatNumber = d3.format(",.0f"),    // zero decimal places
        vis.format = function(d) {
            //     if (d <= 100)  {
            return vis.formatNumber(d);
            //     }
        },
        vis.color = d3.scale.category20();

// append the svg canvas to the page
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("width", vis.width + vis.margin.left + vis.margin.right)
        .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

// Set the sankey diagram properties
    vis.sankey = d3.sankey()
        .nodeWidth(36)
        .nodePadding(40)
        .size([vis.width, vis.height]);

    vis.path = vis.sankey.link();

    // Call visualization - Get initial selection of country and year
    vis.ranking = d3.select("#ranking-type").property("value");
    vis.yearsel = d3.select("#year").property("value");

    //Call Wrangle data
    vis.wrangleData();

    //Call initial Choropleth
    vis.drawChoropleth(DBData);

    // Call visualizationn when country drop down is selected
    d3.select("#ranking-type").on("change", function(){
        country = d3.select("#ranking-type").property("value");
        vis.ranking = d3.select("#ranking-type").property("value");
        vis.yearsel = d3.select("#year").property("value");
        vis.wrangleData();
        updateChoropleth();
    });

    // Call visualizationn when year drop down is selected
    d3.select("#year").on("change", function(){
        vis.ranking = d3.select("#ranking-type").property("value");
        vis.yearsel = d3.select("#year").property("value");
        vis.wrangleData();
    });
};


/*
 * Data wrangling
 */

SankeyAreaChart.prototype.wrangleData = function(){
    var vis = this;

    var newLinks = [];
    var newNodes = [];

    //Default value for doing business score
    vis.titledtf = 0.0;

    //Filter doing business data based on selection of country and year
    DoingBiz.forEach(function(p, i) {
        var Indvalue = .01;
        if (p.ccode == vis.ranking && p.year == vis.yearsel && p.source != 'DTF') {
            if (p.values >0) {
                var Indvalue= p.values
            }
            newLinks.push({
                source: p.inddesc,
                target: p.target,
                value: Indvalue
            });

            newNodes.push({"name": p.inddesc});
            newNodes.push({"name": p.target});
        }
        else if (p.ccode == vis.ranking && p.year == vis.yearsel && p.source == 'DTF') {
            vis.titledtf = p.values;
            vis.countryname = p.target;
        }
    });

    // Default values to be shown when data is not available
    if (newNodes.length == 0) {
        newLinks = [
            {source:'Dealing with Construction Permits', target:vis.ranking, value:.01},
            {source:'Enforcing Contracts', target:vis.ranking, value:.01},
            {source:'Getting Credit', target:vis.ranking, value:.01},
            {source:'Getting Electricity', target:vis.ranking, value:.01},
            {source:'Protecting Minority Investors', target:vis.ranking, value:.01},
            {source:'Paying Taxes', target:vis.ranking, value:.01},
            {source:'Resolving Insolvency', target:vis.ranking, value:.01},
            {source:'Registering Property', target:vis.ranking, value:.01},
            {source:'Starting a Business', target:vis.ranking, value:.01},
            {source:'Trading Across Borders', target:vis.ranking, value:.01}
        ];

        newNodes = [
            {name:'Dealing with Construction Permits'},
            {name:'Enforcing Contracts'},
            {name:'Getting Credit'},
            {name:'Getting Electricity'},
            {name:'Protecting Minority Investors'},
            {name:'Paying Taxes'},
            {name:'Resolving Insolvency'},
            {name:'Registering Property'},
            {name:'Starting a Business'},
            {name:'Trading Across Borders'},
            {name:vis.ranking}
        ];

        vis.titledtf = 'unknown';
    }
    graph.links = newLinks;
    graph.nodes = newNodes;

    // return only the distinct / unique nodes
    graph.nodes = d3.keys(d3.nest()
        .key(function (d) { return d.name; })
        .map(graph.nodes));

    // loop through each link replacing the text with its index from node
    graph.links.forEach(function (d, i) {
        graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
        graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
    });

    //now loop through each nodes to make nodes an array of objects rather than an array of strings
    graph.nodes.forEach(function (d, i) {
        graph.nodes[i] = { "name": d };
    });

    //Call Sankey
    vis.sankey
        .nodes(graph.nodes)
        .links(graph.links)
        .layout(32);

    vis.newDetails = [];

    //Default value of unknown, if value exists it will be overwritten by actual data
    vis.newDetails.push({
        trans_rank: 'unknown',
        life_expectancy: 'unknown',
        net_migration: 'unknown'
    });

    // Get corruption, life expectancy and net migration data to be displayed in report card
    le_corruption_nm.forEach(function(p, i) {
        if (p.ccode == vis.ranking && p.year == vis.yearsel) {
            vis.newDetails = [];

            var net_migration = p.net_migration;
            if (isNaN(p.net_migration)){
                net_migration = 'unknown';
            }

            var trans_rank = p.trans_rank;
            if (isNaN(p.trans_rank)){
                trans_rank = 'unknown';
            }

            var life_expectancy = vis.format(p.life_expectancy);
            if (isNaN(p.life_expectancy)){
                life_expectancy = 'unknown'
            }

            vis.newDetails.push({
                trans_rank: trans_rank,
                life_expectancy: life_expectancy,
                net_migration: net_migration
            });
        }
    });
    //If country flag is not available a default image with name gen.png will be displayed
    vis.alpha2 = 'gen.png';
    // Get flag images for choosen country
    flag_al2_3.forEach(function(p, i) {
        if (p.alpha3 == vis.ranking.toLowerCase()) {
            //https://github.com/stefangabos/world_countries
            vis.alpha2 = p.alpha2+".png"
        }
    });
    vis.updateVis();

}

SankeyAreaChart.prototype.updateVis = function(){
    var vis = this;

    // Sankey title
    var titlelbl = vis.svg.selectAll(".title")
        .data(vis.newDetails);

    // enter text
    titlelbl.enter().append("text")
        .attr("class","title");

    //Dynamically update title
    titlelbl.transition().style("opacity", 0.5).duration(800)
        .attr("x", 0)
        .attr("y", -20)
        .attr("dy", "-.71em")
        .attr("text-anchor", "start")
        .text("Ease of Doing business score for "+ vis.countryname + " in the year "+ vis.yearsel + " is " + vis.titledtf )
        .transition()
        .style("opacity", 1);

    //Remove
    titlelbl.exit().remove();

// Netmigration value
    var netmigration = vis.svg.selectAll(".detail")
        .data(vis.newDetails);

    // Add netmigration text
    netmigration.enter().append("text")
        .attr("class","detail");

    netmigration.transition().style("opacity", 0.5).duration(800)
        .attr("x", 350)
        .attr("y", 100)
        .attr("dy", "-.71em")
        .attr("text-anchor", "start")
        .text(function(d) {
            return "Net Migration: "+ d.net_migration; })
        .transition()
        .style("opacity", 1);

    netmigration.exit().remove();

// Life expectancy value
    var life_expectancy = vis.svg.selectAll(".lexp")
        .data(vis.newDetails);

    life_expectancy.enter().append("text")
        .attr("class","lexp");

    life_expectancy.transition().style("opacity", 0.5).duration(800)
        .attr("x", 350)
        .attr("y", 120)
        .attr("dy", "-.71em")
        .attr("text-anchor", "start")
        .text(function(d) {
            return "Life Expectancy: " + d.life_expectancy; })
        .transition()
        .style("opacity", 1);

    life_expectancy.exit().remove();

    // Corruption value
    var corruption = vis.svg.selectAll(".corr")
        .data(vis.newDetails);

    corruption.enter().append("text")
        .attr("class","corr");

    corruption.transition().style("opacity", 0.5).duration(800)
        .attr("x", 350)
        .attr("y", 140)
        .attr("dy", "-.71em")
        .attr("text-anchor", "start")
        .text(function(d) {
            return "Transparency Rank: "+ d.trans_rank; })
        .transition()
        .style("opacity", 1);

    corruption.exit().remove();

// add in the links
    var link = vis.svg.selectAll(".link")
        .data(graph.links);

    link.enter().append("path")
        .attr("class", "link");
//update
    link.transition().style("opacity", 0.5).duration(800)
        .attr("d", vis.path)
        .style("stroke-width", function (d) {
            return Math.max(1, d.dy);
        })
        .sort(function (a, b) {
            return b.dy - a.dy;
        })
        .transition()
        .style("opacity", 1);

    link.exit().remove();

// add in the nodes
    var node = vis.svg.selectAll(".node")
        .data(graph.nodes);


// add the rectangles for the 10 Indicators
    node.enter().append("rect")
        .attr("class", "node");

    node.transition().style("opacity", 0.5).duration(800)
        .attr("height", function (d) {
        if ((d.name != vis.countryname)&&(d.name.length>3)){
            return d.dy;
        }
        })
        .attr("width", vis.sankey.nodeWidth())
        .style("fill", function (d) {
            return d.color = vis.color(d.name.replace(/ .*/, ""));
        })
        .style("stroke", function (d) {
            return d3.rgb(d.color).darker(2);
        })
        .attr("transform", function (d) {
            if ((d.name != vis.countryname)&&(d.name.length>3)){
                return "translate(" + d.x + "," + d.y + ")";
            }
        })
        .transition()
        .style("opacity", 1);

    node.exit().remove();

// adding flag for choosen country
    var nodeimage = vis.svg.selectAll(".nodeimg")
        .data(graph.nodes);

    nodeimage.enter().append("image")
        .attr("class","nodeimg");

    nodeimage.transition().style("opacity", 0.5).duration(800)
        .attr('xlink:href','img/'+vis.alpha2)
        .attr("x", 505)
        .attr("y", 310)
        .attr("width", 80)
        .attr("height", 80)
        .transition()
        .style("opacity", 1);

    nodeimage.exit().remove();

// add details for each Indicator
    // add in the nodes
    var nodetxt = vis.svg.selectAll(".nodetxt")
        .data(graph.nodes);

    nodetxt.enter().append("text")
        .attr("class", "nodetxt");

    nodetxt.transition().style("opacity", 0.5).duration(800)
        .attr("x", 580)
        .attr("y", function (d) {
            if ((d.name != vis.countryname)&&(d.name.length>3)){
                return d.y + d.dy/2;
            }
            else return 290;

        })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function (d) {
            if (d.value <=100 && d.value >=1 ){
                return d.name+ ": " + vis.format(d.value);
            }
            else if (d.value == 0.01) {
                return d.name+ ": unknown";
            }
            else {
                return d.name;
            }
        })
        .filter(function (d) {
            return d.x < vis.width / 2;
        })
        .attr("x", 6 + vis.sankey.nodeWidth())
        .attr("text-anchor", "start")
        .transition()
        .style("opacity", 1);

    nodetxt.exit().remove();

};

SankeyAreaChart.prototype.setSelectedIndex = function ()
{
    var vis = this;
    s=document.getElementById("ranking-type");

    // Loop through all the items in drop down list
    for (i = 0; i< s.options.length; i++)
    {
        if (s.options[i].value == vis.ranking)
        {
            // Item is found. Set its property and exit
            s.options[i].selected = true;
            break;
        }
    }
    return;
}

/*
//Change dropdown list based on other selection
//https://www.daftlogic.com/information-programmatically-preselect-dropdown-using-javascript.htm
SankeyAreaChart.prototype.setSelectedIndex = function (s, i)
{
    s.options[i-1].selected = true;
    return;
}
    */