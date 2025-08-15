const express = require("express");
var router = express.Router();
const {
  Team,
  ContractTeamUser,
  ContractLeagueTeam,
  League,
  ContractTeamPlayer,
  ContractPlayerUser,
} = require("kybervision18db");
const { authenticateToken } = require("../modules/userAuthentication");
const { addNewPlayerToTeam } = require("../modules/players");

// !! This could probably go on its own route contractPlayerUser.js
// POST /contract-player-user/link-user-to-player
router.post("/link-user-to-player", authenticateToken, async (req, res) => {
  console.log("- accessed POST /contract-player-user/link-user-to-player");

  const { playerId, userId } = req.body;
  // console.log(`playerId: ${playerId}`);

  let contractPlayerUserObject = await ContractPlayerUser.findOne({
    where: { playerId },
  });

  let contractPlayerUserObjectUserAlreadyLinked =
    await ContractPlayerUser.findOne({
      where: { userId },
    });

  if (contractPlayerUserObject) {
    contractPlayerUserObject.userId = userId;
    await contractPlayerUserObject.save();
  } else if (contractPlayerUserObjectUserAlreadyLinked) {
    contractPlayerUserObjectUserAlreadyLinked.playerId = playerId;
    await contractPlayerUserObjectUserAlreadyLinked.save();
  } else {
    contractPlayerUserObject = await ContractPlayerUser.create({
      playerId,
      userId,
    });
  }

  res.json({ result: true, contractPlayerUserObject });
});

// DELETE /contract-player-user/:playerId
router.delete("/:playerId", authenticateToken, async (req, res) => {
  console.log("- accessed DELETE /contract-player-user/:playerId");

  const { playerId } = req.params;
  console.log(`playerId: ${playerId}`);

  await ContractPlayerUser.destroy({ where: { playerId } });

  res.json({ result: true });
});

module.exports = router;
