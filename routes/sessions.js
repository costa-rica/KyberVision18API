const express = require("express");
var router = express.Router();
const {
  Action,
  Script,
  // ContractScriptVideo,
  ContractVideoAction,
  Session,
  ContractLeagueTeam,
  ContractUserAction,
} = require("kybervision18db");
const { authenticateToken } = require("../modules/userAuthentication");
// const { createEstimatedTimestampStartOfVideo } = require("../modules/scripts");
const {
  createEstimatedTimestampStartOfVideo,
} = require("../modules/contractVideoAction");
const {
  createUniquePlayerNamesArray,
  createUniquePlayerObjArray,
} = require("../modules/players");

// POST /sessions/review-selection-screen/get-actions
router.post(
  "/review-selection-screen/get-actions",
  authenticateToken,
  async (req, res) => {
    console.log(`- in POST /sessions/review-selection-screen/get-actions`);

    try {
      const { sessionId, videoId } = req.body;

      // Step 1: Find all Scripts linked to this sessionId
      const scriptsArray = await Script.findAll({
        where: { sessionId },
      });

      // Step 2: Find all Actions linked to this sessionId and this videoId
      // -- > for each script make an array of actions with the correct timestampFromStartOfVideo
      let actionsArrayByScript = [];
      for (let i = 0; i < scriptsArray.length; i++) {
        const actionsArray = await Action.findAll({
          where: { scriptId: scriptsArray[i].id },
          order: [["timestamp", "ASC"]],
          include: [ContractVideoAction],
        });

        // 👇 Make map callback async and wrap in Promise.all --> needed for favorite
        const modifiedActionsArray = await Promise.all(
          actionsArray.map(async (action, index) => {
            const {
              ContractVideoActions,
              ...actionWithoutContractVideoActions
            } = action.toJSON();

            const contractVideoActionOfThisVideo = ContractVideoActions.find(
              (contractVideoAction) =>
                contractVideoAction.videoId === Number(videoId)
            );

            const differenceInTimeActionMinusTimestampReferenceFirstAction =
              (actionWithoutContractVideoActions.timestamp -
                scriptsArray[i].timestampReferenceFirstAction) /
              1000;

            // 🔹 now we can await here
            const contractUserActionObj = await ContractUserAction.findOne({
              where: {
                actionId: actionWithoutContractVideoActions.id,
                userId: req.user.id,
              },
            });

            const favorite = contractUserActionObj ? true : false;

            return {
              ...actionWithoutContractVideoActions,
              timestampReferenceFirstAction:
                scriptsArray[i].timestampReferenceFirstAction,
              timeDeltaInSeconds:
                contractVideoActionOfThisVideo.deltaTimeInSeconds,
              timestampFromStartOfVideo:
                differenceInTimeActionMinusTimestampReferenceFirstAction +
                contractVideoActionOfThisVideo.deltaTimeInSeconds,
              favorite,
            };
          })
        );

        actionsArrayByScript.push({
          scriptId: scriptsArray[i].id,
          actionsArray: modifiedActionsArray,
        });
      }
      // for (let i = 0; i < scriptsArray.length; i++) {
      //   const actionsArray = await Action.findAll({
      //     where: { scriptId: scriptsArray[i].id },
      //     order: [["timestamp", "ASC"]],
      //     include: [ContractVideoAction],
      //   });
      //   const modifiedActionsArray = actionsArray.map((action, index) => {
      //     const { ContractVideoActions, ...actionWithoutContractVideoActions } =
      //       action.toJSON();

      //     const contractVideoActionOfThisVideo = ContractVideoActions.find(
      //       (contractVideoAction) =>
      //         contractVideoAction.videoId === Number(videoId)
      //     );

      //     const differenceInTimeActionMinusTimestampReferenceFirstAction =
      //       (actionWithoutContractVideoActions.timestamp -
      //         scriptsArray[i].timestampReferenceFirstAction) /
      //       1000;

      //     const contractUserActionObj = await ContractUserAction.findOne({
      //       where: {
      //         actionId: actionWithoutContractVideoActions.id,
      //         userId: req.user.id,
      //       },
      //     });
      //     const favorite = contractUserActionObj ? true : false;

      //     return {
      //       // remove ContractVideoAction from action
      //       ...actionWithoutContractVideoActions,
      //       timestampReferenceFirstAction:
      //         scriptsArray[i].timestampReferenceFirstAction,
      //       timeDeltaInSeconds:
      //         contractVideoActionOfThisVideo.deltaTimeInSeconds,
      //       timestampFromStartOfVideo:
      //         differenceInTimeActionMinusTimestampReferenceFirstAction +
      //         contractVideoActionOfThisVideo.deltaTimeInSeconds,
      //       favorite,
      //     };
      //   });
      //   actionsArrayByScript.push({
      //     scriptId: scriptsArray[i].id,
      //     actionsArray: modifiedActionsArray,
      //   });
      // }

      // Step 3: Merge all The actionsArrayByScript into one array
      const actionsArrayMerged = actionsArrayByScript
        .map((script) => script.actionsArray)
        .flat();

      // Step 4: Sort by timestampFromStartOfVideo
      actionsArrayMerged.sort(
        (a, b) => a.timestampFromStartOfVideo - b.timestampFromStartOfVideo
      );

      // Step 5: Add the reviewVideoActionsArrayIndex for each action
      actionsArrayMerged.forEach((action, index) => {
        action.reviewVideoActionsArrayIndex = index + 1;
      });

      // Step 6: Get unique player objects
      const uniqueListOfPlayerObjArray = await createUniquePlayerObjArray(
        actionsArrayMerged
      );

      res.json({
        result: true,
        sessionId,
        videoId,
        actionsArray: actionsArrayMerged,
        // actionsArray: actionsArrayByScript,
        playerDbObjectsArray: uniqueListOfPlayerObjArray,
      });
    } catch (error) {
      console.error("❌ Error fetching scripts for sessionId:", error);
      res.status(500).json({
        result: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

// GET /sessions/:teamId
router.get("/:teamId", authenticateToken, async (req, res) => {
  console.log(`- in GET /sessions/${req.params.teamId}`);

  try {
    const { teamId } = req.params;
    console.log(`teamId: ${teamId}`);

    // 🔹 Find all Sessions linked to this teamId
    const sessionsArray = await Session.findAll({
      where: { teamId },
      // attributes: [
      //   "id",
      //   "contractLeagueTeamId",
      //   "teamId",
      //   "sessionDate",
      //   "createdAt",
      //   "updatedAt",
      //   "city",
      // ],
    });

    // console.log(`sessionsArray: ${JSON.stringify(sessionsArray)}`);

    if (sessionsArray.length === 0) {
      return res.json({ result: true, sessionsArray: [] });
    }

    // console.log(`✅ Found ${sessions.length} sessions`);
    // console.log(
    //   `sessionDate: ${sessionsArray[0].sessionDate} ${typeof sessionsArray[0]
    //     .sessionDate}`
    // );

    // ---- KEEP THIS ------
    // Format sessionDateString for each session
    const formattedSessionsArray = sessionsArray.map((session) => {
      const date = new Date(session.sessionDate);
      const day = date.getDate().toString().padStart(2, "0"); // "15"
      const month = date.toLocaleString("fr-FR", { month: "short" }); // "mar"
      const hour = date.getHours().toString().padStart(2, "0"); // "20"
      const minute = date.getMinutes().toString().padStart(2, "0"); // "00"

      return {
        ...session.toJSON(),
        sessionDateString: `${day} ${month} ${hour}h${minute}`, // "15 mar 20h00"
        sessionDate: date,
      };
    });
    // ---- [end] KEEP THIS ------

    // console.log(
    //   `formattedSessionsArray: ${JSON.stringify(formattedSessionsArray)}`
    // );

    res.json({ result: true, sessionsArray: formattedSessionsArray });
  } catch (error) {
    console.error("❌ Error fetching sessions for teamId:", error);
    res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// POST /sessions/create
router.post("/create", authenticateToken, async (req, res) => {
  console.log(`- in POST /sessions/create`);

  try {
    const {
      teamId,
      sessionDate,
      contractLeagueTeamId,
      sessionName,
      sessionCity,
    } = req.body;
    const city = "Practice";
    console.log(`teamId: ${teamId}`);
    console.log(`sessionDate: ${sessionDate}`);
    console.log(`city: ${city}`);
    // console.log(`contractLeagueTeamId: ${contractLeagueTeamId}`);

    // find contractLeagueTeam For now use default League
    const contractLeagueTeam = await ContractLeagueTeam.findOne({
      where: { id: 1 },
    });

    // 🔹 Create new Session
    const sessionNew = await Session.create({
      teamId,
      sessionDate,
      city: sessionCity,
      contractLeagueTeamId: contractLeagueTeam.id,
      sessionName,
    });

    console.log(`sessionNew: ${JSON.stringify(sessionNew)}`);

    // // Format sessionDateString for each session
    // const formattedSessionsArray = sessionsArray.map((session) => {
    //   const date = new Date(session.sessionDate);
    //   const day = date.getDate().toString().padStart(2, "0"); // "15"
    //   const month = date.toLocaleString("fr-FR", { month: "short" }); // "mar"
    //   const hour = date.getHours().toString().padStart(2, "0"); // "20"
    //   const minute = date.getMinutes().toString().padStart(2, "0"); // "00"

    //   return {
    //     ...session.toJSON(),
    //     sessionDateString: `${day} ${month} ${hour}h${minute}`, // "15 mar 20h00"
    //   };
    // });

    // Format sessionDateString for sessionNew
    const formattedSessionNew = {
      ...sessionNew.toJSON(),
      sessionDateString: `${sessionNew.sessionDate
        .getDate()
        .toString()
        .padStart(2, "0")} ${sessionNew.sessionDate.toLocaleString("fr-FR", {
        month: "short",
      })} ${sessionNew.sessionDate
        .getHours()
        .toString()
        .padStart(2, "0")}h${sessionNew.sessionDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`, // "15 mar 20h00"
    };

    console.log(`formattedSessionNew: ${JSON.stringify(formattedSessionNew)}`);

    res.json({ result: true, sessionNew: formattedSessionNew });
  } catch (error) {
    console.error("❌ Error creating session:", error);
    res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// This is used for the mobile ScriptingSyncVideo Screen (after the user has selected a video)
// GET /sessions/scripting-sync-video/:sessionId/actions
router.get(
  "/scripting-sync-video/:sessionId/actions",
  authenticateToken,
  async (req, res) => {
    console.log(
      `- in GET sessions/scripting-sync-video/${req.params.sessionId}/actions`
    );
    try {
      const { sessionId } = req.params;
      // const sessionId = 2;

      // 🔹 Find all Scripts linked to this sessionId
      const scriptsArray = await Script.findAll({
        where: { sessionId },
        attributes: ["id"], // Only need script IDs
      });

      const actionsArray = await Action.findAll({
        where: { scriptId: scriptsArray.map((script) => script.id) },
        // where: { scriptId: 55 },
        // attributes: ["id", "timestamp", "actionType", "actionValue"], // Only need action IDs
      });

      // console.log(`actionsArray: ${JSON.stringify(actionsArray)}`);

      if (actionsArray.length === 0) {
        return res.status(404).json({
          result: false,
          message: "No actions found for this session.",
        });
      }

      // console.log(`✅ Found ${actionsArray.length} actions`);

      // console.log(
      //   `actionsArray: ${JSON.stringify(actionsArray)}`
      // );

      res.json({ result: true, actionsArray });
    } catch (error) {
      console.error("❌ Error fetching actions for session:", error);
      res.status(500).json({
        result: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

// GET /sessions/scripting-sync-video-screen/get-actions-for-syncing/:sessionId
// This is used for the ScriptingSyncVideo Screen
router.get(
  "/scripting-sync-video-screen/get-actions-for-syncing/:sessionId",
  authenticateToken,
  async (req, res) => {
    console.log("in GET get-actions-for-syncing");
    try {
      const { sessionId } = req.params;
      // const sessionId = 2;

      // Step 1: Find all Scripts linked to this sessionId
      const scriptsArray = await Script.findAll({
        where: { sessionId },
        // attributes: [], // Only need script IDs
      });

      // Step 2: Find all Actions linked to this sessionId
      // -- > this an array of arrays
      // -- > modify so each action has the scriptFirstActionTimestamp and deltaTimeInSeconds
      let actionsArrayByScript = [];
      for (let i = 0; i < scriptsArray.length; i++) {
        // let actionsArray = [];
        const actionsArray = await Action.findAll({
          where: { scriptId: scriptsArray[i].id },
          include: [ContractVideoAction],
        });
        let deltaTimeInSeconds = 0;
        let deltaTimeInSecondsIsSameForAllActions = true;

        const actionsArrayModified = actionsArray.map((action, index) => {
          const { ContractVideoActions, ...actionJSON } = action.toJSON(); // flatten the Sequelize object

          const videoTimestampCalculation =
            (action.timestamp -
              scriptsArray[i].timestampReferenceFirstAction +
              ContractVideoActions[0].deltaTimeInSeconds) /
            1000;

          if (index === 0) {
            deltaTimeInSeconds = ContractVideoActions[0].deltaTimeInSeconds;
          } else {
            if (
              ContractVideoActions[0].deltaTimeInSeconds !== deltaTimeInSeconds
            ) {
              deltaTimeInSecondsIsSameForAllActions = false;
            }
          }

          return {
            ...actionJSON,
            scriptFirstActionTimestamp:
              scriptsArray[i].timestampReferenceFirstAction,
            deltaTimeInSeconds: ContractVideoActions[0].deltaTimeInSeconds,
            videoTimestampCalculation,
          };
        });

        actionsArrayByScript.push({
          scriptId: scriptsArray[i].id,
          actionsArray: actionsArrayModified,
          deltaTimeInSecondsIsSameForAllActions,
          deltaTimeInSeconds,
        });
      }

      // res.json({ result: true, sessionId, formattedScriptsArray });
      res.json({ result: true, sessionId, actionsArrayByScript });
    } catch (error) {
      console.error("❌ Error fetching actions for session:", error);
      res.status(500).json({
        result: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

module.exports = router;
