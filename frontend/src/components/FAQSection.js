import { useState } from "react";
import { ChevronDown } from "lucide-react";

export function FAQSection({ faqs, title = "Frequently Asked Questions" }) {
  const [open, setOpen] = useState(null);
  if (!faqs || !faqs.length) return null;
  return (
    <div className="bg-[#151A22]/80 border border-white/5 rounded-2xl p-6">
      <h3 className="font-heading font-semibold text-slate-200 text-lg mb-5">{title}</h3>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-white/5 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-white/3 transition-colors"
              data-testid={`faq-toggle-${i}`}
            >
              <span className="text-sm font-medium text-slate-200 leading-relaxed">{faq.question}</span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
              />
            </button>
            {open === i && (
              <div className="px-4 pb-4 text-sm text-slate-400 leading-relaxed border-t border-white/5 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
