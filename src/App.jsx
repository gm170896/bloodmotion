import Loader from "./components/Loader.jsx";
import Cursor from "./components/Cursor.jsx";
import Navbar from "./components/Navbar.jsx";
import OrderModal from "./components/OrderModal.jsx";
import Hero from "./sections/Hero.jsx";
import Intro from "./sections/Intro.jsx";
import Portfolio from "./sections/Portfolio.jsx";
import Services from "./sections/Services.jsx";
import Process from "./sections/Process.jsx";
import Statement from "./sections/Statement.jsx";
import Clients from "./sections/Clients.jsx";
import About from "./sections/About.jsx";
import Team from "./sections/Team.jsx";
import Contact from "./sections/Contact.jsx";
import { ContentProvider } from "./content.jsx";
import Footer from "./sections/Footer.jsx";
export default function App() {
  return (<ContentProvider>
    <Loader /><Cursor /><Navbar /><OrderModal />
    <main><Hero /><Intro /><Portfolio /><Services /><Process /><Statement /><About /><Team /><Clients /><Contact /></main>
    <Footer />
  </ContentProvider>);
}
