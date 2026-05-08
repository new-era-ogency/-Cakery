import { Phone } from "lucide-react";
import type { Messages } from "@/lib/i18n";
import { PHONE_DISPLAY, PHONE_E164, PHONE_WA } from "@/lib/constants";

export default function MobileCallBar({ t }: { t: Messages }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-espresso/10 bg-porcelain/95 px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_30px_rgba(58,36,24,0.18)] backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <a
          href={`tel:${PHONE_E164}`}
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-espresso px-4 text-sm font-semibold text-porcelain shadow-soft"
          aria-label={`${t.callBtn} ${PHONE_DISPLAY}`}
        >
          <Phone className="h-4 w-4" />
          {t.callBtn}
        </a>
        <a
          href={`https://wa.me/${PHONE_WA}`}
          target="_blank"
          rel="noopener noreferrer external"
          className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-emerald-900 px-4 text-sm font-semibold text-white shadow-soft hover:bg-emerald-950"
          aria-label="WhatsApp"
        >
          {t.waBtn}
        </a>
      </div>
    </div>
  );
}
