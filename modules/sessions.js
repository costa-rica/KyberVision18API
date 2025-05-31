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
    const session = await Session.findOne({
      where: { id: sessionId },
      include: [
        {
          model: Team,
          as: "team",
          attributes: ["id", "teamName", "city", "coachName"], // Only team fields
          required: true,
          foreignKey: "teamId",
        },
      ],
      attributes: {
        exclude: ["teamId", "contractLeagueTeamId"], // Exclude these fields from match details
      },
    });

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    // Rename team attributes by prefixing them
    const formattedSession = {
      ...session.get(),
      teamId: session.team?.id,
      teamName: session.team?.teamName,
      teamCity: session.team?.city,
      teamCoach: session.team?.coachName,
    };

    // Remove the nested team objects
    delete formattedSession.team;

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
