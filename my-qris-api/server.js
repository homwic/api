const express = require("express");
const chromium = require("chrome-aws-lambda");
const fetch = require("node-fetch"); // Perlu untuk download gambar

const app = express();
app.use(express.json()); // Middleware untuk parsing JSON

const port = process.env.PORT || 3000;

app.post("/generate-qris", async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { nominal } = req.body;

  const qrisData =
    "00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214210379661725380303UMI51440014ID.CO.QRIS.WWW0215ID20253865385780303UMI5204541153033605802ID5922LUTIFY STORE OK23176316006BEKASI61051711162070703A0163041FF9";

  let browser = null;

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto("https://cekid-ariepulsa.my.id/", {
      waitUntil: "domcontentloaded",
    });

    // Isi QRIS Code dan nominal
    await page.type("#qrisCode", qrisData);
    await page.type("#amount", nominal.toString());
    await page.$eval("#qrisForm", (form) => form.requestSubmit());

    // Tunggu QR Code muncul dan ambil URL gambarnya
    await page.waitForSelector("#qrCode img", { timeout: 10000 });
    const imageUrl = await page.$eval("#qrCode img", (img) => img.src);

    // Ambil gambar dari URL
    const imageBuffer = await fetch(imageUrl).then((res) => res.buffer());

    // Kirim gambar sebagai response
    res.setHeader("Content-Type", "image/png");
    res.send(imageBuffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Menjalankan server pada port yang ditentukan
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
