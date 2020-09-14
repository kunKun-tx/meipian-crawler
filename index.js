const got = require("got");
const cheerio = require("cheerio");
const fs = require("fs").promises;
const { AsyncWait, DownloadImage } = require("./utilities");

const getUsrInfo = async (usrId) => {
  const userPageUrl = `https://www.meipian.cn/c/${usrId}`;
  let response;
  try {
    console.log(`Getting User ${usrId}`);
    response = await got.get(userPageUrl);
  } catch (e) {
    console.log("oops");
    console.log(e);
  }
  if (response) {
    console.log("User Info Fetched");
    const $ = cheerio.load(response.body);
    return {
      url: userPageUrl,
      id: $(".usermessage .info h2").text(),
      profileImg: /url\('(\S+)'\)/gi.exec(
        $(".usermessage .headerimg ").css("background-image")
      )[1],
      slogan: $(".usermessage .info p:nth-child(3)").text(),
      stats: $(".usermessage .info p:nth-child(4)").text().trim(),
      latestPostId: $(
        ".userarticles .articlecontent ul:nth-child(1)>li div:nth-child(1)"
      ).attr("data-id"),
    };
  }
};

// get a single batch of 10 article
const getArticleMeta = async (usrId, lastPostId = null) => {
  const articleListUrl = `https://www.meipian.cn/static/action/load_columns_article.php?userid=${usrId}`;
  let response;
  try {
    response = await got.post(
      articleListUrl,
      lastPostId
        ? {
            form: { containerid: 0, maxid: lastPostId, stickmaskid: "" },
            responseType: "json",
            headers: {
              "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
              origin: "https://www.meipian.cn",
              host: "www.meipian.cn",
              referer: `https://www.meipian.cn/c/${usrId}`,
              dnt: 1,
              "content-type":
                "application/x-www-form-urlencoded; charset=UTF-8",
            },
          }
        : {
            responseType: "json",
            headers: {
              "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:79.0) Gecko/20100101 Firefox/79.0",
              origin: "https://www.meipian.cn",
              host: "www.meipian.cn",
              referer: `https://www.meipian.cn/c/${usrId}`,
              dnt: 1,
              "content-type":
                "application/x-www-form-urlencoded; charset=UTF-8",
            },
          }
    );
  } catch (e) {
    console.log(e);
  }
  if (response && response.body.length) {
    return response.body;
  } else {
    console.log("No More Article to Fetch");
    return [];
  }
};

const getAllArticleMeta = async (usrId) => {
  // get first ten
  console.log("Getting First Batch of User Articles");
  const result = await getArticleMeta(usrId, null);
  do {
    console.log("Waiting...");
    await AsyncWait(4);
    const lastPostId = result[result.length - 1].id;
    console.log("Getting Next Batch of User Articles");
    const currentBatch = await getArticleMeta(usrId, lastPostId);
    if (currentBatch.length) {
      console.log(
        `Adding ${currentBatch.length} Articles to Current ${result.length}`
      );
      result.push(...currentBatch);
    } else break;
  } while (1);
  console.log("Articles Fetching Done!");
  return result;
};

const GetUserInfoAndArticleMeta = async (usrId) => {
  const user = await getUsrInfo(usrId);
  const articles = await getAllArticleMeta(usrId);
  // download profile image
  user.profileImg = await DownloadImage(user.profileImg);
  await AsyncWait(2);

  // download article preview images
  const articleCount = articles.length;
  let idx = 1;
  for await (const article of articles) {
    console.log(`Download ${idx}/${articleCount} preview images`);
    article.cover_img_url = await DownloadImage(article.cover_img_url, 'thumb', true);
    idx +=1
    // let's not trigger the rate limiter
    await AsyncWait(4);
  }

  console.log("Writing UserInfo Data to Local JSON file, userInfo.json");
  await fs.writeFile(
    "./Data/userInfo.json",
    JSON.stringify({ user, articles }),
    "utf8"
  );
};


