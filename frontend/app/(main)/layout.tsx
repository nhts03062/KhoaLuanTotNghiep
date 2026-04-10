import ChatBot from "../components/ChatBot";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="pt-[88px]">{children}</main>
      <Footer />
      <ChatBot />
    </>
  );
}
