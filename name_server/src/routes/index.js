const express = require('express');
const Suggestion = require('../models/suggestion');
const Query = require('../models/query');

const router = express.Router();

router.get("/test", async (req, res) => {
  const result = {
    result: 'OK'
  };

  res.status(200).json(result);
});

router.post("/suggestions", async (req, res) => {
    const suggestions = req.body.map(item => ({...item, timestamp: Date.now()}));

    suggestions.forEach(async (item) => {
      const suggestion = new Suggestion(item);
      const mongoResponse = await suggestion.save();
    })

    res.status(201).json(suggestions);
});

// stash (completely anonymized) user queries to better understand where people are looking
router.post("/query", async (req, res) => {
  const qyeryData= {...req.body, timestamp: Date.now()};
  const query = new Query(qyeryData);
  const mongoResponse = await query.save();

  res.status(201).json(qyeryData);
});


module.exports = { router };