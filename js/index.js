import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldHigh from "@amcharts/amcharts4-geodata/worldHigh";

require("babel-polyfill");

const countryMap = require("../country.json");
const countryId = Object.entries(countryMap).map(item => {
  return {
    name: item[1],
    code: item[0]
  };
});

const red = [
  "#ffebee",
  "#ffcdd2",
  "#ef9a9a",
  "#e57373",
  "#ef5350",
  "#f44336",
  "#e53935",
  "#d32f2f",
  "#c62828",
  "#b71c1c"
];

const green = "#dcedc8";

const maxLimit = 1000000;

const renderMap = (response, response2) => {
  /**
   * response2 has more date compare to response,
   * use response2 as parent
   * @type {MapChart}
   */

  // High detail map
  const chart = am4core.create("chartdiv", am4maps.MapChart);
  chart.geodata = am4geodata_worldHigh;
  chart.projection = new am4maps.projections.Miller();
  const polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());

  // polygonSeries.mapPolygons.template.polygon.fill = am4core.color(green);
  polygonSeries.data = response2.map(item => {
    const isExistCountry = response.find(
      item2 => item2.countryName === item.country
    );

    /**
     * If only need one source,
     * comment our this checking
     */
    if (isExistCountry) {
      const {
        countryCode,
        countryName,
        confirmed,
        deaths,
        recovered
      } = isExistCountry;

      const active = confirmed - recovered;
      const percentage = Math.floor((active / maxLimit) * 10);

      return {
        id: countryCode,
        name: countryName,
        confirmed,
        deaths,
        recovered,
        fill:
          confirmed > 1 ? am4core.color(red[percentage]) : am4core.color(green)
      };
    } else {
      const { country, cases, deaths } = item;
      const { active } = cases;
      const percentage = Math.floor((active / maxLimit) * 10);
      const id = countryId.find(item => item.name === country);

      return {
        id: (id && id.code) || "",
        name: country,
        confirmed: cases.total || 0,
        deaths: deaths.total || 0,
        recovered: cases.recovered || 0,
        fill:
          cases.total > 1
            ? am4core.color(red[percentage])
            : am4core.color(green)
      };
    }
  });

  console.log(polygonSeries.data);

  const polygonTemplate = polygonSeries.mapPolygons.template;
  polygonTemplate.propertyFields.fill = "fill";
  polygonTemplate.tooltipText =
    "{name}\n" +
    "Recovered: {recovered}\n" +
    "Total: {confirmed}\n" +
    "Death: {deaths}\n";

  polygonSeries.useGeodata = true;
  polygonSeries.mapPolygons.template.events.on("hit", function(ev) {
    chart.zoomToMapObject(ev.target);
  });

  const label = chart.chartContainer.createChild(am4core.Label);
  // polygonSeries.getPolygonById("FR").fill = am4core.color("#f00");
};

const callApi = async () => {
  // https://api.coronatracker.com/v2/analytics/country
  // https://covid-193.p.rapidapi.com/statistics
  const result = await fetch(
    "https://api.coronatracker.com/v2/analytics/country",
    {
      method: "GET"
    }
  )
    .then(data => {
      return data.json();
    })
    .catch(err => {
      console.log(err);
    });

  const result2 = await fetch("https://covid-193.p.rapidapi.com/statistics", {
    method: "GET",
    headers: {
      "x-rapidapi-host": "covid-193.p.rapidapi.com",
      "x-rapidapi-key": "zNTBBUFQ4tmshYZO8OqzD165MNaap1zF9UAjsn0zSYkYw51ATm"
    }
  })
    .then(data => {
      return data.json();
    })
    .catch(err => {
      console.log(err);
    });

  const { response } = result2;

  renderMap(result, response);
};

const init = () => {
  callApi();
};

init();
