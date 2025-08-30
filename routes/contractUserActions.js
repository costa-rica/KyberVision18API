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

// POST /contract-user-actions/update-user-favorites
router.post("/update-user-favorites", authenticateToken, async (req, res) => {
  console.log("- in POST /contract-user-actions/update-user-favorites");
  try {
    const { sessionId, actionsArray } = req.body;

    // const contractUserAction = await ContractUserAction.create({
    //   actionId,
    //   userId: req.user.id,
    // });
    // console.log("---------------");
    // console.log(`sessionId: ${sessionId}`);
    // console.log(`actionsArray: ${JSON.stringify(actionsArray, null, 2)}`);
    // console.log("---------------");

    // Step 1: Make array of actionIds and favorite status from actionsArray and sessionId
    const actionIdsAndFavoriteStatusArray = actionsArray.map((action) => {
      return {
        actionId: action.actionsDbTableId,
        sessionId: sessionId,
        favorite: action.isFavorite,
        userId: req.user.id,
      };
    });

    // Step 2: create array of existing contractUserActions of user and session
    const existingContractUserActionsArray = await ContractUserAction.findAll({
      where: {
        sessionId,
        userId: req.user.id,
      },
    });

    // Step 3: compare actionIdsAndFavoriteStatusArray with existingContractUserActionsArray
    // -- > if actionId does not exist in existingContractUserActionsArray, create new contractUserAction
    for (let i = 0; i < actionIdsAndFavoriteStatusArray.length; i++) {
      const action = actionIdsAndFavoriteStatusArray[i];
      const existingContractUserAction = existingContractUserActionsArray.find(
        (contractUserAction) => contractUserAction.actionId === action.actionId
      );
      if (!existingContractUserAction && action.favorite) {
        await ContractUserAction.create({
          actionId: action.actionId,
          userId: action.userId,
          sessionId: action.sessionId,
        });
      }
    }

    // Step 4: delete contractUserActions that are in existingContractUserActionsArray but not in actionIdsAndFavoriteStatusArray
    for (let i = 0; i < existingContractUserActionsArray.length; i++) {
      const contractUserAction = existingContractUserActionsArray[i];
      // console.log(`exiting - actionId: ${contractUserAction.actionId}`);
      const action = actionIdsAndFavoriteStatusArray.find(
        (action) => action.actionId === contractUserAction.actionId
      );
      // console.log(`action: ${JSON.stringify(action, null, 2)}`);
      if (action.favorite === false) {
        await contractUserAction.destroy();
      }
    }

    // console.log(`scriptsArray: ${JSON.stringify(scriptsArray, null, 2)}`);

    res.json({
      result: true,
      message: "User favorites updated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
