
const LOG = require( './log' );
const scraperObject = {
  url: "https://thecrystalcouncil.com/tags/properties",
  async scraper(browser) {
    let page = await browser.newPage();
    console.log(`Navigating to ${this.url}...`);
    // Navigate to the selected page
    await page.goto(this.url);
    // Wait for the required DOM to be rendered
    await page.waitForSelector(".tag-list");
    // Get the link to all the required books
    let urls = await page.evaluate(() => {
      let links = document.querySelectorAll(".tag-list a");
      let urls = [];
      for ( let i = 0; i < links.length; i++ ) {
        let obj = {};
        obj.link = links[i].href;
        obj.img = links[i].querySelector("img").src;
        urls.push(obj);
      }
      console.log(urls);
      return urls;
    });

    // Loop through each of those links, open a new page instance and get the relevant data from them
    let pagePromise = link =>
      new Promise(async (resolve, reject) => {
        let dataObj = {};
        let newPage = await browser.newPage();
        await newPage.goto(link);
        dataObj.name = await newPage.$eval(
          "h1",
          text => text.textContent.replace( /(\r\n\t|\n|\r|\t)/gm, "" ).trim()
        );
        let path = dataObj.name.toLowerCase().replace( /\s/g, "-" );
        dataObj.id = path;
        dataObj.relURL = `/properties/${path}`;
        dataObj.content = await newPage.$eval("h1 + div + hr", text =>
          text.nextSibling.textContent.replace(/(\r\n\t|\n|\r|\t)/gm, "").trim()
        );

        resolve(dataObj);
        await newPage.close();
      });

    for (let link in urls) {
      let currentPageData = await pagePromise(urls[link].link);
      // scrapedData.push(currentPageData);
      LOG.appendLog( currentPageData , 'properties' );
      console.log(currentPageData);
    }
  }
};

module.exports = scraperObject;
