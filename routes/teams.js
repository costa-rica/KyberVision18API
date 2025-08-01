const express = require("express");
var router = express.Router();
const {
  Team,
  Player,
  ContractTeamUser,
  ContractLeagueTeam,
  League,
  ContractTeamPlayer,
} = require("kybervision17db");
const { authenticateToken } = require("../modules/userAuthentication");
const { addNewPlayerToTeam } = require("../modules/players");

// GET /teams
router.get("/", authenticateToken, async (req, res) => {
  console.log("- accessed GET /teams");

  const teams = await Team.findAll();
  console.log(`- we have ${teams.length} teams`);
  res.json({ result: true, teams });
});

// POST /teams/create
router.post("/create", authenticateToken, async (req, res) => {
  console.log("- accessed POST /teams/create");

  const { teamName, description, playersArray, leagueName } = req.body;
  console.log(`teamName: ${teamName}`);

  const teamNew = await Team.create({
    teamName,
    description,
    playersArray,
  });

  let leagueId;
  if (!leagueName) {
    leagueId = 1;
  } else {
    const league = await League.findOne({ where: { name: leagueName } });
    leagueId = league.id;
  }

  const contractLeagueTeamNew = await ContractLeagueTeam.create({
    leagueId,
    teamId: teamNew.id,
  });

  const contractTeamUserNew = await ContractTeamUser.create({
    teamId: teamNew.id,
    userId: req.user.id,
    isSuperUser: true,
    isAdmin: true,
  });

  console.log(`teamNew: ${JSON.stringify(teamNew)}`);

  for (let i = 0; i < playersArray.length; i++) {
    const player = playersArray[i];
    // const playerNew = await Player.create({
    //   teamId: teamNew.id,
    //   firstName: player.firstName,
    //   lastName: player.lastName,
    //   // birthDate: player.birthDate,
    // });
    // await ContractTeamPlayer.create({
    //   teamId: teamNew.id,
    //   playerId: playerNew.id,
    //   shirtNumber: player.shirtNumber,
    //   position: player.position,
    // });
    await addNewPlayerToTeam(
      teamNew.id,
      player.firstName,
      player.lastName,
      player.shirtNumber,
      player.position,
      player.positionAbbreviation
    );
  }

  res.json({ result: true, teamNew });
});

// POST /teams/update-visibility
router.post("/update-visibility", authenticateToken, async (req, res) => {
  console.log("- accessed POST /teams/update-visibility");

  const { teamId, visibility } = req.body;
  console.log(`teamId: ${teamId}`);

  const team = await Team.findOne({ where: { id: teamId } });
  // console.log(`team: ${JSON.stringify(team)}`);

  await team.update({ visibility });

  res.json({ result: true, team });
});

// POST /teams/add-player
router.post("/add-player", authenticateToken, async (req, res) => {
  console.log("- accessed POST /teams/add-player");

  const {
    teamId,
    firstName,
    lastName,
    shirtNumber,
    position,
    positionAbbreviation,
  } = req.body;
  console.log(`teamId: ${teamId}`);

  const playerNew = await addNewPlayerToTeam(
    teamId,
    firstName,
    lastName,
    shirtNumber,
    position,
    positionAbbreviation
  );

  res.json({ result: true, playerNew });
});

// DELETE /teams/player
router.delete("/player", authenticateToken, async (req, res) => {
  console.log("- accessed DELETE /teams/player");

  const { teamId, playerId } = req.body;
  console.log(`playerId: ${playerId}`);

  // const player = await Player.findOne({ where: { id: playerId } });
  // console.log(`player: ${JSON.stringify(player)}`);

  await ContractTeamPlayer.destroy({ where: { playerId, teamId } });

  res.json({ result: true });
});

module.exports = router;
