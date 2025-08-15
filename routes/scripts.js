const express = require("express");
const router = express.Router();
const {
  Video,
  Action,

  Script,
  //   SyncContract,
  ContractScriptVideo,
} = require("kybervision18db");

const { authenticateToken } = require("../modules/userAuthentication");

// POST /scripts/scripting-live-screen/receive-actions-array
router.post(
  "/scripting-live-screen/receive-actions-array",
  authenticateToken,
  async (req, res) => {
    console.log(
      "- accessed POST /scripts/scripting-live-screen/receive-actions-array"
    );
    const user = req.user;

    // TODO:  add Script.timestampReferenceFirstAction
    // TODO:  add Script.isScriptingLive = true

    //   let { actionsArray, matchId, scriptId } = req.body;
    // let { actionsArray, sessionId, scriptId } = req.body;
    let { actionsArray, sessionId } = req.body;

    // console.log(
    //   `--------- sessionId: ${sessionId}, scriptId: ${scriptId} ----`
    // );
    // console.log(`actionsArray: ${JSON.stringify(actionsArray)}`);
    // console.log(
    //   `--------- END sessionId: ${sessionId}, scriptId: ${scriptId} ----`
    // );

    // search actionsArray for earliest timestamp
    const earliestTimestamp = actionsArray.reduce((min, action) => {
      return action.timestamp < min ? action.timestamp : min;
    }, actionsArray[0].timestamp);

    try {
      // if (!scriptId) {
      // Create a new script
      const script = await Script.create({
        sessionId,
        timestampReferenceFirstAction: earliestTimestamp,
        isScriptingLive: true,
      });
      let scriptId = script.id;
      // }

      // Create actions
      await Promise.all(
        actionsArray.map((elem) => {
          const actionObj = {
            ...elem,
            scriptId,
          };
          return Action.upsert(actionObj); // Will insert or update based on timestamp + scriptId
        })
      );

      res.json({
        result: true,
        message: `Actions for scriptId: ${scriptId}`,
        scriptId,
      });
    } catch (error) {
      console.error("Error in /receive-actions-array:", error);
      res.status(500).json({ result: false, error: "Internal Server Error" });
    }
  }
);

// -- > OBE ???
// // 🔹 Get all actions for a script
// router.get("/:scriptId/actions", authenticateToken, async (req, res) => {
//   console.log(`- in GET /scripts/${req.params.scriptId}/actions`);

//   try {
//     const { scriptId } = req.params;
//     // Find all ContractScriptVideos linked to the given scriptId
//     const contractScriptVideos = await ContractScriptVideo.findOne({
//       where: { scriptId },
//     });

//     if (!contractScriptVideos) {
//       return res
//         .status(404)
//         .json({ result: false, message: "No actions found for this script." });
//     }
//     // 🔹 Find the Video associated with this SyncContract
//     const video = await Video.findOne({
//       where: { id: contractScriptVideos.videoId },
//     });

//     if (!video || !video.videoFileCreatedDateTimeEstimate) {
//       return res.status(404).json({
//         result: false,
//         message: "No valid video file creation date found.",
//       });
//     }

//     // Convert videoFileCreatedDateTimeEstimate to a Date object
//     const videoCreatedDate = new Date(video.videoFileCreatedDateTimeEstimate);

//     // Find all Actions linked to these ContractScriptVideos
//     const actions = await Action.findAll({
//       where: { scriptId: contractScriptVideos.id },
//       order: [["timestamp", "ASC"]], // Sort by timestamp for better readability
//     });

//     // 🔹 Compute `timestampModified` for each action
//     const modifiedActions = actions.map((action) => {
//       const actionTimestamp = new Date(action.timestamp);
//       return {
//         ...action.get(), // Get plain object representation of Sequelize instance
//         timestampOriginal: action.timestamp,
//         timestamp: (actionTimestamp - videoCreatedDate) / 1000, // Difference in seconds
//       };
//     });

//     res.json({ result: true, actionsArray: modifiedActions });
//   } catch (error) {
//     console.error("Error fetching actions for script:", error);
//     res.status(500).json({
//       result: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// });

module.exports = router;
