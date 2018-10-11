const Crawler = require("sitebot");
const got = require("got");
const fs = require("fs");
const crawler = new Crawler({
  url: "https://www.libro.ca/"
});
crawler.parseBackgroundImages = true; //Have the crawler check for inline/css images as well

const Images = {};

//For each page the list of all resources (images,css,js) found on the page
crawler.on("foundResources", function(queueItem, resources) {
  console.log("Finished", queueItem.href);
  //We are assigning all images found (resources.images) to the Images object with a key of the current url
  Images[queueItem.href] = resources.images;
});

//Event fired when crawler has visited all pages
crawler.on("end", async function() {
  const imageCodes = {};
  const uniqueImages = [];
  for (let url in Images) {
    for (let image of Images[url]) {
      if (!uniqueImages.includes(image)) {
        uniqueImages.push(image);
        try {
          let head = await got.head(image);
          if (!imageCodes[head.statusCode]) imageCodes[head.statusCode] = [];
          imageCodes[head.statusCode].push({ url, image });
        } catch (e) {
          const status = e.code || e.statusCode || e.response.statusCode;
          if (!imageCodes[status]) imageCodes[status] = [];
          imageCodes[status].push({ url, image });
        }
      }
    }
  }
  fs.writeFileSync("./errors.json", JSON.stringify(imageCodes));
});

//Start the crawler
crawler.start();
