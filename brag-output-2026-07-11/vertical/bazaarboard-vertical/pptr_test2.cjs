const puppeteer = require("puppeteer-core");
(async () => {
  try {
    const browser = await puppeteer.launch({ executablePath: "C:/Users/I587436/.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe", headless: true, args: [] });
    console.log("Launched OK", await browser.version());
    await browser.close();
  } catch (e) { console.log("FAIL:", e.code, e.message); console.log(e.stack); }
})();
