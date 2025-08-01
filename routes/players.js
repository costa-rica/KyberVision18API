const express = require("express");
const { Player, ContractTeamPlayer, Team } = require("kybervision17db");
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
      // attributes: [
      //   "id",
      //   "teamId",
      //   "playerId",
      //   "shirtNumber",
      //   "position",
      //   "positionAbbreviation",
      //   "role",
      // ], // Include PlayerContract fields
    },
  });
  console.log(`req.params.teamId: ${req.params.teamId}`);
  const team = await Team.findByPk(req.params.teamId);
  console.log(team.teamName);
  // console.log(team);

  // const positionToAbb = {
  //   "Outside hitter": "OH",
  //   "Middle blocker": "MB",
  //   Setter: "SET",
  //   Opposite: "OPP",
  //   Libero: "L",
  //   Flex: "Flex",
  // };

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
        position: player.ContractTeamPlayers[0].position,
        positionAbbreviation:
          player.ContractTeamPlayers[0].positionAbbreviation,
        role: player.ContractTeamPlayers[0].role,
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
