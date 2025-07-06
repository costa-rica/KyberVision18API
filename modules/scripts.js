const { Script, ContractScriptVideo } = require("kybervision16db");

// Accepts an array of action objects and a deltaTimeInSeconds (in seconds)
// Returns the estimated start of video timestamp
// Why: mobile device on selection of Match to Review (i.e ReviewMatchSelection.js)
function createEstimatedTimestampStartOfVideo(actions, deltaTimeInSeconds) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return null;
  }

  // Ensure actions are sorted by timestamp (ASC)
  const sortedActions = [...actions].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  // First recorded action timestamp as a Date object
  const firstActionTimestamp = new Date(sortedActions[0].timestamp);

  // Subtract deltaTimeInSeconds (convert seconds to milliseconds)
  const estimatedStartOfVideo = new Date(
    firstActionTimestamp.getTime() - deltaTimeInSeconds * 1000
  );

  return estimatedStartOfVideo;
}

// async function updateSyncContractsWithVideoId(videoId, matchId) {
async function updateContractScriptVideosWithVideoId(videoId, sessionId) {
  const scripts = await Script.findAll({
    where: { sessionId },
  });

  if (scripts.length === 0) {
    console.log(`⚠️ No scripts found for sessionId: ${sessionId}`);
  } else {
    console.log(
      `📜 Found ${scripts.length} script(s) for sessionId: ${sessionId}`
    );
  }

  let contractScriptVideoUpdates = 0;

  // For each script create a new row in syncContracts
  Promise.all(
    scripts.map(async (script) => {
      const contractScriptVideo = await ContractScriptVideo.create({
        scriptId: script.id,
        videoId,
        // deltaTimeInSeconds: 0.0,
      });
      contractScriptVideoUpdates++; // Increment the counter
    })
  );

  return contractScriptVideoUpdates;
}

module.exports = {
  createEstimatedTimestampStartOfVideo,
  updateContractScriptVideosWithVideoId,
};
