const pageScraper = require( './pageScraper' );
const propertyScraper = require( './propertyScraper' );
async function scrapeAll ( browserInstance ) {
  let browser;
  try {
    let scrapedData = {};
    browser = await browserInstance;
    // scrapedData.props = await propertyScraper.scraper( browser );
    scrapedData.crystals = await pageScraper.scraper( browser);
    await browser.close();
    console.log( scrapedData );
  }
  catch ( err ) {
    console.log( "Could not resolve the browser instance => ", err );
  }
}

module.exports = ( browserInstance ) => scrapeAll( browserInstance );