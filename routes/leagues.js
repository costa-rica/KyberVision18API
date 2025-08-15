const express = require("express");
var router = express.Router();
const { League, ContractLeagueTeam } = require("kybervision18db");
const { authenticateToken } = require("../modules/userAuthentication");

// GET /leagues
router.get("/team/:teamId", authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;
    const contractLeagueTeamsArray = await ContractLeagueTeam.findAll({
      where: {
        teamId,
      },
    });
    const leaguesArray = await Promise.all(
      contractLeagueTeamsArray.map(async (contractLeagueTeam) => {
        const league = await League.findByPk(contractLeagueTeam.leagueId);
        return {
          id: league.id,
          name: league.name,
          contractLeagueTeamId: contractLeagueTeam.id,
        };
      })
    );
    // sort leagues by leagueId
    leaguesArray.sort((a, b) => a.id - b.id);
    res.status(200).json({ leaguesArray });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération des ligues",
      details: error.message,
    });
  }
});

module.exports = router;
