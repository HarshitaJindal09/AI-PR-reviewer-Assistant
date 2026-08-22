const express = require("express");

const {
    analyzePullRequest
} = require("../controllers/review.controller");

const router = express.Router();

router.post("/", analyzePullRequest);

module.exports = router;