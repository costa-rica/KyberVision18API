const {
  Team,
  League,
  ContractLeagueTeam,
  Session,
} = require("kybervision18db");

async function createNewTeam(teamName, city, coachName, leagueId) {
  try {
    const existingTeam = await Team.findOne({
      where: { teamName },
    });

    if (existingTeam) {
      console.log(`ℹ️  Team ${teamName} already exists. Skipping setup.`);
      return;
    }

    const team = await Team.create({
      teamName,
      city,
      coachName,
    });

    if (!leagueId) {
      const leagueFreeAgents = await League.findOne({
        where: { name: "Free Agent League" },
      });
      leagueId = leagueFreeAgents.id;
    }

    const contractLeagueTeam = await ContractLeagueTeam.create({
      leagueId,
      teamId: team.id,
    });

    // Create practice session
    await Session.create({
      teamId: team.id,
      leagueId,
      contractLeagueTeamId: contractLeagueTeam.id,
      city: "Practice",
      sessionDate: new Date().toISOString().split("T"),
    });

    console.log(`✅ Team ${teamName} created.`);
  } catch (err) {
    console.error(`❌ Error creating team ${teamName}:`, err);
  }
}

module.exports = {
  createNewTeam,
};
