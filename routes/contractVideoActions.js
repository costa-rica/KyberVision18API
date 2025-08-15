const {
  // ContractScriptVideo,
  ContractVideoAction,
  Action,
} = require("kybervision18db");
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../modules/userAuthentication");

// POST /contract-video-actions/scripting-sync-video-screen/update-delta-time-all-actions-in-script
router.post(
  "/scripting-sync-video-screen/update-delta-time-all-actions-in-script",
  authenticateToken,
  async (req, res) => {
    console.log(
      `- in POST /scripting-sync-video-screen/update-delta-time-all-actions-in-script`
    );

    const { newDeltaTimeInSeconds, scriptId, videoId } = req.body;
    console.log(`newDeltaTimeInSeconds: ${newDeltaTimeInSeconds}`);

    const actionsArray = await Action.findAll({
      where: { scriptId: scriptId },
      order: [["timestamp", "ASC"]],
      include: [ContractVideoAction],
    });

    if (!actionsArray) {
      return res.status(404).json({
        result: false,
        message: `Actions not found`,
        // scriptId: scriptId,
      });
    }

    // get array of ContractVideoActions where actionId is in actionsArray
    const contractVideoActionsArray = await ContractVideoAction.findAll({
      where: {
        actionId: actionsArray.map((action) => action.id),
        videoId: videoId,
      },
    });

    // modify contractVideoActionsArray.deltaTimeInSeconds
    for (let i = 0; i < contractVideoActionsArray.length; i++) {
      contractVideoActionsArray[i].deltaTimeInSeconds = newDeltaTimeInSeconds;
      await contractVideoActionsArray[i].save();
    }

    res.json({
      result: true,
      message: `ContractVideoAction modified with success`,
      scriptId: scriptId,
    });
  }
);

module.exports = router;
