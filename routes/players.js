const express = require("express");
const {
  Player,
  ContractTeamPlayer,
  Team,
  ContractPlayerUser,
} = require("kybervision17db");
const { authenticateToken } = require("../modules/userAuthentication");
const router = express.Router();
const fs = require("fs");

// GET /players/team/:teamId
router.get("/team/:teamId", authenticateToken, async (req, res) => {
  console.log("- accessed GET /players/team/:teamId");

  const playersArray = await Player.findAll({
    include: [
      {
        //   model: PlayerContract,
        model: ContractTeamPlayer,
        where: { teamId: req.params.teamId },
      },
      {
        model: ContractPlayerUser,
      },
    ],
  });
  // console.log(JSON.stringify(playersArray, null, 2));
  // console.log(`req.params.teamId: ${req.params.teamId}`);
  const team = await Team.findByPk(req.params.teamId);
  // console.log(team.teamName);

  let playersArrayResponse = [];
  if (playersArray) {
    let playerArrayObj = {};
    // console.log(`- we have players`);
    playersArray.map((player) => {
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
        image: player.image,
        isUser: player.ContractPlayerUsers.length > 0,
        userId:
          player.ContractPlayerUsers.length > 0
            ? player.ContractPlayerUsers[0].userId
            : null,
      };
      playersArrayResponse.push(playerArrayObj);
    });
  } else {
    console.log(`- no players found`);
  }

  // console.log(playersArray);
  res.json({ result: true, team, playersArray: playersArrayResponse });
});

// GET /players/profile-picture/:filename
router.get(
  "/profile-picture/:filename",
  authenticateToken,
  async (req, res) => {
    const filename = req.params.filename;
    console.log(
      `get file from: ${process.env.PATH_PROFILE_PICTURES_PLAYER_DIR}/${filename}`
    );
    const profilePicturePath = `${process.env.PATH_PROFILE_PICTURES_PLAYER_DIR}/${filename}`;
    if (!fs.existsSync(profilePicturePath)) {
      return res.status(404).json({ error: "Profile picture not found" });
    }
    return res.sendFile(profilePicturePath);
  }
);

module.exports = router;
