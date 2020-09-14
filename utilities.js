const fs = require("fs");
const stream = require("stream");
const { promisify } = require("util");
const pipeline = promisify(stream.pipeline);
const got = require("got");

// wait for random ms from 0 to a little more than given secs
const AsyncWait = (waitSec) =>
  new Promise((resolve) =>
    setTimeout(resolve, ((Math.random() * waitSec) | 0) * 1234)
  );

const DownloadImage = async (filePath, folderPath='', thumb = false) => {
  const header = thumb
    ? {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
        origin: "https://www.meipian.cn",
        host: "static2.ivwen.com",
        dnt: 1,
          connection: 'keep-alive',
          "cache-control": 'max-age=0'
      }
    : {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
        origin: "https://www.meipian.cn",
        host: "static2.ivwen.com",
        referer: `https://www.meipian.cn`,
        dnt: 1,
      };

  const regexS = /http:\/\/\S+\/(\S+)\.(\S+)/gi.exec(filePath);
  const fileName = regexS[1];
  const ext = regexS[2];
  const newPath = `./Data/Images/${folderPath}${fileName}.${ext}`;
  console.log(`Downloading and Saving ${filePath}`);
  await pipeline(
    got.stream(`${filePath}${thumb ? "-thumb" : ""}`, header),
    fs.createWriteStream(newPath)
  );
  return newPath;
};

module.exports = { AsyncWait, DownloadImage };
