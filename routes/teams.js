const express = require("express");
var router = express.Router();
const {
  Team,
  Player,
  ContractTeamPlayer,
  ContractTeamUser,
  ContractLeagueTeam,
  League,
} = require("kybervision17db");
const { authenticateToken } = require("../modules/userAuthentication");

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
    const playerNew = await Player.create({
      teamId: teamNew.id,
      firstName: player.firstName,
      lastName: player.lastName,
      // birthDate: player.birthDate,
    });
    await ContractTeamPlayer.create({
      teamId: teamNew.id,
      playerId: playerNew.id,
      shirtNumber: player.shirtNumber,
      position: player.position,
    });
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

module.exports = router;
