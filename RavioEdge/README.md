<div align="center">
  <h1 align="center">Ravio Edge 📈</h1>
  <p align="center">
    <strong>Advanced Quantitative Market Analysis & Options Execution System</strong>
  </p>
</div>

<br/>

## 🚀 Overview

Ravio Edge is a high-performance, Next.js-based terminal and web dashboard engineered specifically for **Nifty 50 Options Buyers**. It operates as a fully automated quantitative analyst, aggregating massive amounts of real-time market data, scraping breaking financial news, and visually analyzing technical charts to generate actionable, highly accurate options execution strategies.

<br/>

## ✨ Key Features

- **Multimodal Chart Analysis**: Upload screenshots of your 5-minute Nifty 50 or Bank Nifty charts. The system physically processes the chart geometry, detecting trendlines, support/resistance, and specific technical indicators (VWAP, EMAs, SMA 88).
- **Options Chain Extraction**: Upload a screenshot of an options chain. The system parses Live Price, ATM IV, PCR, Volume, and Strike combinations directly from the data visual.
- **Three Strategic Modes**:
  - 🌅 **Pre-Market (9:00 AM)**: Aggregates overnight US indices, Asian markets, and ADRs to predict the Indian market opening gap.
  - ⚡ **Live Market**: Focuses on intraday momentum, immediate support/resistance, and real-time news impact.
  - 🌙 **Post-Market**: Summarizes the day's events, analyzes institutional activity, and forecasts tomorrow's sentiment based on the US Open.
- **Live News Scraping**: Automatically scrapes *Pulse by Zerodha* to inject the top 10 breaking financial and geopolitical news headlines into the analysis pipeline.
- **Massive Global Data Integration**: Tracks Nifty 50, Bank Nifty, India VIX, US Crude Oil, USD/INR, Global Indices (DJI, Nasdaq, SPX, Nikkei, etc.), and Key ADRs (Infosys, HDFC, ICICI, Wipro).
- **Premium Glassmorphic UI**: Beautiful, dark-mode, responsive user interface built for fast manual execution.

<br/>

## 🛠️ Technology Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript
- **Styling**: Custom Vanilla CSS with Advanced Glassmorphism & Animations
- **Backend**: Next.js API Routes (Node.js)
- **Processing Core**: Advanced Large Language Model SDK
- **Data Providers**: `yahoo-finance2` (Market Data), `cheerio` (News Scraping)

<br/>

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ravio-edge
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env.local` file in the root directory and add your API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

<br/>

## 🧠 System Directives & Indicators

The system's backend is heavily engineered. When processing a chart, it is explicitly directed to look for the following exact indicator setup:

- 🔵 **VWAP**: Blue dotted line
- 🟢 **EMA 9**: Green Line
- 🔴 **EMA 21**: Red Line
- ⚪ **EMA 50**: White Line
- 🟡 **SMA 88**: Yellow Line

*The system is tuned to prioritize risk management and will output a dedicated "Important Points" section for live trades.*

<br/>

## ⚠️ Disclaimer

This software is for educational and informational purposes only. The generated analysis does not constitute financial advice. Options trading involves substantial risk of loss and is not suitable for every investor. Always perform your own due diligence before executing trades.
