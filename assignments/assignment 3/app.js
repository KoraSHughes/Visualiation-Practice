const csvUrl = 'https://gist.githubusercontent.com/tanmayasang/b07e0ac7713a3deadd690c2b0ed27453/raw/unemployment-dec-2019@2.csv';
const jsonUrl = 'https://gist.githubusercontent.com/tanmayasang/d647d7831a558aa047cb09dc0c8beec5/raw/gz_2010_us_040_00_20m.json';
// DATA: https://www.bls.gov/web/laus/laumstrk.htm

// Define a light gray background color to be used for the SVG.
// You can change this if you want another background color.
backgroundColors = ['#dcdcdc', '#FFFFFF', '#000000', '#d4d4d4']


// Window stuff
width = 1000
height = 1000
margin = {top: 50, bottom: 50, left: 130, right: 20, title: 60}
visWidth = width - margin.left - margin.right
visHeight = 800 - margin.top - margin.bottom
font_size = [] // small, med, large

const desc = [
		"Graph 1 - Marks(bars), Channels(size/width, hue): I think this is a good way to visualize the data. Bar graphs are optimal for categorical x quantitative data which is what we are seeing here. Ordered categories with the added hue visial aid is effective at both comparing near-by states and evaluating the states with the overall highest-lowest employment. Expressiveness is great although the buckets of data that seem to be equivalent even though its likely just due to the accuracy of the data leaves a little to be desired. Also it is hard to guage specfiic values. Effectiveness is good even if hue is more suited to categorical attributes.",
		"Graph 2 - Marks(bars), Channels(size/width, position, brightness/luminance): Slightly worse visualization that the 1st but still readable. Lower values blend kind of blend with background and are harder to see, reducing effectiveness. Comparisons and ranking can still be done, though smaller rankings can be difficult to compare due to distance from the axis labels. Also the combination of length and position is can be confusing. Expressiveness is passible, effectivness is not optimal but could be worse.",
		"Graph 3 - Marks(square-points), Channels(position): This visualization isn't great but could be worse. The position of the points is intuitive and somewhat effective though is not as expressive as it could be with an aligned length comparison. The distance of the marks from the categorical label makes it difficult to tell which point is which in the case of the states with larger unemployment rates which reduces effectiveness.",
		"Graph 4 - Marks(area), Channels(position, color-intensity): This visualization is rather clear so long as you have an intuitive understanding of the US map. Unemployement rate is pretty difficult to tell with smaller states/territories like Hawaii due to the area being too small. Otherwise this visualization is pretty readable. The use of area marks makes effectiveness high but the use of saturation slightly hinders expressiveness as the comparison of rates between states not adjacent to each other becomes inaccurate and difficult."];
// decode: specify good/bad? effectiveness/expressiveness?


const angles = ['--', '\\', '|', '/'];
function angleify(val, ext) {
	const step = (ext[1]-ext[0])/angles.length;
	const ind = Math.floor((val-ext[0])/step);
	if (ind >= angles.length){
		// console.log(val + " was higher than upper lim so bounding...")
		return angles[angles.length - 1]
	}
	// console.log("Step:" + step + ", ind: " + ind);
	return angles[ind];
}


// Guidelines: make 4 different visualizations; each with 3 different channels, 3 different marks
// for each visdescribe which channesla nd marks and why and is it good/bad

// load the CSV file
d3.csv(csvUrl).then(function(unemployment) {
	// if the CSV file was loaded: the JSON file
	d3.json(jsonUrl).then(function (usaGeo) {
		// single object where the keys are the state names and the values are the unemployment rates
		stateToRate = Object.fromEntries(new Map(unemployment.map(d => [d.state, d.rate])))
		states = Array.from(unemployment.map(d => d.state))
		console.log(unemployment)
				
		// calculate the min and max unemployment rates:
		rateExtent = d3.extent(unemployment, d => d.rate)
		console.log("Rate Extent: " + rateExtent)
		
		// scale stuff
		stateScale = d3.scaleBand().domain(states).range([0, visHeight]).padding(0.2)
		rateScale = d3.scaleLinear().domain([2, rateExtent[1]]).range([0, visWidth])
		xAxis = d3.axisBottom(rateScale).tickFormat(d3.format('~s'))
		yAxis = d3.axisLeft(stateScale)

		rateColor = d3.scaleDivergingSqrt().domain([rateExtent[0], rateExtent[1]+1])  // scaleSequential
		.interpolator(d3.interpolateWarm)
		rateColor2 = d3.scaleDivergingSqrt().domain([rateExtent[0]-1, rateExtent[1]+1])
		.interpolator(d3.interpolateGreys)
		rateColor3 = d3.scaleDivergingSqrt().domain([rateExtent[0], rateExtent[1]+1])
		.interpolator(d3.interpolateReds)

		const myfont = {type: "Times New Roman", small: 14, med: 20, large: 30};

		document.getElementById("intro").innerHTML = "Kora Hughes,  Exercise 3: Graphical Encoding\n";
		document.getElementById("d1").innerHTML = desc[0];
		document.getElementById("d2").innerHTML = desc[1];
		document.getElementById("d3").innerHTML = desc[2]; //d3.create
		document.getElementById("d4").innerHTML = desc[3];


		// *****GRAPH 1*****
		svg1 = d3.select("body")
			.append("svg")
			.attr('width', visWidth + margin.left + margin.right)
		 	.attr('height', visHeight + margin.top + margin.bottom)
			.attr("font-size", myfont.small)
			.attr("style", "background-color:" + backgroundColors[0]);
		// Rectangles		
		const g1 = svg1.append("g")
			.attr('transform', `translate(${margin.left}, ${margin.top})`);
		// bind our data to rectangles
		g1.selectAll('rect').data(unemployment).join('rect')
			// set attributes for each bar
			.attr('x', 0)
			.attr('y', d => stateScale(d.state))
			.attr('width', d => rateScale(d.rate))
			.attr('height', stateScale.bandwidth())
			.attr('fill', d => rateColor(d.rate));

		// add a group for the y-axis
		g1.append('g')
			.call(yAxis)
			.call(g => g.select('.domain').remove())
		// add a label for the y-axis
		.append('text')
			.attr('fill', 'black')
			.attr('x', -80)
			.attr('y', visHeight/2)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.text("State");
		// add a group for the x-axis
		g1.append('g')
			// we have to move this group down to the bottom of the vis
			.attr('transform', `translate(0, ${visHeight})`)
			.call(xAxis)
			.call(g => g.select('.domain').remove())
		// add a label for the x-axis
		.append('text')
			.attr('fill', 'black')
			.attr('x', visWidth/2)
			.attr('y', 35)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.text("Unemployment Rate");
		// title
		svg1.append('text')
			.attr('fill', 'black')
			.attr('x', visWidth/2 - margin.title)
			.attr('y', 40)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.large)
			.text("Unemployment Rate By State");
		// color legend
		g1.append("text")
		  .attr("font-family", myfont.type)
		  .attr("font-size", myfont.med)
		  .attr("x", visWidth-200)
		  .attr("y", 180)
		  .text("Rate:");
		g1.append("text")  // text
		  .attr("font-family", myfont.type)
		  .attr("font-size", myfont.med)
		  .attr("x", visWidth-150)
		  .attr("y", 213)
		  .attr('fill', rateColor(2))
		  .text("2%");
		g1.append("text")  // text
		  .attr("font-family", myfont.type)
		  .attr("font-size", myfont.med)
		  .attr("x", visWidth-150)
		  .attr("y", 270)
		  .attr('fill', rateColor(4))
		  .text("4%");
		g1.append("text")  // text
		  .attr("font-family", myfont.type)
		  .attr("font-size", myfont.med)
		  .attr("x", visWidth-150)
		  .attr("y", 328)
		  .attr('fill', rateColor(6))
		  .text("6%");
		const colorlegend = g1.append("g")
		  .selectAll("g")
		  .data([2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6])
		  .join("g")
		  .attr("transform", (d, i) => `translate(680, ${200 + i*5*2.8})`);
		colorlegend.append("rect")  // squares
		  .attr("width",17)
		  .attr("height",17)
		  .attr("fill", d => rateColor(d));
		

		  
		// *****GRAPH 2*****
		svg2 = d3.select("body").append("svg")
			.attr('width', visWidth + margin.left + margin.right)
		 	.attr('height', visHeight + margin.top + margin.bottom)
			.attr("font-size", myfont.small)
			.attr("style", "background-color:" + backgroundColors[1]);
		// Rectangles		
		const g2 = svg2.append("g")
			.attr('transform', `translate(${margin.left}, ${margin.top})`);
		// bind our data to rectangles
		g2.selectAll('rect').data(unemployment).join('rect')
			// set attributes for each bar
			.attr('x', d => visWidth/2 - rateScale(d.rate)/2)
			.attr('y', d => stateScale(d.state))
			.attr('width', d => rateScale(d.rate))
			.attr('height', stateScale.bandwidth())
			.attr('fill', d => rateColor2(d.rate));

		// add a group for the y-axis
		g2.append('g')
			.call(yAxis)
			.call(g => g.select('.domain').remove())
		// add a label for the y-axis
		.append('text')
			.attr('fill', 'black')
			.attr('x', -80)
			.attr('y', visHeight/2)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.text("State");
		// add a group for the x-axis
		g2.append('g')
			// we have to move this group down to the bottom of the vis
			.attr('transform', `translate(0, ${visHeight})`)
			.call(xAxis)
			.call(g => g.select('.domain').remove())
		// add a label for the x-axis
		.append('text')
			.attr('fill', 'black')
			.attr('x', visWidth/2)
			.attr('y', 35)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.text("Unemployment Rate");
		// title
		svg2.append('text')
			.attr('fill', 'black')
			.attr('x', visWidth/2 - margin.title)
			.attr('y', 40)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.large)
			.text("Unemployment Rate By State");
		// color legend
		g2.append("text")
		  .attr("font-family", myfont.type)
		  .attr("font-size", myfont.med)
		  .attr("x", visWidth-200)
		  .attr("y", 180)
		  .text("Rate:");
		g2.append("text")  // text
		  .attr("font-family", myfont.type)
		  .attr("font-size", myfont.med)
		  .attr("x", visWidth-150)
		  .attr("y", 213)
		  .text("2%");
		g2.append("text")  // text
		  .attr("font-family", myfont.type)
		  .attr("font-size", myfont.med)
		  .attr("x", visWidth-150)
		  .attr("y", 270)
		  .text("4%");
		g2.append("text")  // text
		  .attr("font-family", myfont.type)
		  .attr("font-size", myfont.med)
		  .attr("x", visWidth-150)
		  .attr("y", 328)
		  .text("6%");
		const colorlegend2 = g2.append("g")
		  .selectAll("g")
		  .data([2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6])
		  .join("g")
		  .attr("transform", (d, i) => `translate(680, ${200 + i*5*2.8})`);
		colorlegend2.append("rect")  // squares
		  .attr("width",17)
		  .attr("height",17)
		  .attr("fill", d => rateColor2(d));


		// *****GRAPH 3*****
		svg3 = d3.select("body").append("svg")
			.attr('width', visWidth + margin.left + margin.right)
		 	.attr('height', visHeight + margin.top + margin.bottom)
			.attr("font-size", myfont.small)
			.attr("style", "background-color:" + backgroundColors[0]);
		// Rectangles		
		const g3 = svg3.append("g")
			.attr('transform', `translate(${margin.left}, ${margin.top})`);
		// bind our data to rectangles
		g3.selectAll('circle').data(unemployment).join('circle')
			// set attributes for each bar
			.attr('cx', d => rateScale(d.rate))
			.attr('cy', d => stateScale(d.state) + 5)
			.attr('r', stateScale.bandwidth()/3);
			// .attr('width', stateScale.bandwidth())
			// // .attr('width', (d, i) => 102/i)
			// .attr('height', stateScale.bandwidth());

		// add a group for the y-axis
		g3.append('g')
			.call(yAxis)
			.call(g => g.select('.domain').remove())
		// add a label for the y-axis
		.append('text')
			.attr('fill', 'black')
			.attr('x', -80)
			.attr('y', visHeight/2)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.text("State");
		// add a group for the x-axis
		g3.append('g')
			// we have to move this group down to the bottom of the vis
			.attr('transform', `translate(0, ${visHeight})`)
			.call(xAxis)
			.call(g => g.select('.domain').remove())
		// add a label for the x-axis
		.append('text')
			.attr('fill', 'black')
			.attr('x', visWidth/2)
			.attr('y', 35)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.text("Unemployment Rate");
		// title
		svg3.append('text')
			.attr('fill', 'black')
			.attr('x', visWidth/2 - margin.title)
			.attr('y', 40)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.large)
			.text("Unemployment Rate By State");


		// *****GRAPH 4*****
		svg4 = d3.select('body').append('svg')
			.attr('width', visWidth + margin.left + margin.right)
			.attr('height', visHeight + margin.top + margin.bottom-100)
			.attr("style", "background-color:" + backgroundColors[0]);
		const g4 = svg4.append("g")
			.attr("transform", `translate(${margin.right}, ${margin.top})`);
		// draw map
		projection =  d3.geoAlbers().fitSize([visWidth, visHeight], usaGeo)
		path = d3.geoPath().projection(projection)
		g4.selectAll("path")
			.data(usaGeo.features)
			.join("path")
			.attr("d", path)
			.attr("fill", d => rateColor3(stateToRate[d.properties.NAME]))
			.attr("stroke", backgroundColors[2]);
		// title
		svg4.append('text')
			.attr('fill', 'black')
			.attr('x', visWidth/2 - margin.title)
			.attr('y', 60)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.large)
			.text("Unemployment Rate By State");
		g4.append("rect") // legend background
			.attr('fill', backgroundColors[3])
			.attr('stroke', 'black')
			.attr('stroke-width', 1)
			.attr('x', '760')
			.attr('y', '100')
			.attr('height', '180')
			.attr('width', '100');
		const colorlegend4 = g4.append("g")
			.selectAll("g")
			.data([2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6])
			.join("g")
			.attr("transform", (d, i) => `translate(790, ${140 + i*5*2.8})`);
		colorlegend4.append("rect")  // squares
			.attr("width",17)
			.attr("height",17)
			.attr("fill", d => rateColor3(d));
		g4.append("text")
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.attr("x", visWidth-80)
			.attr("y", 120)
			.text("Rate:");
		g4.append("text")  // text
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.attr("x", visWidth-30)
			.attr("y", 153)
			.attr('fill', rateColor3(2))
			.text("2%");
		g4.append("text")  // text
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.attr("x", visWidth-30)
			.attr("y", 210)
			.attr('fill', rateColor3(4))
			.text("4%");
		g4.append("text")  // text
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.attr("x", visWidth-30)
			.attr("y", 265)
			.attr('fill', rateColor3(6))
			.text("6%");


			// svg4 = d3.select("body")
			// 	.append("svg")
			// 	.attr("width", 600)
			// 	.attr("height", unemployment.length * 10)
			// 	.attr("font-size", myfont.small)
			// 	.attr("style", "background-color:" + backgroundColors[0]);
			// sv4.selectAll('text')
			// 	.data(unemployment)
			// 	.join(enter => enter.append("text")
			// 		.text((d, i) => ("Rank #" + i + ": (" + angleify(d['rate'], rateExtent) + ") " + d['rate'] + " - " + d['state']))
			// 		.attr("x", 10)
			// 		.attr("y", (d, i) => (i * (10) ))
			// 	);

	}, function(reason) {
		console.log(reason); // Error!
		d3.select("body")
			.append("p")
			.text("Could not load JSON data set. See console for more information.");
})
}, function(reason) {
	console.log(reason); // Error!
	d3.select("body")
		.append("p")
		.text("Could not load CSV data set. See console for more information.");
});


