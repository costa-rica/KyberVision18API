const {
  // GroupContract,
  ContractTeamUser,
  League,
  // Match,
  Session,

  Team,
} = require("kybervision16db");
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../modules/userAuthentication");

// NOTE: This it the "Tribe" router. Formerly GroupContract
/// --> would be the groups.js file in KV15API

// POST contract-team-user/create/:teamId
router.post("/create/:teamId", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    const { isSuperUser, isAdmin, isCoach } = req.body;
    // create or modify contract team user
    const [contractTeamUser, created] = await ContractTeamUser.upsert(
      { userId, teamId, isSuperUser, isAdmin, isCoach },
      { returning: true }
    );
    // res.status(201).json(group);
    res.status(created ? 201 : 200).json({
      message: created
        ? "ContractTeamUser created with success"
        : "ContractTeamUser updated with success",
      contractTeamUser,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error creating or updating contractTeamUser",
      details: error.message,
    });
  }
});

// GET /contract-team-user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`userId: ${userId}`);
    // const groups = await GroupContract.findAll({ where: { userId } });
    const contractTeamUsers = await ContractTeamUser.findAll({
      where: { userId },
      include: {
        model: Team,
        attributes: ["id", "teamName", "city", "coachName"], // specify fields you want
      },
    });

    // console.log(contractTeamUsers[0].dataValues);

    // const teamsArray = groupContracts.map((gc) => gc.Team);
    const teamsArray = await Promise.all(
      contractTeamUsers.map(async (ctu) => {
        const team = ctu.Team.toJSON(); // convert to plain object

        // Add a practice Match
        const practiceMatch = await Session.findOne({
          where: {
            teamId: team.id,
            //   teamIdOpponent: team.id,
            city: "practice",
          },
          order: [["sessionDate", "DESC"]],
        });
        team.practiceMatch = practiceMatch;
        return team;
      })
    );

    // console.log(teamsArray);

    res.status(200).json({ teamsArray });
  } catch (error) {
    res.status(500).json({
      error: "Error retrieving contractTeamUsers",
      details: error.message,
    });
  }
});

module.exports = router;
