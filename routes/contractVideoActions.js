const {
  // ContractScriptVideo,
  ContractVideoAction,
  Action,
} = require("kybervision17db");
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../modules/userAuthentication");

// POST /contract-video-actions/scripting-sync-video-screen/update-delta-time-all-actions-in-script/:scriptId
router.post(
  "/scripting-sync-video-screen/update-delta-time-all-actions-in-script/:scriptId",
  authenticateToken,
  async (req, res) => {
    console.log(
      `- in POST /scripting-sync-video-screen/update-delta-time-all-actions-in-script/${req.params.scriptId}`
    );

    const { newDeltaTimeInSeconds } = req.body;
    console.log(`newDeltaTimeInSeconds: ${newDeltaTimeInSeconds}`);

    const actionsArray = await Action.findAll({
      where: { scriptId: req.params.scriptId },
      order: [["timestamp", "ASC"]],
      include: [ContractVideoAction],
    });

    if (!actionsArray) {
      return res.status(404).json({
        result: false,
        message: `Actions not found`,
        scriptId: req.params.scriptId,
      });
    }

    for (let i = 0; i < actionsArray.length; i++) {
      const contractVideoAction = actionsArray[i].ContractVideoActions[0];
      if (contractVideoAction) {
        contractVideoAction.deltaTimeInSeconds = newDeltaTimeInSeconds;
        await contractVideoAction.save();
      }
    }

    res.json({
      result: true,
      message: `ContractVideoAction modified with success`,
      contractVideoActionId: req.params.contractVideoActionId,
    });
  }
);

module.exports = router;
