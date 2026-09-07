

require("dotenv").config();

const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

const CITIES = {
  tokyo: { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  london: { name: "London", lat: 51.5074, lon: -0.1278 },
  new_york: { name: "New York", lat: 40.7128, lon: -74.0060 },
  paris: { name: "Paris", lat: 48.8566, lon: 2.3522 },
  sydney: { name: "Sydney", lat: -33.8688, lon: 151.2093 }
};

const WEATHER_CODES = {
  0: "Clear sky ☀️",
  1: "Mainly clear 🌤️",
  2: "Partly cloudy ⛅",
  3: "Overcast ☁️",
  45: "Fog 🌫️",
  48: "Depositing rime fog 🌫️",
  51: "Light drizzle 🌧️",
  61: "Slight rain 🌧️",
  71: "Slight snow 🌨️",
  80: "Rain showers 🌦️",
  95: "Thunderstorm 🌩️"
};

app.command("/gb-bot-ping", async ({ command, ack, respond }) => {
  const start = Date.now();
  await ack();
  const latency = Date.now() - start;
  await respond({ text: `Pong!\nLatency: ${latency}ms` });
});

app.command("/gb-bot-help", async ({ ack, respond }) => {
  await ack();
  await respond({
    text:
`Available Commands:
/gb-bot-ping - Check bot latency
/gb-bot-catfact - Get a random cat fact
/gb-bot-qotd - Get the quote of the day
/gb-bot-weather - View current weather for selected cities
/gb-bot-help - Display this command index`
  });
});

app.command("/gb-bot-catfact", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await fetch("https://catfact.ninja/fact");
    const data = await response.json();
    await respond({
      response_type: "in_channel",
      text: `🐱 *Cat Fact:* ${data.fact}`
    });
  } catch (error) {
    await respond({ text: "Unable to retrieve cat fact at this time." });
  }
});

app.command("/gb-bot-qotd", async ({ ack, respond }) => {
  await ack();
  try {
    const response = await fetch("https://zenquotes.io/api/today");
    const data = await response.json();
    const quote = data[0];
    await respond({
      response_type: "in_channel",
      text: `💬 *Quote of the Day*\n\n"> ${quote.q}"\n— *${quote.a}*`
    });
  } catch (error) {
    await respond({ text: "Unable to retrieve quote of the day at this time." });
  }
});

app.command("/gb-bot-weather", async ({ ack, respond }) => {
  await ack();
  await respond({
    text: "Select a city to check the current weather:",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Select a city to retrieve current weather metrics:*"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "static_select",
            placeholder: {
              type: "plain_text",
              text: "Choose a city..."
            },
            action_id: "weather_city_select",
            options: Object.entries(CITIES).map(([key, city]) => ({
              text: {
                type: "plain_text",
                text: city.name
              },
              value: key
            }))
          }
        ]
      }
    ]
  });
});

app.action("weather_city_select", async ({ ack, action, respond }) => {
  await ack();
  const selectedKey = action.selected_option.value;
  const city = CITIES[selectedKey];

  if (!city) {
    await respond({ text: "Invalid selection." });
    return;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true`;
    const response = await fetch(url);
    const data = await response.json();
    const weather = data.current_weather;
    const condition = WEATHER_CODES[weather.weathercode] || "Variable conditions";

    await respond({
      replace_original: false,
      text: `🌡️ *Weather Metrics for ${city.name}*\n• *Temperature:* ${weather.temperature}°C\n• *Wind Speed:* ${weather.windspeed} km/h\n• *Condition:* ${condition}`
    });
  } catch (error) {
    await respond({ text: `Failed to fetch telemetry for ${city.name}.` });
  }
});

(async () => {
  await app.start();
  console.log("bot is running!");
})();