import { Mail, MessageSquareText } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="bg-[#0B0E14] min-h-screen py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-heading text-4xl sm:text-5xl font-bold text-slate-100 mb-5">Contact</h1>
        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
          Questions, corrections, partnership inquiries, or feedback on calculator assumptions? Reach us below.
        </p>

        <div className="space-y-4">
          <div className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6 flex items-start gap-4">
            <Mail className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-slate-100 font-semibold mb-1">General support</p>
              <a className="text-amber-400 hover:text-amber-300" href="mailto:hello@figuremymoney.com">hello@figuremymoney.com</a>
            </div>
          </div>

          <div className="bg-[#151A22]/70 border border-white/5 rounded-2xl p-6 flex items-start gap-4">
            <MessageSquareText className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-slate-100 font-semibold mb-1">Content and data feedback</p>
              <p className="text-slate-400">
                If you spot an error in an article, data source note, or calculator explanation, email us and include the page URL.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-500 mt-8">
          We aim to respond to most inquiries within 2–3 business days.
        </p>
      </div>
    </div>
  );
}
