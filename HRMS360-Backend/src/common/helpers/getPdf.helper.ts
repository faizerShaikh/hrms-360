import { config } from "dotenv";

const puppeteer = require("puppeteer");
config();

export async function printPDF({
  token,
  schema_name,
  survey_id,
}: {
  token: string;
  schema_name: string;
  survey_id: string;
}) {
  const browser = await puppeteer.launch({
    args: ["--font-render-hinting=none", "--force-color-profile=srgb"],
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36"
  );
  const cookies = [
    {
      name: "token",
      value: token,
      url: `${process.env.FE_URL}/survey/report`,
    },
    {
      name: "schema_name",
      value: schema_name,
      url: `${process.env.FE_URL}/survey/report`,
    },
    {
      name: "survey_id",
      value: survey_id,
      url: `${process.env.FE_URL}/survey/report`,
    },
  ];

  await page.setCookie(...cookies);
  await page.goto(`${process.env.FE_URL}/survey/report/${survey_id}`, {
    waitUntil: "networkidle0",
    timeout: 600000,
  });

  let height = await page.evaluate(() => document.documentElement.offsetHeight);

  await page.evaluateHandle("document.fonts.ready");
  const pdf = await page.pdf({
    printBackground: true,
    preferCSSPageSize: true,
    margins: "none",
    height: height + 5 + "px",
  });

  await browser.close();
  return pdf;
}
