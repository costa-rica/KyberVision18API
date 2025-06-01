// Accepts an array of action objects and a deltaTime (in seconds)
// Returns the estimated start of video timestamp
// Why: mobile device on selection of Match to Review (i.e ReviewMatchSelection.js)
function createEstimatedTimestampStartOfVideo(actions, deltaTime) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return null;
  }

  // Ensure actions are sorted by timestamp (ASC)
  const sortedActions = [...actions].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  // First recorded action timestamp as a Date object
  const firstActionTimestamp = new Date(sortedActions[0].timestamp);

  // Subtract deltaTime (convert seconds to milliseconds)
  const estimatedStartOfVideo = new Date(
    firstActionTimestamp.getTime() - deltaTime * 1000
  );

  return estimatedStartOfVideo;
}

module.exports = {
  createEstimatedTimestampStartOfVideo,
};
