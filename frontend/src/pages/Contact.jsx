//contact.jsx part 1
import { useState } from 'react';
import { Clock, MapPin, Phone, MessageCircle, Send } from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function Contact() {
  const [formName, setFormName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formText, setFormText] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !formContact.trim() || !formText.trim()) {
      alert('Please fill out your Name, Contact Details, and Message fields.');
      return;
    }

    setLoading(true);
    try {
      const combinedMessageText = `[Contact Info: ${formContact.trim()}] \n\n${formText.trim()}`;

      const response = await fetch (`${API_BASE_URL}/api/contact/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          message: combinedMessageText
        })
      });
      const json = await response.json();
      if (json.success) {
        setSuccessMsg('Thank you! Your inquiry and callback phone/email logs have been sent to our admin desk.');
        setFormName('');
        setFormContact('');
        setFormText('');
      } else {
        alert('Failed to transmit inquiry payload packet.');
      }
    } catch (err) {
      alert('Could not establish data link connection to the server.');
    } finally {
      setLoading(false);
    }
  };

  const shopPhoneNumber = "254116643999";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans pb-20 transition-colors duration-200">

      {/* 🏙️ PAGE BANNER HEADER */}
      <div className="relative bg-linear-to-br from-medical-900 via-medical-900 to-[#0B192C] text-white py-16 px-4 text-center border-b border-medical-800 shadow-md overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-sm text-medical-200 px-4 py-1.5 rounded-full border border-white/10">
            <MessageCircle className="h-3 w-3" />
            We're Here To Help
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">Contact & Support</h2>
          <p className="text-medical-100/70 mt-2 max-w-xl mx-auto text-sm sm:text-base font-medium">
            Have an inquiry about sizing or custom order bookings? Reach out across our channels live.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none overflow-hidden p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="h-10 w-10 rounded-2xl bg-medical-50 dark:bg-medical-900/40 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-medical-500" />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-white uppercase tracking-wider">Our Operational Hours</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Weekdays (Mon - Fri)</span>
                <span className="font-black text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-3 py-1 rounded-xl shadow-sm text-xs border dark:border-slate-700">8:00 AM - 7:00 PM</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Saturdays</span>
                <span className="font-black text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-3 py-1 rounded-xl shadow-sm text-xs border dark:border-slate-700">9:00 AM - 6:00 PM</span>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900 flex justify-between items-center sm:col-span-2 text-amber-600 dark:text-amber-500">
                <span className="font-bold">Sundays & Public Holidays</span>
                <span className="font-black bg-white dark:bg-amber-950/40 px-4 py-1 rounded-xl text-xs border border-amber-300">Shop Closed</span>
              </div>
            </div>
          </div>

          {/* 📍 PHYSICAL SUITE ADDRESS + HOTLINE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-medical-50 dark:bg-medical-900/40 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-medical-500" />
              </div>
              <h4 className="font-black uppercase text-xs tracking-wider text-slate-400 dark:text-slate-500">Our Physical Headquarters</h4>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                NORWICH-UNION HOUSE, NEW-WING SECOND FLOOR ROOM 01,<br />
                KIMATHI LANE,NAIROBI CBD,<br />
                Nairobi, Kenya.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-medical-50 dark:bg-medical-900/40 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-medical-500" />
                </div>
                <h4 className="font-black uppercase text-xs tracking-wider text-slate-400 dark:text-slate-500">Direct Inquiries Hotline</h4>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Got a direct sizing question? Call our desk instantly.</p>
              </div>
              <div className="space-y-2">
                <a href={"tel:" + shopPhoneNumber} className="bg-medical-500 hover:bg-medical-600 text-white font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-colors text-center">
                  <Phone className="h-4 w-4" />
                  <span>Call +254116643999</span>
                </a>
                <a href={`https://wa.me/${shopPhoneNumber}`} target="_blank" rel="noopener noreferrer" className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm cursor-pointer transition-colors text-center">
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

        </div>
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-lg shadow-slate-200/50 dark:shadow-none space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-700 flex items-center space-x-3">
            <div className="h-10 w-10 rounded-2xl bg-medical-50 dark:bg-medical-900/40 flex items-center justify-center shrink-0">
              <Send className="h-5 w-5 text-medical-500" />
            </div>
            <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-base">Drop a Message</h3>
          </div>

          {successMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-emerald-500 p-3 rounded-r-xl text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" />
              {successMsg}
            </div>
          )}

          <form onSubmit={handleLocalSubmit} className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Your Full Name</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Dr. Abubakar" className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 transition-all" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Phone Number or Email</label>
              <input type="text" value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="e.g. +254 700 000 000 or name@example.com" className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 transition-all" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold uppercase text-slate-400 dark:text-slate-500">Inquiry Message</label>
              <textarea rows="4" value={formText} onChange={(e) => setFormText(e.target.value)} placeholder="Type details about bulk supply delivery requests or uniform measurements text here..." className="w-full bg-slate-50 dark:bg-slate-900 border dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-medical-500 focus:ring-2 focus:ring-medical-500/20 transition-all resize-none font-medium" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-medical-500 hover:bg-medical-600 text-white font-black uppercase text-xs tracking-wider py-3.5 rounded-xl transition-colors shadow-sm cursor-pointer disabled:bg-slate-300 flex items-center justify-center space-x-2">
              <Send className="h-4 w-4" />
              <span>{loading ? 'Transmitting Message...' : 'Submit Message Request'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}