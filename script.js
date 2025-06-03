function showSection(id) {

  const sections = document.querySelectorAll('.section');

  sections.forEach(section => {

    section.style.display = (section.id === id) ? 'block' : 'none';

  });

}

async function getWeather() {

  const city = document.getElementById('cityInput').value;

  const apiKey = "cf7977df0136e6af4ab2ebee641c9545";

  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

  try {

    // Current Weather

    const currentRes = await fetch(currentUrl);

    if (!currentRes.ok) throw new Error("City not found");

    const currentData = await currentRes.json();

    const iconCode = currentData.weather[0].icon;

    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    const currentInfo = `

      <h3>Current Weather</h3>

      <img src="${iconUrl}" alt="Weather icon" />

      <p><strong>City:</strong> ${currentData.name}</p>

      <p><strong>Temperature:</strong> ${currentData.main.temp} °C</p>

      <p><strong>Condition:</strong> ${currentData.weather[0].main}</p>

      <p><strong>Humidity:</strong> ${currentData.main.humidity}%</p>

      <p><strong>Wind Speed:</strong> ${currentData.wind.speed} m/s</p>

      <p><strong>Pressure:</strong> ${currentData.main.pressure} hPa</p>

    `;

    document.getElementById('weatherResult').innerHTML = currentInfo;

    // Forecast

    const forecastRes = await fetch(forecastUrl);

    const forecastData = await forecastRes.json();

    const days = {};

    forecastData.list.forEach(item => {

      const date = item.dt_txt.split(" ")[0];

      if (!days[date]) {

        days[date] = item; // First reading of the day

      }

    });

    let forecastHTML = `<h3>5-Day Forecast</h3>`;

    for (const date in days) {

      const item = days[date];

      const iconCode = item.weather[0].icon;

      const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

      forecastHTML += `

        <div class="forecast-day">

          <strong>${date}</strong><br>

          <img src="${iconUrl}" alt="Weather icon" /><br>

          Temp: ${item.main.temp} °C<br>

          Condition: ${item.weather[0].main}<br>

          Humidity: ${item.main.humidity}%<br>

          Wind: ${item.wind.speed} m/s<br>

          Pressure: ${item.main.pressure} hPa<br>

          Rain: ${item.rain?.['3h'] || 0} mm

        </div>

      `;

    }

    document.getElementById('forecastResult').innerHTML = forecastHTML;

  } catch (error) {

    document.getElementById('weatherResult').innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;

    document.getElementById('forecastResult').innerHTML = '';

  }

}// --- Firebase Setup ---

const firebaseConfig = {

  apiKey: "AIzaSyCEfCQKCJQuT7IePcbg6X8fQuQLjJ4ca_s",

  authDomain: "agro-helper-zambia.firebaseapp.com",

  projectId: "agro-helper-zambia",

  storageBucket: "agro-helper-zambia.firebasestorage.app",

  messagingSenderId: "239456005865",

  appId: "1:239456005865:web:61357fd49002a73c9bca78",

  measurementId: "G-MK0D2TQHEW"

};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();


// --- Realistic Crop Prices ---

const cropPrices = {

  "Lusaka - Soweto": {

    Maize: 240, Groundnuts: 320, Sunflower: 280, Cassava: 180,

    Beans: 350, Sorghum: 220, Millet: 210, SweetPotatoes: 160,

    Tomatoes: 140, Cabbage: 100, Onions: 180, Watermelon: 200,

    Rice: 400, Soybeans: 300, Bananas: 120, Carrots: 170,

    Pumpkins: 130, Sugarcane: 150, Garlic: 450, Ginger: 500

  },

  "Kitwe": {

    Maize: 250, Groundnuts: 330, Sunflower: 290, Cassava: 190,

    Beans: 360, Sorghum: 230, Millet: 220, SweetPotatoes: 170,

    Tomatoes: 150, Cabbage: 110, Onions: 190, Watermelon: 210,

    Rice: 410, Soybeans: 310, Bananas: 130, Carrots: 180,

    Pumpkins: 140, Sugarcane: 160, Garlic: 460, Ginger: 510

  },

  "Lusaka - Chilenje": { Maize: 242, Groundnuts: 325, Tomatoes: 145 },

  "Lusaka - Matero": { Maize: 238, Groundnuts: 315, Tomatoes: 142 },

  "Lusaka - Mtendere": { Maize: 243, Groundnuts: 328, Tomatoes: 147 },

  "Lusaka - Chelstone": { Maize: 241, Groundnuts: 322, Tomatoes: 144 },

  "Ndola": { Maize: 248, Groundnuts: 334, Tomatoes: 149 },

  "Kasama": { Maize: 244, Groundnuts: 318, Tomatoes: 143 }

};

// --- Update Price Table ---

const marketSelect = document.getElementById("marketSelect");

const priceBody = document.getElementById("priceBody");

function updatePriceTable(market) {

  const prices = cropPrices[market];

  priceBody.innerHTML = "";

  for (let crop in prices) {

    const row = `<tr><td>${crop}</td><td>ZMW ${prices[crop]}</td></tr>`;

    priceBody.innerHTML += row;

  }

}

updatePriceTable(marketSelect.value);

marketSelect.addEventListener("change", () => {

  updatePriceTable(marketSelect.value);

});

// --- Submit Crop Listing to Firestore ---

document.getElementById("sellForm").addEventListener("submit", async function (e) {

  e.preventDefault();

  const listing = {

    name: document.getElementById("sellerName").value,

    crop: document.getElementById("cropName").value,

    quantity: parseFloat(document.getElementById("quantity").value),

    price: parseFloat(document.getElementById("price").value),

    location: document.getElementById("location").value,

    timestamp: firebase.firestore.FieldValue.serverTimestamp()

  };

  try {

    await db.collection("cropListings").add(listing);

    alert("Crop listed successfully!");

    this.reset();

    loadBuyList(); // refresh listings

  } catch (error) {

    console.error("Error adding listing:", error);

  }

});

// --- Load Buy Listings from Firestore ---

const buyList = document.getElementById("buyList");

async function loadBuyList() {

  buyList.innerHTML = "<li>Loading...</li>";

  const snapshot = await db.collection("cropListings")

    .orderBy("timestamp", "desc")

    .limit(30)

    .get();

  if (snapshot.empty) {

    buyList.innerHTML = "<li>No crops listed yet.</li>";

    return;

  }

  buyList.innerHTML = "";

  snapshot.forEach(doc => {

    const d = doc.data();

    buyList.innerHTML += `

      <li><strong>${d.crop}</strong> – ${d.quantity} kg @ ZMW ${d.price}/kg<br>

      Seller: ${d.name} | Market: ${d.location}</li>

    `;

  });

}

loadBuyList();