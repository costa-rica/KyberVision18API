const {
  // CompetitionContract,
  ContractLeagueTeam,
  League,
  Session,
  Team,
} = require("kybervision16db");

async function createSessionWithFreeAgentLeague(teamId) {
  try {
    const freeAgentLeague = await League.findOne({
      where: { name: "Free Agent League" },
    });

    if (!freeAgentLeague) {
      console.log("ℹ️  Free Agent league not found. Skipping setup.");
      return;
    }
    const contractLeagueTeam = await ContractLeagueTeam.create({
      leagueId: freeAgentLeague.id,
      teamId: teamId,
    });

    const session = await Session.create({
      leagueId: freeAgentLeague.id,
      teamId: teamId,
      // competitionContractId: competitionContract.id,
      contractLeagueTeamId: contractLeagueTeam.id,
      city: "Practice",
      sessionDate: new Date().toISOString().split("T"),
    });

    console.log(`✅ Session created with Free Agent league.`);
    return session;
  } catch (err) {
    console.error(`❌ Error creating session with Free Agent league:`, err);
    return null;
  }
}

const createSession = async (sessionData) => {
  try {
    const session = await Session.create(sessionData);
    return { success: true, session };
  } catch (error) {
    console.error("Error creating session:", error);
    return { success: false, error: error.message };
  }
};

const deleteSession = async (sessionId) => {
  try {
    const session = await Session.findByPk(sessionId);
    if (!session) {
      return { success: false, error: "Session not found" };
    }

    await session.destroy();
    return { success: true, message: "Session deleted successfully" };
  } catch (error) {
    console.error("Error deleting session:", error);
    return { success: false, error: error.message };
  }
};

const getSessionWithTeams = async (sessionId) => {
  try {
    // Fetch match with team details
    const session = await Session.findByPk(sessionId, {
      include: [
        {
          model: Team,
          attributes: ["id", "teamName", "city", "coachName"],
          required: true,
        },
      ],
      attributes: {
        exclude: ["teamId", "contractLeagueTeamId"],
      },
    });

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    // console.log(session.dataValues);

    // Rename team attributes by prefixing them
    const formattedSession = {
      ...session.get(),
      teamId: session.Team?.id,
      teamName: session.Team?.teamName,
      teamCity: session.Team?.city,
      teamCoach: session.Team?.coachName,
    };

    // Remove the nested team objects
    delete formattedSession.Team;

    // console.log("--- formattedSession ------");
    // console.log(formattedSession);
    // console.log(" -----------------------------");

    return { success: true, session: formattedSession };
  } catch (error) {
    console.error("Error fetching session with teams:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createSession,
  deleteSession,
  getSessionWithTeams,
  createSessionWithFreeAgentLeague,
};
