/**
 * from https://www.digitalocean.com/community/tutorials/how-to-scrape-a-website-using-node-js-and-puppeteer
 */
const LOG = require( './log' );
const scraperObject = {
  url: "https://thecrystalcouncil.com/crystals",
  async scraper ( browser ) {
    let page = await browser.newPage();
    console.log( `Navigating to ${this.url}...` );
    await page.goto( this.url );

    let scrapedData = [];
    // Wait for the required DOM to be rendered
    async function scrapeCurrentPage () {
      await page.waitForSelector( ".crystal-list" );

      // Get the link to all the required books
      let urls = await page.$$eval(
        ".col-12.col-sm-6.col-lg-4.col-xl-3.mb-3.mb-sm-4",
        links => {
          // Extract the links from the data
          links = links.map( el => el.querySelector( " a" ).href );
          return links;
        }
      );
      let newPage;
      let detailPage;
      // Loop through each of those links, open a new page instance and get the relevant data from them
      let detailPromise = link =>
        new Promise( async ( resolve, _ ) => {
          let dataObj = {};
          detailPage = await browser.newPage();
          await detailPage.goto( link );
          dataObj.content = await detailPage.evaluate( () => {
            return document.querySelector( 'h1 + div + hr' ).nextSibling.textContent;
          } );
          resolve( dataObj );
          await detailPage.close();
        } );
      let pagePromise = link =>
        new Promise( async ( resolve, reject ) => {
          let dataObj = {};
          newPage = await browser.newPage();
          await newPage.goto( link );
          const title = await newPage.$eval( "h1", text => text.textContent );

          jumpTos = await newPage.$$eval(
            ".slick-slide .mx-1 a",
            linkNames => {
              // Extract the links from the data
              linkNames = linkNames.map( el => el.textContent );
              return linkNames;
            }
          );
          for ( let text of jumpTos ) {
            const selector = `#${text.toLowerCase()} .tag`;
            const section = await newPage.evaluate( select => {
              if ( select.includes( "#pronunciation" ) ) return document.querySelector( 'audio' ).currentSrc;
              if ( select.includes( "#properties" ) ) return;
              return Array.from( document.querySelectorAll( select ) ).map(
                section =>
                  section?.textContent.replace( /(\r\n\t|\n|\r|\t)/gm, "" ) ||
                  "Not found"
              );
            }, selector );
            dataObj[text] = section;
          }

          let url = title.toLowerCase().replace( /\s/gm, "-" );
          dataObj.id = url;
          dataObj.relURL = `/crystals/${url}`;
          dataObj.name = title;
          dataObj.Formula = await newPage.evaluate( () => {
            return document.querySelector( 'h4.mt-3 + hr + p' )?.textContent || 'Unknown';
          } );

          dataObj.Hardness = await newPage.evaluate( () => {
            let hard = {};
            hard.min = parseFloat(
              document.querySelector( '.hardness-scale .scale.min' )?.textContent || 0 );
            hard.max = parseFloat(
              document.querySelector( '.hardness-scale .scale.max' )?.textContent || 0 );
            return hard;
          } );

          dataObj.Related = await newPage.$$eval(
            ".crystal-list .col-12.col-sm-6.col-lg-4.col-xl-3.mb-3.mb-sm-4",
            links => {
              // Extract the links from the data
              links = links.map( el => {
                let obj = {};
                obj[el.querySelector( "h5" ).textContent] = el.querySelector( "a" ).href;
                return obj;
              } );
              return links;
            }
          );

          dataObj.Origin = await newPage.evaluate( () => {
            var titles = Array.from( document.querySelectorAll( 'h3' ) )
              .filter( el => el.nextSibling.tagName === 'P' );
            let origin = {};
            let text = '';
            const getContent = ( el, accum ) => {
              if ( el.nextSibling.tagName === 'P' ) {
                let nextEl = el.nextSibling;
                accum += nextEl.textContent;
                getContent( nextEl, accum );
              }
              return accum;
            };
            titles.forEach( el => {
              origin[el.textContent] = getContent( el, text );
            } );
            return origin;
          } );


          dataObj.props = await newPage.evaluate( () => {
            let props = {};
            let propList = document.querySelectorAll( '.properties .tag-container' );
            for ( let prop of propList ) {
              let propName = prop?.textContent.replace( /(\r\n\t|\n|\r|\t)/gm, "" ).trim();
              let propValue = prop?.href ;
              props[propName] = propValue;
            }
            return props;
          } );

          // dataObj.props = await newPage.$$eval(
          //   ".properties .tag-container",
          //   links => {
          //     // console.log({ links });
          //     // Extract the links from the data
          //     links = links.map( el => {
          //       let prop = el?.textContent.replace( /(\r\n\t|\n|\r|\t)/gm, "" ).trim();
          //       console.error( { prop } );
          //       if ( prop ) {
          //         let obj = {};


          //         obj[prop] = await detailPromise( el.href );
          //         return obj;
          //       }
          //     }
          //     );
          //     return links.filter( e => e );
          //   }
          // );


          dataObj.Additional_Images = await newPage.$$eval(
            '.additional_images img',
            links => {
              // Extract the links from the data
              links = links.map( el => el.src );
              return links;
            }
          );
          dataObj.Image = await newPage.$eval( '.rellax.crystal-bg', img => img.style.backgroundImage.replace( 'url("', '' ).replace( '")', '' ) || 'Unknown' );

          resolve( dataObj );
          await newPage.close();
        } );

      for ( let link in urls ) {
        let currentPageData = await pagePromise( urls[link] );
        scrapedData.push( currentPageData );
        LOG.appendLog( currentPageData );
        console.log( JSON.stringify( currentPageData, null, 2 ) );
      }

      // @TODO: Add a check to see if there are more pages to scrape
      // When all the data on this page is done, click the next button and start the scraping of the next page
      // You are going to check if this button exist first, so you know if there really is a next page.
      // let nextButtonExist = false;
      // try {
      //   const nextButton = await page.$eval(".next > a", a => a.textContent);
      //   nextButtonExist = true;
      // } catch (err) {
      //   nextButtonExist = false;
      // }
      // if (nextButtonExist) {
      //   await page.click(".next > a");
      //   return scrapeCurrentPage(); // Call this function recursively
      // }
      await page.close();
      return scrapedData;
    }
    let data = await scrapeCurrentPage();
    console.log( data );
    return data;
  }
};

module.exports = scraperObject;
