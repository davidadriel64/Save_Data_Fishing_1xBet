√const puppeteer = require("puppeteer-extra");
const launch = require("./launch");
const fs = require("fs");
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

//get WsEndpoint
async function getWsEndpoint() {
  let wsEndpoint = await launch();
  return wsEndpoint;
}

(async () => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: await getWsEndpoint(),
    defaultViewport: null,
  });

  let page = await browser.newPage();
  await page.goto("https://ar.1xbet.com/es/allgamesentrance/fishing");

  const client = await page.target().createCDPSession();

  await client.send("Network.enable");

  client.on(
    "Network.webSocketFrameReceived",
    ({ requestId, timestamp, response }) => {
      let payloadString = response.payloadData.toString("utf8");

      try {
        if (payloadString.includes('"target":"OnFish"')) {
          payloadString = payloadString.replace(/[^\x20-\x7E]/g, "");
          const payload = JSON.parse(payloadString);

          const { st, i, ft, cf, tcf, us, gs } = payload.arguments[0];
          console.log(st, i, ft, cf, tcf, us, gs);
          const csvData = `${st},${i},${ft},${cf},${tcf},${us},${gs}\n`;

          fs.appendFile("data.csv", csvData, (err) => {
            if (err) throw err;
          });
        }
      } catch (error) {
        console.error("Error processing WebSocket frame:", error);
      }
    }
  );

  while (true) {
    await page.keyboard.press("Tab");
    await wait(1000);
    await page.keyboard.press("ArrowDown");
    await wait(1000);
  }
})();
