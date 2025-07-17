const { ContractScriptVideo } = require("kybervision17db");
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../modules/userAuthentication");

// POST /contract-script-video/modify-delta-time/:contractScriptVideoId
router.post(
  "/modify-delta-time/:contractScriptVideoId",
  authenticateToken,
  async (req, res) => {
    console.log(
      `- in POST /contract-script-video/modify-delta-time/${req.params.contractScriptVideoId}`
    );

    const { newDeltaTimeInSeconds } = req.body;

    const contractScriptVideo = await ContractScriptVideo.findByPk(
      req.params.contractScriptVideoId
    );

    contractScriptVideo.deltaTimeInSeconds = newDeltaTimeInSeconds;
    await contractScriptVideo.save();

    if (!contractScriptVideo) {
      return res.status(404).json({
        result: false,
        message: `ContractScriptVideo not found`,
        contractScriptVideoId: req.params.contractScriptVideoId,
      });
    }

    res.json({
      result: true,
      message: `ContractScriptVideo modified with success`,
      contractScriptVideoId: req.params.contractScriptVideoId,
    });
  }
);

module.exports = router;
