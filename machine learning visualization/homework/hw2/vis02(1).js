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

function draw_regression(wrapper, data)
{
  let svg = add_svg(wrapper);

  let y = data["y"]
  let y_pred = data["y_pred"]
  let coef = data["coef"]

  let x_min = d3.min(y)
  let x_max = d3.max(y)

  let scalex = d3.scaleLinear().domain([x_min, x_max]).range([0, svg.attr("width")]);  
  let x_axis = d3.axisBottom().scale(scalex);  

  svg.append('g')
    .attr("class", "x_axis")
    .attr("transform", "translate(30, " + (svg.attr("height") - 20) + ")")
    .call(x_axis);

  let y_min = d3.min(y_pred)
  let y_max = d3.max(y_pred)    

  let scaley = d3.scaleLinear()
    .domain([y_min, y_max])
    .range([svg.attr("height") - 22, 3]);
  let y_axis = d3.axisLeft().scale(scaley);  

  svg.append('g')
    .attr("class", "y_axis")
    .attr("transform", "translate(30, 0)")
    .call(y_axis);

  let points = y.map(function (value, index) {
    return [value, y_pred[index]];
  });

  svg.selectAll("dot")
    .data(points)
    .enter()
    .append("circle")
    .attr("r", 3.5)
    .attr("cx", function (d) { return Number(scalex(d[0])) + 30; })
    .attr("cy", function (d) { return Number(scaley(d[1])); })
    .style("fill", "#69b3a2");

  svg.append('line')
    .attr('x1', Number(scalex(x_min)) + 30) 
    .attr('y1', Number(scaley(y_min)))
    .attr('x2', Number(scalex(x_max)) + 30)
    .attr('y2', Number(scaley(y_max)))
    .attr('stroke', '#ff6d69')
    .attr('stroke-width', 3)  
}