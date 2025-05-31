const {
  // GroupContract,
  ContractTeamUser,
  // Match,
  Session,
  Team,
} = require("kybervision16db");
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../modules/userAuthentication");

// OBE POST groups/create/:teamId
// POST team-users/create/:teamId
router.post("/create/:teamId", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    const { isSuperUser, isAdmin, isCoach } = req.body;
    // create or modify team-user contract
    const [group, created] = await ContractTeamUser.upsert(
      { userId, teamId, isSuperUser, isAdmin, isCoach },
      { returning: true }
    );
    // res.status(201).json(group);
    res.status(200).json({
      message: "contractTeamUser created or updated",
      group,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error creating or updating contractTeamUser",
      details: error.message,
    });
  }
});

// OBE: GET /groups
// OBE: GET /team-users/
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // const groups = await GroupContract.findAll({ where: { userId } });
    const contractTeamUsers = await ContractTeamUser.findAll({
      where: { userId },
      include: {
        model: Team,
        attributes: ["id", "teamName", "city", "coachName"], // specify fields you want
      },
    });

    console.log(contractTeamUsers);

    // const teamsArray = groupContracts.map((gc) => gc.Team);
    const teamsArray = await Promise.all(
      contractTeamUsers.map(async (ctu) => {
        const team = ctu.Team.toJSON(); // convert to plain object

        // Add a practice Match
        const practiceSession = await Session.findOne({
          where: {
            teamId: team.id,
            city: "practice",
          },
          order: [["sessionDate", "DESC"]],
        });
        team.practiceSession = practiceSession;
        return team;
      })
    );

    console.log(teamsArray);

    res.status(200).json({ teamsArray });
  } catch (error) {
    res.status(500).json({
      error: "Error getting contractTeamUsers",
      details: error.message,
    });
  }
});

module.exports = router;
