// Put your access token and sheet IDs in a file called env.txt
// ACCESS_TOKEN=<your-access-token>
// SOURCE_SHEET=<id>
// DESTINATION_SHEET=<id>

// Load env.txt
require('dotenv').config({ path: require('path').resolve(process.cwd(), 'env.txt') });

const accessToken = process.env.ACCESS_TOKEN;
const sourceSheetId = process.env.SOURCE_SHEET;
const destinationSheetId = process.env.DESTINATION_SHEET;

// Make an API call
async function api(method, path, body) {
  const headers = {
    Authorization: `Bearer ${accessToken}`
  };
  if (method !== 'GET') {
    headers['Content-Type'] = 'application/json';
  }
  const url = `https://api.smartsheet.com/2.0/${path}`;
  console.log(method, url);
  const response = await fetch(url, {
    method,
    headers,
    body
  });

  if (!response.ok) {
    throw new Error(`API call failed ${method} ${path}: ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

// Fetch one sheet by ID
function fetchSheetData(sheetId) {
  return api('GET', `sheets/${sheetId}`)
}

// Adds rows to a sheet by ID
function addRows(sheetId, rows) {
  console.log(`Adding ${rows.length} rows`);
  return api('POST', `sheets/${sheetId}/rows`, JSON.stringify(rows))
}

async function main() {
  const src = await fetchSheetData(sourceSheetId)
  const dest = await fetchSheetData(destinationSheetId);

  const [header, ...rows] = src.rows;

  const newRows = [];
  for (let row of rows) {
    const projectName = row.cells[0].value;
    const personResponsible = row.cells[1].value;

    if (!projectName || !personResponsible) {
      continue;
    }

    // Iterate through months (columns 3 to 15)
    for (let monthIndex = 2; monthIndex < 14; monthIndex++) {
      const month = `${monthIndex - 1}`;
      const hoursPerWeek = row.cells[monthIndex].value;
      if (!hoursPerWeek || hoursPerWeek === '0') {
        continue;
      }

      // Create a new row for the destination sheet
      const newRow = {
        toBottom: true,
        cells: [
          { columnId: dest.columns[0].id, value: projectName },
          { columnId: dest.columns[1].id, value: personResponsible },
          { columnId: dest.columns[2].id, value: month },
          { columnId: dest.columns[3].id, value: hoursPerWeek }
        ]
      };
      
      newRows.push(newRow);
    }
  }

  await addRows(destinationSheetId, newRows);
}

// Run the whole thing
main()
  .then(() => console.log('Done!'))
  .catch((err) => console.log('ERROR:', err));

