import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import "@/App.css";
import Navbar from "./components/Navbar";
import MarketTicker from "./components/MarketTicker";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import CalculatorsHub from "./pages/CalculatorsHub";
import MarketsPage from "./pages/MarketsPage";
import BlogPage from "./pages/BlogPage";
import BlogArticle from "./pages/BlogArticle";
import TradingPage from "./pages/TradingPage";
import RentVsBuy from "./pages/calculators/RentVsBuy";
import Mortgage from "./pages/calculators/Mortgage";
import CarLease from "./pages/calculators/CarLease";
import DebtPayoff from "./pages/calculators/DebtPayoff";
import Retirement from "./pages/calculators/Retirement";
import InvestVsDebt from "./pages/calculators/InvestVsDebt";
import StockReturns from "./pages/calculators/StockReturns";
import CostOfLiving from "./pages/calculators/CostOfLiving";
import NetWorth from "./pages/calculators/NetWorth";
import EmergencyFund from "./pages/calculators/EmergencyFund";
import BuyVsInvest from "./pages/calculators/BuyVsInvest";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col">
      <MarketTicker />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calculators" element={<CalculatorsHub />} />
          <Route path="/calculators/rent-vs-buy" element={<RentVsBuy />} />
          <Route path="/calculators/mortgage" element={<Mortgage />} />
          <Route path="/calculators/car-lease" element={<CarLease />} />
          <Route path="/calculators/debt-payoff" element={<DebtPayoff />} />
          <Route path="/calculators/retirement" element={<Retirement />} />
          <Route path="/calculators/invest-vs-debt" element={<InvestVsDebt />} />
          <Route path="/calculators/stock-returns" element={<StockReturns />} />
          <Route path="/calculators/cost-of-living" element={<CostOfLiving />} />
          <Route path="/calculators/net-worth" element={<NetWorth />} />
          <Route path="/calculators/emergency-fund" element={<EmergencyFund />} />
          <Route path="/calculators/buy-vs-invest" element={<BuyVsInvest />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/markets" element={<MarketsPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
