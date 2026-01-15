require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');

const DOMAIN = 'banno-jha.atlassian.net';  
// Access variables from the environment (local .env or GitHub Secrets)
const email = process.env.JIRA_EMAIL;
const token = process.env.JIRA_TOKEN;

const AUTH = Buffer.from(`${email}:${token}`).toString('base64');

async function generatePreview() {
    // Holly Brouillette

    const pms = ["Tim Bryerton", "Holly Brouillette", "Anna Campbell", "Amber Bass", "Brett Sinn", "Kara Cross", "Kevin Casey"];

    for (const pm of pms) {

        const pmName = pm.replaceAll(" ", "-");
        console.log("PM: " + pm);
        const jql = `project = "PD" AND issuetype = "Idea" AND assignee = "${pm}" AND status NOT IN ("BACKLOG", "INBOX", "REVIEW NEXT YEAR","REVIEW SIX MONTHS","REVIEW NEXT QUARTER")`;
        const fields = 'summary,description,customfield_10997,customfield_11160,customfield_10970,customfield_10738,customfield_10968,customfield_10964'; //,customfield_10970,';

        const response = await fetch(`https://${DOMAIN}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&fields=${fields}&maxResults=100`, {
            headers: { 'Authorization': `Basic ${AUTH}`, 'Accept': 'application/json' }
        });

        const data = await response.json();

        if (!data.issues || data.issues.length === 0) {
            console.log("Zero ideas found for this user in project PD.");
            return;
        }

        let htmlContent = `
        <html>
        <head>
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
                    background: #EBECF0; padding: 40px; display: flex; flex-direction: column; align-items: center; 
                }
                .slide { 
                    background: white; border-radius: 12px; 
                    width: 900px; 
                    min-height: 500px; /* Allows the slide to grow if content spills */
                    height: auto; 
                    margin-bottom: 40px; 
                    padding: 50px; 
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1); 
                    position: relative; 
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                }
                h1 { color: #172B4D; font-size: 32px; border-bottom: 3px solid #0052CC; padding-bottom: 10px; margin-top: 20px; }
                
                .desc { 
                        color: #44546F; 
                        font-size: 18px; /* Slightly smaller as requested */
                        line-height: 1.4; /* Tighter line height for better fit */
                        white-space: pre-wrap; /* Keeps your newlines but wraps text naturally */
                        margin-top: 15px; 
                        overflow-wrap: break-word;
                    }

                /* Target the text following the first bullet to add spacing above the list */
                .desc:contains("•") {
                    margin-top: 30px;
                }

                .meta-row {
                    display: flex;
                    flex-direction: row; /* Force horizontal */
                    align-items: center; /* Vertical center alignment */
                    gap: 10px;           /* Space between date and tags */
                    margin-bottom: 20px;
                    flex-wrap: nowrap;   /* Prevents wrapping to a new line */
                    overflow: hidden;    /* Safety to keep things tidy */
                }

                .pill { 
                    align-self: flex-start;
                    background: #DFE1E6; color: #000000; 
                    padding: 6px 16px; border-radius: 20px; 
                    font-weight: bold; font-size: 14px; text-transform: uppercase;
                    white-space: nowrap;
                }
                .pill2 { 
                    background: #E1EFFF; color: #000000; 
                    padding: 6px 16px; border-radius: 20px; 
                    font-weight: bold; font-size: 14px; text-transform: uppercase;
                    white-space: nowrap;
                }
                .pill3 { 
                    background: #F9EDD2; color: #000000; 
                    padding: 6px 16px; border-radius: 20px; 
                    font-weight: bold; font-size: 14px; text-transform: uppercase;
                    white-space: nowrap;
                }
                .tag { position: absolute; top: 20px; right: 20px; background: #EAE6FF; color: #403294; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>Verified Slide Preview</h1>
        `;

        let slideCount = 0;

        const now = new Date();
        const curTime = now.toLocaleString();
    
        htmlContent += `<div style="font-size:10px; padding-bottom:10px;">Generated: ${curTime}</div>`;

        data.issues.forEach(issue => {

            //htmlContent += `<div>**${issue.key}**</div>`;
            if (issue.fields.customfield_10997 == 1) { 
                slideCount++;

                // 1. Use the new recursive function to get EVERYTHING
                const fullDescription = extractAllText(issue.fields.description?.content);

                // 2. Checklist Logic: Extracting all checked values
                const checklistArray = issue.fields.customfield_10738;
                const tagsHtml = Array.isArray(checklistArray) ? checklistArray.map(item => `<div class="pill2">${item.value}</div>`).join('') : "";
            

                // 3. Isolate the text between "~~~~~~~~~~"
                const delimiter = "~~~~~~~~~~";
                const parts = fullDescription.split(delimiter);

                let filteredDescription = "";
                if (parts.length >= 3) {
                    // parts[0] is before the first ~~~
                    // parts[1] is the text BETWEEN the first and second ~~~
                    filteredDescription = parts[1].trim();
                } else {
                    // Fallback if the delimiters aren't found or formatted correctly
                    filteredDescription = "<em>Meetup Slide Detail Description not found</em>\n";
                }

                // 4. Get the target date

                const dropdownObj = issue.fields.customfield_10970;
                let quarterDisplay = "No Date Set";

                if (dropdownObj && dropdownObj.value) {
                    // Send the string value (e.g., "01/26") into your converter
                    quarterDisplay = formatQuarterYear(dropdownObj.value);
                }

                if (issue.fields.customfield_10970 == null) {
                    dtStr = "null";
                } else {
                    dtStr = issue.fields.customfield_10970;
                }

                
                htmlContent += `
                    <div class="slide">
                        <div class="tag">SLIDE READY</div>
                        <div class="meta-row">
                `;

                const slideStatusObj = issue.fields.customfield_10964;
                if (slideStatusObj && slideStatusObj.value) {
                    htmlContent += `
                    <div class="pill3">${slideStatusObj.value}</div>
                    `;
                }


                htmlContent += `
                        <div class="pill">${quarterDisplay}</div></div>
                        <h1>${issue.fields.summary}</h1>
                `;
                
        
                if (issue.fields.customfield_11160 !== null) {
                    htmlContent += `<h3>${issue.fields.customfield_11160}</h3>`;
                } 


                htmlContent += `<div class="meta-row">${tagsHtml}</div>
                                <div class="desc">${filteredDescription}</div><br/>`;

                //const figmaUrl = issue.fields.customfield_10968;
                const rawFigmaUrl = issue.fields.customfield_10968;
                //let figmaHtml = ""; // Default to empty if no URL exists

                if (rawFigmaUrl && rawFigmaUrl.includes("figma.com")) {
                    const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(rawFigmaUrl)}`;
                    htmlContent += `<div class="image-container">
                                    <iframe 
                                        style="border: 1px solid rgba(0, 0, 0, 0.1); border-radius: 8px;" 
                                        width="100%" 
                                        height="300" 
                                        src="${embedUrl}" 
                                        allowfullscreen>
                                    </iframe>
                                </div>`; 
                }
            
                
                htmlContent += `</div>`;
            }
        });

        htmlContent += `</body></html>`;

        const filename = pmName + ".html";

        if (slideCount === 0) {
            console.log("Found ideas, but NONE of them had '1' in customfield_10997.");
        } else {
            fs.writeFileSync(filename, htmlContent);
            console.log(`✅ Success! Generated ${slideCount} slides in slides.html`);
        }
    }
}

function extractAllText(contentArray) {
    let text = "";
    let isInsideList = false; // Track if we are currently in a list block
    if (!contentArray) return text;

    contentArray.forEach((node, index) => {
        // Detect the start of a list to add leading space
        if (node.type === 'listItem' && !isInsideList) {
            text += "\n"; // Adds the space ABOVE the first list item
            isInsideList = true;
        } 
        // Reset the flag if we move back to a paragraph
        else if (node.type !== 'listItem') {
            isInsideList = false;
        }

        if (node.type === 'listItem') {
            text += "•\t"; 
        }

        if (node.type === 'text' && node.text) {
            text += node.text;
        } 
        else if (node.content) {
            text += extractAllText(node.content);
        }

        // Standard block separation
        if (['paragraph', 'listItem'].includes(node.type)) {
            text += "\n";
        }
    });
    return text;
}

function formatQuarterYear(dateStr) {
    if (!dateStr) return "TBD";
    
    // Splits "01/26" into ["01", "26"]
    const [month, year] = dateStr.split('/');
    const monthNum = parseInt(month, 10);
    
    let quarter;
    if (monthNum <= 3) quarter = "Q1";
    else if (monthNum <= 6) quarter = "Q2";
    else if (monthNum <= 9) quarter = "Q3";
    else quarter = "Q4";

    return `${quarter} - ${year}`;
}

generatePreview();

