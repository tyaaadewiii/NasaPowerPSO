import React from "react";
import Dashboard from "./pages/Dashboard";
import Footer from "./components/Footer";

function App() {
  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'#060e1a' }}>
      <main style={{ flex:1 }}>
        <Dashboard />
      </main>
      <Footer />
    </div>
  );
}

export default App;
