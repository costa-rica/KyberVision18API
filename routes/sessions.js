const express = require("express");
var router = express.Router();
const {
  Action,
  Script,
  ContractScriptVideo,
  Session,
} = require("kybervision16db");
const { authenticateToken } = require("../modules/userAuthentication");
const { createEstimatedTimestampStartOfVideo } = require("../modules/scripts");
const {
  createUniquePlayerNamesArray,
  createUniquePlayerObjArray,
} = require("../modules/players");

// 🔹 GET /sessions/:sessionId/actions : Get all actions for a session
// router.get("/:matchId/actions", authenticateToken, async (req, res) => {
router.get("/:sessionId/actions", authenticateToken, async (req, res) => {
  console.log(`- in GET /sessions/${req.params.sessionId}/actions`);

  try {
    const { sessionId } = req.params;

    // 🔹 Find all Scripts linked to this sessionId
    const scripts = await Script.findAll({
      where: { sessionId },
      attributes: ["id"], // Only need script IDs
    });

    console.log(`scripts: ${JSON.stringify(scripts)}`);

    if (scripts.length === 0) {
      return res
        .status(404)
        .json({ result: false, message: "No actions found for this session." });
    }

    // Extract script IDs
    const scriptIds = scripts.map((script) => script.id);
    // console.log(`scriptIds: ${scriptIds}`);

    // 🔹 Find all ContractScriptVideos associated with these Scripts
    const contractScriptVideos = await ContractScriptVideo.findAll({
      where: { scriptId: scriptIds },
      attributes: ["id", "scriptId", "deltaTime"], // Need deltaTime per ContractScriptVideo
    });

    // console.log(`contractScriptVideos: ${JSON.stringify(contractScriptVideos)}`);

    if (contractScriptVideos.length === 0) {
      return res.status(404).json({
        result: false,
        message: "No ContractScriptVideos found for this session.",
      });
    }

    console.log(`✅ Found ${contractScriptVideos.length} ContractScriptVideos`);

    // Create a mapping of scriptId → deltaTime
    const deltaTimeMap = {};
    contractScriptVideos.forEach((sc) => {
      // deltaTimeMap[sc.id] = sc.deltaTime || 0.0; // Default 0.0 if undefined
      deltaTimeMap[sc.scriptId] = sc.deltaTime || 0.0; // Default 0.0 if undefined
    });

    // console.log(`📊 DeltaTime mapping:`, deltaTimeMap);

    // 🔹 Find all Actions linked to these ContractScriptVideos
    const actions = await Action.findAll({
      where: { scriptId: scriptIds },
      order: [["timestamp", "ASC"]],
    });

    // console.log(`actions: ${JSON.stringify(actions)}`);

    if (actions.length === 0) {
      return res.json({ result: true, actions: [] });
    }

    console.log(`✅ Found ${actions.length} actions`);

    // Compute estimated start of video timestamp per action’s ContractScriptVideo deltaTime
    const updatedActions = actions.map((action, index) => {
      const actionDeltaTime = deltaTimeMap[action.scriptId] || 0.0; // Get deltaTime per action’s ContractScriptVideo
      const estimatedStartOfVideo = createEstimatedTimestampStartOfVideo(
        actions,
        actionDeltaTime
      );

      return {
        ...action.toJSON(),
        timestampFromStartOfVideo:
          (new Date(action.timestamp) - estimatedStartOfVideo) / 1000, // Convert ms to seconds
        reviewVideoActionsArrayIndex: index + 1, // Start indexing at 1
      };
    });

    console.log(
      `✅ Updated ${updatedActions.length} actions with correct deltaTimes`
    );

    const uniqueListOfPlayerNamesArray = await createUniquePlayerNamesArray(
      updatedActions
    );
    const uniqueListOfPlayerObjArray = await createUniquePlayerObjArray(
      updatedActions
    );

    // console.log(`uniqueListOfPlayerNamesArray: ${JSON.stringify(uniqueListOfPlayerNamesArray)}`);

    res.json({
      result: true,
      actionsArray: updatedActions,
      playerNamesArray: uniqueListOfPlayerNamesArray,
      playerDbObjectsArray: uniqueListOfPlayerObjArray,
    });
  } catch (error) {
    console.error("❌ Error fetching actions for match:", error);
    res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET /sessions/:teamId
router.get("/:teamId", authenticateToken, async (req, res) => {
  console.log(`- in GET /sessions/${req.params.teamId}`);

  try {
    const { teamId } = req.params;
    console.log(`teamId: ${teamId}`);

    // 🔹 Find all Sessions linked to this teamId
    const sessionsArray = await Session.findAll({
      where: { teamId },
      attributes: [
        "id",
        "contractLeagueTeamId",
        "teamId",
        "sessionDate",
        "createdAt",
        "updatedAt",
        "city",
      ],
    });

    console.log(`sessionsArray: ${JSON.stringify(sessionsArray)}`);

    if (sessionsArray.length === 0) {
      return res.json({ result: true, sessionsArray: [] });
    }

    // console.log(`✅ Found ${sessions.length} sessions`);
    console.log(
      `sessionDate: ${sessionsArray[0].sessionDate} ${typeof sessionsArray[0]
        .sessionDate}`
    );
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
      };
    });

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
    const { teamId, sessionDate, contractLeagueTeamId } = req.body;
    const city = "Practice";
    console.log(`teamId: ${teamId}`);
    console.log(`sessionDate: ${sessionDate}`);
    console.log(`city: ${city}`);
    console.log(`contractLeagueTeamId: ${contractLeagueTeamId}`);

    // 🔹 Create new Session
    const sessionNew = await Session.create({
      teamId,
      sessionDate,
      city,
      contractLeagueTeamId,
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

module.exports = router;
