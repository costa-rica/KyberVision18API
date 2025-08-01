const express = require("express");
const { Player, ContractTeamPlayer, Team } = require("kybervision17db");
const { authenticateToken } = require("../modules/userAuthentication");
const router = express.Router();
const fs = require("fs");

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

// GET /players/profile-picture/:playerId
router.get(
  "/profile-picture/:playerId",
  authenticateToken,
  async (req, res) => {
    const playerId = req.params.playerId;
    const player = await Player.findByPk(playerId);
    console.log(
      `get file from: ${process.env.PATH_PROFILE_PICTURES_PLAYER_DIR}/${player.image} or use _playerDefaultRedditAlien.png as default`
    );
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }
    const profilePicture = player.image;
    let profilePicturePath;
    if (!profilePicture) {
      profilePicturePath = `${process.env.PATH_PROFILE_PICTURES_PLAYER_DIR}/_playerDefaultRedditAlien.png`;
    } else {
      profilePicturePath = `${process.env.PATH_PROFILE_PICTURES_PLAYER_DIR}/${player.image}`;
    }
    if (!fs.existsSync(profilePicturePath)) {
      return res.status(404).json({ error: "Profile picture not found" });
    }
    res.status(200).json({ profilePicturePath });
  }
);

module.exports = router;
