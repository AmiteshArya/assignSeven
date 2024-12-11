// Import React and D3
import React, { Component } from "react";
import * as d3 from "d3";

// Main Dashboard Component
class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      selectedTweets: [],
      colorMode: "Sentiment",
    };
    this.svgRef = React.createRef();
  }

  handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const jsonData = JSON.parse(e.target.result);
        this.setState({ data: jsonData.slice(0, 300) }, this.createVisualization);
      };
      reader.readAsText(file);
    }
  };

  createVisualization = () => {

    
    const { data, colorMode } = this.state;
    const svg = d3.select(this.svgRef.current);
    const width = 800;
    const height = 600;

    if (!svg.selectAll("circle").empty()) return; 


    // Clear SVG for re-rendering
    svg.selectAll("*").remove();

    // Set up scales
    const sentimentColorScale = d3
      .scaleLinear()
      .domain([-1, 0, 1])
      .range(["red", "#ECECEC", "green"]);

    const subjectivityColorScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range(["#ECECEC", "#4467C4"]);

    const colorScale =
      colorMode === "Sentiment" ? sentimentColorScale : subjectivityColorScale;

    const radius = 7.5;

    // Group tweets by month
    const months = [...new Set(data.map((d) => d.Month))];
    const monthScale = d3
      .scaleBand()
      .domain(months)
      .range([0, height])
      .padding(0.2);

    // Create force layout
    const simulations = months.map((month) => {
      const monthData = data.filter((d) => d.Month === month);

      const simulation = d3.forceSimulation(monthData)
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(() => monthScale(month) + monthScale.bandwidth() / 2).strength(1))
        .force("collide", d3.forceCollide(radius + 1))
        .stop();

      for (let i = 0; i < 300; ++i) simulation.tick();

      return { month, nodes: monthData };
    });

    months.forEach((month) => {
      svg.append("text")
        .attr("x", 10)
        .attr("y", monthScale(month) + monthScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .text(month)
        .style("font-size", "16px")
        .style("font-weight", "bold");
    });

    const addTweet = (tweet) => {
      this.setState({selectedTweets: [...this.state.selectedTweets, tweet]});
    }
    const removeTweet = (tweet) => {
      this.setState({selectedTweets: this.state.selectedTweets.filter(existingTweet => existingTweet !== tweet)})
    }

    // Draw circles
    simulations.forEach(({ month, nodes }) => {
      svg
        .selectAll(`.circle-${month}`)
        .data(nodes)
        .enter()
        .append("circle")
        .attr("cx", (d) => d.x)
        .attr("cy", (d) => d.y)
        .attr("r", radius)
        .attr("fill", (d) => colorScale(d[colorMode]))
        .attr("stroke", "none")
        .on("click", function (event, d) 
        {
          if (this.style.stroke  === "transparent") {
          d3.select(this).style("stroke", 'black');
          addTweet(d.RawTweet);
        }
        else {
          d3.select(this).style("stroke", 'transparent');
          removeTweet(d.RawTweet);
        }
      }
       );
    });


    this.createGradientLegend(svg, colorMode, width, height);

  };


  

  

  createGradientLegend = (svg, colorMode, width, height) => {
    // Remove any existing legend
  svg.select(".sectioned-legend").remove();

  // Define the color scales
  const sentimentColorScale = d3.scaleLinear().domain([-1, 0, 1]).range(["green", "#ECECEC", "red"]);
  const subjectivityColorScale = d3.scaleLinear().domain([0, 1]).range(["#4467C4", "#ECECEC" ]);

  const colorScale = colorMode === "Sentiment" ? sentimentColorScale : subjectivityColorScale;

  // Legend parameters
  const legendHeight = 150; // Total height of the legend
  const legendWidth = 20; // Width of each rectangle
  const numSections = 10; // Number of discrete sections
  const sectionHeight = legendHeight / numSections; // Height of each section

  // Compute value range for each section
  const valueRange =
    colorMode === "Sentiment"
      ? d3.range(-1, 1.01, (2 / numSections)) // Sentiment: [-1, 1]
      : d3.range(0, 1.01, (1 / numSections)); // Subjectivity: [0, 1]

  // Create a group for the legend
  const legendGroup = svg.append("g").attr("class", "sectioned-legend").attr("transform", `translate(${width - 50}, ${height / 4})`);

  // Add rectangles for each section
  valueRange.forEach((value, i) => {
    legendGroup
      .append("rect")
      .attr("x", 0)
      .attr("y", i * sectionHeight)
      .attr("width", legendWidth)
      .attr("height", sectionHeight)
      .style("fill", colorScale(value));
  });

  // Add labels for the top and bottom of the legend
  legendGroup
    .append("text")
    .attr("x", legendWidth + 5)
    .attr("y", -5)
    .text(colorMode === "Sentiment" ? "Positive" : "Subjective")
    .style("font-size", "12px")
    .style("text-anchor", "start");

  legendGroup
    .append("text")
    .attr("x", legendWidth + 5)
    .attr("y", legendHeight + 10)
    .text(colorMode === "Sentiment" ? "Negative" : "Objective")
    .style("font-size", "12px")
    .style("text-anchor", "start");
  };
  

  
  updateColors = () => {
    const {  colorMode } = this.state;
    
    // Define updated color scale
    const sentimentColorScale = d3.scaleLinear().domain([-1, 0, 1]).range(["red", "#ECECEC", "green"]);
    const subjectivityColorScale = d3.scaleLinear().domain([0, 1]).range(["#ECECEC", "#4467C4"]);
    
    const colorScale = colorMode === "Sentiment" ? sentimentColorScale : subjectivityColorScale;
  
    // Update fill colors of existing circles
    const svg = d3.select(this.svgRef.current);

    d3.select(this.svgRef.current)
      .selectAll("circle")
      .transition()
      .duration(500)
      .attr("fill", (d) => colorScale(d[colorMode]));


    this.createGradientLegend(svg, colorMode, 800, 600);

      
  };

  
  handleColorModeChange = (event) => {
    const colorMode = event.target.value;
    this.setState({ colorMode }, this.updateColors);
  };

  render() {
    
    const { data, selectedTweets, colorMode } = this.state;
    return (
      <div>
        <div style={{ backgroundColor: "#f0f0f0", padding: 20 }}>
          <h2>Upload a JSON File</h2>
          <form onSubmit={this.handleFileSubmit}>
            <input type="file" accept=".json" onChange={this.handleFileUpload} />
          </form>
        </div>

         {data.length > 0 && (<>
          <div style={{ fontSize: "16px", fontWeight:'bold'}} >
            <label >Color by: </label>
            <select value={colorMode} onChange={this.handleColorModeChange}>
              <option value="Sentiment">Sentiment</option>
              <option value="Subjectivity">Subjectivity</option>
            </select>
          </div>
          <svg ref={this.svgRef} width={850} height={600}></svg>
          <div>
            <ul>
              {selectedTweets.map((tweet) => (
                <li key={tweet.Idx}>{tweet}</li>
              ))}
            </ul>
          </div>
          </>)}
      </div>
    );
  }
}

export default Dashboard;
