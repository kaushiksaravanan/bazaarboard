const puppeteer = require("puppeteer-core");
const args = [
  "--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage",
  "--enable-features=CanvasContextLostInBackground",
  "--enable-webgl","--ignore-gpu-blocklist",
  "--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader",
  "--font-render-hinting=none","--force-color-profile=srgb","--window-size=1080,1920",
  "--disable-background-timer-throttling","--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding","--disable-background-media-suspend",
  "--disable-breakpad","--no-zygote","--disable-extensions",
  "--force-gpu-mem-available-mb=512","--disk-cache-size=268435456",
  "--autoplay-policy=no-user-gesture-required"
];
(async () => {
  try {
    const b = await puppeteer.launch({
      executablePath: "C:/Users/I587436/.cache/puppeteer/chrome-headless-shell/win64-148.0.7778.97/chrome-headless-shell-win64/chrome-headless-shell.exe",
      headless: true, args, defaultViewport: null, timeout: 30000
    });
    console.log("OK", await b.version());
    await b.close();
  } catch (e) { console.log("FAIL:", e.code, e.message); console.log(e.stack); }
})();
