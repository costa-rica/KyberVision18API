const express = require("express");
const { Player, ContractTeamPlayer, Team } = require("kybervision16db");
const { authenticateToken } = require("../modules/userAuthentication");
const router = express.Router();

// GET /players/team/:teamId
router.get("/team/:teamId", authenticateToken, async (req, res) => {
  console.log("- accessed GET /players/team/:teamId");

  const players = await Player.findAll({
    include: {
      //   model: PlayerContract,
      model: ContractTeamPlayer,
      where: { teamId: req.params.teamId },
      attributes: ["id", "teamId", "playerId", "shirtNumber"], // Include PlayerContract fields
    },
  });
  console.log(`req.params.teamId: ${req.params.teamId}`);
  const team = await Team.findByPk(req.params.teamId);
  console.log(team.teamName);
  // console.log(team);

  let playersArray = [];
  if (players) {
    let playerArrayObj = {};
    console.log(`- we have players`);
    players.map((player) => {
      // console.log(player.get({ plain: true }));
      playerArrayObj = {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        birthDate: player.birthDate,
        shirtNumber: player.ContractTeamPlayers[0].shirtNumber,
      };
      playersArray.push(playerArrayObj);
    });
  } else {
    console.log(`- no players found`);
  }

  // console.log(playersArray);
  res.json({ result: true, team, players: playersArray });
});

module.exports = router;
