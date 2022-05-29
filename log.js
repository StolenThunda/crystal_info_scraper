const fs = require( "fs" );
const fileName = "./db.json";

async function writeLog ( data, id ) {
  fs.writeFile( fileName, JSON.stringify( data ), "utf8", function ( err ) {
    if ( err ) {
      return console.log( err );
    }
    console.log(
      `The data for "${id}" has been scraped and saved successfully! View it at './db.json'`
    );
  } );
}
async function appendLog ( data, category = "crystals" ) {
  const currentData = await readLogAsData();
  // add new data to the existing data
  // let idx = getCrystalIndex( data.name );
  // if ( idx !== -1 ) {
  //   currentData.crystals[idx] = data;
  // } else {
  currentData[category].push( data );
  // }

  // remove duplicates
  currentData[category] = [...new Set( currentData[category] )];
  writeLog( currentData, data.name );
}
async function readLogAsData () {
  try {
    const data = fs.readFileSync( fileName, "utf8" );
    return JSON.parse( data );
  } catch ( err ) {
    return { crystals: [], properties: [] };
  }
}

// function getCrystalData ( name ) { 
//   const data = readLogAsData();
//   return data.crystals.find( crystal => crystal.name === name );
// } 

async function getCrystalIndex ( name ) {
  const data = await readLogAsData();
  // console.log( { data } );
  return data?.crystals.map( crystal => crystal.name ).indexOf( name ) || -1;
}
module.exports = {
  writeLog,
  appendLog
};
