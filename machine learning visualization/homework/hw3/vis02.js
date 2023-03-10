function add_svg(wrapper) 
{
  var svg = d3.select(wrapper).select("svg");

  if (svg.empty())
    svg = d3.select(wrapper).append("svg");
  else
    svg.selectAll("*").remove();

  return svg.attr("width", 300).attr("height", 300);
}

function set_update(div_id, _)
{

  comm.call({n: 5})
  setInterval(function(){ comm.call({n: 5}) }, 2000);
}

function draw_circle(wrapper, data)
{
  let svg = add_svg(wrapper);

  svg.append('circle')
    .attr('cx', 100) 
    .attr('cy', 100)
    .attr('r', 10)
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .attr('fill', '#69a3b2')
    .transition()
    .duration(2500)
    .attr("r", 50)
    .attr("fill", "#b26d69");
}

function draw_boxplot(wrapper, data)
{
  //registering function
  py_callback = new CommAPI("python_callback",
    function (data)
    {
      alert(data['y']);
    });


  var boxplot_width = 30;
  var boxplot_x     = 100;
  var outlier_r     = 3;

  data = data["data"]
  data = data.sort(d3.ascending);

  var q1 = d3.quantile(data, .25);
  var median = d3.quantile(data, .5);
  var q3 = d3.quantile(data, .75);
  var interQuantileRange = q3 - q1;
  var limI = q1 - 1.5 * interQuantileRange;
  var limS = q3 + 1.5 * interQuantileRange;

  var min  = d3.min(data);
  var max  = d3.max(data);
  var mean = d3.mean(data);

  console.log(min, max)

  var x0 = data.find(function(v) {return v >= limI });
  var xf = data.reverse().find(function(v) {return v <= limS });
  var outlier = [];
  outlier = outlier.concat(data.filter(function(v) {return v < limI}));
  outlier = outlier.concat(data.reverse().filter(function(v) {return v > limS}));

  var scaley = d3.scaleLinear().domain([min, max]).range([195, outlier_r]);  
  var y_axis = d3.axisLeft().scale(scaley);  
  var svg    = add_svg(wrapper)

  svg.append('g')
    .attr("class", "y_axis")
    .attr("transform", "translate(30, 0)")
    .call(y_axis); 
    
  var b1 = svg.append('g').attr('class', 'b1');

  b1.append('line')
      .attr('x1', boxplot_x + boxplot_width / 2)              //no centro do rect
      .attr('y1', scaley(xf))
      .attr('x2', boxplot_x + boxplot_width / 2)              //no centro do rect
      .attr('y2', scaley(x0))
      .attr('stroke', 'black')
      .attr('stroke-width', 1)          
  b1.append('rect')
      .attr('x', boxplot_x)
      .attr('y', scaley(q3))
      .attr('width', boxplot_width)
      .attr('height', scaley(q1) - scaley(q3))
      .attr('class', 'box-rect')
      .on('click', function ()
      {
        py_callback.call({ n: 5 })
      });
  b1.selectAll('line.values')
     .data([x0, median, mean, xf])
     .enter()
     .append('line')
     .attr('class', 'values')
     .attr('x1', boxplot_x)             //no inicio do rect
     .attr('y1', function(obj) { return scaley(obj); })
     .attr('x2', boxplot_x + boxplot_width)            //no final do rect
     .attr('y2', function(obj) { return scaley(obj); })
     .attr('stroke',  'black')
     .attr('stroke-width', 1) 
     .attr('stroke-dasharray',  function(obj, index) { return index == 2 ? '2,2' : null; });
  b1.selectAll('circle.outlier')
     .data(outlier)
     .enter()
     .append('circle')
     .attr('class', 'outlier')
     .attr('cx', boxplot_x + boxplot_width / 2)  //no centro do rect
     .attr('cy', function(obj) { return scaley(obj); })
     .attr('r', outlier_r)
     .attr('stroke', 'black')
     .attr('stroke-width', 1)
     .attr('fill', 'none')  
}

function draw_histogram(wrapper, data)
{
  data = data["data"]
  data = data.sort(d3.ascending);

  let svg  = add_svg(wrapper);  
  let min = d3.min(data);
  let max  = d3.max(data);    

  let scalex = d3.scaleLinear().domain([min, max]).range([0, svg.attr("width")]);  
  let x_axis = d3.axisBottom().scale(scalex);  

  svg.append('g')
    .attr("class", "x_axis")
    .attr("transform", "translate(30, " + (svg.attr("height") - 20) + ")")
    .call(x_axis);       

  let histogram = d3.histogram()
      .domain(scalex.domain()) 
      .thresholds(10);

  let bins = histogram(data);
  
  let scaley = d3.scaleLinear()
    .domain([0, d3.max(bins, function (d) { return d.length; })])
    .range([svg.attr("height") - 22, 3]);
  let y_axis = d3.axisLeft().scale(scaley);  

  svg.append('g')
    .attr("class", "y_axis")
    .attr("transform", "translate(30, 0)")
    .call(y_axis);

  svg.selectAll("rect")
      .data(bins)
      .enter()
      .append("rect")
        .attr("x", 32)
        .attr("transform", function(d) { return "translate(" + scalex(d.x0) + "," + scaley(d.length) + ")"; })
        .attr("width", function(d) { return scalex(d.x1) - scalex(d.x0) -1 ; })
        .attr("height", function(d) { return (svg.attr("height") - 20) - scaley(d.length); })
        .attr("class", "hist-rect")
}


function draw_hbar(wrapper, data)
{
  let svg = add_svg(wrapper);
  let data = data['data']

  const width = 1000
  const height = 1000
  const margin = {top: 50, bottom: 10, left: 150, right: 20, title: 60}
  const visWidth = width - margin.left - margin.right
  const visHeight = 800 - margin.top - margin.bottom

  const valExtent = d3.extent(data, d => Math.abs(d.influence))
  const attributeScale = d3.scaleBand().domain(data.map(d => d.name)).range([0, visHeight]).padding(0.5)
  const valScale = d3.scaleLinear().domain(valExtent).range([0, visWidth])
  const yAxis = d3.axisLeft(attributeScale)
  const myfont = {type: "Times New Roman", small: 14, med: 20, large: 30};
  const bar_color = ['blue', 'orange']
  const bar_text = ['white', 'black']
  
  // const svg = d3.create('svg')
  //     .attr('width', visWidth + margin.left + margin.right)
  //     .attr('height', visHeight + margin.top + margin.bottom);
  
  // append a group element and move it left and down to create space
  // for the left and top margins
  const g = svg.append("g")
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // bind our data to rectangles
  g.selectAll('rect')
    .data(data)
    .join('rect')
      // set attributes for each bar
      .attr('x', function(d){ if(d.class === 1){return 5+visWidth/2;} else{return 5+(visWidth/2) - (valScale(Math.abs(d.influence)));} })
      .attr('y', d => attributeScale(d.name))
      .attr('width', d => valScale(Math.abs(d.influence)))
      .attr('height', attributeScale.bandwidth())
      .attr('fill', d => bar_color[d.class]);

  //titles
  svg.append('text')
			.attr('fill', bar_color[0])
			.attr('x', visWidth/2 - margin.title)
			.attr('y', 40)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.large)
			.text("Class 0: <=50k");
  svg.append('text')
			.attr('fill', bar_color[1])
			.attr('x', 230+visWidth/2 - margin.title)
			.attr('y', 40)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.large)
			.text("Class 1: >50k");

  const barinfo = g.append("g")
		  .selectAll("g")
		  .data(data)
		  .join("g")
		  .attr("transform", (d, i) => `translate(410, ${85 + i*108})`);
  barinfo.append("text")  // values
		  .attr('fill', d => bar_color[d.class])
			.attr('x', d => -5 - 20*Math.sign(d.influence))
			.attr('y', 0)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.small)
			.text(d => d.influence);
    barinfo.append("text")   //names
		  .attr('fill', 'black')
			.attr('x', d => -80 + 80*Math.sign(d.influence))
			.attr('y', (d, i) => -50 + 3*i)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.med)
			.text(d => d.name);
  
    // table to the right
    barinfo.append("rect")
		  .attr('fill', d => bar_color[d.class])
      .attr('width', 250)
      .attr('height', 25)
			.attr('x', 190)
			.attr('y', (d, i) => 132 - 80*i);	
    barinfo.append("text")   //names
		  .attr('fill', d => bar_text[d.class])
			.attr('x', 200)
			.attr('y', (d, i) => 150 - 80*i)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.small)
			.text(d => d.name + ":");
    barinfo.append("text")   //values
		  .attr('fill', d => bar_text[d.class])
			.attr('x', 400)
			.attr('y', (d, i) => 150 - 80*i)
			.attr("font-family", myfont.type)
			.attr("font-size", myfont.small)
			.text(d => d.value);
  
  return svg.node();
}

function draw_dep(wrapper, data)
{
  let svg = add_svg(wrapper)
  let data = data['data']
    // set up
  const margin = {top: 50, right: 120, bottom: 50, left: 120};
  const visWidth = 400;
  const visHeight = 400;

  const colorExt = d3.extent(data2, d => d.color)
  const colorScale = d3.scaleDivergingSqrt().domain(colorExt).interpolator(d3.interpolateTurbo)

  const svg = d3.create('svg')
      .attr('width', visWidth + margin.left + margin.right)
      .attr('height', visHeight + margin.top + margin.bottom);

  const g = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // add title  
  g.append("text")
    .attr("x", visWidth / 2)
    .attr("y", -margin.top + 5)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "hanging")
    .attr("font-family", "sans-serif")
    .attr("font-size", "16px")
    .text("Dependency Graph");

  // create scales

  const x = d3.scaleLinear()
      .domain(d3.extent(data2, d => d.x)).nice()
      .range([0, visWidth]);

  const y = d3.scaleLinear()
      .domain(d3.extent(data2, d => d.y)).nice()
      .range([visHeight, 0]);

  // create and add axes

  const xAxis = d3.axisBottom(x);

  g.append("g")
      // move to bottom of chart
      .attr("transform", `translate(0, ${visHeight})`)
      // add axis
      .call(xAxis)
      // remove baseline from axis
      .call(g => g.select(".domain").remove())
      // add grid lines
      // refernces https://observablehq.com/@d3/connected-scatterplot
      .call(g => g.selectAll('.tick line')
        .clone()
          .attr('stroke', '#d3d3d3')
          .attr('y1', -visHeight)
          .attr('y2', 0))
    // add title
    .append("text")
      .attr("x", visWidth / 2)
      .attr("y", 40)
      .attr("fill", "black")
      .attr("text-anchor", "middle")
      .text("XAXIS");

  const yAxis = d3.axisLeft(y);

  g.append("g")
      // add axis
      .call(yAxis)
      // remove baseline from axis
      .call(g => g.select(".domain").remove())
      // add grid lines
      // refernces https://observablehq.com/@d3/connected-scatterplot
      .call(g => g.selectAll('.tick line')
        .clone()
          .attr('stroke', '#d3d3d3')
          .attr('x1', 0)
          .attr('x2', visWidth))
    // add title
    .append("text")
      .attr("x", -40)
      .attr("y", visHeight / 2)
      .attr("fill", "black")
      .attr("dominant-baseline", "middle")
      .text("YAXIS");

  // draw points

  g.append("g")
    .selectAll("circle")
    .data(data2)
    .join("circle")
      .attr("cx", d => x(d.x))
      .attr("cy", d => y(d.y))
      .attr("fill", d => colorScale(d.color))
      .attr("r", 3);

  const colorlegend = g.append("g")
    .selectAll("g")
    .data(colorExt)
    .join("g")
      .attr("transform", (d, i) => `translate(650, ${360 + i*15*2.8})`);
  
  colorlegend.append("circle")
    .attr("r", 15)
    .attr("fill", d => colorScale(d));

  colorlegend.append("text")
    .attr("dominant-baseline", "right")
    .attr("x", 20)
    .attr("y", 5)
    .text(d => d + "%");

  return svg.node();
}