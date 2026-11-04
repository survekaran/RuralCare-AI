
import { Link } from "react-router";
import {
  Video,
  Activity,
  MapPin,
  FileText,
  Droplets,
  Thermometer,
  Heart,
} from "lucide-react";

import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useLanguage } from "../context/LanguageContext";

export function Home() {
  const { language } = useLanguage();
  const isMarathi = language === "mr";

  const features = [
    {
      icon: Video,
      title: isMarathi ? "डॉक्टरांशी बोला" : "Talk to Doctor",
      description: isMarathi
        ? "ऑडिओ किंवा व्हिडिओद्वारे डॉक्टरांशी सल्लामसलत करा."
        : "Connect with doctors through audio or video consultation.",
      path: "/talk-to-doctor",
      color: "#4F7DF3",
    },
    {
      icon: Activity,
      title: isMarathi ? "लक्षणे तपासा" : "Check Symptoms",
      description: isMarathi
        ? "तुमची लक्षणे सांगा आणि AI आधारित आरोग्य मार्गदर्शन मिळवा."
        : "Describe symptoms and receive AI-based health guidance.",
      path: "/check-symptoms",
      color: "#A7E3C9",
    },
    {
      icon: MapPin,
      title: isMarathi ? "औषधे शोधा" : "Find Medicines",
      description: isMarathi
        ? "जवळपासची औषधांची दुकाने शोधा आणि औषधांची उपलब्धता तपासा."
        : "Search nearby pharmacies and check medicine availability.",
      path: "/find-medicines",
      color: "#FFD6A5",
    },
    {
      icon: FileText,
      title: isMarathi ? "आरोग्य नोंदी" : "Health Records",
      description: isMarathi
        ? "प्रिस्क्रिप्शन, वैद्यकीय अहवाल आणि आरोग्य इतिहास सुरक्षित ठेवा."
        : "Store prescriptions, reports, and medical history securely.",
      path: "/health-records",
      color: "#4F7DF3",
    },
  ];

  const healthTips = [
    {
      icon: Droplets,
      title: isMarathi ? "स्वच्छ पाणी प्या" : "Drink Clean Water",
      description: isMarathi
        ? "संसर्ग टाळण्यासाठी आणि निरोगी राहण्यासाठी नेहमी स्वच्छ पाणी प्या."
        : "Always drink clean water to avoid infections and stay healthy.",
      color: "#4F7DF3",
    },
    {
      icon: Heart,
      title: isMarathi ? "नियमित हात धुवा" : "Wash Hands Regularly",
      description: isMarathi
        ? "आजार टाळण्यासाठी वारंवार साबणाने हात धुवा."
        : "Wash your hands with soap frequently to prevent diseases.",
      color: "#A7E3C9",
    },
    {
      icon: Thermometer,
      title: isMarathi ? "आरोग्यावर लक्ष ठेवा" : "Monitor Your Health",
      description: isMarathi
        ? "ताप बराच काळ टिकल्यास किंवा असामान्य लक्षणे दिसल्यास वैद्यकीय मदत घ्या."
        : "Seek medical help for persistent fever or unusual symptoms.",
      color: "#FFD6A5",
    },
  ];

  return (
    <div>

      {/* Hero Section */}
      <section className="bg-[#F8FAFC] py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left Side - Content */}
            <div className="text-center lg:text-left">

              <h1
                className="text-3xl md:text-4xl lg:text-5xl text-[#1E293B] mb-6"
                style={{ fontWeight: 700, lineHeight: 1.2 }}
              >
                {isMarathi
                  ? "प्रत्येक ग्रामीण भागासाठी आरोग्यसेवा"
                  : "Healthcare Access for Every Rural Area"}
              </h1>

              <p className="text-lg md:text-xl text-[#64748B] mb-8 leading-relaxed">
                {isMarathi
                  ? "ऑनलाइन डॉक्टरांचा सल्ला घ्या, लक्षणे तपासा, जवळपास औषधे शोधा आणि तुमच्या आरोग्याच्या नोंदी एकाच ठिकाणी व्यवस्थापित करा."
                  : "Consult doctors online, check symptoms, find medicines nearby, and manage your health records in one place."}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">

                <Link
                  to="/talk-to-doctor"
                  className="px-8 py-4 bg-[#4F7DF3] text-white rounded-2xl hover:bg-[#3D6DE3] transition-colors"
                >
                  {isMarathi ? "डॉक्टरांशी बोला" : "Talk to a Doctor"}
                </Link>

                <Link
                  to="/check-symptoms"
                  className="px-8 py-4 bg-white text-[#4F7DF3] border-2 border-[#4F7DF3] rounded-2xl hover:bg-[#F8FAFC] transition-colors"
                >
                  {isMarathi ? "लक्षणे तपासा" : "Check Symptoms"}
                </Link>

              </div>
            </div>

            {/* Right Side - Image */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-lg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1758691463620-188ca7c1a04f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWxlbWVkaWNpbmUlMjBkb2N0b3IlMjBwYXRpZW50JTIwdmlkZW8lMjBjYWxsfGVufDF8fHx8MTc3MzMxNDUwMnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt={isMarathi ? "ऑनलाइन डॉक्टरांचा सल्ला" : "Telemedicine consultation"}
                  className="w-full h-auto"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-12">

            <h2
              className="text-2xl md:text-3xl lg:text-4xl text-[#1E293B] mb-4"
              style={{ fontWeight: 700 }}
            >
              {isMarathi
                ? "संपूर्ण आरोग्य सेवा"
                : "Complete Healthcare Solution"}
            </h2>

            <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
              {isMarathi
                ? "उत्तम आरोग्यासाठी आवश्यक सर्व सेवा एकाच सोप्या व्यासपीठावर."
                : "Everything you need for better health, all in one simple platform"}
            </p>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-6">

            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.path}
                  to={feature.path}
                  className="group bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all border border-gray-100"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${feature.color}15` }}
                  >
                    <Icon
                      className="w-7 h-7"
                      style={{ color: feature.color }}
                    />
                  </div>

                  <h3
                    className="text-xl text-[#1E293B] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    {feature.title}
                  </h3>

                  <p className="text-[#64748B] leading-relaxed">
                    {feature.description}
                  </p>

                </Link>
              );
            })}

          </div>
        </div>
      </section>

      {/* Recent Health Tips Section */}
      <section className="bg-[#F8FAFC] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between mb-12">

            <div>
              <h2
                className="text-2xl md:text-3xl lg:text-4xl text-[#1E293B] mb-2"
                style={{ fontWeight: 700 }}
              >
                {isMarathi ? "दैनंदिन आरोग्य टिप्स" : "Daily Health Tips"}
              </h2>

              <p className="text-lg text-[#64748B]">
                {isMarathi
                  ? "चांगल्या आरोग्यासाठी सोपे सल्ले"
                  : "Simple advice for better health"}
              </p>
            </div>

            <Link
              to="/health-tips"
              className="hidden sm:block px-6 py-3 bg-[#4F7DF3] text-white rounded-full hover:bg-[#3D6DE3] transition-colors"
            >
              {isMarathi ? "सर्व टिप्स पहा" : "View All Tips"}
            </Link>

          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {healthTips.map((tip, index) => {
              const Icon = tip.icon;

              return (
                <div
                  key={index}
                  className="bg-white hover:shadow-lg rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${tip.color}15` }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: tip.color }}
                    />
                  </div>

                  <h3
                    className="text-lg text-[#1E293B] mb-2"
                    style={{ fontWeight: 600 }}
                  >
                    {tip.title}
                  </h3>

                  <p className="text-[#64748B] leading-relaxed">
                    {tip.description}
                  </p>

                </div>
              );
            })}

          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link
              to="/health-tips"
              className="inline-block px-8 py-3 bg-[#4F7DF3] text-white rounded-full hover:bg-[#3D6DE3] transition-colors"
            >
              {isMarathi ? "सर्व टिप्स पहा" : "View All Tips"}
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
