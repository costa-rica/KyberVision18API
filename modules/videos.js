const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Video } = require("kybervision16db");
const ffmpeg = require("fluent-ffmpeg");
const axios = require("axios"); // Make sure Axios is installed: yarn add axios

// Multer attaches an object representing the file to the request under the property req.file.
// - Multer creates the req.file.filename property
// Configure multer storage [cb = callback]
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.PATH_VIDEOS_UPLOADED);
  },
  filename: (req, file, cb) => {
    const now = new Date();

    // Format the datetime as YYYYMMDD-HHMMSS
    const formattedDate = now.toISOString().split("T")[0].replace(/-/g, "");
    const formattedTime = now.toTimeString().split(" ")[0].replace(/:/g, "");
    const datetimeString = `${formattedDate}-${formattedTime}`;

    // Generate the complete filename
    const filename = `${datetimeString}${path.extname(file.originalname)}`;

    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["video/mp4", "video/quicktime"]; // quicktime for .mov
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Invalid file type. Only .mp4 and .mov are allowed.")
      );
    }
    cb(null, true);
  },
});

// ✅ New function to rename video files with desired format
const renameVideoFile = (videoId, sessionId) => {
  // Ensure the numbers are formatted with leading zeros
  const formattedVideoId = videoId.toString().padStart(4, "0");
  return `${process.env.PREFIX_VIDEO_FILE_NAME}-videoId${formattedVideoId}-sessionId${sessionId}.mp4`;
};

// need to update this with all the places the video could be
const deleteVideo = async (videoId) => {
  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      return { success: false, error: "Video not found" };
    }
    const filePathToVideoFile = path.join(
      // process.env.PATH_VIDEOS_UPLOADED,
      video.pathToVideoFile,
      video.filename
    );

    fs.unlink(filePathToVideoFile, (err) => {
      if (err) {
        console.error(`❌ Error deleting file ${filePath}:`, err);
      }
    });
    const filePathToVideoFileInUpload = path.join(
      process.env.PATH_VIDEOS_UPLOADED,
      video.filename
    );
    fs.unlink(filePathToVideoFileInUpload, (err) => {
      if (err) {
        console.error(
          `❌ Error deleting file ${filePathToVideoFileInUpload}:`,
          err
        );
      }
    });

    await video.destroy();
    return { success: true, message: "Video deleted successfully" };
  } catch (error) {
    console.error("Error deleting video:", error);
    return { success: false, error: error.message };
  }
};

async function requestJobQueuerVideoUploaderYouTubeProcessing(
  filename,
  videoId
) {
  try {
    const response = await fetch("http://localhost:8003/youtube-uploader/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename,
        videoId,
        queueName: process.env.YOUTUBE_UPLOADER_QUEUE_NAME,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`❌ Failed to queue YouTube upload job: ${text}`);
    }

    const result = await response.json();
    console.log("✅ Queuer YouTube response:", result);
    return result;
  } catch (err) {
    console.error("❌ Error contacting YouTube Queuer:", err.message);
    throw err;
  }
}

module.exports = {
  upload,
  renameVideoFile,
  deleteVideo,
  requestJobQueuerVideoUploaderYouTubeProcessing,
};
