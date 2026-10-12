
const { chromium } = require("playwright");

async function inspectWebsite(url) {
    const browser = await chromium.launch({ headless: true });

    try {
        const page = await browser.newPage();
        await page.goto(url, {
            waitUntil: "domcontentloaded",
            timeout: 30000
        });

        const details = await page.evaluate(() => ({
            title: document.title,
            url: location.href,
            headings: Array.from(document.querySelectorAll("h1, h2"))
                .map(el => el.innerText)
                .slice(0, 10),
            links: Array.from(document.querySelectorAll("a"))
                .filter(el => el.innerText.trim())
                .map(el => ({
                    text: el.innerText.trim(),
                    href: el.href
                }))
                .slice(0, 20),
            buttons: Array.from(document.querySelectorAll("button"))
                .map(el => el.innerText.trim())
                .filter(Boolean)
                .slice(0, 20)
        }));

        return details;
    } finally {
        await browser.close();
    }
}

module.exports = { inspectWebsite };
