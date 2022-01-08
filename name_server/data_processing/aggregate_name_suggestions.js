const dotenv = require("dotenv");
const path = require("path");
const assert = require("assert");
const MongoClient = require("mongodb").MongoClient;

const fs = require("fs");
const csv = require("fast-csv");

dotenv.config({ path: path.join(__dirname, "../.env") });

const unnamedFeatureCounts = [
  {
    $group: {
      _id: "$levelpathid",
      count: {
        $sum: 1,
      },
      route_url: {
        $first: "$route_url",
      },
    },
  },
  {
    $sort: {
      count: -1,
    },
  },
];

const suggestionCounts = [
  {
    $group: {
      _id: "$nameid",
      count: {
        $sum: 1,
      },
      route_url: {
        $push: "$route_url",
      },
      suggestions: {
        $push: "$suggested_name",
      },
    },
  },
  {
    $sort: {
      count: -1,
    },
  },
];

const getExistingOverrides = async (filepath) => {
  let rows = [];

  return new Promise((resolve) => {
    fs.createReadStream(path.join(__dirname, filepath))
      .pipe(csv.parse({ headers: true }))
      .on("error", (error) => console.error(error))
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
};

const runAggregation = async (aggregationPipeline, collection) => {
  return new Promise((resolve) => {
    MongoClient.connect(
      process.env.MONGODB_URL,
      { useNewUrlParser: true, useUnifiedTopology: true },
      function (connectErr, client) {
        assert.equal(null, connectErr);

        const coll = client.db("river_runner").collection(collection);

        coll.aggregate(aggregationPipeline, async (cmdErr, result) => {
          assert.equal(null, cmdErr);

          const aggregationData = await result.toArray();
          client.close();

          resolve(aggregationData);
        });
      }
    );
  });
};

const main = async () => {
  const csvFilepath = "../../public/data/name_overrides.csv";

  const existingOverrides = await getExistingOverrides(csvFilepath);
  const groupedOccurences = await runAggregation(unnamedFeatureCounts, "unnamed_features");
  const groupedSuggestions = await runAggregation(suggestionCounts, "suggestions");

  console.log(groupedSuggestions.filter((d) => d.count > 3));
};

main();
